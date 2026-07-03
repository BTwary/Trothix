// /api/feedback — records lightweight, one-tap feedback signals. No
// document text, no analysis content, no free text, no identifiers are
// accepted or stored here -- every value is checked against a fixed
// allowlist before being tallied via the shared stats module. See
// api/_stats.js for exactly what's tracked.
//
// Three kinds of signal, all tap-only (no typing required, by design --
// open text fields get skipped almost every time; one-click chips don't):
//   "helpful"   — the original yes/no "was this helpful?"
//   "reason"    — one-click "what could be better?" (only meaningful once
//                 you have enough volume to see a pattern across taps)
//   "would_use" — "would you actually use this on a real document?", the
//                 single most direct product-market-fit signal available
//                 without asking anyone to type anything

import { recordEvent } from "./_stats.js";

const HELPFUL_VALUES = new Set(["yes", "no"]);
const REASON_VALUES = new Set(["jargon", "missed_something", "red_flags_off", "unclear_next_steps", "nothing"]);
const WOULD_USE_VALUES = new Set(["yes", "not_yet", "no"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { kind, value } = req.body || {};

  // Back-compat: earlier clients sent { value } with no "kind" field for
  // the yes/no thumbs. Treat a missing kind as "helpful".
  const effectiveKind = kind || "helpful";

  if (effectiveKind === "helpful") {
    if (!HELPFUL_VALUES.has(value)) {
      return res.status(400).json({ error: "value must be 'yes' or 'no'." });
    }
    await recordEvent("feedback", { value });
  } else if (effectiveKind === "reason") {
    if (!REASON_VALUES.has(value)) {
      return res.status(400).json({ error: "Unknown reason." });
    }
    await recordEvent("feedback_reason", { reason: value });
  } else if (effectiveKind === "would_use") {
    if (!WOULD_USE_VALUES.has(value)) {
      return res.status(400).json({ error: "Unknown would_use value." });
    }
    await recordEvent("would_use", { value });
  } else {
    return res.status(400).json({ error: "Unknown kind." });
  }

  return res.status(200).json({ ok: true });
}
