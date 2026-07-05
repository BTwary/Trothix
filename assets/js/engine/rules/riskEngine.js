export function calculateRisk(clauses, placeholders, riskRules) {
  let score = 0;
  const flags = [];
  
  clauses.forEach(c => {
     const t = c.text.toLowerCase();
     riskRules.forEach(rule => {
        if (t.includes(rule.pattern.toLowerCase())) {
           score += rule.score;
           flags.push({ severity: rule.level.toUpperCase(), clause: c.title, message: `Detected risk pattern: "${rule.pattern}"` });
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
