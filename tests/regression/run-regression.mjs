/**
 * Regression corpus runner.
 *
 * Reads tests/regression/corpus.json and runs every entry through the real
 * production engine (Trothix.js, Pipeline B). No mocking, no fixture engine.
 *
 * Each entry declares:
 *   - mustInclude: finding ids that MUST appear (regresses if they stop firing)
 *   - mustExclude: finding ids that must NOT appear (regresses if they start
 *     firing without the domain actually being authored, OR if a pending
 *     domain's status has advanced and this file is now stale)
 *
 * A failure on a "pending"-status entry's mustExclude side is a GOOD sign —
 * it means the domain likely just went compiled-active and this corpus
 * entry (plus tests/integration/<domain>_runtime.test.js) needs updating to
 * assert the new positive behavior. That is the intended lifecycle of this
 * file, not a bug in the runner.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { Trothix } from '../../assets/js/engine/Trothix.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const corpus = JSON.parse(readFileSync(path.join(__dirname, 'corpus.json'), 'utf-8'));

  const engine = new Trothix();
  await engine.initialize();

  let passed = 0;
  let failed = 0;
  const statusCounts = {};

  console.log('='.repeat(70));
  console.log(`REGRESSION CORPUS — ${corpus.length} entries, real engine (Trothix.js)`);
  console.log('='.repeat(70));

  for (const entry of corpus) {
    statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;

    const report = await engine.analyze(entry.text, { category: entry.category || 'Services Agreement' });
    const findingIds = report.findings.map(f => f.rule ?? f.ruleId ?? f.id);

    let entryFailed = false;
    console.log(`\n--- ${entry.id} (${entry.domain}, status: ${entry.status}) ---`);

    for (const id of entry.mustInclude) {
      if (findingIds.includes(id)) {
        console.log(`  ✅ includes ${id}`);
      } else {
        console.log(`  ❌ MISSING expected finding ${id}`);
        entryFailed = true;
      }
    }
    for (const id of entry.mustExclude) {
      if (!findingIds.includes(id)) {
        console.log(`  ✅ correctly excludes ${id}`);
      } else {
        console.log(`  ❌ UNEXPECTEDLY fired ${id} (if this domain was just authored, update corpus.json + the matching integration test)`);
        entryFailed = true;
      }
    }

    if (entryFailed) {
      failed++;
      console.log(`  (got: ${JSON.stringify(findingIds)})`);
    } else {
      passed++;
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`SUMMARY: ${passed}/${corpus.length} entries passed`);
  console.log('By status:', JSON.stringify(statusCounts));
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

main();
