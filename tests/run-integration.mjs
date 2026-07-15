/**
 * @fileoverview run-integration.mjs
 * Cross-platform runner for integration tests.
 */

import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const integrationDir = path.join(__dirname, 'integration');

const files = fs.readdirSync(integrationDir)
  .filter(f => f.endsWith('.test.js'))
  .map(f => path.join(integrationDir, f));

console.log(`Running ${files.length} integration tests sequentially...`);

let failed = 0;

for (const file of files) {
  const baseName = path.basename(file);
  console.log(`\n--- Running ${baseName} ---`);
  
  await new Promise((resolve) => {
    const child = fork(file, [], { stdio: 'inherit' });
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

console.log(`\nIntegration summary: ${files.length - failed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
