/**
 * @fileoverview test_confidence_reliability_commitA.mjs
 * Verification test for RuleReliabilityProvider - Commit A: Cache & Provider Seams.
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
  constructor() {
    this.rules = [
      { id: "RULE_1", severity: "High", metadata: { status: "production" } },
      { id: "RULE_2", severity: "Medium", metadata: { status: "draft" } }
    ];
  }
  getRules() {
    return this.rules;
  }
}

console.log("=== Testing RuleReliabilityProvider: Commit A ===");

const registry = new MockRuleRegistry();
const provider = new RuleReliabilityProvider(registry);

// 1. Same rule ID returns same score and same object (reproducibility and caching)
const record1a = provider.get("RULE_1");
const record1b = provider.get("RULE_1");

assert("Same rule returns identical record reference (cache hit)", record1a === record1b);
assert("Same rule returns same overall reliability", record1a.overallReliability === record1b.overallReliability);

// 2. Cache statistics check
assert("Lookup count tracks properly", provider.totalLookups === 2, `got: ${provider.totalLookups}`);
assert("Cache hits recorded correctly", provider.cacheHits === 1, `got: ${provider.cacheHits}`);
assert("Cache misses recorded correctly", provider.cacheMisses === 1, `got: ${provider.cacheMisses}`);

// 3. Cache Invalidation on registry update
provider.resetMetrics();
// Modify registry rules (add a new rule)
registry.rules.push({ id: "RULE_3", severity: "Low", metadata: { status: "experimental" } });

// Next lookup should miss and rebuild cache
const record1c = provider.get("RULE_1");
assert("Cache is invalidated when registry changes", provider.cacheMisses === 1, `got miss count: ${provider.cacheMisses}`);
assert("New lookup returns a fresh equivalent record object", record1c !== record1a);
assert("Fresh record overallReliability matches original", record1c.overallReliability === record1a.overallReliability);

// 4. Invalid rule returns deterministic fallback record
const fallback = provider.get("RULE_INVALID");
assert("Invalid rule returns fallback overall reliability", fallback.overallReliability === 0.5);
assert("Fallback record contains errors or reasons detailing missing rule", fallback.reasons.length > 0 && fallback.reasons[0].includes("not registered"));
assert("Fallback record is immutable", Object.isFrozen(fallback));

console.log(`\nCommit A verification complete: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
