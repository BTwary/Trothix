// Shared helper for tests/integration/*.test.js.
//
// Every test in this directory runs the REAL Trothix engine (Pipeline B —
// assets/js/engine/Trothix.js — the same class api/analyze.js instantiates
// in production) against real clause text. There is no mocked pipeline, no
// hardcoded finding, and no console.log narration standing in for actual
// execution. If a rule doesn't fire, the test reports that it didn't fire.
//
// This file existed as five near-identical files that each called a local
// evaluateClause() function returning a hardcoded literal object, so the
// if-check at the bottom could never fail. See PHASE2_TESTING_RESTORATION.md
// for the full writeup.

import { Trothix } from '../../assets/js/engine/Trothix.js';

let sharedEngine = null;

// The engine's knowledge base load is expensive-ish and identical across
// every test file, so cache one initialized instance per process.
export async function getEngine() {
  if (!sharedEngine) {
    const engine = new Trothix();
    await engine.initialize();
    sharedEngine = engine;
  }
  return sharedEngine;
}

let passed = 0;
let failed = 0;

export function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`✅ ${label}`);
  } else {
    failed++;
    console.log(`❌ ${label}${detail ? '\n   ' + detail : ''}`);
  }
}

export function summarize(fileLabel) {
  console.log(`\n${fileLabel}: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

// Convenience: run analyze() and return the finding rule/ruleId ids as one
// flat list, since some findings use `rule` and some use `ruleId` (this
// inconsistency is itself a known, tracked issue — see roadmap item on
// unifying the Finding shape — and tests should not paper over it).
export async function analyzeAndGetFindingIds(text, metadata = { category: 'Services Agreement' }) {
  const engine = await getEngine();
  const report = await engine.analyze(text, metadata);
  return report.findings.map(f => f.rule ?? f.ruleId ?? f.id);
}
