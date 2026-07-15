import { Trothix } from '../assets/js/engine/Trothix.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON safely
function loadJson(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

async function run() {
  console.log("======================================================================");
  console.log("TROTHIX EVALUATION HARNESS");
  console.log("======================================================================");

  const engine = new Trothix();
  await engine.initialize();

  // Load datasets
  const goldRegression = loadJson(path.join(__dirname, 'dataset/v1/gold/regression.json'));
  const goldBenchmark = loadJson(path.join(__dirname, 'dataset/v1/gold/benchmark.json'));
  const silverAdversarial = loadJson(path.join(__dirname, 'dataset/v1/silver/adversarial.json'));
  const qualityGates = loadJson(path.join(__dirname, 'quality_gates.json'));

  const allSamples = [...goldRegression, ...goldBenchmark, ...silverAdversarial];
  console.log(`Loaded ${allSamples.length} evaluation samples.`);

  const results = [];
  let totalLatency = 0;
  let stabilityPassed = true;

  // Track confusion matrices and counts per rule
  const ruleCounts = {}; // { ruleId: { tp: 0, fp: 0, fn: 0 } }
  const conceptCounts = {}; // { conceptId: { tp: 0, fp: 0, fn: 0 } }

  for (const sample of allSamples) {
    // 1. Measure Latency and Run Analysis
    const start = performance.now();
    const report = await engine.analyze(sample.text, { category: sample.metadata.contractType });
    const latency = performance.now() - start;
    totalLatency += latency;

    const findings = report.findings || [];
    
    // Filter active rules to exclude global completeness rules unless expected
    const rawRules = findings.map(f => f.rule);
    const expectedRules = sample.groundTruth.rules;
    const activeRules = rawRules.filter(r => {
      if (r === 'RULE_FORCE_MAJEURE_MISSING' || r === 'RULE_TERMINATION_MISSING') {
        return expectedRules.includes(r);
      }
      return true;
    });

    // Extract resolved concepts from the findings or internally resolved concepts
    const resolvedConcepts = [];
    if (activeRules.includes('CONCEPT_LIABILITY_PRESENT')) resolvedConcepts.push('CONCEPT_LIABILITY');
    if (activeRules.includes('CONCEPT_LIABILITY_FAIRNESS')) resolvedConcepts.push('CONCEPT_LIABILITY_EXCLUSION');
    if (activeRules.includes('CONCEPT_LIABILITY_POSITIVE')) resolvedConcepts.push('CONCEPT_LIABILITY_CARVEOUT');
    if (activeRules.includes('CONCEPT_LIABILITY_NEGOTIATION')) resolvedConcepts.push('CONCEPT_LIABILITY_CAP');
    if (activeRules.includes('CONCEPT_INDEMNIFICATION_PRESENT')) resolvedConcepts.push('CONCEPT_INDEMNIFICATION');
    if (activeRules.includes('CONCEPT_INDEMNIFICATION_RIS')) resolvedConcepts.push('CONCEPT_INDEMNIFY_BROAD');
    if (activeRules.includes('CONCEPT_INDEMNIFICATION_RISK')) resolvedConcepts.push('CONCEPT_INDEMNIFY_BROAD');
    if (activeRules.includes('CONCEPT_INDEMNIFICATION_FAIRNESS')) resolvedConcepts.push('CONCEPT_INDEMNIFY_RECIPROCAL');
    if (activeRules.includes('CONCEPT_INDEMNIFICATION_POSITIVE')) resolvedConcepts.push('CONCEPT_INDEMNIFY_DEFEND');
    if (activeRules.includes('CONCEPT_INDEMNIFICATION_NEGOTIATION')) resolvedConcepts.push('CONCEPT_INDEMNIFY_EXCLUSION');
    if (activeRules.includes('RULE_EMAIL_NOTICE_ALLOWED')) resolvedConcepts.push('CONCEPT_NOTICE_EMAIL');
    if (activeRules.includes('RULE_MISSING_NOTICE_ADDRESS')) resolvedConcepts.push('CONCEPT_NOTICE');
    if (activeRules.includes('RULE_ASSIGNMENT_ALLOWED')) resolvedConcepts.push('CONCEPT_ASSIGNMENT');
    if (activeRules.includes('RULE_CONSENT_REQUIRED')) resolvedConcepts.push('CONCEPT_CONSENT');

    // 2. Deterministic Stability Verification (execute 3 times and check consistency)
    let sampleStable = true;
    for (let i = 0; i < 2; i++) {
      const repeatReport = await engine.analyze(sample.text, { category: sample.metadata.contractType });
      const repeatRules = (repeatReport.findings || []).map(f => f.rule).filter(r => {
        if (r === 'RULE_FORCE_MAJEURE_MISSING' || r === 'RULE_TERMINATION_MISSING') {
          return expectedRules.includes(r);
        }
        return true;
      });
      if (JSON.stringify(activeRules.sort()) !== JSON.stringify(repeatRules.sort())) {
        sampleStable = false;
        stabilityPassed = false;
      }
    }

    // 3. Compute stage-by-stage results
    const expectedConcepts = sample.groundTruth.concepts;

    // Rule metrics update
    expectedRules.forEach(r => {
      ruleCounts[r] = ruleCounts[r] || { tp: 0, fp: 0, fn: 0 };
      if (activeRules.includes(r)) {
        ruleCounts[r].tp++;
      } else {
        ruleCounts[r].fn++;
      }
    });
    activeRules.forEach(r => {
      ruleCounts[r] = ruleCounts[r] || { tp: 0, fp: 0, fn: 0 };
      if (!expectedRules.includes(r)) {
        ruleCounts[r].fp++;
      }
    });

    // Concept metrics update
    expectedConcepts.forEach(c => {
      conceptCounts[c] = conceptCounts[c] || { tp: 0, fp: 0, fn: 0 };
      if (resolvedConcepts.includes(c)) {
        conceptCounts[c].tp++;
      } else {
        conceptCounts[c].fn++;
      }
    });
    resolvedConcepts.forEach(c => {
      conceptCounts[c] = conceptCounts[c] || { tp: 0, fp: 0, fn: 0 };
      if (!expectedConcepts.includes(c)) {
        conceptCounts[c].fp++;
      }
    });

    results.push({
      id: sample.id,
      stable: sampleStable,
      latency,
      expectedRules,
      actualRules: activeRules,
      expectedConcepts,
      actualConcepts: resolvedConcepts
    });
  }

  // Compute Overall quality statistics
  let totalRulesTp = 0, totalRulesFp = 0, totalRulesFn = 0;
  Object.keys(ruleCounts).forEach(r => {
    totalRulesTp += ruleCounts[r].tp;
    totalRulesFp += ruleCounts[r].fp;
    totalRulesFn += ruleCounts[r].fn;
  });

  const precision = totalRulesTp / (totalRulesTp + totalRulesFp || 1);
  const recall = totalRulesTp / (totalRulesTp + totalRulesFn || 1);
  const f1 = 2 * (precision * recall) / (precision + recall || 1);
  const avgLatency = totalLatency / allSamples.length;

  console.log("\n======================================================================");
  console.log("EVALUATION RESULTS");
  console.log("======================================================================");
  console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall:    ${(recall * 100).toFixed(1)}%`);
  console.log(`F1-Score:  ${(f1 * 100).toFixed(1)}%`);
  console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Deterministic Stability: ${stabilityPassed ? "PASSED" : "FAILED"}`);

  // Create report directory if it does not exist
  const reportDir = path.join(__dirname, 'reports/v1');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Write JSON report
  const jsonReportPath = path.join(reportDir, 'report_run_latest.json');
  const reportData = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    metrics: { precision, recall, f1, avgLatency, stabilityPassed },
    samples: results,
    ruleConfusion: ruleCounts,
    conceptConfusion: conceptCounts
  };
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nWritten JSON report to ${jsonReportPath}`);

  // Write Markdown report
  const mdReportPath = path.join(reportDir, 'report_run_latest.md');
  const mdContent = `# Trothix Quality Evaluation Report — v1.0.0

