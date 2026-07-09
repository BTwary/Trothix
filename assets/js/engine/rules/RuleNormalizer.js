/**
 * @fileoverview RuleNormalizer.js
 * Sprint 1 infrastructure.
 *
 * Implements: Raw Rule -> Rule Normalizer -> Canonical Rule -> RuleCompiler
 *
 * RuleCompiler.js is left untouched and continues to compile exactly one
 * schema (the existing {id, when, then, ...} shape). This module's job is
 * only to look at whatever shape a raw knowledge-domain entry is actually
 * in and produce a normalized wrapper that's honest about whether there's
 * anything executable to compile at all — it never invents a `when`
 * clause to force a rule through the compiler.
 *
 * Confirmed against the real repository (not assumed): every rules.json
 * entry across assets/js/engine/knowledge/v1/domains/ is one of two raw
 * shapes today:
 *
 *   Schema "executable-v1": has both `when` and `then`. This is already
 *   in RuleCompiler's canonical shape — e.g. Payment/rules.json's
 *   RULE_PAYMENT_DEADLINE_LONG, and (see caveat below) every
 *   Indemnification/Liability entry.
 *
 *   Schema "knowledge-concept-v1": has `concept`/`rationale`/
 *   `recommendation`/`legal_effect`/`targetPrecision`/`targetRecall`/
 *   `linkedTests` and NO `when`/`then` at all — e.g. every entry in
 *   Assignment, Confidentiality, Definitions, GoverningLaw,
 *   IntellectualProperty, Lifecycle, Notice. These are real, intentional
 *   knowledge-base entries (they document a legal concept and its
 *   recommendation), just not yet authored as executable conditions.
 *   Normalizing this into a fake `when` clause would be fabricating a
 *   capability that was never authored, so `evaluable` is set to false
 *   and `canonical` is left null — RuleDiagnostics reports these as
 *   inert with an honest reason, it does not send them to RuleCompiler.
 *
 * Traceability fields on every result, per the handbook's requirement:
 *   normalized, originalSchema, sourceRule, evaluable.
 */

/** @returns {'executable-v1'|'knowledge-concept-v1'} */
function detectSchema(rawRule) {
  return (rawRule && rawRule.when && rawRule.then) ? 'executable-v1' : 'knowledge-concept-v1';
}

/**
 * @param {object} rawRule - a single raw entry from a domain's rules.json
 * @returns {{
 *   normalized: true,
 *   originalSchema: string,
 *   sourceRule: object,
 *   evaluable: boolean,
 *   canonical: object|null,
 *   normalizationNote: string
 * }}
 */
export function normalizeRule(rawRule) {
  const originalSchema = detectSchema(rawRule);

  if (originalSchema === 'executable-v1') {
    return {
      normalized: true,
      originalSchema,
      sourceRule: rawRule,
      evaluable: true,
      canonical: {
        id: rawRule.id,
        when: rawRule.when,
        then: rawRule.then,
        category: rawRule.category ?? null,
        severity: rawRule.severity ?? rawRule.then?.severity ?? null,
      },
      normalizationNote: 'Already in canonical executable shape; passed through unchanged, wrapped with traceability metadata.',
    };
  }

  return {
    normalized: true,
    originalSchema,
    sourceRule: rawRule,
    evaluable: false,
    canonical: null,
    normalizationNote: `No "when"/"then" present in the source rule — this is a knowledge-concept entry (concept: "${rawRule.concept ?? 'unknown'}"), not an executable condition. Not sent to RuleCompiler: inventing a condition that was never authored would fabricate capability the rule doesn't have. Needs to be authored with real "when"/"then" logic before it can become compiled-active.`,
  };
}

/**
 * Normalizes every rule entry in a domain's raw rules.json content
 * (accepts either the bare-object or array envelope shape, matching what
 * KnowledgeProvider.js already does for loading).
 * @param {object|object[]} rawDomainRules
 * @returns {ReturnType<typeof normalizeRule>[]}
 */
export function normalizeDomainRules(rawDomainRules) {
  const items = Array.isArray(rawDomainRules) ? rawDomainRules : [rawDomainRules];
  return items.map(normalizeRule);
}
