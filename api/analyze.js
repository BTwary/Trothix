// /api/analyze — server-side proxy to the Gemini API.
// The Gemini API key lives only here, in the Vercel environment variable
// GEMINI_API_KEY. It is never sent to or exposed in the browser.

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
            maxOutputTokens: 2000,
            temperature: 0.3,
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
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    if (!text) {
      return res.status(502).json({
        error:
          finishReason === "SAFETY"
            ? "The document couldn't be analyzed — it may have tripped a safety filter."
            : "The analysis service returned an empty response.",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ error: "Couldn't parse the analysis. Try again." });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error.", detail: String(err.message || err) });
  }
}
