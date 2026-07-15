/**
 * Confidentiality (formerly "real_clause.test.js") — real runtime
 * integration test.
 *
 * The original file's name claimed "real clause" but its body was a
 * hardcoded { finding: "RULE_NON_DISCLOSURE" } literal — it read the
 * compiled bundle and manifest off disk (to look like it was doing
 * something) but never fed the clause text through them. This version
 * calls the real engine.
 *
 * Updated by the Knowledge Expansion sprint: as this file's own prior
 * comment predicted, RULE_NON_DISCLOSURE now fires, since it has real
 * when/then backed by real CONCEPT_NON_DISCLOSURE phrases
 * (phrases.json), verified against the real engine below.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  const clause = "The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose such Confidential Information to any third party without the prior written consent of the Disclosing Party.";

  const findingIds = await analyzeAndGetFindingIds(clause);

  check(
    'Confidentiality: RULE_NON_DISCLOSURE fires for a real non-disclosure clause (Knowledge Expansion sprint)',
    findingIds.includes('RULE_NON_DISCLOSURE'),
    `got findings: ${JSON.stringify(findingIds)}`
  );

  check(
    'Confidentiality: no unexpected findings on a plain non-disclosure clause',
    findingIds.every(id => id === 'RULE_FORCE_MAJEURE_MISSING' || id === 'RULE_FORCE_MAJEURE_PRESENT' || id === 'RULE_TERMINATION_MISSING' || id === 'RULE_TERMINATION_PRESENT' || id === 'RULE_NON_DISCLOSURE'),
    `got findings: ${JSON.stringify(findingIds)}`
  );

  summarize('real_clause.test.js (Confidentiality)');
}

run();
