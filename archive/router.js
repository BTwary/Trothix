// Benchmark runner for the Trothix parser engine.
//
// Usage:  node benchmark/run-benchmark.mjs
//
// For each category (nda / lease / tos), reads every .txt document, runs it
// through core/router.js exactly as the real app would (including type
// classification -- providedType is left null on purpose), and compares the
// result against benchmark/<category>/expected.json field by field.
//
// This is intentionally NOT pass/fail on the whole document -- it reports
// per-field accuracy so a single wrong field doesn't hide 17 correct ones,
// and so regressions are visible immediately (e.g. "Payment: 96% -> 81%").
//
// Each expected.json entry carries a stable `id` (e.g. LEASE-003) plus
// `origin` / `difficulty` / `status` / `introduced` metadata. `origin` is
// load-bearing, not decorative: the summary below breaks accuracy out by
// origin so a blended "100%" can't quietly average a fully-covered
// synthetic set against a thin, untested real-document set once those
// start getting added.

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { processDocument } from './assets/js/engine/core/legacy/router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RULES = {
  schemaVersion: '1.0',
  ndaMaxTerm: 3,
  neutralStates: ['Delaware', 'New York', 'California'],
  leaseMaxLateFeePercent: 5,
  leaseMaxDepositMonths: 2,
};

const CATEGORIES = [
  { name: 'nda', userContext: { homeState: 'New York', role: 'Receiving Party' } },
  { name: 'lease', userContext: { homeState: 'New York', role: 'Tenant' } },
  { name: 'tos', userContext: { homeState: 'New York', role: null } },
];

// Fixed display order so the "By Origin" section is stable across runs,
// including origins that currently have zero documents (e.g. real/community
// before any have been added).
const ORIGIN_LABELS = [
  { key: 'synthetic', label: 'Synthetic' },
  { key: 'anonymized_real', label: 'Anonymized Real' },
  { key: 'community_submission', label: 'Community' },
];

let totalFields = 0;
let passedFields = 0;
let totalDocs = 0;
let docsWithFailures = 0;
let knownLimitationDocs = 0;

// Per-origin and per-parser tallies, populated as documents are scored.
const originStats = {};
const parserStats = {};

function bump(stats, key, fieldsTotal, fieldsPassed) {
  if (!stats[key]) stats[key] = { docs: 0, fields: 0, passed: 0 };
  stats[key].docs++;
  stats[key].fields += fieldsTotal;
  stats[key].passed += fieldsPassed;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'string') return a.toLowerCase() === b.toLowerCase();
  return JSON.stringify(a) === JSON.stringify(b);
}

async function runCategory(category) {
  const dir = path.join(__dirname, category.name);
  const expectedPath = path.join(dir, 'expected.json');
  const expectedAll = JSON.parse(readFileSync(expectedPath, 'utf-8'));

  const files = readdirSync(dir).filter(f => f.endsWith('.txt')).sort();

  console.log(`\n${'='.repeat(70)}`);
  console.log(`CATEGORY: ${category.name.toUpperCase()}  (${files.length} documents)`);
  console.log('='.repeat(70));

  for (const file of files) {
    const docSpec = expectedAll[file];
    if (!docSpec) {
      console.log(`\n⚠️  ${file}: no entry in expected.json, skipping`);
      continue;
    }

    const text = readFileSync(path.join(dir, file), 'utf-8');
    const result = await processDocument(text, null, category.userContext, RULES, false);

    totalDocs++;
    let docFailed = false;
    let docFieldsTotal = 0;
    let docFieldsPassed = 0;

    const idLabel = docSpec.id ? `${docSpec.id} (${file})` : file;
    const statusTag = docSpec.status === 'known_limitation' ? '  [KNOWN LIMITATION]' : '';
    console.log(`\n--- ${idLabel}${statusTag} ---`);
    console.log(`Purpose: ${docSpec.purpose}`);
    if (docSpec.status === 'known_limitation') knownLimitationDocs++;

    // Check document type classification
    totalFields++;
    docFieldsTotal++;
    if (deepEqual(result.docType, docSpec.docType)) {
      passedFields++;
      docFieldsPassed++;
      console.log(`  ✅ docType: ${result.docType}`);
    } else {
      docFailed = true;
      console.log(`  ❌ docType: expected "${docSpec.docType}", got "${result.docType}"`);
    }

    // Check requiresAIFallback if specified
    if ('requiresAIFallback' in docSpec.expected) {
      totalFields++;
      docFieldsTotal++;
      const actualFallback = !result.isFullyLocal;
      if (deepEqual(actualFallback, docSpec.expected.requiresAIFallback)) {
        passedFields++;
        docFieldsPassed++;
        console.log(`  ✅ requiresAIFallback: ${actualFallback}`);
      } else {
        docFailed = true;
        console.log(`  ❌ requiresAIFallback: expected ${docSpec.expected.requiresAIFallback}, got ${actualFallback}`);
      }
    }

    // Check each expected extracted field
    for (const [field, expectedValue] of Object.entries(docSpec.expected)) {
      if (field === 'requiresAIFallback') continue; // already checked above
      totalFields++;
      docFieldsTotal++;
      const actualValue = result.extractedData[field];
      if (deepEqual(actualValue, expectedValue)) {
        passedFields++;
        docFieldsPassed++;
        console.log(`  ✅ ${field}: ${JSON.stringify(actualValue)}`);
      } else {
        docFailed = true;
        console.log(`  ❌ ${field}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
      }
    }

    if (docFailed) docsWithFailures++;

    const origin = docSpec.origin || 'synthetic';
    bump(originStats, origin, docFieldsTotal, docFieldsPassed);
    bump(parserStats, category.name, docFieldsTotal, docFieldsPassed);
  }
}

function printBreakdown(title, stats, order) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(title);
  console.log('='.repeat(70));
  for (const { key, label } of order) {
    const s = stats[key];
    if (!s || s.docs === 0) {
      console.log(`${label.padEnd(18)} 0 docs   N/A`);
      continue;
    }
    const pct = ((s.passed / s.fields) * 100).toFixed(1);
    console.log(`${label.padEnd(18)} ${String(s.docs).padStart(2)} docs   ${s.passed}/${s.fields}   ${pct}%`);
  }
}

async function main() {
  for (const category of CATEGORIES) {
    await runCategory(category);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Documents tested:      ${totalDocs}`);
  console.log(`Documents w/ >=1 fail: ${docsWithFailures}`);
  console.log(`Known limitations:     ${knownLimitationDocs} (documented, not counted as regressions)`);
  console.log(`Field-level accuracy:  ${passedFields}/${totalFields} (${((passedFields / totalFields) * 100).toFixed(1)}%)`);

  printBreakdown('BY ORIGIN', originStats, ORIGIN_LABELS);

  const parserOrder = CATEGORIES.map(c => ({ key: c.name, label: c.name.toUpperCase() }));
  printBreakdown('BY PARSER', parserStats, parserOrder);

  console.log('='.repeat(70));
}

main();
