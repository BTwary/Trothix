/**
 * @fileoverview test_confidence_phase1.mjs
 * Verification test for Phase 1 of the Confidence System.
 */

import { WeightedGeometricMeanStrategy, WeightedArithmeticMeanStrategy } from './assets/js/engine/assessment/ConfidenceStrategy.js';
import { DefaultConfidenceProfile } from './assets/js/engine/assessment/ConfidenceProfile.js';
import { ConfidenceResolver } from './assets/js/engine/assessment/ConfidenceResolver.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEIGHTS_PATH = path.join(__dirname, 'assets', 'js', 'engine', 'knowledge', 'v1', 'weights');

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

// ----------------------------------------------------
// 1. Pluggable Strategies Tests
// ----------------------------------------------------
console.log("=== Testing Pluggable Strategies ===");

const signals = {
  extraction: 0.90,
  evidence: 0.80,
  coverage: 0.95,
  contradiction: 1.0
};

const weights = {
  extraction: 0.3,
  evidence: 0.2,
  coverage: 0.2,
  contradiction: 0.3
};

const geoStrategy = new WeightedGeometricMeanStrategy();
const arithStrategy = new WeightedArithmeticMeanStrategy();

const geoResult = geoStrategy.aggregate(signals, weights);
const arithResult = arithStrategy.aggregate(signals, weights);

assert("WeightedGeometricMeanStrategy matches expected formula", geoResult > 0.85 && geoResult < 0.95, `got ${geoResult}`);
assert("WeightedArithmeticMeanStrategy matches expected formula", Math.abs(arithResult - 0.92) < 0.001, `got ${arithResult}`);

// Test saturating behavior / low signal impact
const lowSignals = { ...signals, evidence: 0.1 };
const geoLow = geoStrategy.aggregate(lowSignals, weights);
const arithLow = arithStrategy.aggregate(lowSignals, weights);

// Geometric mean should penalize low scores significantly more than arithmetic mean
assert("WeightedGeometricMean Strategy penalizes low scores more severely than Arithmetic", geoLow < arithLow, `geo: ${geoLow}, arith: ${arithLow}`);

// ----------------------------------------------------
// 2. Confidence Profile Tests
// ----------------------------------------------------
console.log("\n=== Testing Confidence Profile ===");
const profile = new DefaultConfidenceProfile(WEIGHTS_PATH);
assert("Default profile loaded successfully", profile.id === "default-json-profile");
assert("Default profile matches JSON weights file version", profile.version === "1.0.0");
assert("Default profile returns correct weights mapping", JSON.stringify(profile.getWeights()) === JSON.stringify(weights));

// ----------------------------------------------------
// 3. Confidence Resolver & Determinism Tests
// ----------------------------------------------------
console.log("\n=== Testing Confidence Resolver ===");
const resolver = new ConfidenceResolver({ profile, strategy: geoStrategy });
const mockFindings = [
  { id: "FINDING_1", category: "Risk", severity: "High", confidence: 0.90, node: {} },
  { id: "FINDING_2", category: "Completeness", severity: "Medium", confidence: 0.80, node: {} }
];
const mockAssessments = {
  completenessAssessment: { confidence: 0.95 }
};

const record1 = resolver.resolve(mockAssessments, mockFindings);
const record2 = resolver.resolve(mockAssessments, mockFindings);

assert("Resolver computes expected mock score", record1.finalScore > 0.8 && record1.finalScore < 1.0, `got ${record1.finalScore}`);
assert("Resolver metadata matches specification", record1.metadata.algorithmVersion === "1.0.0");
assert("Resolver metadata includes aggregation strategy", record1.metadata.aggregationStrategy === "WeightedGeometricMean");
assert("Resolver metadata includes profile identifier", record1.metadata.profileIdentifier === "default-json-profile");
assert("Resolver output is 100% deterministic (byte-identical across runs)", JSON.stringify(record1) === JSON.stringify(record2));

console.log(`\nPhase 1 verification complete: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
