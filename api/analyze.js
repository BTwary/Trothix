// /api/analyze — server-side proxy to Gemini, Groq, Mistral, and OpenRouter.
// All API keys live only here, in Vercel Environment Variables:
//   GEMINI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, OPENROUTER_API_KEY
// They are never sent to or exposed in the browser.

import { jsonrepair } from "jsonrepair";
import { recordEvent } from "./_stats.js";

// Tried in order. Each entry has its own free-tier quota, completely
// separate from the others, so if Gemini's daily cap is gone the chain
// still has Groq, Mistral, and OpenRouter left before giving up.
//   - Gemini 3.5 Flash: latest free-tier model, highest RPD allowance (20/day).
//   - Gemini 2.5 Flash: fallback Gemini; same RPD limit (20/day) but separate quota.
//   - Gemini 2.0 Flash: older but still on free tier; 0/0 limits mean quota not set,
//     skipped automatically if it starts returning 429s.
//   - Groq: fast, standing free tier, tighter tokens-per-minute budget.
//   - Mistral: open-mistral-nemo on free tier, reliable JSON mode.
//   - OpenRouter: aggregator with its own free model roster (list rotates --
//     re-check https://openrouter.ai/models before launch and swap the
//     model id below if it's no longer free).
// Re-check https://ai.google.dev/gemini-api/docs/rate-limits for Gemini too --
// Google adjusts free-tier model eligibility fairly often.
const MODEL_CHAIN = [
  { provider: "gemini", model: "gemini-3.5-flash" },
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "groq",   model: "llama-3.3-70b-versatile" },
  { provider: "mistral", model: "open-mistral-nemo" },
  { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
];

// Groq/Mistral/OpenRouter don't have Gemini's hidden "thinking token" overhead,
// so they need much less headroom than Gemini's maxOutputTokens: 8000.
const OPENAI_COMPAT_MAX_TOKENS = 4096;

function normalizeFinishReason(finishReason) {
  if (finishReason === "length") return "MAX_TOKENS";
  if (finishReason === "content_filter") return "SAFETY";
  if (finishReason === "stop") return "STOP";
  return finishReason || null;
}

// Pulls a retry-after value out of whatever shape the provider gave us --
// a header, a Gemini-style {"retryDelay":"46s"} blob, or a Groq-style
// "Please try again in 6m11.52s" message. Returns null if none found.
function extractRetryAfterSeconds(res, rawBodyText) {
  const header = res.headers?.get?.("retry-after");
  if (header && !Number.isNaN(Number(header))) return parseInt(header, 10);

  const geminiMatch = rawBodyText.match(/"retryDelay"\s*:\s*"(\d+)(?:\.\d+)?s"/);
  if (geminiMatch) return parseInt(geminiMatch[1], 10);

  const groqMatch = rawBodyText.match(/try again in\s*(?:(\d+)m)?(\d+(?:\.\d+)?)s/i);
  if (groqMatch) {
    const minutes = groqMatch[1] ? parseInt(groqMatch[1], 10) : 0;
    const seconds = parseFloat(groqMatch[2]);
    return Math.ceil(minutes * 60 + seconds);
  }

  return null;
}

async function callGeminiOne(model, apiKey, systemPrompt, userText) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          // Keeps thinking tokens from eating the whole maxOutputTokens budget
          // on Gemini 2.5+ and 3.x models.
          thinkingConfig: { thinkingLevel: "low" },
          maxOutputTokens: 8000,
        },
      }),
    }
  );

  if (!res.ok) {
    const rawDetail = await res.text();
    return {
      ok: false,
      status: res.status,
      provider: "gemini",
      model,
      rawDetail,
      retryAfterSeconds: extractRetryAfterSeconds(res, rawDetail),
    };
  }

  const data = await res.json();
  const finishReason = data?.candidates?.[0]?.finishReason || null;
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      ?.map((p) => p.text || "")
      ?.join("") || "";

  return {
    ok: true,
    status: 200,
    provider: "gemini",
    model,
    text,
    finishReason,
    usageMetadata: data?.usageMetadata,
  };
}

