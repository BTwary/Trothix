/**
 * @fileoverview RuleDiagnostics.js
 * Audits rules by loading them via KnowledgeProvider and checking field/shape constraints.
 */

import { RuleCompiler } from './RuleCompiler.js';
import { normalizeRule } from './RuleNormalizer.js';
import { extractFieldPaths, lookupField } from './RuleFieldRegistry.js';
import { isExecutableRule, analyzeConditionShape } from './RuleCapability.js';
import { KnowledgeProvider } from '../knowledge/KnowledgeProvider.js';

/**
 * Runs rule diagnostics on the knowledge base at the specified path.
 * Reuses the production KnowledgeProvider loader to avoid duplicated file scanning/routing logic.
 * @param {string} basePath
 */
export function runRuleDiagnostics(basePath) {
  const provider = new KnowledgeProvider(basePath);
  
  // Execute loading and graph validation using production methods
  provider._loadDomains();
  provider._validateAndResolveGraph();

  const compiler = new RuleCompiler();
  const rules = [];

  for (const { entry, domain } of provider.getRawEntries()) {
    const executable = isExecutableRule(entry);
    const inScope = executable || entry.id.startsWith('RULE_');

    if (!inScope) {
      continue;
    }

    const normalization = normalizeRule(entry);

    if (!normalization.evaluable) {
      rules.push({
        id: entry.id,
        domain,
        status: 'failed',
        reason: `Compilation would throw: RuleCompiler.compileRule() requires "when" and "then"; this entry has neither (it's a knowledge-concept entry describing "${entry.concept ?? 'an unspecified concept'}", not an executable rule). ${normalization.normalizationNote}`,
        normalization,
        provenanceWarnings: [],
      });
      continue;
    }

    let compiled;
    try {
      compiled = compiler.compileRule(normalization.canonical);
    } catch (e) {
      rules.push({
        id: entry.id,
        domain,
        status: 'failed',
        reason: `RuleCompiler threw during compilation: ${e.message}`,
        normalization,
        provenanceWarnings: [],
      });
      continue;
    }

    // Detect unrecognized condition shape (silently ignored by compiler)
    const shapeAnalysis = analyzeConditionShape(normalization.canonical.when);
    if (!shapeAnalysis.recognized) {
      rules.push({
        id: entry.id,
        domain,
        status: 'compiled-inert',
        reason: `Compiles successfully but can never produce a finding: its condition tree contains ${shapeAnalysis.unrecognizedLeaves.length} unrecognized leaf node(s) that RuleCompiler._compileCondition() doesn't understand (e.g. ${JSON.stringify(shapeAnalysis.unrecognizedLeaves[0])}) — no "field" key and no logical combinator, so RuleCompiler's default fallback silently compiles it to "() => false".`,
        normalization,
        provenanceWarnings: [],
      });
      continue;
    }

    // Verify dependencies against the populated field registry
    const fieldPaths = extractFieldPaths(normalization.canonical.when);
    const fieldLookups = fieldPaths.map(lookupField);
    const inertFields = fieldLookups.filter(f => f.status !== 'active');
    const provenanceWarnings = fieldLookups
      .filter(f => f.provenanceWarning)
      .map(f => `${f.pattern}: ${f.provenanceWarning}`);

    if (inertFields.length > 0) {
      rules.push({
        id: entry.id,
        domain,
        status: 'compiled-inert',
        reason: inertFields
          .map(f => `"${f.pattern}" ${f.status === 'unverified' ? 'is unverified' : 'is inert'}: ${f.reason || 'unverified status'}`)
          .join(' | '),
        normalization,
        provenanceWarnings,
      });
      continue;
    }

    rules.push({
      id: entry.id,
      domain,
      status: 'compiled-active',
      reason: 'All referenced fields are populated by the current pipeline.',
      normalization,
      provenanceWarnings,
    });
  }

  const byDomain = {};
  for (const r of rules) {
    byDomain[r.domain] ??= { compiledActive: 0, compiledInert: 0, failed: 0 };
    if (r.status === 'compiled-active') byDomain[r.domain].compiledActive++;
    else if (r.status === 'compiled-inert') byDomain[r.domain].compiledInert++;
    else byDomain[r.domain].failed++;
  }

  const summary = {
    total: rules.length,
    compiledActive: rules.filter(r => r.status === 'compiled-active').length,
    compiledInert: rules.filter(r => r.status === 'compiled-inert').length,
    failed: rules.filter(r => r.status === 'failed').length,
  };

  return { summary, byDomain, rules };
}

/** Pretty-prints report summary and findings. */
export function printDiagnosticsReport(report) {
  const { summary, byDomain, rules } = report;
  console.log('='.repeat(70));
  console.log('RULE DIAGNOSTICS');
  console.log('='.repeat(70));
  console.log(`Total rules considered: ${summary.total}`);
  console.log(`  compiled-active: ${summary.compiledActive}`);
  console.log(`  compiled-inert:  ${summary.compiledInert}`);
  console.log(`  failed:          ${summary.failed}`);
  console.log('');
  console.log('By domain:');
  for (const [domain, counts] of Object.entries(byDomain).sort()) {
    console.log(`  ${domain}: active=${counts.compiledActive} inert=${counts.compiledInert} failed=${counts.failed}`);
  }
  console.log('');
  const failedRules = rules.filter(r => r.status === 'failed');
  if (failedRules.length) {
    console.log('Failed rules:');
    failedRules.forEach(r => console.log(`  [${r.domain}] ${r.id}\n    -> ${r.reason}\n`));
  }
  const inertRules = rules.filter(r => r.status === 'compiled-inert');
  if (inertRules.length) {
    console.log('Inert rules:');
    inertRules.forEach(r => console.log(`  [${r.domain}] ${r.id}\n    -> ${r.reason}\n`));
  }
  const withProvenance = rules.filter(r => r.provenanceWarnings.length);
  if (withProvenance.length) {
    console.log('Active rules with provenance warnings:');
    withProvenance.forEach(r => r.provenanceWarnings.forEach(w => console.log(`  [${r.domain}] ${r.id}: ${w}`)));
  }
}
