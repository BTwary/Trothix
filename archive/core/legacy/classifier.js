export function classifyClauses(clauses, entities, obligations) {
  return clauses.map(c => {
    const t = c.text.toLowerCase();
    const types = new Set();
    
    if (t.includes("definition") || t.includes("shall mean")) types.add("Definitions");
    if (t.includes("indemnify") || t.includes("hold harmless")) types.add("Indemnity");
    if (t.includes("injunct") || t.includes("equitable relief")) types.add("Injunctive Relief");
    if (t.includes("terminate") || t.includes("survival") || t.includes("default") || t.includes("acceleration")) types.add("Termination");
    if (t.includes("law") || t.includes("jurisdiction") || t.includes("arbitration")) types.add("Dispute Resolution");
    if (t.includes("return") || t.includes("destroy")) types.add("Return");
    if (t.includes("shall not disclose") || t.includes("confidential")) types.add("Obligations");
    if (t.includes("except") || t.includes("however")) types.add("Exceptions");
    if (t.includes("purpose") || t.includes("evaluat")) types.add("Purpose");

    // Generic clause types found across contract types beyond NDAs
    if (t.includes("payment") || t.includes("invoice") || t.includes("due within") || t.includes("fee") || t.includes("salary") || t.includes("payable") || t.includes("compensation")) types.add("Payment");
    if (t.includes("warrant") || t.includes("as is") || t.includes("disclaim")) types.add("Warranty");
    if ((t.includes("license") || t.includes("licence")) || t.includes("intellectual property")) types.add("License/IP");
    if (t.includes("non-compete") || t.includes("shall not compete") || t.includes("restraint of trade")) types.add("Non-Compete");
    if (t.includes("automatically renew") || t.includes("auto-renew") || t.includes("automatic renewal")) types.add("Auto-Renewal");
    if (t.includes("shall not be liable") || t.includes("consequential") || t.includes("limitation of liability") || t.includes("shall not exceed")) types.add("Liability Limit");
    if (t.includes("severable") || t.includes("invalid or unenforceable")) types.add("Severability");
    if (t.includes("assign") && (t.includes("consent") || t.includes("transfer"))) types.add("Assignment");
    if (t.includes("signature") || /_{3,}\s*$/.test(c.text.trim())) types.add("Signatures");
    
    // Check obligations mapped to this clause
    const clauseObs = obligations.filter(o => o.clauseId === c.id);
    if (clauseObs.length > 0) types.add("Obligations");
    
    if (types.size === 0) types.add("General");
    
    return { ...c, types: Array.from(types) };
  });
}
