import path from 'path';
import { recordEvent } from "./_stats.js";
import { Trothix } from "../assets/js/engine/Trothix.js";

// Cache the engine globally across serverless invocations
let globalEngine = null;

const RATE_WINDOW_MS = 60 * 1000;
const GLOBAL_LIMIT_PER_MIN = 300; // Raised because it's deterministic now!
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

  if (isGloballyThrottled()) {
    await recordEvent("rate_limited");
    return res.status(429).json({
      error: "Trothix is getting a lot of traffic right now. Please try again in a moment.",
      retryAfterSeconds: 60,
    });
  }

  let { documentText, userCountry, userRole, mode, findings } = req.body || {};

  // Legacy fallback for UI chunking: if it sends "synthesize", we just return the merged findings it sent us.
  // We don't actually need to re-analyze it if it's already done.
  if (mode === "synthesize") {
    await recordEvent("completed", { documentType: findings?.documentType || "Unknown", provider: "deterministic" });
    return res.status(200).json(findings);
  }

  // The new deterministic engine doesn't care about chunk size!
  if (!documentText || typeof documentText !== "string" || !documentText.trim()) {
    await recordEvent("error", { reason: "missing_document" });
    return res.status(400).json({ error: "No document text was provided." });
  }

  if (documentText.trim().length < 100) {
    await recordEvent("error", { reason: "too_short" });
    return res.status(400).json({ error: "That's too short to be a real document — paste at least a few sentences." });
  }

  try {
    if (!globalEngine) {
      // In Vercel, process.cwd() is the project root
      const kbPath = path.join(process.cwd(), 'assets', 'js', 'engine', 'knowledge', 'v1');
      globalEngine = new Trothix({ kbPath });
      await globalEngine.initialize();
    }

    const metadata = { 
      jurisdiction: userCountry || "Not specified", 
      role: userRole || "Not specified" 
    };

    const report = await globalEngine.analyze(documentText, metadata);

    // Standardize output for the frontend
    report.isDocument = true;

    await recordEvent("completed", {
      documentType: report.documentType || "Unknown",
      documentLength: documentText.length,
      provider: "deterministic",
      model: "trothix-v2",
      mode: "full",
    });

    return res.status(200).json(report);
  } catch (err) {
    console.error(`[analyze] engine error: ${err?.stack || err}`);
    await recordEvent("error", { reason: "engine_crash" });
    return res.status(500).json({ error: "Something went wrong in the legal engine. Try again in a moment." });
  }
}
