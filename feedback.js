// /api/stats — read-only aggregate usage numbers for the ClearClause
// operator (not shown to end users). No document text, no IP addresses, no
// visitor identifiers are exposed here -- see api/_stats.js for exactly
// what's tracked and its in-memory caveats.

import { getStats } from "./_stats.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  return res.status(200).json(await getStats());
}