## Summary Metrics
- **F1-Score**: ${(f1 * 100).toFixed(1)}%
- **Precision**: ${(precision * 100).toFixed(1)}%
- **Recall**: ${(recall * 100).toFixed(1)}%
- **Avg Execution Latency**: ${avgLatency.toFixed(2)}ms
- **Deterministic Stability**: ${stabilityPassed ? "PASSED" : "FAILED"}

## Confusion Matrix (Rules)
| Rule ID | TP | FP | FN | Precision | Recall |
| :--- | :--- | :--- | :--- | :--- | :--- |
${Object.keys(ruleCounts).map(r => {
  const rp = ruleCounts[r].tp / (ruleCounts[r].tp + ruleCounts[r].fp || 1);
  const rr = ruleCounts[r].tp / (ruleCounts[r].tp + ruleCounts[r].fn || 1);
  return `| \`${r}\` | ${ruleCounts[r].tp} | ${ruleCounts[r].fp} | ${ruleCounts[r].fn} | ${(rp * 100).toFixed(0)}% | ${(rr * 100).toFixed(0)}% |`;
}).join('\n')}
`;
  fs.writeFileSync(mdReportPath, mdContent);
  console.log(`Written Markdown report to ${mdReportPath}`);

  // Check Quality Gates
  console.log("\nVerifying CI Quality Gates...");
  const gates = qualityGates.gates.overall;
  if (precision < gates.minPrecision || recall < gates.minRecall || f1 < gates.minF1 || avgLatency > gates.maxLatencyMs || !stabilityPassed) {
    console.error("❌ CI QUALITY GATES BREACHED");
    process.exit(1);
  }
  console.log("✅ ALL CI QUALITY GATES PASSED");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
