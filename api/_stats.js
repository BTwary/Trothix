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

// The three sample-document chips on the homepage (see index.html). Kept as
// a fixed allowlist -- funnel counters below key off this list rather than
// trusting whatever string the client sends, so a tampered request can't
// write arbitrary keys into the stats store.
const SAMPLE_TYPES = ["lease", "freelance", "tos"];
function normalizeSampleType(t) {
  return SAMPLE_TYPES.includes(t) ? t : "other";
}

// Fixed allowlist of "why did this request fail" reasons, set by
// analyze.js at each of its own error-return sites (never trusted from the
// client) -- this turns the single opaque "errors" counter into something
// you can actually act on: is it mostly bad input, a Gemini outage, or
// JSON the model returned that we couldn't parse?
const ERROR_REASONS = [
  "missing_document",
  "too_short",
  "missing_api_key",
  "gemini_5xx",
  "empty_response",
  "json_parse_failed",
  "unexpected",
];
function normalizeErrorReason(r) {
  return ERROR_REASONS.includes(r) ? r : "unexpected";
}

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
    case "sample_clicked":
      calls.push(supabaseRpc("clearclause_incr", { p_key: `sampleClicks_${normalizeSampleType(payload.sampleType)}` }));
      break;
    case "analysis_started":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "analysisStarted" }));
      break;
    case "request":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "totalRequests" }));
      break;
    case "rate_limited":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "rateLimitHits" }));
      break;
    case "error":
      calls.push(supabaseRpc("clearclause_incr", { p_key: "errors" }));
      calls.push(supabaseRpc("clearclause_incr", { p_key: `errorReasons_${normalizeErrorReason(payload.reason)}` }));
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
  const sampleClicks = Object.fromEntries(
    [...SAMPLE_TYPES, "other"].map((t) => [t, byKey[`sampleClicks_${t}`] || 0])
  );
  const errorReasons = Object.fromEntries(
    ERROR_REASONS.map((r) => [r, byKey[`errorReasons_${r}`] || 0])
  );

  return buildStatsPayload({
    pageViews: byKey.pageViews || 0,
    sampleClicks,
    analysisStarted: byKey.analysisStarted || 0,
    totalRequests: byKey.totalRequests || 0,
    completedAnalyses: byKey.completedAnalyses || 0,
    notDocumentCount: byKey.notDocumentCount || 0,
    errors: byKey.errors || 0,
    errorReasons,
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
  analysisStarted: KEY_PREFIX + "analysisStarted",
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
const SAMPLE_CLICKS_HASH_KEY = KEY_PREFIX + "sampleClicks";
const ERROR_REASONS_HASH_KEY = KEY_PREFIX + "errorReasons";

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
    case "sample_clicked":
      await redisPipeline([["HINCRBY", SAMPLE_CLICKS_HASH_KEY, normalizeSampleType(payload.sampleType), 1]]);
      break;
    case "analysis_started":
      await redisPipeline([["INCR", COUNTER_KEYS.analysisStarted]]);
      break;
    case "request":
      await redisPipeline([["INCR", COUNTER_KEYS.totalRequests]]);
      break;
    case "rate_limited":
      await redisPipeline([["INCR", COUNTER_KEYS.rateLimitHits]]);
      break;
    case "error":
      await redisPipeline([
        ["INCR", COUNTER_KEYS.errors],
        ["HINCRBY", ERROR_REASONS_HASH_KEY, normalizeErrorReason(payload.reason), 1],
      ]);
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
    analysisStartedRes,
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
    sampleClicksRes,
    errorReasonsRes,
  ] = await redisPipeline([
    ["GET", COUNTER_KEYS.pageViews],
    ["GET", COUNTER_KEYS.analysisStarted],
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
    ["HGETALL", SAMPLE_CLICKS_HASH_KEY],
    ["HGETALL", ERROR_REASONS_HASH_KEY],
  ]);

  const toInt = (r) => parseInt(r?.result, 10) || 0;

  const docTypesFlat = docTypesRes?.result || [];
  const documentTypeCounts = {};
  for (let i = 0; i < docTypesFlat.length; i += 2) {
    documentTypeCounts[docTypesFlat[i]] = parseInt(docTypesFlat[i + 1], 10) || 0;
  }

  const sampleClicksFlat = sampleClicksRes?.result || [];
  const sampleClicks = Object.fromEntries([...SAMPLE_TYPES, "other"].map((t) => [t, 0]));
  for (let i = 0; i < sampleClicksFlat.length; i += 2) {
    sampleClicks[sampleClicksFlat[i]] = parseInt(sampleClicksFlat[i + 1], 10) || 0;
  }

  const errorReasonsFlat = errorReasonsRes?.result || [];
  const errorReasons = Object.fromEntries(ERROR_REASONS.map((r) => [r, 0]));
  for (let i = 0; i < errorReasonsFlat.length; i += 2) {
    errorReasons[errorReasonsFlat[i]] = parseInt(errorReasonsFlat[i + 1], 10) || 0;
  }

  return buildStatsPayload({
    pageViews: toInt(pageViewsRes),
    sampleClicks,
    analysisStarted: toInt(analysisStartedRes),
    totalRequests: toInt(totalRequestsRes),
    completedAnalyses: toInt(completedAnalysesRes),
    notDocumentCount: toInt(notDocumentCountRes),
    errors: toInt(errorsRes),
    errorReasons,
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
  analysisStarted: 0,
  sampleClicks: Object.fromEntries([...SAMPLE_TYPES, "other"].map((t) => [t, 0])),
  totalRequests: 0,
  completedAnalyses: 0,
  notDocumentCount: 0,
  errors: 0,
  errorReasons: Object.fromEntries(ERROR_REASONS.map((r) => [r, 0])),
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
    case "sample_clicked": {
      const t = normalizeSampleType(payload.sampleType);
      memoryStats.sampleClicks[t] = (memoryStats.sampleClicks[t] || 0) + 1;
      break;
    }
    case "analysis_started":
      memoryStats.analysisStarted++;
      break;
    case "request":
      memoryStats.totalRequests++;
      break;
    case "rate_limited":
      memoryStats.rateLimitHits++;
      break;
    case "error": {
      memoryStats.errors++;
      const r = normalizeErrorReason(payload.reason);
      memoryStats.errorReasons[r] = (memoryStats.errorReasons[r] || 0) + 1;
      break;
    }
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
  sampleClicks,
  analysisStarted,
  totalRequests,
  completedAnalyses,
  notDocumentCount,
  errors,
  errorReasons,
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
  const sampleClicksTotal = Object.values(sampleClicks || {}).reduce((a, b) => a + b, 0);

  // Funnel: Page View -> Sample/Analysis Started -> Analysis Completed -> Feedback.
  // "analysisStarted" fires client-side the instant the button is clicked
  // with valid-looking text, BEFORE the network request goes out -- so it
  // can diverge from totalRequests (e.g. a request that never reaches the
  // server due to a network error). Comparing the two tells you whether
  // drop-off is happening before or after the request leaves the browser.
  const div = (num, denom) => (denom ? +(num / denom).toFixed(3) : null);

  const notes = {
    supabase: "Backed by Supabase (Postgres) — durable across requests and cold starts.",
    redis: "Backed by Redis (Vercel KV / Upstash) — durable across requests and cold starts.",
    "in-memory":
      "No database configured, so this is falling back to in-memory, per-instance counters — they reset on cold start and won't stay in sync across serverless instances. See the setup comment at the top of api/_stats.js to connect Supabase (or Redis).",
  };

  return {
    persistence: BACKEND,
    windowStartedAt: new Date(windowStartedAt).toISOString(),

    // -- Funnel, top to bottom --
    pageViews,
    sampleClicks,
    sampleClicksTotal,
    analysisStarted,
    totalRequests,
    completedAnalyses,

    // -- Funnel rates, each step relative to the one above it --
    pageViewToSampleClickRate: div(sampleClicksTotal, pageViews),
    pageViewToAnalysisStartedRate: div(analysisStarted, pageViews),
    // Kept as "visitToAnalysisRate" for continuity with the existing
    // stats.html label ("Visit → analysis rate"); this is page-view ->
    // completed, the headline trust/understanding/effort number.
    visitToAnalysisRate: div(completedAnalyses, pageViews),
    analysisStartedToCompletedRate: div(completedAnalyses, analysisStarted),
    analysisCompletedToFeedbackRate: div(totalFeedback, completedAnalyses),

    notDocumentCount,
    errors,
    errorReasons,
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
