import { KnowledgeProvider } from '../../assets/js/engine/knowledge/KnowledgeProvider.js';
import assert from 'assert';

console.log("Running KnowledgeProvider.enterprise.test.js...");

const kp = new KnowledgeProvider();
await kp.initialize();

// 1. getPhraseGroup: shape is correct even for a concept with no authored phrases yet
const group = kp.getPhraseGroup('CONCEPT_ASSIGNMENT');
assert.strictEqual(group.conceptId, 'CONCEPT_ASSIGNMENT');
assert.ok(Array.isArray(group.phrases));

// 2. getRecommendation: backfilled `then.recommendation` on a real compiled rule
const recCompiled = kp.getRecommendation('RULE_TERMINATION_MISSING');
assert.ok(recCompiled, 'expected a recommendation record for RULE_TERMINATION_MISSING');
assert.ok(recCompiled.recommendation && recCompiled.recommendation.length > 0,
  'expected non-empty recommendation text (backfilled into then.recommendation)');
assert.ok(recCompiled.rationale && recCompiled.rationale.length > 0);

// 3. getRecommendation: falls back to a non-executable knowledge-concept node's
//    top-level recommendation/rationale (RULE_NON_DISCLOSURE has no when/then —
//    see RuleCompiler.js's documented Phase-1 gap list — so this must NOT throw
//    and must NOT fabricate a compiled shape).
const recConceptOnly = kp.getRecommendation('RULE_NON_DISCLOSURE');
assert.ok(recConceptOnly);
assert.ok(recConceptOnly.recommendation && recConceptOnly.recommendation.includes('exceptions'),
  'expected the raw node-level recommendation text to surface');

// 4. getSources / getJurisdictionNotes / getExamples: real, authored content
const sources = kp.getSources('CONCEPT_TERMINATION');
assert.ok(sources.length >= 3, `expected >=3 sources for CONCEPT_TERMINATION, got ${sources.length}`);
assert.ok(sources.every(s => s.id.startsWith('SOURCE_') && typeof s.citation === 'string'));

const jnotes = kp.getJurisdictionNotes('CONCEPT_TERMINATION');
assert.ok(jnotes.length >= 2);
assert.ok(jnotes.every(j => j.id.startsWith('JNOTE_') && typeof j.jurisdiction === 'string'));

const examples = kp.getExamples('CONCEPT_TERMINATION');
assert.ok(examples.some(e => e.polarity === 'positive'));
assert.ok(examples.some(e => e.polarity === 'negative'));

// getExamples with polarity filter
const positiveOnly = kp.getExamples('CONCEPT_TERMINATION', 'positive');
assert.ok(positiveOnly.every(e => e.polarity === 'positive'));

// 5. getJurisdictionNotes must NOT collide with GoverningLaw's pre-existing
//    JURISDICTION_* venue-name lexicon (different prefix, different node shape).
const govLawVenueNode = kp.getNode('JURISDICTION_NEW_YORK');
assert.ok(govLawVenueNode, 'pre-existing GoverningLaw lexicon node must be untouched');
assert.strictEqual(govLawVenueNode.concept, undefined,
  'the venue-lexicon node must not have been mistaken for a jurisdiction-note node');

// 6. getExceptions: concept-linked exceptions, including legacy EXC_* ids
const exceptions = kp.getExceptions('CONCEPT_TERMINATION');
assert.ok(exceptions.length >= 3, `expected >=3 exceptions for CONCEPT_TERMINATION, got ${exceptions.length}`);
assert.ok(exceptions.some(e => e.id === 'EXC_FRAUD'));

const assignmentExceptions = kp.getExceptions('CONCEPT_ASSIGNMENT');
assert.ok(assignmentExceptions.some(e => e.id === 'EXCEPTION_MERGER'));

// 7. getMatchedSurfaceForms: never throws on empty/garbage input
const empty = kp.getMatchedSurfaceForms('CONCEPT_TERMINATION', '');
assert.deepStrictEqual(empty, { matchedAliases: [], matchedPhrases: [] });
const unknownConcept = kp.getMatchedSurfaceForms('CONCEPT_DOES_NOT_EXIST', 'some clause text');
assert.deepStrictEqual(unknownConcept, { matchedAliases: [], matchedPhrases: [] });

// 8. Unauthored concepts degrade to empty arrays, never throw
assert.deepStrictEqual(kp.getSources('CONCEPT_DOES_NOT_EXIST'), []);
assert.deepStrictEqual(kp.getJurisdictionNotes('CONCEPT_DOES_NOT_EXIST'), []);
assert.deepStrictEqual(kp.getExamples('CONCEPT_DOES_NOT_EXIST'), []);
assert.deepStrictEqual(kp.getExceptions('CONCEPT_DOES_NOT_EXIST'), []);

console.log("KnowledgeProvider.enterprise.test.js: all assertions passed.");
