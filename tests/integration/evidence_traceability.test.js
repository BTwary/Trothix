/**
 * Evidence Traceability sprint — real runtime integration test.
 *
 * Runs the real Trothix engine end-to-end and asserts:
 *  1. Every finding carries a deterministic evidenceChain and reasoningTrace.
 *  2. The top-level evidenceChains/auditTrail report surfaces are present
 *     and consistent with the per-finding fields.
 *  3. reportManifest lists the new sections.
 *  4. The existing (pre-sprint) report surfaces are untouched — backward
 *     compatibility of the frozen runtime/scoring/verdict output.
 *  5. Two runs on identical input produce identical evidenceChains/
 *     auditTrail (aside from known, pre-existing timing-only fields).
 */
import { getEngine, check, summarize } from './_lib.mjs';

async function run() {
  const engine = await getEngine();
  const clause = "This Agreement shall terminate immediately upon 5 days written notice by either party. Client shall not be liable for any indirect or consequential damages, and Client's total liability shall not exceed the fees paid in the preceding 12 months.";

  const report = await engine.analyze(clause, { category: 'Services Agreement' });
  const report2 = await engine.analyze(clause, { category: 'Services Agreement' });

  check('report has at least one finding', report.findings.length > 0, `got ${report.findings.length}`);

  check(
    'every finding carries an evidenceChain',
    report.findings.every(f => f.evidenceChain && f.evidenceChain.findingId === f.id)
  );

  check(
    'every finding carries a non-empty reasoningTrace',
    report.findings.every(f => Array.isArray(f.reasoningTrace) && f.reasoningTrace.length > 0)
  );

  check(
    'evidenceChain exposes all required facets',
    report.findings.every(f => {
      const c = f.evidenceChain;
      return c.firedRule && c.supportingEvidence && c.matchedPhrasesAndTokens &&
        c.clauseLocation && c.ontologyConcepts && c.confidenceRationale &&
        c.applicableLegalPrinciple;
    })
  );

  check(
    'top-level evidenceChains has one entry per finding, in order',
    report.evidenceChains.length === report.findings.length &&
    report.evidenceChains.every((c, i) => c.findingId === report.findings[i].id)
  );

  check(
    'auditTrail.totalFindings matches findings.length',
    report.auditTrail.totalFindings === report.findings.length
  );

  check(
    'auditTrail.documentHash matches metadata.documentHash',
    report.auditTrail.documentHash === report.metadata.documentHash
  );

  check(
    'auditTrail.rulesFired counts sum to totalFindings-with-a-rule',
    report.auditTrail.rulesFired.reduce((s, r) => s + r.count, 0) ===
      report.findings.filter(f => f.rule).length
  );

  check(
    'auditTrail.integrity declares deterministic, non-LLM output',
    report.auditTrail.integrity.deterministic === true && report.auditTrail.integrity.llmDependent === false
  );

  check(
    'reportManifest lists evidenceChains and auditTrail',
    report.reportManifest.some(m => m.id === 'evidenceChains') &&
    report.reportManifest.some(m => m.id === 'auditTrail')
  );

  // Backward compatibility: pre-existing surfaces are still present and shaped as before.
  check(
    'pre-existing report surfaces are untouched',
    Array.isArray(report.obligations) && Array.isArray(report.rights) &&
    typeof report.overallVerdict.verdict === 'string' &&
    typeof report.scores.overallScore === 'number' &&
    report.traceability && report.clauseTree && report.reasoningTimeline
  );

  // Determinism: evidenceChains carry no timing data, so two runs on
  // identical input must be byte-identical.
  check(
    'evidenceChains are byte-identical across two runs on identical input',
    JSON.stringify(report.evidenceChains) === JSON.stringify(report2.evidenceChains)
  );

  check(
    'auditTrail is byte-identical across two runs on identical input (excluding engine timing)',
    JSON.stringify({ ...report.auditTrail, engineExecutionSummary: null }) ===
    JSON.stringify({ ...report2.auditTrail, engineExecutionSummary: null })
  );

  summarize('evidence_traceability.test.js');
}

run();
