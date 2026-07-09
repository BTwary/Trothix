#!/usr/bin/env node
/**
 * @fileoverview runRuleDiagnostics.mjs
 *
 * Read-only diagnostics entry point.
 *
 * Walks every domains/<Domain>/rules.json file (the same directory
 * KnowledgeProvider reads, the same file convention every domain uses for
 * its rule definitions), classifies every entry found there as
 * compiled-active / compiled-inert / failed, and prints a per-domain
 * report plus full detail for every failure.
 *
 * This script never imports or invokes Trothix.js, EngineRegistry,
 * KnowledgeProvider, RuleEvaluator, or RuleRegistry. It only reuses the
 * real, unmodified RuleCompiler (via RuleClassifier.js) so "does this
 * compile" matches production exactly. Nothing here mutates the Legal IR,
 * the parser, the ontology, or any knowledge file on disk.
 *
 * Usage:
 *   node assets/js/engine/diagnostics/runRuleDiagnostics.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyRule, STATE } from './RuleClassifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainsPath = path.join(__dirname, '..', 'knowledge', 'v1', 'domains');

function loadDomainRules(domainsPath) {
  const domains = fs
    .readdirSync(domainsPath)
    .filter((f) => fs.statSync(path.join(domainsPath, f)).isDirectory())
    .sort();

  const results = [];

  for (const domain of domains) {
    const rulesFile = path.join(domainsPath, domain, 'rules.json');
    if (!fs.existsSync(rulesFile)) {
      results.push({ domain, entries: [], skipped: 'no rules.json in this domain' });
      continue;
    }

    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
    } catch (e) {
      results.push({ domain, entries: [], skipped: `rules.json failed to parse: ${e.message}` });
      continue;
    }

    const entries = Array.isArray(raw) ? raw : [raw];
    results.push({ domain, entries });
  }

  return results;
}

function runDiagnostics() {
  const domainData = loadDomainRules(domainsPath);

  const totals = { [STATE.ACTIVE]: 0, [STATE.INERT]: 0, [STATE.FAILED]: 0 };
  const byDomain = {};
  const failures = [];
  const inertDetails = [];

  for (const { domain, entries, skipped } of domainData) {
    if (skipped) {
      byDomain[domain] = { skipped };
      continue;
    }

    const counts = { [STATE.ACTIVE]: 0, [STATE.INERT]: 0, [STATE.FAILED]: 0 };

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || !entry.id) continue;

      const result = classifyRule(entry, domain);
      counts[result.state]++;
      totals[result.state]++;

      if (result.state === STATE.FAILED) failures.push(result);
      if (result.state === STATE.INERT) inertDetails.push(result);
    }

    byDomain[domain] = counts;
  }

  return { totals, byDomain, failures, inertDetails };
}

const report = runDiagnostics();
const grandTotal = report.totals[STATE.ACTIVE] + report.totals[STATE.INERT] + report.totals[STATE.FAILED];

console.log('=== Trothix Rule Compiler Diagnostics (Step 2) ===\n');
console.log(`Total Rules:      ${grandTotal}`);
console.log(`Compiled Active:  ${report.totals[STATE.ACTIVE]}`);
console.log(`Compiled Inert:   ${report.totals[STATE.INERT]}`);
console.log(`Failed:           ${report.totals[STATE.FAILED]}`);

console.log('\n--- Per Domain ---');
for (const [domain, counts] of Object.entries(report.byDomain)) {
  console.log(`\n${domain}`);
  if (counts.skipped) {
    console.log(`  (skipped: ${counts.skipped})`);
    continue;
  }
  console.log(`  Compiled Active: ${counts[STATE.ACTIVE]}`);
  console.log(`  Compiled Inert:  ${counts[STATE.INERT]}`);
  console.log(`  Failed:          ${counts[STATE.FAILED]}`);
}

if (report.inertDetails.length > 0) {
  console.log('\n--- Compiled-Inert Rules (detail) ---');
  for (const r of report.inertDetails) {
    console.log(`\n[${r.domain}] ${r.id}`);
    console.log(`  Reason: ${r.reason}`);
  }
}

console.log('\n--- Failed Rules (detail) ---');
for (const f of report.failures) {
  console.log(`\n[${f.domain}] ${f.id}`);
  console.log(`  Reason: ${f.reason}`);
}

export { runDiagnostics };
