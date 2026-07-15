/**
 * Termination runtime integration test.
 * Verifies that the compiled rules in the Termination domain
 * evaluate correctly against raw clause text using the real Trothix engine.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  // 1. Test Case 1: Mutual convenience with short notice and cure period
  const clause1 = "Either party may terminate this Agreement for convenience upon 10 days notice. In the event of a material breach, the non-breaching party may terminate this Agreement if the breaching party fails to cure such breach within 5 days.";
  const findings1 = await analyzeAndGetFindingIds(clause1);

  check(
    'Termination: RULE_TERMINATION_PRESENT fires on clause text',
    findings1.includes('RULE_TERMINATION_PRESENT'),
    `got findings: ${JSON.stringify(findings1)}`
  );

  check(
    'Termination: RULE_TERMINATION_NOTICE_SHORT fires on 10 days notice',
    findings1.includes('RULE_TERMINATION_NOTICE_SHORT'),
    `got findings: ${JSON.stringify(findings1)}`
  );

  check(
    'Termination: RULE_TERMINATION_CURE_PERIOD_SHORT fires on 5 days cure period',
    findings1.includes('RULE_TERMINATION_CURE_PERIOD_SHORT'),
    `got findings: ${JSON.stringify(findings1)}`
  );

  check(
    'Termination: RULE_TERMINATION_CONVENIENCE_UNILATERAL does not fire when mutual ("Either party")',
    !findings1.includes('RULE_TERMINATION_CONVENIENCE_UNILATERAL'),
    `got findings: ${JSON.stringify(findings1)}`
  );

  // 2. Test Case 2: Unilateral convenience
  const clause2 = "Client may terminate this Agreement for convenience upon 30 days notice.";
  const findings2 = await analyzeAndGetFindingIds(clause2);

  check(
    'Termination: RULE_TERMINATION_CONVENIENCE_UNILATERAL fires when unilateral ("Client")',
    findings2.includes('RULE_TERMINATION_CONVENIENCE_UNILATERAL'),
    `got findings: ${JSON.stringify(findings2)}`
  );

  check(
    'Termination: RULE_TERMINATION_NOTICE_SHORT does not fire on 30 days notice',
    !findings2.includes('RULE_TERMINATION_NOTICE_SHORT'),
    `got findings: ${JSON.stringify(findings2)}`
  );

  // 3. Test Case 3: Negative control (Missing termination)
  const clause3 = "The Company shall make payment of USD 1,000 within 5 days.";
  const findings3 = await analyzeAndGetFindingIds(clause3);

  check(
    'Termination: RULE_TERMINATION_MISSING fires when no termination language present',
    findings3.includes('RULE_TERMINATION_MISSING'),
    `got findings: ${JSON.stringify(findings3)}`
  );

  check(
    'Termination: RULE_TERMINATION_PRESENT does not fire when no termination language present',
    !findings3.includes('RULE_TERMINATION_PRESENT'),
    `got findings: ${JSON.stringify(findings3)}`
  );

  summarize('termination_runtime.test.js');
}

run();
