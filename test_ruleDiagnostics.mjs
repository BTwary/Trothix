// Sprint 1 integration tests: RuleNormalizer + RuleDiagnostics.
// Runs against the REAL knowledge/v1/domains data via the real RuleCompiler -
// no mocked pipeline, no hardcoded pass/fail. Every assertion below failed
// at least once during development before the code/expectation was fixed;
// per the handbook, every one of those is now a permanent regression test.

import path from 'path';
import { fileURLToPath } from 'url';
import { runRuleDiagnostics, printDiagnosticsReport } from './assets/js/engine/rules/RuleDiagnostics.js';
import { normalizeRule } from './assets/js/engine/rules/RuleNormalizer.js';
import { RuleCompiler } from './assets/js/engine/rules/RuleCompiler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH = path.join(__dirname, 'assets', 'js', 'engine', 'knowledge', 'v1');

let passed = 0, failed = 0;
function check(label, condition, detail = '') {
  if (condition) { passed++; console.log(`✅ ${label}`); }
  else { failed++; console.log(`❌ ${label}${detail ? '\n   ' + detail : ''}`); }
}

// ---------------------------------------------------------------------
// 1. RuleNormalizer, in isolation, on synthetic fixtures (not real data -
//    this is testing the normalizer's own logic, not the corpus).
// ---------------------------------------------------------------------
const executableFixture = {
  id: 'RULE_TEST_EXECUTABLE',
  when: { field: 'actions[*].verb', equals: 'pay' },
  then: { trigger: 'FINDING_TEST', severity: 'medium' },
};
const conceptFixture = {
  id: 'RULE_TEST_CONCEPT_ONLY',
  concept: 'Test Concept',
  rationale: 'Because reasons.',
  recommendation: 'Do the thing.',
};

const normExec = normalizeRule(executableFixture);
check('executable fixture normalizes with evaluable=true', normExec.evaluable === true);
check('executable fixture originalSchema is executable-v1', normExec.originalSchema === 'executable-v1');
check('executable fixture preserves sourceRule verbatim (traceability)', normExec.sourceRule === executableFixture);
check('executable fixture canonical has when/then', !!(normExec.canonical?.when && normExec.canonical?.then));

const normConcept = normalizeRule(conceptFixture);
check('concept-only fixture normalizes with evaluable=false', normConcept.evaluable === false);
check('concept-only fixture originalSchema is knowledge-concept-v1', normConcept.originalSchema === 'knowledge-concept-v1');
check('concept-only fixture canonical is null (no fabricated when/then)', normConcept.canonical === null);
check('concept-only fixture normalizationNote mentions the concept name', normConcept.normalizationNote.includes('Test Concept'));

// ---------------------------------------------------------------------
// 2. RuleCompiler still compiles the normalizer's canonical output
//    unchanged (proves the normalizer's output shape is genuinely
//    compatible with the existing, untouched compiler).
// ---------------------------------------------------------------------
const compiler = new RuleCompiler();
let compiledOk = false;
try {
  const compiled = compiler.compileRule(normExec.canonical);
  compiledOk = typeof compiled.evaluate === 'function' || typeof compiled === 'function' || !!compiled;
} catch (e) {
  compiledOk = false;
  console.log('   compile error:', e.message);
}
check('normalized executable canonical rule compiles via the real RuleCompiler', compiledOk);

// ---------------------------------------------------------------------
// 3. RuleDiagnostics against the REAL knowledge/v1/domains corpus.
//    These exact numbers were derived by hand-tracing every one of the
//    27 real rule entries against KnowledgeProvider's actual loader
//    logic and RuleContext's actual field resolution - not guessed.
// ---------------------------------------------------------------------
const report = runRuleDiagnostics(KB_PATH);

check('total rules considered is 47', report.summary.total === 47,
  `got ${report.summary.total}`);

// Phase 1 (Rule Coverage Restoration): RuleCompiler now handles
// conceptExists/conceptMissing/documentRequiresConcept (Liability +
// Indemnification, 12 rules) via CONCEPT_DETECTION_TABLE, and
// forceMajeureExtractor.js now populates extractedData.* (ForceMajeure,
// 4 rules) that RULE_FIELD_REGISTRY previously flagged unverified.
// 1 (Payment, pre-existing) + 12 (Liability/Indemnification) + 4
// (ForceMajeure) + 5 (Termination, Phase 3) + 4 (Assignment, Phase 4 enriched) + 3 (Notice, Phase 4 enriched) + 3 (Payment, Phase 4 enriched) = 37.
//
// Knowledge Expansion sprint: the remaining 10 rules that were
// concept-only (Confidentiality 1, Definitions 3, GoverningLaw 2,
// IntellectualProperty 2, Lifecycle 2) now have real, evidence-backed
// when/then authored using only already-supported condition types
// (conceptExists/conceptMissing, some combined via "all"), each backed
// by real concept.json/phrases.json entries. 37 + 10 = 47, and the
// previously-failed count drops to 0.
check('47 rules are compiled-active after the Knowledge Expansion sprint closed the remaining concept-only rules',
  report.summary.compiledActive === 47,
  `got ${report.summary.compiledActive}`);

check('0 rules are compiled-inert (the previously-inert ForceMajeure/unrecognized-shape rules are now either active or failed, none left in a compiles-but-dead-predicate state)',
  report.summary.compiledInert === 0,
  `got ${report.summary.compiledInert}`);

