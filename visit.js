// Lightweight, privacy-respecting usage analytics.
//
// We deliberately store nothing that identifies a visitor or a document:
// no document text, no IP addresses, no session/user IDs -- just aggregate
// counters (how many analyses ran, which document types, how long they
// were, how often we errored or rate-limited, how feedback broke down).
//
// PERSISTENCE: on Vercel, /api/analyze, /api/feedback, and /api/stats each
// run as their own isolated serverless function -- they do NOT share
// process memory with each other, even though they're all files in the
// same /api folder. A plain in-memory counter written in analyze.js is
// invisible to stats.js. So this module talks to a real database when one
// is configured, and only falls back to an in-memory counter (useful for
// local `vercel dev`, or before you've set anything up) when it isn't.
// recordEvent()/getStats() are the only two functions the rest of the app
// calls, so which backend is active is invisible to analyze.js,
// feedback.js, and stats.js.
//
// Two backends are supported, checked in this order:
//   1. Supabase (Postgres) -- SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   2. Redis (Vercel KV / Upstash) -- KV_REST_API_URL + KV_REST_API_TOKEN
//      (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
//   3. In-memory fallback if neither is configured.
//
// ---- SETTING UP SUPABASE (using your existing Supabase project) ----
// 1. In Supabase, open your project -> SQL Editor -> New query, and run:
//
//      create table if not exists clearclause_stats (
//        key text primary key,
//        value bigint not null default 0
//      );
//
//      create table if not exists clearclause_doc_types (
//        doc_type text primary key,
//        count bigint not null default 0
//      );
//
//      create or replace function clearclause_incr(p_key text, p_amount bigint default 1)
//      returns void as $$
//      begin
//        insert into clearclause_stats (key, value)
//        values (p_key, p_amount)
//        on conflict (key) do update set value = clearclause_stats.value + excluded.value;
//      end;
//      $$ language plpgsql;
//
//      create or replace function clearclause_incr_doctype(p_type text, p_amount bigint default 1)
//      returns void as $$
//      begin
//        insert into clearclause_doc_types (doc_type, count)
//        values (p_type, p_amount)
//        on conflict (doc_type) do update set count = clearclause_doc_types.count + excluded.count;
//      end;
//      $$ language plpgsql;
//
//      create or replace function clearclause_set_if_absent(p_key text, p_value bigint)
//      returns void as $$
//      begin
//        insert into clearclause_stats (key, value)
//        values (p_key, p_value)
//        on conflict (key) do nothing;
//      end;
//      $$ language plpgsql;
//
// 2. In Supabase, go to Project Settings -> API. Copy the "Project URL"
//    and the "service_role" secret key (NOT the anon/public key -- the
//    service role key is required so writes aren't blocked by row-level
//    security; it never reaches the browser, it's only used here on the
//    server).
// 3. In Vercel, go to your project -> Settings -> Environment Variables
//    and add:
//      SUPABASE_URL = <your Project URL>
//      SUPABASE_SERVICE_ROLE_KEY = <your service_role key>
// 4. Redeploy. /stats.html will show "Backed by Supabase" once it's picked up.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = !SUPABASE_ENABLED && Boolean(REDIS_URL && REDIS_TOKEN);

const BACKEND = SUPABASE_ENABLED ? "supabase" : REDIS_ENABLED ? "redis" : "in-memory";

// ---- Supabase backend ----

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabaseRpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`Supabase RPC ${fn} failed: ${res.status} ${await res.text()}`);
  }
}

async function supabaseSelect(table, select) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    headers: supabaseHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Supabase select on ${table} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function recordEventSupabase(event, payload) {
  const calls = [supabaseRpc("clearclause_set_if_absent", { p_key: "windowStartedAt", p_value: Date.now() })];

  switch (event) {
    case "visit":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "pageViews" }));
      break;
    case "request":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "totalRequests" }));
      break;
    case "rate_limited":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "rateLimitHits" }));
      break;
    case "error":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "errors" }));
      break;
    case "not_document":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "notDocumentCount" }));
      break;
    case "feedback":
      if (payload.value === "yes") calls.push(supabaseRpc("clearclause_incr", { p_key: "feedbackYes" }));
      else if (payload.value === "no") calls.push(supabaseRpc("clearclause_incr", { p_key: "feedbackNo" }));
      break;
    case "completed": {
      const type = String(payload.documentType || "Unlabeled").trim().slice(0, 60) || "Unlabeled";
      calls.push(supabaseRpc("clearclause_incr", { p_key: "completedAnalyses" }));
      calls.push(supabaseRpc("clearclause_incr_doctype", { p_type: type }));
      if (typeof payload.documentLength === "number") {
        calls.push(supabaseRpc("clearclause_incr", { p_key: "totalDocumentLength", p_amount: payload.documentLength }));
      }
      break;
    }
    default:
      break;
  }

  await Promise.all(calls);
}