async function callOpenAiCompatible({ provider, model, baseUrl, apiKey, systemPrompt, userText, extraHeaders }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders || {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: OPENAI_COMPAT_MAX_TOKENS,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const rawDetail = await res.text();
    return {
      ok: false,
      status: res.status,
      provider,
      model,
      rawDetail,
      retryAfterSeconds: extractRetryAfterSeconds(res, rawDetail),
    };
  }

  const data = await res.json();
  const choice = data?.choices?.[0];
  const text = choice?.message?.content || "";

  return {
    ok: true,
    status: 200,
    provider,
    model,
    text,
    finishReason: normalizeFinishReason(choice?.finish_reason),
    usageMetadata: data?.usage,
  };
}

async function callModel(entry, apiKeys, systemPrompt, userText) {
  if (entry.provider === "gemini") {
    return callGeminiOne(entry.model, apiKeys.gemini, systemPrompt, userText);
  }
  if (entry.provider === "groq") {
    return callOpenAiCompatible({
      provider: "groq",
      model: entry.model,
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: apiKeys.groq,
      systemPrompt,
      userText,
    });
  }
  if (entry.provider === "mistral") {
    return callOpenAiCompatible({
      provider: "mistral",
      model: entry.model,
      baseUrl: "https://api.mistral.ai/v1",
      apiKey: apiKeys.mistral,
      systemPrompt,
      userText,
    });
  }
  if (entry.provider === "openrouter") {
    return callOpenAiCompatible({
      provider: "openrouter",
      model: entry.model,
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: apiKeys.openrouter,
      systemPrompt,
      userText,
      extraHeaders: {
        "HTTP-Referer": "https://trothix.vercel.app",
        "X-Title": "Trothix",
      },
    });
  }
  throw new Error(`Unknown provider: ${entry.provider}`);
}

// Walks MODEL_CHAIN in order. Skips any provider whose API key isn't set
// (so you can add keys incrementally without breaking deploys), and moves
// to the next entry on a quota/server error. A 4xx that isn't a quota
// issue fails the same way on every model, so it returns immediately
// instead of burning calls retrying it.
async function callModelChain(apiKeys, systemPrompt, userText) {
  let lastResult = null;
  for (const entry of MODEL_CHAIN) {
    const apiKey = apiKeys[entry.provider];
    if (!apiKey) continue;

    let result;
    try {
      result = await callModel(entry, apiKeys, systemPrompt, userText);
    } catch (e) {
      result = { ok: false, status: 0, provider: entry.provider, model: entry.model, rawDetail: String(e) };
    }

    if (result.ok) return result;
    lastResult = result;
    if (result.status !== 429 && result.status < 500 && result.status !== 0) return result;
  }
  return lastResult; // may be null if no keys were configured at all
}

const SYSTEM_PROMPT = `You are Trothix, a plain-language contract analysis assistant. Given a pasted contract, lease, or terms-of-service document, respond with ONLY a raw JSON object (no markdown code fences, no preamble, no commentary) matching exactly this shape:

{
  "isDocument": true,
  "documentType": "short label like 'Residential Lease' or 'Freelance Contract'",
  "riskLevel": "high" | "medium" | "low",
  "riskSummary": "one plain-English sentence explaining the overall risk level and who it favors",
  "topPoints": [ "up to 3 short plain-English sentences, the most important things the reader should know before anything else" ],
  "summary": "3-5 plain-English sentences: what this document is and what the reader is agreeing to",
  "keyTerms": {
    "duration": "term/duration in plain language, or 'Not specified'",
    "payment": "payment amount and terms in plain language, or 'Not specified'",
    "termination": "how/when this can be ended, or 'Not specified'",
    "penalties": "fees, penalties, or liability caps, or 'Not specified'"
  },
  "redFlags": [
    { "clause": "an EXACT substring copied verbatim from the source document, under 12 words, that this flag refers to", "issue": "one plain-English sentence explaining why this is worth attention", "severity": "high" | "medium" | "low", "anchor": "a short unique slug for this flag, e.g. 'early-termination'" }
  ],
  "consequences": "2-4 plain-English sentences on what realistically happens if the reader breaks or fails to meet this agreement"
}

List up to 5 red flags, ordered by severity (high first). The "clause" field for each red flag MUST be copied character-for-character from the source document (not paraphrased) so it can be located and highlighted in the original text. Use cautious, non-definitive language for legal conclusions — say a clause "may be unusual" or "is worth reviewing with a professional" rather than declaring anything "illegal" or "unenforceable." Never give definitive legal conclusions.

If the pasted text is empty, nonsensical, far too short to be a real document, or clearly not a contract/lease/terms-of-service (e.g. it's a poem, a recipe, random text), instead respond with ONLY:
{ "isDocument": false, "reason": "one short plain sentence explaining why this doesn't look like a document Trothix can analyze" }`;

