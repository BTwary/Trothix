// Shared, cross-instance rate limiter.
//
// api/analyze.js previously enforced its per-minute request limit with a
// module-level in-memory counter. On Vercel, each serverless instance has
// its own process memory and does NOT share it with other instances
// running the same function concurrently -- so that counter was only ever
// checking traffic against a single instance. With N concurrent instances,
// the real ceiling was `limit x N`, not `limit`. This module fixes that by
// keeping the count in a datastore every instance shares, using the same
// two backends (and the same env vars) api/_stats.js already established:
//   1. Supabase (Postgres) -- SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   2. Redis (Vercel KV / Upstash) -- KV_REST_API_URL + KV_REST_API_TOKEN
//      (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
//   3. In-memory fallback if neither is configured (local dev, or before
//      you've set anything up) -- same caveat as _stats.js's fallback:
//      resets on cold start, not shared across instances.
//
// Windowing: fixed windows, bucketed as `{key}_{flooredWindowStart}`, so a
// new counter key is used every `windowMs` and old buckets are simply
// never read again. Redis additionally EXPIREs its keys so they don't
// accumulate forever; Supabase rows are small enough that this isn't a
// practical concern the way it would be for a huge key space.
//
// Supabase setup: reuses the `clearclause_incr` RPC that api/_stats.js's
// header comment already documents how to create. If you've already set
// up Supabase for stats, there is nothing new to run.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = !SUPABASE_ENABLED && Boolean(REDIS_URL && REDIS_TOKEN);

// ---- Supabase backend ----

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function supabaseIncrAndGet(key) {
  const incrRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/clearclause_incr`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ p_key: key }),
  });
  if (!incrRes.ok) {
    throw new Error(`Supabase rate-limit incr failed: ${incrRes.status} ${await incrRes.text()}`);
  }

  const selectRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clearclause_stats?key=eq.${encodeURIComponent(key)}&select=value`,
    { headers: supabaseHeaders() }
  );
  if (!selectRes.ok) {
    throw new Error(`Supabase rate-limit read failed: ${selectRes.status} ${await selectRes.text()}`);
  }
  const rows = await selectRes.json();
  return Number(rows?.[0]?.value) || 0;
}

// Adds `member` to the distinct-item set for `bucketKey` and returns the
// set's new cardinality. Backed by a small dedicated table rather than
// clearclause_stats, since this tracks *which* items were seen, not just
// a count -- reusing the counter table can't express "already seen."
//
// Requires this table (run once, in addition to api/_stats.js's SQL, if
// you're using Supabase and want the job-count limiter to be shared):
//
//   create table if not exists clearclause_ratelimit_members (
//     bucket_key text not null,
//     member text not null,
//     created_at timestamptz not null default now(),
//     primary key (bucket_key, member)
//   );
//
// If this table doesn't exist yet, the insert/select below will fail and
// isDistinctItemCountOverLimit() falls back to the in-memory path for
// that request, same as any other backend error in this module.
async function supabaseAddToSetAndCount(bucketKey, member) {
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/clearclause_ratelimit_members`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ bucket_key: bucketKey, member }),
  });
  if (!insertRes.ok) {
    throw new Error(`Supabase rate-limit set insert failed: ${insertRes.status} ${await insertRes.text()}`);
  }

  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clearclause_ratelimit_members?bucket_key=eq.${encodeURIComponent(bucketKey)}&select=member`,
    { headers: supabaseHeaders() }
  );
  if (!countRes.ok) {
    throw new Error(`Supabase rate-limit set count failed: ${countRes.status} ${await countRes.text()}`);
  }
  const rows = await countRes.json();
  return rows.length;
}

// ---- Redis backend (Vercel KV / Upstash) ----

async function redisIncrAndGet(key, expireSeconds) {
  const incrRes = await fetch(`${REDIS_URL}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!incrRes.ok) {
    throw new Error(`Redis rate-limit incr failed: ${incrRes.status} ${await incrRes.text()}`);
  }
  const { result: count } = await incrRes.json();

  if (count === 1) {
    // First request to land in this window's bucket -- set it to expire so
    // old window buckets don't accumulate as keys forever. Fire-and-forget:
    // losing this race under concurrency just means a bucket without a
    // TTL, not an incorrect count, so it isn't worth blocking the request on.
    fetch(`${REDIS_URL}/expire/${encodeURIComponent(key)}/${expireSeconds}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    }).catch(() => {});
  }

  return count;
}