async function getStatsSupabase() {
  const [statRows, docTypeRows] = await Promise.all([
    supabaseSelect("clearclause_stats", "key,value"),
    supabaseSelect("clearclause_doc_types", "doc_type,count"),
  ]);

  const byKey = Object.fromEntries(statRows.map((r) => [r.key, Number(r.value) || 0]));
  const documentTypeCounts = Object.fromEntries(docTypeRows.map((r) => [r.doc_type, Number(r.count) || 0]));

  return buildStatsPayload({
    pageViews: byKey.pageViews || 0,
    totalRequests: byKey.totalRequests || 0,
    completedAnalyses: byKey.completedAnalyses || 0,
    notDocumentCount: byKey.notDocumentCount || 0,
    errors: byKey.errors || 0,
    rateLimitHits: byKey.rateLimitHits || 0,
    totalDocumentLength: byKey.totalDocumentLength || 0,
    feedbackYes: byKey.feedbackYes || 0,
    feedbackNo: byKey.feedbackNo || 0,
    windowStartedAt: byKey.windowStartedAt || Date.now(),
    documentTypeCounts,
  });
}

// ---- Redis backend (Vercel KV / Upstash) ----

const KEY_PREFIX = "clearclause:stats:";
const COUNTER_KEYS = {
  pageViews: KEY_PREFIX + "pageViews",
  totalRequests: KEY_PREFIX + "totalRequests",
  completedAnalyses: KEY_PREFIX + "completedAnalyses",
  notDocumentCount: KEY_PREFIX + "notDocumentCount",
  errors: KEY_PREFIX + "errors",
  rateLimitHits: KEY_PREFIX + "rateLimitHits",
  totalDocumentLength: KEY_PREFIX + "totalDocumentLength",
  feedbackYes: KEY_PREFIX + "feedbackYes",
  feedbackNo: KEY_PREFIX + "feedbackNo",
  windowStartedAt: KEY_PREFIX + "windowStartedAt",
};
const DOC_TYPES_HASH_KEY = KEY_PREFIX + "docTypes";

