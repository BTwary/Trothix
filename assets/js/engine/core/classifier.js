export function classifyClauses(clauses, entities, obligations) {
  return clauses.map(c => {
    const t = c.text.toLowerCase();
    const types = new Set();
    
    if (t.includes("definition") || t.includes("shall mean")) types.add("Definitions");
    if (t.includes("indemnify") || t.includes("hold harmless")) types.add("Indemnity");
    if (t.includes("injunct") || t.includes("equitable relief")) types.add("Injunctive Relief");
    if (t.includes("terminate") || t.includes("survival")) types.add("Termination");
    if (t.includes("law") || t.includes("jurisdiction") || t.includes("arbitration")) types.add("Dispute Resolution");
    if (t.includes("return") || t.includes("destroy")) types.add("Return");
    if (t.includes("shall not disclose") || t.includes("confidential")) types.add("Obligations");
    if (t.includes("except") || t.includes("however")) types.add("Exceptions");
    if (t.includes("purpose") || t.includes("evaluat")) types.add("Purpose");
    
    // Check obligations mapped to this clause
    const clauseObs = obligations.filter(o => o.clauseId === c.id);
    if (clauseObs.length > 0) types.add("Obligations");
    
    if (types.size === 0) types.add("General");
    
    return { ...c, types: Array.from(types) };
  });
}
