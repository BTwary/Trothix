// Benchmark runner for the REAL production engine — Trothix.js (Pipeline B),
// the class api/analyze.js instantiates and calls in production.
//
// This intentionally does NOT reuse run-benchmark.mjs's per-field accuracy
// model, because that model is shaped for core/router.js's output
// (`result.extractedData[field]`), which Pipeline B does not produce.
// Trothix.analyze() returns a findings-based report, so this benchmark
// scores at the finding level: for each document, which finding ids fired.
//
// Two things it checks per document:
//   1. Snapshot regression: findings must match benchmark/pipeline-b-baseline.json
//      exactly (a checked-in baseline captured by running the real engine).
//      A diff here means either a real regression OR real progress (e.g. a
//      newly-authored domain starting to fire) — either way it demands a
//      human look, not a silent pass. Intentional changes get re-baselined
//      with `node benchmark/run-benchmark-pipelineB.mjs --update-baseline`.
//      Caveat: this only guards against *change* from the baseline. If the
//      baseline itself was captured while a finding was wrong (missing,
//      extra, or misclassified), this check will pass forever without
//      catching it — it is not a substitute for the hand-labeled gold-set
//      accuracy numbers in evaluation/run-evaluation.mjs.
//   2. Coverage sanity: flags any document producing zero findings at all,
//      which is a stronger, cheaper signal than field accuracy for a rule
//      engine whose current constraint is "not enough rules fire."
//
// Usage:
//   node benchmark/run-benchmark-pipelineB.mjs                 # check against baseline
//   node benchmark/run-benchmark-pipelineB.mjs --update-baseline # regenerate baseline

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { Trothix } from '../assets/js/engine/Trothix.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = path.join(__dirname, 'pipeline-b-baseline.json');
const UPDATE_MODE = process.argv.includes('--update-baseline');

const CATEGORIES = [
  { name: 'nda', context: { category: 'NDA' } },
  { name: 'lease', context: { category: 'Lease' } },
  { name: 'tos', context: { category: 'Terms of Service' } },
];

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

async function main() {
  const engine = new Trothix();
  await engine.initialize();

  const newBaseline = {};
  let totalDocs = 0;
  let zeroFindingDocs = 0;
  let regressed = 0;
  let matchedOrNew = 0;

  const existingBaseline = UPDATE_MODE
    ? {}
    : JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));

  console.log('='.repeat(70));
  console.log(`PIPELINE B BENCHMARK — real engine: assets/js/engine/Trothix.js`);
  console.log(`Mode: ${UPDATE_MODE ? 'UPDATE BASELINE' : 'CHECK AGAINST BASELINE'}`);
  console.log('='.repeat(70));

  for (const category of CATEGORIES) {
    const dir = path.join(__dirname, category.name);
    const files = readdirSync(dir).filter(f => f.endsWith('.txt')).sort();

    console.log(`\n${'-'.repeat(70)}`);
    console.log(`CATEGORY: ${category.name.toUpperCase()}  (${files.length} documents)`);
    console.log('-'.repeat(70));

    for (const file of files) {
      totalDocs++;
      const key = `${category.name}/${file}`;
      const text = readFileSync(path.join(dir, file), 'utf-8');
      const report = await engine.analyze(text, category.context);
      const findingIds = report.findings.map(f => f.rule ?? f.ruleId ?? f.id).sort();

      newBaseline[key] = findingIds;

      if (findingIds.length === 0) {
        zeroFindingDocs++;
        console.log(`  ⚠️  ${key}: 0 findings`);
      }

      if (!UPDATE_MODE) {
        const expected = existingBaseline[key] || [];
        if (arraysEqual(expected, findingIds)) {
          matchedOrNew++;
          console.log(`  ✅ ${key}: matches baseline (${findingIds.length} finding${findingIds.length === 1 ? '' : 's'})`);
        } else {
          regressed++;
          console.log(`  ❌ ${key}: DIFFERS from baseline`);
          console.log(`     baseline: ${JSON.stringify(expected)}`);
          console.log(`     actual:   ${JSON.stringify(findingIds)}`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Documents benchmarked:     ${totalDocs}`);
  console.log(`Documents w/ 0 findings:   ${zeroFindingDocs}  (coverage signal, not necessarily wrong — see rule coverage roadmap)`);

  if (UPDATE_MODE) {
    writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2) + '\n');
    console.log(`\nBaseline written to ${path.relative(process.cwd(), BASELINE_PATH)}`);
  } else {
    console.log(`Matches baseline:          ${matchedOrNew}/${totalDocs}`);
    console.log(`Differs from baseline:     ${regressed}/${totalDocs}`);
    console.log('='.repeat(70));
    if (regressed > 0) {
      console.log('\nIf every diff above is intentional (a domain went live, a bug got');
      console.log('fixed), re-run with --update-baseline and commit the new baseline');
      console.log('alongside the change that caused it. If any diff is unexplained,');
      console.log('it is a real regression.');
      process.exit(1);
    }
  }
}

main();
