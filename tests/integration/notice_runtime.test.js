/**
 * Notice — real runtime integration test.
 * Verifies that the compiled rules in the Notice domain
 * evaluate correctly against raw clause text using the real Trothix engine.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  // Scenario 1: Email notice without address details (happy path for email, triggers missing address)
  const clauseEmailOnly = "Notice shall be deemed received if sent by email, upon confirmation of transmission.";
  const findingsEmailOnly = await analyzeAndGetFindingIds(clauseEmailOnly);

  check(
    'Notice (email only): RULE_EMAIL_NOTICE_ALLOWED fires',
    findingsEmailOnly.includes('RULE_EMAIL_NOTICE_ALLOWED'),
    `got findings: ${JSON.stringify(findingsEmailOnly)}`
  );

  check(
    'Notice (email only): RULE_MISSING_NOTICE_ADDRESS fires because no physical address is provided',
    findingsEmailOnly.includes('RULE_MISSING_NOTICE_ADDRESS'),
    `got findings: ${JSON.stringify(findingsEmailOnly)}`
  );

  // Scenario 2: Physical notice address present (does not trigger missing address)
  const clauseAddressPresent = "Notices under this Agreement shall be sent to the address set forth below: 123 Main Street, Tech City.";
  const findingsAddressPresent = await analyzeAndGetFindingIds(clauseAddressPresent);

  check(
    'Notice (address present): RULE_EMAIL_NOTICE_ALLOWED does not fire',
    !findingsAddressPresent.includes('RULE_EMAIL_NOTICE_ALLOWED'),
    `got findings: ${JSON.stringify(findingsAddressPresent)}`
  );

  check(
    'Notice (address present): RULE_MISSING_NOTICE_ADDRESS does not fire when address is provided',
    !findingsAddressPresent.includes('RULE_MISSING_NOTICE_ADDRESS'),
    `got findings: ${JSON.stringify(findingsAddressPresent)}`
  );

  // Scenario 3: Unrelated clause
  const clauseUnrelated = "The Receiving Party shall keep the Information confidential.";
  const findingsUnrelated = await analyzeAndGetFindingIds(clauseUnrelated);

  check(
    'Notice (unrelated): RULE_EMAIL_NOTICE_ALLOWED does not fire',
    !findingsUnrelated.includes('RULE_EMAIL_NOTICE_ALLOWED'),
    `got findings: ${JSON.stringify(findingsUnrelated)}`
  );

  check(
    'Notice (unrelated): RULE_MISSING_NOTICE_ADDRESS does not fire',
    !findingsUnrelated.includes('RULE_MISSING_NOTICE_ADDRESS'),
    `got findings: ${JSON.stringify(findingsUnrelated)}`
  );

  summarize('notice_runtime.test.js');
}

run();
