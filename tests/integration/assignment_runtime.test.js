/**
 * Assignment — real runtime integration test.
 * Verifies that the compiled rules in the Assignment domain
 * evaluate correctly against raw clause text using the real Trothix engine.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  // Scenario 1: Assignment permitted with consent
  const clauseConsent = "Neither party may assign this Agreement without the prior written consent of the other party.";
  const findingsConsent = await analyzeAndGetFindingIds(clauseConsent);

  check(
    'Assignment (with consent): RULE_ASSIGNMENT_ALLOWED fires',
    findingsConsent.includes('RULE_ASSIGNMENT_ALLOWED'),
    `got findings: ${JSON.stringify(findingsConsent)}`
  );

  check(
    'Assignment (with consent): RULE_CONSENT_REQUIRED fires',
    findingsConsent.includes('RULE_CONSENT_REQUIRED'),
    `got findings: ${JSON.stringify(findingsConsent)}`
  );

  // Scenario 2: Assignment permitted without consent (wording uses assign, but lacks consent)
  const clauseUnconditional = "Either party may assign this Agreement to any of its affiliates.";
  const findingsUnconditional = await analyzeAndGetFindingIds(clauseUnconditional);

  check(
    'Assignment (unconditional): RULE_ASSIGNMENT_ALLOWED fires',
    findingsUnconditional.includes('RULE_ASSIGNMENT_ALLOWED'),
    `got findings: ${JSON.stringify(findingsUnconditional)}`
  );

  check(
    'Assignment (unconditional): RULE_CONSENT_REQUIRED does NOT fire when consent is not mentioned',
    !findingsUnconditional.includes('RULE_CONSENT_REQUIRED'),
    `got findings: ${JSON.stringify(findingsUnconditional)}`
  );

  // Scenario 3: Unrelated clause
  const clauseUnrelated = "Notice shall be sent by email.";
  const findingsUnrelated = await analyzeAndGetFindingIds(clauseUnrelated);

  check(
    'Assignment (unrelated): RULE_ASSIGNMENT_ALLOWED does not fire',
    !findingsUnrelated.includes('RULE_ASSIGNMENT_ALLOWED'),
    `got findings: ${JSON.stringify(findingsUnrelated)}`
  );

  check(
    'Assignment (unrelated): RULE_CONSENT_REQUIRED does not fire',
    !findingsUnrelated.includes('RULE_CONSENT_REQUIRED'),
    `got findings: ${JSON.stringify(findingsUnrelated)}`
  );

  summarize('assignment_runtime.test.js');
}

run();
