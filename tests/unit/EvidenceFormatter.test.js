import { EvidenceFormatter, describeCondition } from '../../assets/js/engine/assessment/EvidenceFormatter.js';
import assert from 'assert';

console.log("Running EvidenceFormatter.test.js...");

// --- describeCondition: deterministic rendering of the rule DSL --- //

assert.strictEqual(
  describeCondition({ type: 'conceptExists', value: 'CONCEPT_LIABILITY' }),
  'concept "CONCEPT_LIABILITY" is present in the document'
);

assert.strictEqual(
  describeCondition({ type: 'conceptMissing', value: 'CONCEPT_LIABILITY' }),
  'concept "CONCEPT_LIABILITY" is absent from the document'
);

assert.strictEqual(
  describeCondition({ field: 'actions[*].verb', equals: 'pay' }),
  'field "actions[*].verb" equals "pay"'
);

assert.strictEqual(
  describeCondition({
    and: [
      { field: 'category', equals: 'NDA' },
      { field: 'actions[*].verb', equals: 'pay' }
    ]
  }),
  'field "category" equals "NDA" AND field "actions[*].verb" equals "pay"'
);

assert.strictEqual(
  describeCondition({ or: [{ field: 'a', exists: true }, { field: 'b', missing: true }] }),
  '(field "a" exists OR field "b" is missing)'
);

assert.strictEqual(
  describeCondition({ not: { field: 'x', exists: true } }),
  'NOT (field "x" exists)'
);

// Missing/malformed condition never throws
assert.strictEqual(describeCondition(null), 'an unspecified condition');
assert.strictEqual(describeCondition(undefined), 'an unspecified condition');
assert.strictEqual(describeCondition({}), 'an unspecified condition');

// --- EvidenceFormatter.build: defensive with no knowledgeProvider --- //

const formatter = new EvidenceFormatter();

const bareFinding = {
  id: 'FINDING_TEST_1',
  rule: 'RULE_TEST',
  category: 'Risk',
  severity: 'High',
  confidence: 0.9,
  type: 'TestFinding',
  node: null
};

const chainNoKp = formatter.build(bareFinding, { nodes: [] }, null);
assert.strictEqual(chainNoKp.findingId, 'FINDING_TEST_1');
assert.strictEqual(chainNoKp.firedRule.id, 'RULE_TEST');
// No knowledgeProvider -> rule metadata fields fall back to finding-level data
assert.strictEqual(chainNoKp.firedRule.category, 'Risk');
assert.strictEqual(chainNoKp.firedRule.severity, 'High');
assert.strictEqual(chainNoKp.firedRule.conditionSummary, null);
assert.deepStrictEqual(chainNoKp.matchedPhrasesAndTokens, { matchedPhrases: [], matchedAliases: [], totalMatches: 0 });
assert.strictEqual(chainNoKp.clauseLocation.nodeId, null);
assert.strictEqual(chainNoKp.ontologyConcepts.concept, null);
assert.deepStrictEqual(chainNoKp.applicableLegalPrinciple, { sources: [], jurisdictionNotes: [], exceptions: [] });
assert.strictEqual(chainNoKp.confidenceRationale.baseConfidence, 0.9);
assert.strictEqual(chainNoKp.confidenceRationale.factors.length, 3);

// --- EvidenceFormatter.build: fully enriched finding (as Trothix.js would set) --- //

const node = {
  id: 'node_7',
  kind: 'Clause',
  parent: 'node_0',
  text: 'Client shall not be liable for any indirect damages.',
  metadata: { candidates: [{ id: 'Liability', score: 0.87 }] }
};

const enrichedFinding = {
  id: 'FINDING_TEST_2',
  rule: 'RULE_LIABILITY_TEST',
  category: 'Risk',
  severity: 'High',
  confidence: 0.75,
  type: 'LiabilityExclusion',
  node,
  span: { start: 10, end: 60 },
  concept: 'CONCEPT_LIABILITY_EXCLUSION',
  conceptRecord: { id: 'CONCEPT_LIABILITY_EXCLUSION', name: 'Liability Exclusion', description: 'desc' },
  ontologyNode: 'Clause',
  evidence: {
    matchedText: 'Client shall not be liable for any indirect damages.',
    matchedPhrases: ['shall not be liable'],
    span: { start: 10, end: 60 }
  },
  matchedAliases: ['liability waiver'],
  sources: [{ id: 'SOURCE_LIABILITY_EXCLUSION_01', citation: 'Restatement (Second) of Contracts § 351' }],
  jurisdictionNotes: [],
  exceptions: []
};

