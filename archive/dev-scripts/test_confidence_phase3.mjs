/**
 * @fileoverview test_confidence_phase3.mjs
 * Verification test for Phase 3: Runtime Integration & End-to-End Flow.
 */

import { Trothix } from './assets/js/engine/Trothix.js';

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

async function runTest() {
  console.log("=== Testing Phase 3: E2E Confidence Plumbing ===");

  const trothix = new Trothix();
  await trothix.initialize();

  const complexText = `
    This Agreement is governed by the laws of New York.
    The Company shall make payment of USD 50,000 within 30 days.
  `;

  // 1. Evaluate with FEATURE_DYNAMIC_CONFIDENCE = false
  process.env.FEATURE_DYNAMIC_CONFIDENCE = 'false';
  const reportLegacy = await trothix.analyze(complexText);

  assert("Legacy verdict confidence is exactly 0.95", reportLegacy.overallVerdict.confidence === 0.95, `got: ${reportLegacy.overallVerdict.confidence}`);
  assert("Legacy report does not contain confidence metadata", reportLegacy.confidence === undefined);

  // 2. Evaluate with FEATURE_DYNAMIC_CONFIDENCE = true
  process.env.FEATURE_DYNAMIC_CONFIDENCE = 'true';
  const reportDynamic1 = await trothix.analyze(complexText);
  const reportDynamic2 = await trothix.analyze(complexText);

  assert("Dynamic verdict confidence is computed dynamically", typeof reportDynamic1.overallVerdict.confidence === 'number' && reportDynamic1.overallVerdict.confidence !== 0.95, `got: ${reportDynamic1.overallVerdict.confidence}`);
  assert("Dynamic report contains confidence metadata object", typeof reportDynamic1.confidence === 'object' && reportDynamic1.confidence !== null);
  
  if (reportDynamic1.confidence) {
    assert("Dynamic confidence record contains finalScore matching overallVerdict", reportDynamic1.confidence.finalScore === reportDynamic1.overallVerdict.confidence, `got: ${reportDynamic1.confidence.finalScore} vs ${reportDynamic1.overallVerdict.confidence}`);
    assert("Dynamic confidence record includes correct aggregation strategy", reportDynamic1.confidence.metadata.aggregationStrategy === "WeightedGeometricMean");
    assert("Dynamic confidence record includes profile identifier", reportDynamic1.confidence.metadata.profileIdentifier === "default-json-profile");
    assert("Dynamic confidence record includes buildVersion", reportDynamic1.confidence.metadata.buildVersion === "reproducible-build-v1");
  }

  // 3. Verification of determinism
  // Remove transient fields like engineMetadata.analysisTime before checking byte-identical reports
  delete reportDynamic1.engineMetadata.analysisTime;
  delete reportDynamic2.engineMetadata.analysisTime;
  
  assert("Report output is 100% deterministic (byte-identical across runs)", JSON.stringify(reportDynamic1) === JSON.stringify(reportDynamic2));

  console.log(`\nPhase 3 verification complete: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTest().catch(console.error);
