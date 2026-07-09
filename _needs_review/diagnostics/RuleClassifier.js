/**
 * @fileoverview RuleClassifier.js
 *
 * Read-only diagnostic classifier. For each raw rule entry found on disk,
 * determines whether it is compiled-active, compiled-inert, or failed --
 * based strictly on what the CURRENT repository code does, not on what the
 * architecture assumes it does.
 *
 * This module does not modify RuleCompiler, RuleEvaluator, RuleContext, the
 * Legal IR, the parser, the ontology, or finding generation. It imports the
 * real RuleCompiler read-only so "does this compile" is answered by
 * production code, not a re-implementation of it.
 *
 * Definitions (temporary migration states -- see RuleNormalizer.js header):
 *   compiled-active: normalized, compiled, AND every referenced field is
 *     populated by a confirmed engine and reachable by RuleContext.
 *   compiled-inert: normalized, compiled, syntactically valid, but at least
 *     one referenced field has no working deterministic IR hook today.
 *   failed: cannot be normalized, cannot be compiled, or never reaches the
 *     compiler at all under the current routing rules.
 */

import { RuleCompiler } from '../rules/RuleCompiler.js';
import { RuleNormalizer } from '../rules/RuleNormalizer.js';

const compiler = new RuleCompiler();
const normalizer = new RuleNormalizer();

export const STATE = {
  ACTIVE: 'compiled-active',
  INERT: 'compiled-inert',
  FAILED: 'failed'
};

/**
 * Mirrors KnowledgeProvider._loadDomains()'s ACTUAL routing rule exactly:
 *
 *   if (entry.id.startsWith('RULE_')) this.ruleRegistry.compileRule(entry);
 *   else if (entry.id.startsWith('REL_')) this.graph.edges.push(entry);
 *   else this.graph.nodes.set(entry.id, entry);
 *
 * Only 'RULE_'-prefixed ids are ever forwarded to RuleRegistry.compileRule().
 * An entry with a valid when/then block but a different id prefix (e.g. the
 * 'CONCEPT_*' entries found in Liability/rules.json and
 * Indemnification/rules.json) is stored as an ontology graph node instead
 * and NEVER reaches the compiler in the current pipeline -- regardless of
 * whether its content would compile fine in isolation.
 */
function isRoutedToCompiler(rawRule) {
  return typeof rawRule.id === 'string' && rawRule.id.startsWith('RULE_');
}

/**
 * @param {Object} rawRule
 * @param {string} domain
 */
export function classifyRule(rawRule, domain) {
  const base = { id: rawRule.id, domain };

  if (!isRoutedToCompiler(rawRule)) {
    const wouldOtherwiseNormalize = !!(rawRule.when && rawRule.then);
    return {
      ...base,
      state: STATE.FAILED,
      reason:
        `Not routed to RuleCompiler: KnowledgeProvider._loadDomains() only forwards entries whose id starts with 'RULE_' to RuleRegistry.compileRule(); this entry's id ('${rawRule.id}') is routed to the ontology graph instead and never reaches the compiler in the current pipeline` +
        (wouldOtherwiseNormalize
          ? ' (it has a syntactically valid when/then block -- it is excluded purely by id-prefix naming convention, not by its content).'
          : '.'),
      unknownPredicate: null,
      unsupportedCondition: null
    };
  }

  const normalization = normalizer.normalize(rawRule);

  if (!normalization.normalized) {
    return {
      ...base,
      state: STATE.FAILED,
      reason: normalization.reason,
      unknownPredicate: null,
      unsupportedCondition: null
    };
  }

  let compiledOk = true;
  let compileError = null;
  try {
    compiler.compileRule(normalization.canonicalRule);
  } catch (err) {
    compiledOk = false;
    compileError = err.message;
  }

  if (!compiledOk) {
    return {
      ...base,
      state: STATE.FAILED,
      reason: `RuleCompiler.compileRule() threw: ${compileError}`,
      unknownPredicate: null,
      unsupportedCondition: null
    };
  }

  if (normalization.evaluable) {
    return {
      ...base,
      state: STATE.ACTIVE,
      reason:
        'Compiled successfully; every field referenced in `when` is populated by a confirmed engine in the current pipeline and reachable by RuleContext.resolveField().',
      referencedFields: normalization.referencedFields
    };
  }

  return {
    ...base,
    state: STATE.INERT,
    reason: `Compiled successfully, but ${normalization.unresolvedFields.length} of ${normalization.referencedFields.length} referenced field(s) have no working deterministic IR hook today: ${normalization.unresolvedFields.join(', ')}`,
    referencedFields: normalization.referencedFields,
    unresolvedFields: normalization.unresolvedFields
  };
}
