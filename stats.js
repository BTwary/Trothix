// /api/visit — records one anonymous page view. Fired once per page load
// from index.html (see the beacon call near the top of its <script> block).
//
// No IP address, cookie, user-agent, or any other identifier is read or
// stored here -- this is a single counter increment, exactly like
// totalRequests or feedbackYes in api/_stats.js. It cannot tell repeat
// visitors apart from new ones; it's a raw "how many times did the page
// load" count, not a unique-visitor count.

import { recordEvent } from "./_stats.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  await recordEvent("visit");
  return res.status(204).end();
}
