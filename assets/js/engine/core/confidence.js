// Cue words that suggest the source text actually contains time-bound
// language. Used to gate the "0 deadlines" penalty below so we don't punish
// a document (e.g. a short TOS clause) that legitimately has no deadlines.
const TEMPORAL_CUE_REGEX = /\b(days?|months?|years?|period of|notice)\b/i;

export function calculateConfidence(ir, sourceText = "") {
  let conf = 0;
  
  // Clause Coverage (30%)
  // If we found mostly general clauses, coverage is bad. If we classified many clauses, coverage is good.
  const classifiedClauses = ir.clauses.filter(c => !c.types.includes("General")).length;
  const clauseRatio = ir.clauses.length > 0 ? classifiedClauses / ir.clauses.length : 0;
  conf += clauseRatio * 30;
  
  // Risk Detection (20%) - If we successfully scanned and scored risks
  if (ir.riskScore >= 0) conf += 20;
  
  // Entity Extraction (15%) - If we found parties
  if (ir.entities.length > 0) conf += 15;
  if (ir.obligations.length > 0) conf += 10;
  
  // Formatting / Checklists (25%)
  if (ir.missingClauses.length === 0) {
     conf += 25; // Perfect checklist
  } else {
     conf += 10; // Some missing
  }

  // Penalties: catch cases where extraction quality is visibly poor even
  // though the checks above passed.
  const looksLikeItHasDeadlines = TEMPORAL_CUE_REGEX.test(sourceText);
  if (looksLikeItHasDeadlines && (!ir.deadlines || ir.deadlines.length === 0)) {
    conf -= 10; // Text suggests deadlines exist, but none were extracted.
  }
  if (!ir.fairness || /^unknown/i.test(ir.fairness)) {
    conf -= 15; // Fairness scoring came back empty/unresolved.
  }

  conf = Math.max(0, Math.min(100, conf));
  return Math.round(conf);
}
