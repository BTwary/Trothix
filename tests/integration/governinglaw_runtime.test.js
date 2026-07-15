/**
 * GoverningLaw — real runtime integration test.
 *
 * Before the Knowledge Expansion sprint, this domain had no concept.json at
 * all; RULE_EXPLICIT_GOVERNING_LAW and RULE_EXCLUSIVE_VENUE pointed at bare
 * "GOVERNING_LAW" / "VENUE" concept strings that were never defined
 * anywhere, and had no when/then. This sprint authored real
 * CONCEPT_GOVERNING_LAW / CONCEPT_EXCLUSIVE_VENUE concepts, backing
 * phrases.json entries, and real when/then. Verified against the real
 * engine below, not assumed.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  const governingLawClause = "This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles.";
  const governingLawFindingIds = await analyzeAndGetFindingIds(governingLawClause);
  check(
    'GoverningLaw: RULE_EXPLICIT_GOVERNING_LAW fires for real choice-of-law language (Knowledge Expansion sprint)',
    governingLawFindingIds.includes('RULE_EXPLICIT_GOVERNING_LAW'),
    `got findings: ${JSON.stringify(governingLawFindingIds)}`
  );

  const venueClause = "The parties submit to the exclusive jurisdiction of the courts located in New York County, New York for any dispute arising under this Agreement.";
  const venueFindingIds = await analyzeAndGetFindingIds(venueClause);
  check(
    'GoverningLaw: RULE_EXCLUSIVE_VENUE fires for real forum-selection language (Knowledge Expansion sprint)',
    venueFindingIds.includes('RULE_EXCLUSIVE_VENUE'),
    `got findings: ${JSON.stringify(venueFindingIds)}`
  );

  const unrelatedClause = "Notice shall be sent by email.";
  const unrelatedFindingIds = await analyzeAndGetFindingIds(unrelatedClause);
  check(
    'GoverningLaw: neither rule fires on unrelated text',
    !unrelatedFindingIds.includes('RULE_EXPLICIT_GOVERNING_LAW') && !unrelatedFindingIds.includes('RULE_EXCLUSIVE_VENUE'),
    `got findings: ${JSON.stringify(unrelatedFindingIds)}`
  );

  summarize('governinglaw_runtime.test.js');
}

run();
