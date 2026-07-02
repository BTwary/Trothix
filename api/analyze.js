// /api/analyze — server-side proxy to the Gemini API.
// The Gemini API key lives only here, in the Vercel environment variable
// GEMINI_API_KEY. It is never sent to or exposed in the browser.

import { jsonrepair } from "jsonrepair";

const GEMINI_MODEL = "gemini-3.5-flash"; // current free-tier-eligible Gemini model as of mid-2026;
                                          // re-check https://ai.google.dev/gemini-api/docs/pricing
                                          // before launch, since Google adjusts free-tier
                                          // model eligibility fairly often.

const SYSTEM_PROMPT = `You are ClearClause, a plain-language contract analysis assistant. Given a pasted contract, lease, or terms-of-service document, respond with ONLY a raw JSON object (no markdown code fences, no preamble, no commentary) matching exactly this shape:

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
{ "isDocument": false, "reason": "one short plain sentence explaining why this doesn't look like a document ClearClause can analyze" }`;

// Very lightweight in-memory rate limit: 5 requests per minute per IP.
// NOTE: this resets whenever the serverless function cold-starts, and isn't
// shared across concurrent instances — it's a cheap speed bump to stop
// someone accidentally hammering your free Gemini quota, not real
// production rate limiting. For that, use Vercel's Edge Config / a real
// store like Upstash Redis once you have traffic worth protecting.
const requestLog = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "You're analyzing documents faster than the free tier allows. Wait about a minute and try again.",
    });
  }

  const { documentText } = req.body || {};
  if (!documentText || typeof documentText !== "string" || !documentText.trim()) {
    return res.status(400).json({ error: "No document text was provided." });
  }
  if (documentText.trim().length < 100) {
    return res.status(400).json({ error: "That's too short to be a real document — paste at least a few sentences." });
  }

  const truncated =
    documentText.length > 18000
      ? documentText.slice(0, 18000) + "\n\n[document truncated for length]"
      : documentText;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "The server is missing GEMINI_API_KEY. Set it in your Vercel project's Environment Variables and redeploy.",
    });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: truncated }] }],
          generationConfig: {
            responseMimeType: "application/json",
            // Gemini 3.x models are "thinking" models: by default they spend an
            // unpredictable number of tokens reasoning before writing the answer,
            // and those thinking tokens are deducted from the SAME
            // maxOutputTokens budget as the actual output. With no
            // thinkingConfig and a tight token cap, the model can burn most/all
            // of the budget on reasoning and get cut off mid-JSON
            // (finishReason: MAX_TOKENS) -- which is what was causing
            // "Couldn't parse the analysis" here. Keeping thinking low and
            // giving plenty of headroom fixes it.
            thinkingConfig: { thinkingLevel: "low" },
            maxOutputTokens: 8000,
            // temperature/top_p/top_k are no longer recommended for Gemini 3.x --
            // Google tunes reasoning quality around the defaults, so we omit them.
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      // Surface rate-limit errors distinctly so the frontend can say something useful.
      const status = geminiRes.status === 429 ? 429 : 502;
      return res.status(status).json({
        error:
          geminiRes.status === 429
            ? "The analysis service is rate-limited right now (free tier). Wait a moment and try again."
            : "The analysis service returned an error.",
        detail: detail.slice(0, 500),
      });
    }

    const data = await geminiRes.json();
    const finishReason = data?.candidates?.[0]?.finishReason;
    const thoughtsTokens = data?.usageMetadata?.thoughtsTokenCount;
    // Defensively skip any part explicitly marked as a "thought" (reasoning)
    // part rather than an answer part -- we don't request include_thoughts,
    // so this shouldn't normally fire, but it costs nothing to be safe.
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.filter((p) => !p.thought)
        ?.map((p) => p.text || "")
        ?.join("") || "";

    if (!text) {
      console.error(
        `[analyze] empty text from Gemini. finishReason=${finishReason} thoughtsTokenCount=${thoughtsTokens} usage=${JSON.stringify(data?.usageMetadata)}`
      );
      return res.status(502).json({
        error:
          finishReason === "SAFETY"
            ? "The document couldn't be analyzed — it may have tripped a safety filter."
            : finishReason === "MAX_TOKENS"
            ? "The analysis got cut off before it finished (ran out of tokens, often on internal reasoning). Try again or shorten the document."
            : "The analysis service returned an empty response.",
        detail: `finishReason: ${finishReason || "unknown"}${thoughtsTokens ? `; thoughtsTokenCount: ${thoughtsTokens}` : ""}`,
      });
    }

    // Gemini is asked for pure JSON via responseMimeType, but strip stray
    // code fences defensively in case a model variant adds them anyway.
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Gemini's JSON mode is asked for strict JSON but isn't 100% reliable,
      // especially when the prompt demands verbatim character-for-character
      // quotes from messy source text (odd whitespace, stray characters in
      // things like blank contract templates). Before giving up, try
      // jsonrepair, which fixes the common ways LLM JSON goes slightly wrong
      // (trailing commas, unescaped control characters, unterminated
      // strings/objects, etc.) without us hand-rolling regex fixes.
      try {
        parsed = JSON.parse(jsonrepair(cleaned));
        console.warn(
          `[analyze] strict JSON.parse failed but jsonrepair recovered it. finishReason=${finishReason}`
        );
      } catch (repairErr) {
        console.error(
          `[analyze] JSON.parse failed and jsonrepair could not recover it. finishReason=${finishReason} thoughtsTokenCount=${thoughtsTokens} raw length=${cleaned.length}\nraw text:\n${cleaned}`
        );
        return res.status(502).json({
          error:
            finishReason === "MAX_TOKENS"
              ? "The analysis got cut off before it finished. Try a shorter document, or try again."
              : "Couldn't parse the analysis. Try again.",
          detail: `finishReason: ${finishReason || "unknown"}; raw start: ${cleaned.slice(0, 300)}`,
        });
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error.", detail: String(err.message || err) });
  }
}
