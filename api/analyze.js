import path from 'path';
import { recordEvent } from "./_stats.js";
import { isRateLimited } from "./_rateLimiter.js";
import { Trothix } from "../assets/js/engine/Trothix.js";

const ENABLE_ANALYTICS =
  String(process.env.TROTHIX_ENABLE_ANALYTICS).toLowerCase() === "true";

async function safeRecordEvent(event, payload) {
  if (!ENABLE_ANALYTICS) return;
  return recordEvent(event, payload);
}

// Cache the engine globally across serverless invocations
let globalEngine = null;

const RATE_WINDOW_MS = 60 * 1000;
const GLOBAL_LIMIT_PER_MIN = 300; // Raised because it's deterministic now!

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  await safeRecordEvent("request");

  if (await isRateLimited("analyze_global", GLOBAL_LIMIT_PER_MIN, RATE_WINDOW_MS)) {
    await safeRecordEvent("rate_limited");
    return res.status(429).json({
      error: "Trothix is getting a lot of traffic right now. Please try again in a moment.",
      retryAfterSeconds: 60,
    });
  }

  let { documentText, userCountry, userRole, mode, findings, includeTelemetry, debug } = req.body || {};

  // Legacy fallback for UI chunking: if it sends "synthesize", we just return the merged findings it sent us.
  // We don't actually need to re-analyze it if it's already done.
  if (mode === "synthesize") {
    await safeRecordEvent("completed", { 
      documentType: findings?.documentType || "Unknown", 
      provider: "deterministic" 
    });
    return res.status(200).json(findings);
  }

  // The new deterministic engine doesn't care about chunk size!
  if (!documentText || typeof documentText !== "string" || !documentText.trim()) {
    await safeRecordEvent("error", { reason: "missing_document" });
    return res.status(400).json({ error: "No document text was provided." });
  }

  if (documentText.trim().length < 100) {
    await safeRecordEvent("error", { reason: "too_short" });
    return res.status(400).json({ error: "That's too short to be a real document — paste at least a few sentences." });
  }

  try {
    if (!globalEngine) {
      // In Vercel, process.cwd() is the project root
      const kbPath = path.join(process.cwd(), 'assets', 'js', 'engine', 'knowledge', 'v1');
      // Construct and initialize into a LOCAL variable first. Only commit
      // to the module-level singleton after initialize() actually
      // succeeds — previously `globalEngine` was assigned before the
      // await, so a thrown initialize() (e.g. a bad knowledge file) left
      // a truthy-but-broken engine in place; every subsequent request in
      // that warm container would see `globalEngine` as non-null, skip
      // re-initialization entirely, and call .analyze() on a broken
      // instance instead of retrying — silently, for the life of the
      // container.
      const engine = new Trothix({ kbPath });
      await engine.initialize();
      globalEngine = engine;
    }

    const metadata = { 
      jurisdiction: userCountry || "Not specified", 
      role: userRole || "Not specified",
      includeTelemetry: includeTelemetry === true,
      debug: debug === true
    };

    const report = await globalEngine.analyze(documentText, metadata);

    // Standardize output for the frontend
    report.isDocument = true;

    await safeRecordEvent("completed", {
      documentType: report.documentType || "Unknown",
      documentLength: documentText.length,
      provider: "deterministic",
      model: "trothix-v2",
      mode: "full",
    });

    return res.status(200).json(report);
  } catch (err) {
    console.error(`[analyze] engine error: ${err?.stack || err}`);
    await safeRecordEvent("error", { reason: "engine_crash" });
    return res.status(500).json({ error: "Something went wrong in the legal engine. Try again in a moment." });
  }
}
