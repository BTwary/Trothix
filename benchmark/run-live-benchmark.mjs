import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from '../assets/js/engine/core/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBenchmark() {
  const suites = ['nda', 'lease', 'tos'];
  let totalTests = 0;
  let passedTests = 0;

  for (const suite of suites) {
    console.log(`\n--- Running ${suite.toUpperCase()} Suite ---`);
    const suiteDir = path.join(__dirname, suite);
    if (!fs.existsSync(suiteDir)) continue;

    const files = fs.readdirSync(suiteDir).filter(f => f.endsWith('.txt'));
    let expected = {};
    try {
      expected = JSON.parse(fs.readFileSync(path.join(suiteDir, 'expected.json'), 'utf8'));
    } catch (e) {
      console.warn(`No expected.json found for ${suite}, skipping validation.`);
    }

    for (const file of files) {
      const docText = fs.readFileSync(path.join(suiteDir, file), 'utf8');
      console.log(`Testing ${file}...`);
      
      const docType = suite === 'tos' ? 'UNKNOWN' : suite.toUpperCase();
      
      const result = await processDocument(docText, docType, {}, {}, false);

      totalTests++;
      
      const expectedData = expected[file];
      if (!expectedData) {
        console.log(`  No expected output defined. Got risk score: ${result.riskScore}`);
        passedTests++;
        continue;
      }

      // Basic validation
      let passed = true;
      if (expectedData.expectedRiskLevel && result.riskLevel.toLowerCase() !== expectedData.expectedRiskLevel.toLowerCase()) {
        console.error(`  [FAIL] Expected risk level ${expectedData.expectedRiskLevel}, got ${result.riskLevel}`);
        passed = false;
      }
      
      if (passed) {
        console.log(`  [PASS] Score: ${result.riskScore}, Confidence: ${result.confidenceScore}, Fairness: ${result.fairness}`);
        passedTests++;
      }
    }
  }

  console.log(`\n=== Benchmark Complete: ${passedTests}/${totalTests} Passed ===`);
}

runBenchmark().catch(console.error);
