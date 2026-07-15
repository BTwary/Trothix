/**
 * IntellectualProperty — real runtime integration test.
 *
 * Before the Knowledge Expansion sprint, this domain had no concept.json at
 * all; RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED and RULE_OWNERSHIP_UNDEFINED
 * pointed at a bare "OWNERSHIP" concept string that was never defined
 * anywhere, and had no when/then. This sprint authored real
 * CONCEPT_IP_OWNERSHIP (an express assignment clause) and CONCEPT_IP_
 * OWNERSHIP_GAP (IP-generating language with no assignment), backing
 * phrases.json entries, and real when/then. RULE_OWNERSHIP_UNDEFINED uses
 * an "all" condition (conceptExists CONCEPT_IP_OWNERSHIP_GAP AND
 * conceptMissing CONCEPT_IP_OWNERSHIP) so it only fires when IP-generating
 * language appears WITHOUT an accompanying assignment — verified below
 * against the real engine, not assumed, including the negative case where
 * both are present.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  const assignedClause = "Contractor hereby assigns to Company all right, title and interest in and to any work product created under this Agreement.";
  const assignedFindingIds = await analyzeAndGetFindingIds(assignedClause);
  check(
    'IntellectualProperty: RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED fires for a real assignment clause (Knowledge Expansion sprint)',
    assignedFindingIds.includes('RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED'),
    `got findings: ${JSON.stringify(assignedFindingIds)}`
  );
  check(
    'IntellectualProperty: RULE_OWNERSHIP_UNDEFINED does not fire when an assignment clause is present',
    !assignedFindingIds.includes('RULE_OWNERSHIP_UNDEFINED'),
    `got findings: ${JSON.stringify(assignedFindingIds)}`
  );

  const gapClause = "Contractor will develop deliverables developed hereunder for Company's internal use.";
  const gapFindingIds = await analyzeAndGetFindingIds(gapClause);
  check(
    'IntellectualProperty: RULE_OWNERSHIP_UNDEFINED fires when IP-generating language appears with no assignment clause (Knowledge Expansion sprint)',
    gapFindingIds.includes('RULE_OWNERSHIP_UNDEFINED'),
    `got findings: ${JSON.stringify(gapFindingIds)}`
  );

  const bothClause = "Contractor hereby assigns to Company all right, title and interest. Contractor will develop deliverables developed hereunder for Company's internal use.";
  const bothFindingIds = await analyzeAndGetFindingIds(bothClause);
  check(
    'IntellectualProperty: RULE_OWNERSHIP_UNDEFINED does NOT fire once an assignment clause covers the same IP-generating language',
    !bothFindingIds.includes('RULE_OWNERSHIP_UNDEFINED'),
    `got findings: ${JSON.stringify(bothFindingIds)}`
  );

  const unrelatedClause = "Notice shall be sent by email.";
  const unrelatedFindingIds = await analyzeAndGetFindingIds(unrelatedClause);
  check(
    'IntellectualProperty: neither rule fires on unrelated text',
    !unrelatedFindingIds.includes('RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED') && !unrelatedFindingIds.includes('RULE_OWNERSHIP_UNDEFINED'),
    `got findings: ${JSON.stringify(unrelatedFindingIds)}`
  );

  summarize('intellectualproperty_runtime.test.js');
}

run();
