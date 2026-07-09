// Regression test for Enterprise Hardening Sprint 1, verified issue #2:
// api/analyze.js's globalEngine singleton was assigned BEFORE
// initialize() resolved, so a thrown initialize() left a truthy-but-
// broken engine in place forever (next request would skip
// re-initialization entirely). This exercises the exact pattern now used
// in api/analyze.js, against the real Trothix/KnowledgeProvider classes -
// not a mock - using a deliberately broken knowledge directory to force a
// real initialize() failure, then a real good one to prove retry works.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { Trothix } from './assets/js/engine/Trothix.js';

let passed = 0, failed = 0;
function check(label, condition, detail = '') {
  if (condition) { passed++; console.log(`✅ ${label}`); }
  else { failed++; console.log(`❌ ${label}${detail ? '\n   ' + detail : ''}`); }
}

// --- Build a deliberately broken knowledge base: one node references a
// target id that doesn't exist anywhere, which _validateAndResolveGraph()
// will reject with a real thrown error. ---
const brokenKb = fs.mkdtempSync(path.join(os.tmpdir(), 'broken-kb-'));
fs.mkdirSync(path.join(brokenKb, 'domains', 'Broken'), { recursive: true });
fs.writeFileSync(
  path.join(brokenKb, 'domains', 'Broken', 'nodes.json'),
  JSON.stringify([
    { id: 'CONCEPT_BROKEN', related: ['CONCEPT_DOES_NOT_EXIST'] },
  ])
);

const realKb = path.join(process.cwd(), 'assets', 'js', 'engine', 'knowledge', 'v1');

// --- Simulates the EXACT pattern api/analyze.js now uses. ---
let globalEngineOldPattern = null;
let globalEngineNewPattern = null;

async function requestOldPattern(kbPath) {
  if (!globalEngineOldPattern) {
    globalEngineOldPattern = new Trothix({ kbPath }); // BUG: assigned before init
    await globalEngineOldPattern.initialize(); // if this throws, the assignment above already happened
  }
  return globalEngineOldPattern;
}

async function requestNewPattern(kbPath) {
  if (!globalEngineNewPattern) {
    const engine = new Trothix({ kbPath });
    await engine.initialize(); // if this throws, globalEngineNewPattern is never touched
    globalEngineNewPattern = engine;
  }
  return globalEngineNewPattern;
}

// --- Old (buggy) pattern: first call fails, second call is stuck. ---
let firstCallThrew = false;
try {
  await requestOldPattern(brokenKb);
} catch (e) {
  firstCallThrew = true;
}
check('old pattern: first call against a broken KB throws', firstCallThrew);
check('old pattern: BUG REPRODUCED — globalEngine is left non-null after the throw',
  globalEngineOldPattern !== null,
  'if this is false, the old code pattern no longer has the bug (unexpected)');

let secondCallRetried = true;
try {
  // Second "request" - if the bug is present, this returns instantly
  // without ever calling initialize() again, because `if (!globalEngine)`
  // is now false. We can detect that indirectly: the broken instance's
  // .graph was never fully validated, so using it will misbehave rather
  // than throw a fresh "broken reference" error.
  await requestOldPattern(brokenKb);
  secondCallRetried = false; // no error at all means it silently reused the broken instance
} catch (e) {
  // If it retried and hit the SAME broken-reference error, that's actually
  // the desired behavior - but the old pattern's `if (!globalEngine)` guard
  // means this catch block should never be reached for the old pattern.
  secondCallRetried = true;
}
check('old pattern: BUG REPRODUCED — second call does not retry initialize() at all (silently reuses the broken engine)',
  !secondCallRetried);

// --- New (fixed) pattern: first call fails cleanly, second call retries
// and, given a good path this time, succeeds. ---
let newFirstCallThrew = false;
try {
  await requestNewPattern(brokenKb);
} catch (e) {
  newFirstCallThrew = true;
}
check('new pattern: first call against a broken KB throws', newFirstCallThrew);
check('new pattern: FIX VERIFIED — globalEngine remains null after the throw (no broken instance retained)',
  globalEngineNewPattern === null);

let secondCallSucceeded = false;
try {
  const engine = await requestNewPattern(realKb); // simulate the "problem got fixed, try again" case with a real good KB
  secondCallSucceeded = !!engine && globalEngineNewPattern === engine;
} catch (e) {
  console.log('   unexpected error on retry:', e.message);
}
check('new pattern: FIX VERIFIED — next call retries initialize() from scratch and succeeds against a good KB',
  secondCallSucceeded);

fs.rmSync(brokenKb, { recursive: true, force: true });

console.log('');
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
