export function calculateRisk(clauses, placeholders, riskRules) {
  let score = 0;
  const flags = [];
  
  clauses.forEach(c => {
     const t = c.text.toLowerCase();
     riskRules.forEach(rule => {
        const pLower = rule.pattern.toLowerCase();
        const idx = t.indexOf(pLower);
        if (idx !== -1) {
           score += rule.score;
           // Extract the exact case-sensitive matched string for highlighting
           const matchedText = c.text.substring(idx, idx + rule.pattern.length);
           flags.push({ severity: rule.level.toUpperCase(), clause: matchedText, message: rule.explanation || `Detected risk pattern: "${rule.pattern}"` });
        }
     });
  });
  
  if (placeholders.length > 0) {
     score += 15;
     flags.push({ severity: 'MEDIUM', clause: 'Incomplete Document', message: `Found ${placeholders.length} blank fields or placeholders.` });
  }
  
  let level = "Low Risk";
  if (score > 20) level = "Medium Risk";
  if (score > 45) level = "High Risk";
  
  return { score, level, flags };
}