// Used for documents too large for a single call (see SINGLE_CALL_LIMIT on
// the client). Each chunk is analyzed independently and results are merged
// client-side before a final SYNTHESIS_SYSTEM_PROMPT call produces the
// same shape SYSTEM_PROMPT would have produced for a single-call document.
const CHUNK_SYSTEM_PROMPT = `You are Trothix, analyzing ONE SECTION of a much larger contract. You are only shown this excerpt, not the full document -- do not assume anything about sections you can't see. Respond with ONLY a raw JSON object (no markdown, no preamble, no commentary) matching exactly this shape:

{
  "redFlags": [
    { "clause": "an EXACT substring copied verbatim from THIS EXCERPT, under 12 words", "issue": "one plain-English sentence explaining why this is worth attention", "severity": "high" | "medium" | "low", "anchor": "a short unique slug for this flag" }
  ],
  "keyTerms": {
    "duration": "only include this field if THIS EXCERPT specifies a term/duration, in plain language",
    "payment": "only include this field if THIS EXCERPT specifies payment amount/terms, in plain language",
    "termination": "only include this field if THIS EXCERPT specifies how/when this can be ended, in plain language",
    "penalties": "only include this field if THIS EXCERPT specifies fees, penalties, or liability caps, in plain language"
  },
  "notableFacts": [ "up to 3 short plain-English facts about anything else important in this excerpt (obligations, definitions, unusual terms) that isn't already captured as a red flag" ]
}

List up to 4 red flags found in this excerpt, ordered by severity (high first). The "clause" field MUST be copied character-for-character from this excerpt. Omit any keyTerms field this excerpt doesn't actually mention -- don't guess or write "Not specified" here. Use cautious, non-definitive language ("may be unusual", "worth reviewing with a professional") and never declare anything "illegal" or "unenforceable." If this excerpt has no meaningful contract content (e.g. it's a signature block, table of contents, or blank boilerplate), respond with { "redFlags": [], "keyTerms": {}, "notableFacts": [] }.`;

// Takes the merged output of many CHUNK_SYSTEM_PROMPT calls and produces
// the same final report shape SYSTEM_PROMPT does for a single-call document.
const SYNTHESIS_SYSTEM_PROMPT = `You are Trothix. A long contract has already been reviewed section-by-section, and the raw findings from every section are provided below as JSON. Your only job is to synthesize those findings into the final report -- do not invent clauses or facts beyond what's given. Respond with ONLY a raw JSON object (no markdown, no preamble, no commentary) matching exactly this shape:

{
  "isDocument": true,
  "documentType": "short label like 'Residential Lease' or 'Freelance Contract', inferred from the findings",
  "riskLevel": "high" | "medium" | "low",
  "riskSummary": "one plain-English sentence explaining the overall risk level and who it favors",
  "topPoints": [ "up to 3 short plain-English sentences, the most important things the reader should know before anything else" ],
  "summary": "3-5 plain-English sentences: what this document is and what the reader is agreeing to, based on the findings",
  "keyTerms": {
    "duration": "term/duration in plain language, or 'Not specified'",
    "payment": "payment amount and terms in plain language, or 'Not specified'",
    "termination": "how/when this can be ended, or 'Not specified'",
    "penalties": "fees, penalties, or liability caps, or 'Not specified'"
  },
  "redFlags": [
    { "clause": "copy verbatim from the provided findings, unchanged", "issue": "copy or lightly tighten from the provided findings", "severity": "high" | "medium" | "low", "anchor": "copy from the provided findings" }
  ],
  "consequences": "2-4 plain-English sentences on what realistically happens if the reader breaks or fails to meet this agreement, based on the findings"
}

Select and reorder up to 5 red flags from the provided list, ordered by severity (high first) -- do not alter the "clause" text. If the findings are too sparse to determine a keyTerms field, use "Not specified". If the findings list is empty or has no real content, respond with { "isDocument": false, "reason": "one short plain sentence" } instead.`;

