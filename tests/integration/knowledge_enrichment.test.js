/**
 * Enterprise KB enrichment integration test.
 *
 * Verifies that a finding produced by the real Trothix engine carries the
 * enriched shape requested for the knowledge-package integration work:
 * concept, evidence, recommendation detail, sources, jurisdiction notes,
 * exceptions, examples, and matched aliases/phrases — sourced from
 * KnowledgeProvider's new accessors, not fabricated in the test.
 */
import { check, summarize, getEngine } from './_lib.mjs';

async function run() {
  const engine = await getEngine();

  // Termination is one of the domains with a full sources/jurisdiction-notes/
  // examples/exceptions authoring pass, so it's the strongest end-to-end case.
  const clause = "The Company shall make payment of USD 1,000 within 5 days.";
  const report = await engine.analyze(clause, { category: 'Services Agreement' });

  const finding = report.findings.find(f => f.rule === 'RULE_TERMINATION_MISSING');
  check('RULE_TERMINATION_MISSING fired', !!finding, `got: ${JSON.stringify(report.findings.map(f => f.rule))}`);
  if (!finding) { summarize('knowledge_enrichment.test.js'); return; }

  check('finding.concept resolves to CONCEPT_TERMINATION', finding.concept === 'CONCEPT_TERMINATION', `got: ${finding.concept}`);

  check('finding.conceptRecord is populated', !!finding.conceptRecord && finding.conceptRecord.id === 'CONCEPT_TERMINATION');

  check('finding.recommendationDetail has non-empty recommendation text',
    !!finding.recommendationDetail && !!finding.recommendationDetail.recommendation,
    JSON.stringify(finding.recommendationDetail));

  check('finding.sources has >=1 authoritative citation',
    Array.isArray(finding.sources) && finding.sources.length >= 1,
    JSON.stringify(finding.sources));
  check('finding.sources entries have citation + type',
    finding.sources.every(s => typeof s.citation === 'string' && typeof s.type === 'string'));

  check('finding.jurisdictionNotes has >=1 entry',
    Array.isArray(finding.jurisdictionNotes) && finding.jurisdictionNotes.length >= 1,
    JSON.stringify(finding.jurisdictionNotes));

  check('finding.exceptions has >=1 entry (EXC_LAW/EXC_CONSENT/EXC_FRAUD)',
    Array.isArray(finding.exceptions) && finding.exceptions.length >= 1,
    JSON.stringify(finding.exceptions.map(e => e.id)));

  check('finding.examples includes both positive and negative clauses',
    finding.examples.some(e => e.polarity === 'positive') && finding.examples.some(e => e.polarity === 'negative'),
    JSON.stringify(finding.examples.map(e => e.polarity)));

  check('finding.evidence.matchedText is populated', !!finding.evidence && typeof finding.evidence.matchedText === 'string');

  check('finding.matchedAliases is an array (empty is fine — no aliases authored yet)',
    Array.isArray(finding.matchedAliases));

  // Report-level: unaffected by enrichment — traceability must still resolve.
  check('report.traceability has an entry for the finding', !!report.traceability[finding.id]);

  summarize('knowledge_enrichment.test.js');
}

run();