check('0 rules are failed (Knowledge Expansion sprint authored when/then for the remaining 10 concept-only entries)',
  report.summary.failed === 0,
  `got ${report.summary.failed}`);

const activeRuleIds = report.rules.filter(r => r.status === 'compiled-active').map(r => r.id).sort();
check('active rules include Payment, all 6 Liability CONCEPT_ rules, all 6 Indemnification CONCEPT_ rules, all 4 ForceMajeure rules, Assignment, Notice, and the 10 rules closed by the Knowledge Expansion sprint',
  activeRuleIds.includes('RULE_PAYMENT_DEADLINE_LONG') &&
  activeRuleIds.includes('CONCEPT_LIABILITY_PRESENT') &&
  activeRuleIds.includes('CONCEPT_INDEMNIFICATION_PRESENT') &&
  activeRuleIds.includes('RULE_FORCE_MAJEURE_PRESENT') &&
  activeRuleIds.includes('RULE_ASSIGNMENT_ALLOWED') &&
  activeRuleIds.includes('RULE_EMAIL_NOTICE_ALLOWED') &&
  activeRuleIds.includes('RULE_NON_DISCLOSURE') &&
  activeRuleIds.includes('RULE_DEFINITIONS_PRESENT') &&
  activeRuleIds.includes('RULE_ALIASES_RESOLVED') &&
  activeRuleIds.includes('RULE_UNDEFINED_CAPITALIZED_TERM') &&
  activeRuleIds.includes('RULE_EXPLICIT_GOVERNING_LAW') &&
  activeRuleIds.includes('RULE_EXCLUSIVE_VENUE') &&
  activeRuleIds.includes('RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED') &&
  activeRuleIds.includes('RULE_OWNERSHIP_UNDEFINED') &&
  activeRuleIds.includes('RULE_PROPER_NOTICE_TIMELINE') &&
  activeRuleIds.includes('RULE_ILLEGAL_STATE_TRANSITION') &&
  activeRuleIds.length === 47,
  `got ${JSON.stringify(activeRuleIds)}`);

const conceptActiveRules = report.rules.filter(r => r.status === 'compiled-active' && (r.domain === 'Indemnification' || r.domain === 'Liability'));
check('all 12 Liability/Indemnification CONCEPT_ rules are compiled-active (conceptExists/conceptMissing/documentRequiresConcept now recognized)',
  conceptActiveRules.length === 12,
  `got ${conceptActiveRules.length}`);

const missingWhenFailures = report.rules.filter(r => r.status === 'failed' && r.reason.includes('Compilation would throw'));
check('0 rules remain failed for missing when/then (the Knowledge Expansion sprint authored all 10)',
  missingWhenFailures.length === 0,
  `got ${missingWhenFailures.length}`);

const neverRoutedFailures = report.rules.filter(r => r.status === 'failed' && r.reason.includes('Never reaches RuleCompiler'));
check('the old "never reaches RuleCompiler due to prefix" failure reason no longer occurs (routing is structural now)',
  neverRoutedFailures.length === 0,
  `got ${neverRoutedFailures.length}`);

const referencesWarning = report.rules.find(r => r.provenanceWarnings.length > 0);
check('no rule in the current real corpus triggers a references[] provenance warning (none reference that field yet)',
  referencesWarning === undefined,
  referencesWarning ? `unexpectedly found: ${referencesWarning.id}` : '');

// ---------------------------------------------------------------------
// 4. Synthetic proof that 'compiled-inert' is actually distinguishable
//    from 'compiled-active' and 'failed' - the real corpus has zero
//    inert rules today, so without this the inert branch would be
//    completely untested code.
// ---------------------------------------------------------------------
import fs2 from 'fs';
import os from 'os';

const tmpKb = fs2.mkdtempSync(path.join(os.tmpdir(), 'rule-diag-test-'));
fs2.mkdirSync(path.join(tmpKb, 'domains', 'TestDomain'), { recursive: true });
fs2.writeFileSync(
  path.join(tmpKb, 'domains', 'TestDomain', 'rules.json'),
  JSON.stringify([
    {
      id: 'RULE_TEST_INERT_CATEGORY',
      when: { field: 'category', equals: 'NDA' },
      then: { trigger: 'FINDING_TEST', severity: 'low' },
    },
    {
      id: 'RULE_TEST_ACTIVE_VERB',
      when: { field: 'actions[*].verb', equals: 'terminate' },
      then: { trigger: 'FINDING_TEST_2', severity: 'low' },
    },
  ])
);

const syntheticReport = runRuleDiagnostics(tmpKb);
check('synthetic corpus: category-dependent rule is classified compiled-inert',
  syntheticReport.rules.find(r => r.id === 'RULE_TEST_INERT_CATEGORY')?.status === 'compiled-inert');
check('synthetic corpus: verb-dependent rule is classified compiled-active',
  syntheticReport.rules.find(r => r.id === 'RULE_TEST_ACTIVE_VERB')?.status === 'compiled-active');
check('synthetic inert rule reason names the actual mock (RuleContext hardcodes "Unknown")',
  syntheticReport.rules.find(r => r.id === 'RULE_TEST_INERT_CATEGORY')?.reason.includes('Unknown'));

fs2.rmSync(tmpKb, { recursive: true, force: true });

// ---------------------------------------------------------------------
console.log('');
console.log(`${passed} passed, ${failed} failed`);
console.log('');
printDiagnosticsReport(report);

if (failed > 0) process.exit(1);
