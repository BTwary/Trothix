/**
 * @fileoverview test_confidence_reliability_commitB.mjs
 * Verification test for RuleReliabilityProvider - Commit B: Field Verification.
 */

import { RuleReliabilityProvider } from './assets/js/engine/assessment/RuleReliabilityProvider.js';

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

// Mock Rule Registry
class MockRuleRegistry {
  constructor(rules = []) {
    this.rules = rules;
  }
  getRules() {
    return this.rules;
  }
}

console.log("=== Testing RuleReliabilityProvider: Commit B (Field Verification) ===");

// Define test cases
const activeRule = {
  id: "RULE_ACTIVE",
  metadata: {
    when: {
      field: "actions[0].verb",
      operator: "equals",
      value: "pay"
    }
  }
};

const unverifiedRule = {
  id: "RULE_UNVERIFIED",
  metadata: {
    when: {
      field: "nodes[0].metadata.candidates[0]",
      operator: "exists"
    }
  }
};

const inertRule = {
  id: "RULE_INERT",
  metadata: {
    when: {
      field: "actions[1].recipient",
      operator: "equals",
      value: "vendor"
    }
  }
};

const mixedRule = {
  id: "RULE_MIXED",
  metadata: {
    when: {
      and: [
        { field: "actions[0].verb", operator: "equals", value: "pay" },
        { field: "actions[1].recipient", operator: "equals", value: "vendor" }
      ]
    }
  }
};

const unknownRule = {
  id: "RULE_UNKNOWN",
  metadata: {
    when: {
      field: "nonexistent.field.path",
      operator: "exists"
    }
  }
};

const duplicateRule = {
  id: "RULE_DUPLICATE",
  metadata: {
    when: {
      and: [
        { field: "actions[0].verb", operator: "equals", value: "pay" },
        { field: "actions[0].verb", operator: "equals", value: "deliver" }
      ]
    }
  }
};

const emptyRule = {
  id: "RULE_EMPTY",
  metadata: {}
};

const malformedRule = {
  id: "RULE_MALFORMED",
  metadata: {
    when: "not-an-object"
  }
};

const rulesList = [
  activeRule, unverifiedRule, inertRule, mixedRule,
  unknownRule, duplicateRule, emptyRule, malformedRule
];

const registry = new MockRuleRegistry(rulesList);
const provider = new RuleReliabilityProvider(registry);

// 1. Only active fields
const recActive = provider.get("RULE_ACTIVE");
assert("Active field rule score is 1.0", recActive.fieldSupport === 1.0, `got: ${recActive.fieldSupport}`);
assert("Active rule diagnostics is structured", recActive.fieldDiagnostics[0].field === "actions[0].verb" && recActive.fieldDiagnostics[0].status === "active");

// 2. Only unverified fields
const recUnverified = provider.get("RULE_UNVERIFIED");
assert("Unverified field rule score is 0.5", recUnverified.fieldSupport === 0.5, `got: ${recUnverified.fieldSupport}`);
assert("Unverified rule contains warning/recommendation", recUnverified.recommendations.length > 0);

// 3. Only inert fields
const recInert = provider.get("RULE_INERT");
assert("Inert field rule score is 0.1", recInert.fieldSupport === 0.1, `got: ${recInert.fieldSupport}`);
assert("Inert rule has inert recommendations", recInert.recommendations[0].includes("Replace inert field"));

// 4. Mixed field statuses
const recMixed = provider.get("RULE_MIXED");
// active (1.0) + inert (0.1) = 1.1 / 2 = 0.55
assert("Mixed field rule score is average (0.55)", Math.abs(recMixed.fieldSupport - 0.55) < 0.001, `got: ${recMixed.fieldSupport}`);
assert("Mixed rule has multiple structured diagnostics", recMixed.fieldDiagnostics.length === 2);

// 5. Unknown fields
const recUnknown = provider.get("RULE_UNKNOWN");
assert("Unknown field defaults to 0.5 (unverified)", recUnknown.fieldSupport === 0.5, `got: ${recUnknown.fieldSupport}`);

// 6. Duplicate field references (deduplicated)
const recDuplicate = provider.get("RULE_DUPLICATE");
// "actions[0].verb" is referenced twice, but unique fields count = 1 (active: 1.0). So score should be 1.0!
assert("Duplicate field references are deduplicated (score 1.0)", recDuplicate.fieldSupport === 1.0, `got: ${recDuplicate.fieldSupport}`);
assert("Duplicate rule diagnostics has only 1 entry", recDuplicate.fieldDiagnostics.length === 1);

// 7. Empty rule conditions
const recEmpty = provider.get("RULE_EMPTY");
assert("Empty rule condition score is 1.0", recEmpty.fieldSupport === 1.0, `got: ${recEmpty.fieldSupport}`);

// 8. Malformed rule metadata
const recMalformed = provider.get("RULE_MALFORMED");
assert("Malformed metadata falls back gracefully to 1.0 without crashing", recMalformed.fieldSupport === 1.0, `got: ${recMalformed.fieldSupport}`);
assert("Malformed metadata generates a warning", recMalformed.warnings.length > 0);

// 9. Custom external policy check
const customPolicy = {
  active: 1.0,
  unverified: 0.8,
  inert: 0.2
};
const customProvider = new RuleReliabilityProvider(registry, { fieldPolicy: customPolicy });
const recCustom = customProvider.get("RULE_MIXED"); // active (1.0) + inert (0.2) = 1.2 / 2 = 0.60
assert("Custom field policy weights applied correctly", Math.abs(recCustom.fieldSupport - 0.60) < 0.001, `got: ${recCustom.fieldSupport}`);

console.log(`\nCommit B verification complete: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