async function redisPipeline(commands) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    throw new Error(`Redis pipeline failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function ensureWindowStarted() {
  await redisPipeline([["SET", COUNTER_KEYS.windowStartedAt, String(Date.now()), "NX"]]);
}

async function recordEventRedis(event, payload) {
  switch (event) {
    case "visit":
      await redisPipeline([["INCR", COUNTER_KEYS.pageViews]]);
      break;
    case "request":
      await redisPipeline([["INCR", COUNTER_KEYS.totalRequests]]);
      break;
    case "rate_limited":
      await redisPipeline([["INCR", COUNTER_KEYS.rateLimitHits]]);
      break;
    case "error":
      await redisPipeline([["INCR", COUNTER_KEYS.errors]]);
      break;
    case "not_document":
      await redisPipeline([["INCR", COUNTER_KEYS.notDocumentCount]]);
      break;
    case "feedback":
      if (payload.value === "yes") {
        await redisPipeline([["INCR", COUNTER_KEYS.feedbackYes]]);
      } else if (payload.value === "no") {
        await redisPipeline([["INCR", COUNTER_KEYS.feedbackNo]]);
      }
      break;
    case "completed": {
      const type = String(payload.documentType || "Unlabeled").trim().slice(0, 60) || "Unlabeled";
      const commands = [["INCR", COUNTER_KEYS.completedAnalyses], ["HINCRBY", DOC_TYPES_HASH_KEY, type, 1]];
      if (typeof payload.documentLength === "number") {
        commands.push(["INCRBY", COUNTER_KEYS.totalDocumentLength, payload.documentLength]);
      }
      await redisPipeline(commands);
      break;
    }
    default:
      break;
  }
  await ensureWindowStarted();
}

async function getStatsRedis() {
  const [
    pageViewsRes,
    totalRequestsRes,
    completedAnalysesRes,
    notDocumentCountRes,
    errorsRes,
    rateLimitHitsRes,
    totalDocumentLengthRes,
    feedbackYesRes,
    feedbackNoRes,
    windowStartedAtRes,
    docTypesRes,
  ] = await redisPipeline([
    ["GET", COUNTER_KEYS.pageViews],
    ["GET", COUNTER_KEYS.totalRequests],
    ["GET", COUNTER_KEYS.completedAnalyses],
    ["GET", COUNTER_KEYS.notDocumentCount],
    ["GET", COUNTER_KEYS.errors],
    ["GET", COUNTER_KEYS.rateLimitHits],
    ["GET", COUNTER_KEYS.totalDocumentLength],
    ["GET", COUNTER_KEYS.feedbackYes],
    ["GET", COUNTER_KEYS.feedbackNo],
    ["GET", COUNTER_KEYS.windowStartedAt],
    ["HGETALL", DOC_TYPES_HASH_KEY],
  ]);

  const toInt = (r) => parseInt(r?.result, 10) || 0;

  const docTypesFlat = docTypesRes?.result || [];
  const documentTypeCounts = {};
  for (let i = 0; i < docTypesFlat.length; i += 2) {
    documentTypeCounts[docTypesFlat[i]] = parseInt(docTypesFlat[i + 1], 10) || 0;
  }

  return buildStatsPayload({
    pageViews: toInt(pageViewsRes),
    totalRequests: toInt(totalRequestsRes),
    completedAnalyses: toInt(completedAnalysesRes),
    notDocumentCount: toInt(notDocumentCountRes),
    errors: toInt(errorsRes),
    rateLimitHits: toInt(rateLimitHitsRes),
    totalDocumentLength: toInt(totalDocumentLengthRes),
    feedbackYes: toInt(feedbackYesRes),
    feedbackNo: toInt(feedbackNoRes),
    windowStartedAt: windowStartedAtRes?.result ? parseInt(windowStartedAtRes.result, 10) : Date.now(),
    documentTypeCounts,
  });
}

// ---- In-memory fallback (local dev, or before any backend is configured) ----

const memoryStats = {
  pageViews: 0,
  totalRequests: 0,
  completedAnalyses: 0,
  notDocumentCount: 0,
  errors: 0,
  rateLimitHits: 0,
  totalDocumentLength: 0,
  documentTypeCounts: Object.create(null),
  feedbackYes: 0,
  feedbackNo: 0,
  windowStartedAt: Date.now(),
};

function recordEventMemory(event, payload) {
  switch (event) {
    case "visit":
      memoryStats.pageViews++;
      break;
    case "request":
      memoryStats.totalRequests++;
      break;
    case "rate_limited":
      memoryStats.rateLimitHits++;
      break;
    case "error":
      memoryStats.errors++;
      break;
    case "not_document":
      memoryStats.notDocumentCount++;
      break;
    case "feedback":
      if (payload.value === "yes") memoryStats.feedbackYes++;
      else if (payload.value === "no") memoryStats.feedbackNo++;
      break;
    case "completed": {
      memoryStats.completedAnalyses++;
      if (typeof payload.documentLength === "number") {
        memoryStats.totalDocumentLength += payload.documentLength;
      }
      const type = String(payload.documentType || "Unlabeled").trim().slice(0, 60) || "Unlabeled";
      memoryStats.documentTypeCounts[type] = (memoryStats.documentTypeCounts[type] || 0) + 1;
      break;
    }
    default:
      break;
  }
}

function getStatsMemory() {
  return buildStatsPayload({ ...memoryStats });
}

// ---- Shared response shaping ----

function buildStatsPayload({
  pageViews,
  totalRequests,
  completedAnalyses,
  notDocumentCount,
  errors,
  rateLimitHits,
  totalDocumentLength,
  documentTypeCounts,
  feedbackYes,
  feedbackNo,
  windowStartedAt,
}) {
  const topDocumentTypes = Object.entries(documentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }));

  const rate = (n) => (totalRequests ? +(n / totalRequests).toFixed(3) : null);
  const totalFeedback = feedbackYes + feedbackNo;

  const notes = {
    supabase: "Backed by Supabase (Postgres) — durable across requests and cold starts.",
    redis: "Backed by Redis (Vercel KV / Upstash) — durable across requests and cold starts.",
    "in-memory":
      "No database configured, so this is falling back to in-memory, per-instance counters — they reset on cold start and won't stay in sync across serverless instances. See the setup comment at the top of api/_stats.js to connect Supabase (or Redis).",
  };

  return {
    persistence: BACKEND,
    windowStartedAt: new Date(windowStartedAt).toISOString(),
    pageViews,
    // Of everyone who loaded the page, what fraction ran an analysis? This
    // is the "trust / understanding / effort" funnel number -- low values
    // mean people are visiting but not converting, not that the product
    // itself is bad.
    visitToAnalysisRate: pageViews ? +(completedAnalyses / pageViews).toFixed(3) : null,
    totalRequests,
    completedAnalyses,
    notDocumentCount,
    errors,
    rateLimitHits,
    completionRate: rate(completedAnalyses),
    errorRate: rate(errors),
    rateLimitHitRate: rate(rateLimitHits),
    averageDocumentLength: completedAnalyses
      ? Math.round(totalDocumentLength / completedAnalyses)
      : null,
    topDocumentTypes,
    feedbackYes,
    feedbackNo,
    totalFeedback,
    satisfactionRate: totalFeedback ? +(feedbackYes / totalFeedback).toFixed(3) : null,
    note: notes[BACKEND],
  };
}

// ---- Public API ----

export async function recordEvent(event, payload = {}) {
  if (SUPABASE_ENABLED) {
    try {
      await recordEventSupabase(event, payload);
      return;
    } catch (err) {
      console.error("[stats] Supabase write failed, falling back to in-memory for this event:", err.message || err);
    }
  } else if (REDIS_ENABLED) {
    try {
      await recordEventRedis(event, payload);
      return;
    } catch (err) {
      console.error("[stats] Redis write failed, falling back to in-memory for this event:", err.message || err);
    }
  }
  recordEventMemory(event, payload);
}

export async function getStats() {
  if (SUPABASE_ENABLED) {
    try {
      return await getStatsSupabase();
    } catch (err) {
      console.error("[stats] Supabase read failed, falling back to in-memory:", err.message || err);
    }
  } else if (REDIS_ENABLED) {
    try {
      return await getStatsRedis();
    } catch (err) {
      console.error("[stats] Redis read failed, falling back to in-memory:", err.message || err);
    }
  }
  return getStatsMemory();
}