const fakeKnowledgeProvider = {
  getRuleMetadata(ruleId) {
    if (ruleId !== 'RULE_LIABILITY_TEST') return null;
    return {
      id: 'RULE_LIABILITY_TEST',
      name: 'Liability Exclusion Test',
      category: 'Risk',
      severity: 'High',
      status: 'production',
      when: { field: 'actions[*].verb', contains: 'liable' },
      then: {
        trigger: 'LiabilityExclusion',
        rationale: 'Excludes indirect damages.',
        recommendation: 'Negotiate a carve-out.'
      },
      legal_effect: 'Limits recoverable damages',
      jurisdiction: 'US-Delaware'
    };
  },
  getAliases: () => ['liability waiver', 'exclusion of liability'],
  getPhrasesForConcept: () => ['shall not be liable', 'in no event shall']
};

const chain = formatter.build(enrichedFinding, { nodes: [node] }, fakeKnowledgeProvider);

assert.strictEqual(chain.findingId, 'FINDING_TEST_2');

// Fired rule
assert.strictEqual(chain.firedRule.id, 'RULE_LIABILITY_TEST');
assert.strictEqual(chain.firedRule.rationale, 'Excludes indirect damages.');
assert.strictEqual(chain.firedRule.recommendation, 'Negotiate a carve-out.');
assert.strictEqual(chain.firedRule.legalEffect, 'Limits recoverable damages');
assert.strictEqual(chain.firedRule.jurisdiction, 'US-Delaware');
assert.strictEqual(chain.firedRule.conditionSummary, 'field "actions[*].verb" contains "liable"');

// Supporting evidence
assert.strictEqual(chain.supportingEvidence.matchedText, enrichedFinding.evidence.matchedText);
assert.strictEqual(chain.supportingEvidence.nodeId, 'node_7');
assert.deepStrictEqual(chain.supportingEvidence.span, { start: 10, end: 60 });

// Matched phrases/tokens
assert.deepStrictEqual(chain.matchedPhrasesAndTokens.matchedPhrases, ['shall not be liable']);
assert.deepStrictEqual(chain.matchedPhrasesAndTokens.matchedAliases, ['liability waiver']);
assert.strictEqual(chain.matchedPhrasesAndTokens.totalMatches, 2);

// Clause location
assert.strictEqual(chain.clauseLocation.nodeId, 'node_7');
assert.strictEqual(chain.clauseLocation.parentNodeId, 'node_0');
assert.strictEqual(chain.clauseLocation.clauseCategory, 'Liability');
assert.strictEqual(chain.clauseLocation.clauseCategoryScore, 0.87);
assert.strictEqual(chain.clauseLocation.spanStart, 10);
assert.strictEqual(chain.clauseLocation.spanEnd, 60);

// Ontology concepts
assert.strictEqual(chain.ontologyConcepts.concept, 'CONCEPT_LIABILITY_EXCLUSION');
assert.deepStrictEqual(chain.ontologyConcepts.knownAliases, ['liability waiver', 'exclusion of liability']);
assert.deepStrictEqual(chain.ontologyConcepts.knownPhrases, ['shall not be liable', 'in no event shall']);

// Confidence rationale
assert.strictEqual(chain.confidenceRationale.baseConfidence, 0.75);
assert.ok(chain.confidenceRationale.rationale.includes('0.75'));
assert.ok(chain.confidenceRationale.rationale.includes('node_7'));

// Applicable legal principle: prefers already-resolved finding fields
assert.deepStrictEqual(chain.applicableLegalPrinciple.sources, enrichedFinding.sources);

// Long matched text is truncated in the excerpt, not in matchedText itself
const longText = 'x'.repeat(500);
const longFinding = { ...enrichedFinding, evidence: { ...enrichedFinding.evidence, matchedText: longText } };
const longChain = formatter.build(longFinding, { nodes: [node] }, fakeKnowledgeProvider);
assert.strictEqual(longChain.supportingEvidence.matchedText.length, 500);
assert.ok(longChain.supportingEvidence.excerpt.length < 500);
assert.ok(longChain.supportingEvidence.excerpt.endsWith('…'));

// Determinism: same input -> byte-identical output
const chainAgain = formatter.build(enrichedFinding, { nodes: [node] }, fakeKnowledgeProvider);
assert.strictEqual(JSON.stringify(chain), JSON.stringify(chainAgain));

console.log("EvidenceFormatter.test.js: all assertions passed.");
