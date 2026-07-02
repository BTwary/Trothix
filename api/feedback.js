// /api/feedback — records a simple yes/no "was this helpful?" signal.
// No document text, no analysis content, no identifiers are accepted or
// stored here — just a tally of yes/no counts via the shared stats module.

import { recordEvent } from "./_stats.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { value } = req.body || {};
  if (value !== "yes" && value !== "no") {
    return res.status(400).json({ error: "value must be 'yes' or 'no'." });
  }

  recordEvent("feedback", { value });
  return res.status(200).json({ ok: true });
}
