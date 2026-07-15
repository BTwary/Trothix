/**
 * @fileoverview test_confidence_phase2_commitB.mjs
 * Verification test for Phase 2 - Commit B: Local Evaluation & Traceability.
 */

import { Trothix } from './assets/js/engine/Trothix.js';
import { LegalIRBuilder } from './assets/js/engine/core/ir/legalIRBuilder.js';
import { EngineRegistry } from './assets/js/engine/core/ir/engineRegistry.js';
import { RuleContext } from './assets/js/engine/rules/RuleContext.js';
import { RuleEvaluator } from './assets/js/engine/rules/RuleEvaluator.js';
import { KnowledgeProvider } from './assets/js/engine/knowledge/KnowledgeProvider.js';

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
  console.log("=== Testing Commit B: Local Evaluation & Traceability ===");

  const knowledgeProvider = new KnowledgeProvider();
  await knowledgeProvider.initialize();
  const compiledRules = knowledgeProvider.getCompiledRules();

  const complexText = `
    This Agreement is governed by the laws of New York.
    The Company shall make payment of USD 50,000 within 30 days.
  `;

  // 1. Evaluate with FEATURE_DYNAMIC_CONFIDENCE = false (Legacy)
  process.env.FEATURE_DYNAMIC_CONFIDENCE = 'false';
  
  const irBuilder1 = new LegalIRBuilder();
  irBuilder1.buildFromText(complexText);
  
  const evaluatorLegacy = new RuleEvaluator(compiledRules);
  const findingsLegacy = evaluatorLegacy.evaluate(irBuilder1.document);

  // 2. Evaluate with FEATURE_DYNAMIC_CONFIDENCE = true (New Localized Evaluator)
  process.env.FEATURE_DYNAMIC_CONFIDENCE = 'true';

  const irBuilder2 = new LegalIRBuilder();
  irBuilder2.buildFromText(complexText);
  // Re-run tokenizer/builders if needed, but since we are testing RuleEvaluator directly on the document nodes:
  // Wait, the rules depend on actions[*].verb, etc., which are built by the plugins.
  // Let's use the real Trothix analyze pipeline to run the full engines, so we get fully enriched IR!
  
  const trothix = new Trothix();
  await trothix.initialize();

  // Run full pipeline in legacy mode
  process.env.FEATURE_DYNAMIC_CONFIDENCE = 'false';
  const reportLegacy = await trothix.analyze(complexText);

  // Run full pipeline in dynamic mode
  process.env.FEATURE_DYNAMIC_CONFIDENCE = 'true';
  const reportDynamic = await trothix.analyze(complexText);

  // Assert rule firing behavior is identical
  assert("Same number of findings produced in both modes", 
    reportLegacy.findings.length === reportDynamic.findings.length,
    `legacy: ${reportLegacy.findings.length}, dynamic: ${reportDynamic.findings.length}`);

  for (let i = 0; i < reportLegacy.findings.length; i++) {
    const fLegacy = reportLegacy.findings[i];
    const fDynamic = reportDynamic.findings.find(fd => fd.rule === fLegacy.rule);
    
    assert(`Finding for rule ${fLegacy.rule} exists in both reports`, !!fDynamic);
    if (fDynamic) {
      assert(`Finding details (severity/category) are identical for rule ${fLegacy.rule}`,
        fLegacy.severity === fDynamic.severity && fLegacy.category === fDynamic.category);
    }
  }

  // Assert node and traceability mapping in dynamic mode
  const paymentFinding = reportDynamic.findings.find(fd => fd.rule === "RULE_PAYMENT_DEADLINE_LONG");
  assert("Payment finding exists", !!paymentFinding);
  if (paymentFinding) {
    // In legacy mode, node is null, and traceability is 'Unknown'
    const legacyPaymentFinding = reportLegacy.findings.find(fd => fd.rule === "RULE_PAYMENT_DEADLINE_LONG");
    assert("Legacy node reference is null", legacyPaymentFinding.node === null);
    assert("Legacy traceability refers to 'Unknown'", reportLegacy.traceability[legacyPaymentFinding.id].clauseNode === "Unknown");

    // In dynamic mode, node must be successfully pinpointed!
    assert("Dynamic node reference is populated", paymentFinding.node !== null);
    assert("Dynamic node ID starts with expected prefix", paymentFinding.node.id.startsWith("node_"));
    assert("Dynamic node text matches matched text", paymentFinding.node.text.includes("payment of USD 50,000"));
    
    // Assert ReportAssembler correctly consumed the node to build traceability
    const traceId = paymentFinding.id;
    assert("Traceability entry exists for dynamic finding ID", !!reportDynamic.traceability[traceId]);
    if (reportDynamic.traceability[traceId]) {
      assert("Traceability points to the correct node ID instead of 'Unknown'", 
        reportDynamic.traceability[traceId].clauseNode === paymentFinding.node.id,
        `got: ${reportDynamic.traceability[traceId].clauseNode}`);
    }
  }

  console.log(`\nCommit B verification complete: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTest().catch(console.error);
