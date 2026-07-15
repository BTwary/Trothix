/**
 * @fileoverview test_confidence_phase2_commitA.mjs
 * Verification test for Phase 2 - Commit A: Deterministic Finding IDs.
 */

import { RuleEvaluator } from './assets/js/engine/rules/RuleEvaluator.js';

let passed = 0, failed = 0;
function assert(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`✅ ${label}`);
  } else {
    failed++;
    console.log(`❌ ${label} ${detail ? '\n   ' + detail : ''}`);
  }
}

// Mock rules and context
const mockRules = [
  {
    id: "RULE_MOCK_1",
    category: "Risk",
    severity: "High",
    metadata: { then: { trigger: "MockTrigger1" } },
    evaluate: () => true
  },
  {
    id: "RULE_MOCK_2",
    category: "Completeness",
    severity: "Medium",
    metadata: { then: { trigger: "MockTrigger2" } },
    evaluate: () => true
  }
];

const mockIR = {
  nodes: [],
  edges: [],
  metadata: {}
};

console.log("=== Testing Commit A: Deterministic Finding IDs ===");

// 1. Check legacy non-deterministic behavior (feature flag disabled)
process.env.FEATURE_DYNAMIC_CONFIDENCE = 'false';
const evaluatorLegacy = new RuleEvaluator(mockRules);

const findingsLegacy1 = evaluatorLegacy.evaluate(mockIR);
// Wait a millisecond to guarantee timestamp change if Date.now() is used (though random number is also used)
await new Promise(resolve => setTimeout(resolve, 5));
const findingsLegacy2 = evaluatorLegacy.evaluate(mockIR);

assert("Legacy IDs are non-deterministic (different across runs)", findingsLegacy1[0].id !== findingsLegacy2[0].id, `got matching IDs: ${findingsLegacy1[0].id}`);

// 2. Check dynamic deterministic behavior (feature flag enabled)
process.env.FEATURE_DYNAMIC_CONFIDENCE = 'true';
const evaluatorDeterministic = new RuleEvaluator(mockRules);

const findingsDet1 = evaluatorDeterministic.evaluate(mockIR);
const findingsDet2 = evaluatorDeterministic.evaluate(mockIR);

assert("Deterministic IDs are identical across identical runs", findingsDet1[0].id === findingsDet2[0].id, `got different IDs: ${findingsDet1[0].id} vs ${findingsDet2[0].id}`);
assert("Deterministic IDs match expected SHA-256 pattern", /^FINDING_[A-F0-9]{16}$/.test(findingsDet1[0].id), `got ID: ${findingsDet1[0].id}`);

// 3. Different rule details generate different finding IDs
assert("Different rules generate distinct deterministic IDs", findingsDet1[0].id !== findingsDet1[1].id, `got matching IDs for different rules: ${findingsDet1[0].id}`);

console.log(`\nCommit A verification complete: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