// Adds `member` to the Redis set at `key` and returns the set's new
// cardinality (SADD + SCARD), expiring the set on its first member so
// old window buckets don't accumulate forever.
async function redisAddToSetAndCount(key, member, expireSeconds) {
  const addRes = await fetch(`${REDIS_URL}/sadd/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!addRes.ok) {
    throw new Error(`Redis rate-limit SADD failed: ${addRes.status} ${await addRes.text()}`);
  }

  const cardRes = await fetch(`${REDIS_URL}/scard/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!cardRes.ok) {
    throw new Error(`Redis rate-limit SCARD failed: ${cardRes.status} ${await cardRes.text()}`);
  }
  const { result: count } = await cardRes.json();

  if (count === 1) {
    // Fire-and-forget, same reasoning as redisIncrAndGet above.
    fetch(`${REDIS_URL}/expire/${encodeURIComponent(key)}/${expireSeconds}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    }).catch(() => {});
  }

  return count;
}

// ---- In-memory fallback (local dev, or before any backend is configured) ----
// Same caveat as api/_stats.js's in-memory fallback: per-instance, resets
// on cold start, not shared across concurrent instances.

const memoryWindows = new Map();

function memoryIncrAndGet(key, windowMs, bucket) {
  const mapKey = `${key}_${bucket}`;
  const count = (memoryWindows.get(mapKey) || 0) + 1;
  memoryWindows.set(mapKey, count);

  // Best-effort cleanup so the map doesn't grow without bound across
  // many distinct keys/windows over a long-running local process.
  if (memoryWindows.size > 200) {
    for (const k of memoryWindows.keys()) {
      if (k !== mapKey) memoryWindows.delete(k);
    }
  }

  return count;
}

const memorySets = new Map();

function memoryAddToSetAndCount(key, member, bucket) {
  const mapKey = `${key}_${bucket}`;
  let set = memorySets.get(mapKey);
  if (!set) {
    set = new Set();
    memorySets.set(mapKey, set);
  }
  set.add(member);

  if (memorySets.size > 200) {
    for (const k of memorySets.keys()) {
      if (k !== mapKey) memorySets.delete(k);
    }
  }

  return set.size;
}

/**
 * Checks whether `key` has exceeded `limit` requests within the current
 * fixed window of `windowMs` milliseconds, incrementing the shared counter
 * as a side effect. Backed by Supabase or Redis when configured (shared
 * across all serverless instances); falls back to a per-instance in-memory
 * counter otherwise, matching api/_stats.js's fallback behavior.
 *
 * @param {string} key - Logical rate-limit bucket name (e.g. "analyze_global").
 * @param {number} limit - Max requests allowed per window.
 * @param {number} windowMs - Window size in milliseconds.
 * @returns {Promise<boolean>} true if this request should be throttled.
 */
export async function isRateLimited(key, limit, windowMs) {
  const bucket = Math.floor(Date.now() / windowMs);

  if (SUPABASE_ENABLED) {
    try {
      const count = await supabaseIncrAndGet(`ratelimit_${key}_${bucket}`);
      return count > limit;
    } catch (err) {
      console.error("[rateLimiter] Supabase check failed, falling back to in-memory for this request:", err.message || err);
    }
  } else if (REDIS_ENABLED) {
    try {
      const count = await redisIncrAndGet(`clearclause:ratelimit:${key}:${bucket}`, Math.ceil(windowMs / 1000) + 5);
      return count > limit;
    } catch (err) {
      console.error("[rateLimiter] Redis check failed, falling back to in-memory for this request:", err.message || err);
    }
  }

  return memoryIncrAndGet(key, windowMs, bucket) > limit;
}

/**
 * Checks whether the number of DISTINCT `itemId` values added under `key`
 * within the current fixed window of `windowMs` has exceeded `limit`,
 * adding `itemId` to the shared set as a side effect. Use this instead of
 * isRateLimited() when the limit is on how many distinct things occurred
 * (e.g. distinct job IDs from one IP) rather than how many requests
 * occurred -- a repeated `itemId` doesn't grow the count.
 *
 * Backed by Supabase or Redis when configured (shared across all
 * serverless instances); falls back to a per-instance in-memory Set
 * otherwise, matching isRateLimited()'s fallback behavior.
 *
 * @param {string} key - Logical rate-limit bucket name (e.g. "ai_augment_jobs_1.2.3.4").
 * @param {string} itemId - The distinct item to record (e.g. a job ID).
 * @param {number} limit - Max distinct items allowed per window.
 * @param {number} windowMs - Window size in milliseconds.
 * @returns {Promise<boolean>} true if this request should be throttled.
 */
export async function isDistinctItemCountOverLimit(key, itemId, limit, windowMs) {
  const bucket = Math.floor(Date.now() / windowMs);

  if (SUPABASE_ENABLED) {
    try {
      const count = await supabaseAddToSetAndCount(`${key}_${bucket}`, itemId);
      return count > limit;
    } catch (err) {
      console.error("[rateLimiter] Supabase set check failed, falling back to in-memory for this request:", err.message || err);
    }
  } else if (REDIS_ENABLED) {
    try {
      const count = await redisAddToSetAndCount(`clearclause:ratelimit:set:${key}:${bucket}`, itemId, Math.ceil(windowMs / 1000) + 5);
      return count > limit;
    } catch (err) {
      console.error("[rateLimiter] Redis set check failed, falling back to in-memory for this request:", err.message || err);
    }
  }

  return memoryAddToSetAndCount(key, itemId, bucket) > limit;
}