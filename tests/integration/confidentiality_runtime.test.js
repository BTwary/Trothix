/**
 * Confidentiality — real runtime integration test.
 *
 * RULE_NON_DISCLOSURE was the one remaining concept-only rule in the
 * Confidentiality domain (its four sibling rules — RULE_TRADE_SECRETS_
 * PROTECTED, RULE_RESIDUALS_RESTRICTED, RULE_COMPELLED_DISCLOSURE_NOTICE,
 * RULE_RETURN_DESTROY_CERTIFICATION — already had real when/then).
 * Knowledge Expansion sprint: added phrases.json for CONCEPT_NON_DISCLOSURE
 * and authored real when/then for RULE_NON_DISCLOSURE. Verified against the
 * real engine below, not assumed.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  const clause = "The Receiving Party shall hold in strict confidence all Confidential Information disclosed by the Disclosing Party and shall not disclose it to any third party.";
  const findingIds = await analyzeAndGetFindingIds(clause);

  check(
    'Confidentiality: RULE_NON_DISCLOSURE fires for real non-disclosure obligation language (Knowledge Expansion sprint)',
    findingIds.includes('RULE_NON_DISCLOSURE'),
    `got findings: ${JSON.stringify(findingIds)}`
  );

  const unrelatedClause = "Notice shall be sent by email.";
  const unrelatedFindingIds = await analyzeAndGetFindingIds(unrelatedClause);
  check(
    'Confidentiality: RULE_NON_DISCLOSURE does not fire on unrelated text',
    !unrelatedFindingIds.includes('RULE_NON_DISCLOSURE'),
    `got findings: ${JSON.stringify(unrelatedFindingIds)}`
  );

  summarize('confidentiality_runtime.test.js');
}

run();
