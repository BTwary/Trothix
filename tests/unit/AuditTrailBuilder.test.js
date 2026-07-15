import { AuditTrailBuilder } from '../../assets/js/engine/assessment/AuditTrailBuilder.js';
import { EvidenceFormatter } from '../../assets/js/engine/assessment/EvidenceFormatter.js';
import assert from 'assert';

console.log("Running AuditTrailBuilder.test.js...");

const builder = new AuditTrailBuilder();

// --- Defaults: no findings/evidenceChains/etc. --- //

const empty = builder.build({});
assert.strictEqual(empty.totalFindings, 0);
assert.strictEqual(empty.totalEvidenceChains, 0);
assert.deepStrictEqual(empty.rulesFired, []);
assert.deepStrictEqual(empty.conceptsInvoked, []);
assert.deepStrictEqual(empty.clauseNodesTouched, []);
assert.strictEqual(empty.verdictSummary, null);
assert.strictEqual(empty.overallScore, null);
assert.deepStrictEqual(empty.integrity, { deterministic: true, llmDependent: false, schemaVersion: "1.0.0" });

// --- Populated: findings + evidence chains + pipeline trace + scores/verdict --- //

const findings = [
  { id: 'F1', rule: 'RULE_A', concept: 'CONCEPT_A', node: { id: 'node_1' } },
  { id: 'F2', rule: 'RULE_A', concept: 'CONCEPT_B', node: { id: 'node_2' } },
  { id: 'F3', rule: 'RULE_B', concept: 'CONCEPT_A', node: { id: 'node_1' } },
  { id: 'F4', rule: null, concept: null, node: null } // rule-less finding must not throw or pollute counts
];

const formatter = new EvidenceFormatter();
const evidenceChains = findings.map(f => formatter.build(f, { nodes: [] }, null));

const pipelineTrace = [
  { type: 'START', engine: 'findingEngine' },
  { type: 'END', engine: 'findingEngine', duration: 3.5, findingsEmitted: 4, warnings: ['w1'] }
];

const scores = { overallScore: 72 };
const verdict = { verdict: 'High Risk', confidence: 0.91 };

const trail = builder.build({
  findings,
  evidenceChains,
  documentHash: 'abc123',
  scores,
  verdict,
  pipelineTrace
});

assert.strictEqual(trail.documentHash, 'abc123');
assert.strictEqual(trail.totalFindings, 4);
assert.strictEqual(trail.totalEvidenceChains, 4);

// Rule firing counts, sorted by rule id
assert.deepStrictEqual(trail.rulesFired, [
  { ruleId: 'RULE_A', count: 2 },
  { ruleId: 'RULE_B', count: 1 }
]);

// Concepts/clause nodes deduplicated and sorted
assert.deepStrictEqual(trail.conceptsInvoked, ['CONCEPT_A', 'CONCEPT_B']);
assert.deepStrictEqual(trail.clauseNodesTouched, ['node_1', 'node_2']);

// Evidence chain summaries carry through per-finding identifiers
assert.strictEqual(trail.evidenceChainSummaries.length, 4);
assert.strictEqual(trail.evidenceChainSummaries[0].findingId, 'F1');
assert.strictEqual(trail.evidenceChainSummaries[0].ruleId, 'RULE_A');

// Engine execution summary reflects the pipeline trace's END events only
assert.strictEqual(trail.engineExecutionSummary.length, 1);
assert.strictEqual(trail.engineExecutionSummary[0].engine, 'findingEngine');
assert.strictEqual(trail.engineExecutionSummary[0].duration, 3.5);

// Verdict/score rollup
assert.deepStrictEqual(trail.verdictSummary, { verdict: 'High Risk', confidence: 0.91 });
assert.strictEqual(trail.overallScore, 72);

// Determinism: identical input -> identical output
const trailAgain = builder.build({ findings, evidenceChains, documentHash: 'abc123', scores, verdict, pipelineTrace });
assert.strictEqual(JSON.stringify(trail), JSON.stringify(trailAgain));

console.log("AuditTrailBuilder.test.js: all assertions passed.");