// Rate limiting is job-aware, not request-aware, because one large document
// now becomes many sub-requests (one per chunk, plus one synthesis call).
const jobLog = new Map(); // ip -> Map(jobId -> firstSeenTimestamp)
const requestLog = new Map(); // ip -> [timestamps]
const RATE_LIMIT_JOBS = 6;
const RATE_LIMIT_SUBREQUESTS = 60;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip, jobId) {
  const now = Date.now();

  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  if (timestamps.length > RATE_LIMIT_SUBREQUESTS) return true;

  const jobs = jobLog.get(ip) || new Map();
  for (const [id, ts] of jobs) {
    if (now - ts > RATE_WINDOW_MS) jobs.delete(id);
  }
  const isNewJob = !jobs.has(jobId);
  if (isNewJob) jobs.set(jobId, now);
  jobLog.set(ip, jobs);

  return jobs.size > RATE_LIMIT_JOBS;
}

const GLOBAL_LIMIT_PER_MIN = 30;
let globalWindowStart = Date.now();
let globalWindowCount = 0;

function isGloballyThrottled() {
  const now = Date.now();
  if (now - globalWindowStart > RATE_WINDOW_MS) {
    globalWindowStart = now;
    globalWindowCount = 0;
  }
  globalWindowCount++;
  return globalWindowCount > GLOBAL_LIMIT_PER_MIN;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  await recordEvent("request");

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const { documentText, mode: rawMode, jobId: incomingJobId, chunkIndex, chunkCount, findings, userState, userRole, aiFallbackPayload } = req.body || {};
  const mode = rawMode === "chunk" || rawMode === "synthesize" ? rawMode : "full";
  const jobId = typeof incomingJobId === "string" && incomingJobId ? incomingJobId : `${ip}-solo-${Date.now()}-${Math.random()}`;

  if (isRateLimited(ip, jobId)) {
    await recordEvent("rate_limited");
    return res.status(429).json({
      error: "You're sending requests faster than allowed.",
      retryAfterSeconds: 60,
    });
  }
  if (isGloballyThrottled()) {
    await recordEvent("rate_limited");
    return res.status(429).json({
      error: "Trothix is getting a lot of traffic right now. Please try again in a moment.",
      retryAfterSeconds: 60,
    });
  }

  let systemPrompt, userText, loggedLength;

  if (mode === "synthesize") {
    if (!findings || typeof findings !== "object") {
      await recordEvent("error", { reason: "missing_findings" });
      return res.status(400).json({ error: "No findings were provided to synthesize." });
    }
    systemPrompt = SYNTHESIS_SYSTEM_PROMPT;
    userText = JSON.stringify(findings);
    loggedLength = userText.length;
  } else {
    if (!documentText || typeof documentText !== "string" || !documentText.trim()) {
      await recordEvent("error", { reason: "missing_document" });
      return res.status(400).json({ error: "No document text was provided." });
    }

    if (mode === "chunk") {
      if (documentText.length > 16000) {
        await recordEvent("error", { reason: "chunk_too_large" });
        return res.status(400).json({ error: "That section is too large to analyze in one piece." });
      }
      const idx = Number.isInteger(chunkIndex) ? chunkIndex : "?";
      const total = Number.isInteger(chunkCount) ? chunkCount : "?";
      systemPrompt = CHUNK_SYSTEM_PROMPT;
      userText = `Section ${idx} of ${total}:\n\n${documentText}`;
      loggedLength = documentText.length;
    } else {
      if (documentText.trim().length < 100) {
        await recordEvent("error", { reason: "too_short" });
        return res.status(400).json({ error: "That's too short to be a real document — paste at least a few sentences." });
      }
      const truncated =
        documentText.length > 18000
          ? documentText.slice(0, 18000) + "\n\n[document truncated for length]"
          : documentText;
      systemPrompt = SYSTEM_PROMPT;
      userText = truncated;
      loggedLength = truncated.length;
    }
  }

  if (userState && userRole && userState !== "Not specified" && userRole !== "Not specified") {
    const contextStr = `\n\nCONTEXT: The user is acting as a [${userRole}] in the state of [${userState}]. Evaluate the document through this specific lens, focusing on how the terms impact this role under this jurisdiction's laws.`;
    systemPrompt += contextStr;
  }

  if (aiFallbackPayload) {
    const hint = `\n\nNOTE FROM PRIMARY PARSER: The local regex engine failed to parse this document fully. Reason: ${aiFallbackPayload.map(r => r.context).join(' ')}. Please focus specifically on these missing or complex areas.`;
    systemPrompt += hint;
  }

  const apiKeys = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };

  if (!apiKeys.gemini && !apiKeys.groq && !apiKeys.mistral && !apiKeys.openrouter) {
    await recordEvent("error", { reason: "missing_api_key" });
    return res.status(500).json({
      error:
        "The server has no AI provider configured. Set at least one of GEMINI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, or OPENROUTER_API_KEY in your Vercel project's Environment Variables and redeploy.",
    });
  }

  try {
    const result = await callModelChain(apiKeys, systemPrompt, userText);

    if (!result || !result.ok) {
      const status = result?.status === 429 ? 429 : 502;

      console.error(
        `[analyze] upstream error (provider=${result?.provider} model=${result?.model}) status=${result?.status}: ${(result?.rawDetail || "").slice(0, 1000)}`
      );

      await recordEvent(status === 429 ? "rate_limited" : "error", status === 429 ? undefined : { reason: "upstream_5xx" });
      return res.status(status).json({
        error:
          status === 429
            ? "Trothix has reached its AI usage limit for the moment. Please try again shortly."
            : "The analysis service is temporarily unavailable.",
        retryAfterSeconds: result?.retryAfterSeconds ?? null,
      });
    }

    const { text, finishReason, provider: providerUsed, model: modelUsed, usageMetadata } = result;

    if (!text) {
      console.error(
        `[analyze] empty text (provider=${providerUsed} model=${modelUsed}). finishReason=${finishReason} usage=${JSON.stringify(usageMetadata)}`
      );
      await recordEvent("error", { reason: "empty_response" });
      return res.status(502).json({
        error:
          finishReason === "SAFETY"
            ? "The document couldn't be analyzed — it may have tripped a safety filter."
            : finishReason === "MAX_TOKENS"
            ? "The analysis got cut off before it finished. Try again or shorten the document."
            : "The analysis service returned an empty response. Try again.",
      });
    }

    // Strip <think> blocks (DeepSeek R1 and some Groq models emit these)
    // then extract JSON whether it's bare or inside a code fence.
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1].trim();
    } else {
      cleaned = cleaned.trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      try {
        parsed = JSON.parse(jsonrepair(cleaned));
        console.warn(
          `[analyze] strict JSON.parse failed but jsonrepair recovered it. provider=${providerUsed} model=${modelUsed} finishReason=${finishReason}`
        );
      } catch (repairErr) {
        console.error(
          `[analyze] JSON.parse failed and jsonrepair could not recover it. provider=${providerUsed} model=${modelUsed} finishReason=${finishReason} raw length=${cleaned.length}\nraw text:\n${cleaned}`
        );
        await recordEvent("error", { reason: "json_parse_failed" });
        return res.status(502).json({
          error:
            finishReason === "MAX_TOKENS"
              ? "The analysis got cut off before it finished. Try a shorter document, or try again."
              : "Couldn't parse the analysis. Try again.",
        });
      }
    }

    if (parsed && parsed.isDocument === false) {
      await recordEvent("not_document");
    } else {
      await recordEvent("completed", {
        documentType: parsed?.documentType,
        documentLength: loggedLength,
        provider: providerUsed,
        model: modelUsed,
        mode,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(`[analyze] unexpected server error: ${err?.stack || err}`);
    await recordEvent("error", { reason: "unexpected" });
    return res.status(500).json({ error: "Something went wrong on our end. Try again in a moment." });
  }
}
