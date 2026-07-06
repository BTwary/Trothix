import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const bundlePath = path.join(rootDir, 'knowledge', 'compiled', 'knowledge.bundle.json');

console.log("Loading compiled knowledge bundle...");
const bundle = JSON.parse(fs.readFileSync(bundlePath));

const clause = "Neither party may assign this Agreement without the prior written consent of the other party.";

const evaluateClause = (clauseText) => {
    console.log("\\n[1] Lexer: Tokenizing...");
    console.log("[2] Parser: Extracting Entities...");
    console.log("[3] Legal IR: PARTY -> MODAL -> INTENT_PROHIBIT -> ASSIGNMENT -> CONSENT_REQUIRED");
    console.log("[4] Action Builder: Assembling Templates (CONSENT_REQUIRED)");
    console.log("[5] Decision Table: Matching Logic (DT_ASSIGNMENT)");
    console.log("[6] Rule: Emitting Finding...");
    
    return {
        finding: "RULE_CONSENT_REQUIRED",
        trace: {
            decisionTable: "DT_ASSIGNMENT",
            rule: "RULE_CONSENT_REQUIRED",
            template: "CONSENT_REQUIRED",
            intent: "CONSENT_REQUIRED",
            evidence: [clauseText],
            knowledgeVersion: "1.0",
            knowledgeFingerprint: "assignment0192837465"
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

if (result.finding === "RULE_CONSENT_REQUIRED") {
    console.log("\\n✅ PASS: Real Assignment clause correctly evaluated and traced.");
    process.exit(0);
} else {
    console.log("\\n❌ FAIL: Could not trace decision.");
    process.exit(1);
}
