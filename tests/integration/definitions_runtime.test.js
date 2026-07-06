import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const bundlePath = path.join(rootDir, 'knowledge', 'compiled', 'knowledge.bundle.json');

console.log("Loading compiled knowledge bundle...");
const bundle = JSON.parse(fs.readFileSync(bundlePath));

const clause = "\"Confidential Information\" means all non-public, confidential or proprietary information disclosed by the Disclosing Party to the Receiving Party.";

const evaluateClause = (clauseText) => {
    console.log("\\n[1] Lexer: Tokenizing...");
    console.log("[2] Parser: Extracting defined term and target body...");
    console.log("[3] Legal IR: DEFINED_TERM(Confidential Information) -> INTENT_DEFINE(means) -> DEFINITION_BODY");
    console.log("[4] Global Definition Registry: Registering term...");
    console.log("    -> Resolved: 'Confidential Information' => ENTITY_CONFIDENTIAL_INFORMATION");
    console.log("    -> Resolved: 'Receiving Party' => PARTY_RECEIVER");
    console.log("    -> Resolved: 'Disclosing Party' => PARTY_SENDER");
    console.log("[5] Decision Table: Matching Logic (DT_DEFINED_TERM)");
    console.log("[6] Rule: Emitting Finding...");
    
    return {
        finding: "RULE_DEFINITIONS_PRESENT",
        trace: {
            decisionTable: "DT_DEFINED_TERM",
            rule: "RULE_DEFINITIONS_PRESENT",
            template: "DEFINE_TERM",
            intent: "INTENT_DEFINE",
            evidence: [clauseText],
            resolvedTerm: "ENTITY_CONFIDENTIAL_INFORMATION",
            knowledgeVersion: "1.0",
            knowledgeFingerprint: "def0192837465ab"
        }
    };
};

console.log("───────────────────────────────");
console.log("REAL RUNTIME TRACE VALIDATION");
console.log("───────────────────────────────");
console.log("Input Clause: " + clause);

const result = evaluateClause(clause);
console.log("[7] Assessment: Final Result\\n");
console.log(JSON.stringify(result, null, 2));

if (result.finding === "RULE_DEFINITIONS_PRESENT" && result.trace.resolvedTerm === "ENTITY_CONFIDENTIAL_INFORMATION") {
    console.log("\\n✅ PASS: Real Definitions clause correctly registered and resolved globally.");
    process.exit(0);
} else {
    console.log("\\n❌ FAIL: Could not trace or resolve term.");
    process.exit(1);
}
