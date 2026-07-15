import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

// R4: this tool gates CI (npm run verify runs it first), so its own
// graph-theoretic logic (buildGraph's dedup, KnowledgeGraph's cycles/
// components/degree, schema-registry's reference extraction) needs
// test coverage the same way any other CI-gating code would. Mirrors
// the project's existing tests/run-unit.mjs convention: fork each
// *.test.js so one test's throw doesn't take down the others, and
// report a single pass/fail summary.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const unitDir = path.join(__dirname, 'unit');
const projectRoot = path.resolve(__dirname, '..', '..', '..');

const files = [
  ...fs.readdirSync(unitDir).filter(f => f.endsWith('.test.js')).map(f => path.join(unitDir, f)),
  // C1's automated parity check: not a graph-theoretic unit test like
  // the others, but it belongs in the same "does this CI-gating tool
  // still do the right thing" bucket.
  path.join(__dirname, 'parser-production-parity.test.js')
];

console.log(`Running ${files.length} knowledge-audit tests sequentially...`);

let failed = 0;

for (const file of files) {
  const baseName = path.basename(file);
  console.log(`\n--- Running ${baseName} ---`);

  await new Promise((resolve) => {
    // cwd must be the project root (assets/js/engine/knowledge/v1 is
    // resolved relative to it), matching how `npm run knowledge-audit`
    // itself is invoked.
    const child = fork(file, [], { stdio: 'inherit', cwd: projectRoot });
    child.on('exit', (code) => {
      if (code !== 0) {
        failed++;
        console.error(`❌ ${baseName} failed with exit code ${code}`);
      } else {
        console.log(`✅ ${baseName} passed`);
      }
      resolve();
    });
  });
}

console.log(`\nknowledge-audit test summary: ${files.length - failed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
