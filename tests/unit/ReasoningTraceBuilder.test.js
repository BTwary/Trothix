import { ReasoningTraceBuilder } from '../../assets/js/engine/assessment/ReasoningTraceBuilder.js';
import assert from 'assert';

console.log("Running ReasoningTraceBuilder.test.js...");

const builder = new ReasoningTraceBuilder();

// --- Defensive: no node, no rule, no knowledgeProvider, no pipelineTrace --- //

const minimalFinding = { id: 'FINDING_MIN', confidence: 1.0 };
const minimalTrace = builder.build(minimalFinding, { nodes: [] }, null, []);

assert.ok(Array.isArray(minimalTrace));
// Only the Parsing and Confidence Assignment steps should be present
assert.deepStrictEqual(minimalTrace.map(s => s.stage), ['Parsing', 'Confidence Assignment']);
assert.strictEqual(minimalTrace[0].step, 1);
assert.strictEqual(minimalTrace[1].step, 2);

// --- Fully populated finding: every stage present, in order --- //

const node = {
  id: 'node_3',
  metadata: { candidates: [{ id: 'Termination', score: 0.92 }] }
};

const finding = {
  id: 'FINDING_FULL',
  rule: 'RULE_TERMINATION_PRESENT',
  concept: 'CONCEPT_TERMINATION',
  confidence: 0.8,
  node,
  evidence: { matchedPhrases: ['terminate this Agreement'] },
  matchedAliases: ['termination clause']
};

const fakeKnowledgeProvider = {
  getRuleMetadata: (ruleId) => ({
    id: ruleId,
    when: { type: 'conceptExists', value: 'CONCEPT_TERMINATION' }
  })
};

const pipelineTrace = [
  { type: 'START', engine: 'clauseClassifier' },
  { type: 'END', engine: 'clauseClassifier', duration: 1.23, findingsEmitted: 0 },
  { type: 'END', engine: 'findingEngine', duration: 4.5, findingsEmitted: 1 },
  { type: 'END', engine: 'someUnrelatedEngine', duration: 99, findingsEmitted: 0 }
];

const ir = { nodes: [node, { id: 'node_0' }] };

const trace = builder.build(finding, ir, fakeKnowledgeProvider, pipelineTrace);

const stages = trace.map(s => s.stage);
assert.deepStrictEqual(stages, [
  'Parsing',
  'Classification',
  'Rule Evaluation',
  'Evidence Resolution',
  'Confidence Assignment',
  'Pipeline Context'
]);

// Steps are sequentially numbered starting at 1
trace.forEach((s, i) => assert.strictEqual(s.step, i + 1));

// Parsing reflects the IR's actual node count
assert.ok(trace[0].description.includes('2 clause node(s)'));

// Classification reflects the node's top candidate
assert.ok(trace[1].description.includes('node_3'));
assert.ok(trace[1].description.includes('Termination'));
assert.ok(trace[1].description.includes('0.92'));

// Rule evaluation renders the condition via describeCondition and names the finding
assert.ok(trace[2].description.includes('RULE_TERMINATION_PRESENT'));
assert.ok(trace[2].description.includes('concept "CONCEPT_TERMINATION" is present'));
assert.ok(trace[2].description.includes('FINDING_FULL'));

// Evidence resolution reports the exact matched counts
assert.ok(trace[3].description.includes('1 matched phrase(s)'));
assert.ok(trace[3].description.includes('1 matched alias(es)'));

// Confidence assignment reflects the finding's actual confidence
assert.ok(trace[4].description.includes('0.8'));

// Pipeline context only includes relevant engines, not the unrelated one
assert.ok(trace[5].description.includes('clauseClassifier'));
assert.ok(trace[5].description.includes('findingEngine'));
assert.ok(!trace[5].description.includes('someUnrelatedEngine'));
assert.ok(trace[5].description.includes('5.73ms')); // 1.23 + 4.5

// Determinism: identical input -> identical output
const traceAgain = builder.build(finding, ir, fakeKnowledgeProvider, pipelineTrace);
assert.strictEqual(JSON.stringify(trace), JSON.stringify(traceAgain));

console.log("ReasoningTraceBuilder.test.js: all assertions passed.");
