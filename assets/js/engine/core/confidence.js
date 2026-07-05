export function calculateConfidence(ir) {
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
  
  return Math.round(conf);
}
