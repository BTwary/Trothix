/**
 * @fileoverview RulesSchema.js
 * Ported verbatim from KnowledgeLinter._validateRules / _extractIds('rules')
 * / _getReferences('rules'). No behavior changes to the per-rule checks.
 *
 * Fix: same repository-wide convention as ActionsSchema — a rules.json
 * file may be a single bare rule object instead of an array (e.g.
 * Payment/rules.json, which holds exactly one rule,
 * RULE_PAYMENT_DEADLINE_LONG — confirmed compiling and firing correctly
 * in production). The old `if (!Array.isArray(data))` rejected that
 * already-valid, already-loaded shape before any of the real per-rule
 * checks below ever ran. Normalizing to an array up front means every
 * existing check (when/then vs concept-style, required fields, status
 * enum) still applies unchanged to a single-object rule; idExtractor and
 * getReferences updated the same way so a single-object rule's id and
 * concept references are still tracked instead of silently vanishing.
 */

import { RuleSchemaValidator } from '../../rules/RuleSchemaValidator.js';

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  const items = asItems(data);
  if (items === null) {
    errors.push(`[${Severity.ERROR}] ${file}: rules must be an array, or a single rule object`);
    return errors;
  }
  if (items.length === 0) {
    errors.push(`[${Severity.ERROR}] ${file}: rules array cannot be empty`);
    return errors;
  }
  const allowedStatuses = ['production', 'validated', 'draft', 'deprecated', 'verified', 'experimental'];
  items.forEach((rule, idx) => {
    if (!rule || typeof rule !== 'object') {
      errors.push(`[${Severity.ERROR}] ${file}: rule at index ${idx} is not an object`);
      return;
    }
    const id = rule.id || `index ${idx}`;
    
    // Call RuleSchemaValidator
    const validatorResult = RuleSchemaValidator.validateRule(rule);
    validatorResult.errors.forEach(err => errors.push(`[${Severity.ERROR}] ${file}: ${err}`));
    validatorResult.warnings.forEach(warn => errors.push(`[${Severity.WARNING}] ${file}: ${warn}`));
    if (!rule.id) {
      errors.push(`[${Severity.ERROR}] ${file}: rule at index ${idx} missing "id"`);
    } else if (typeof rule.id !== 'string') {
      errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" "id" must be a string`);
    }
    const hasWhenThen = 'when' in rule && 'then' in rule;
    const hasConcept = 'concept' in rule;
    const hasLegalEffect = 'legal_effect' in rule;
    if (hasWhenThen) {
      // "name" and "description" were previously required here, but a
      // repository-wide survey (every when/then-style rule, all 11
      // domains) found: name absent in 1/17 (RULE_PAYMENT_DEADLINE_LONG -
      // the one rule confirmed compiling and firing in production) and
      // description absent in 7/17 (41%, spanning Payment and all six
      // Indemnification when/then rules). Neither field has any bearing
      // on whether a rule compiles or executes - RuleCompiler.js never
      // reads either one. Enforcing them as mandatory here was flagging
      // the repository's one proven-functional rule as invalid, which is
      // exactly the "unnecessary metadata" failure mode this schema
      // should not reproduce. category/severity, by contrast, are
      // present on all 17/17 when/then rules and are consumed by
      // downstream severity/category validation elsewhere - kept
      // required. Missing name/description are still surfaced, just as
      // WARNING rather than ERROR, so authoring gaps remain visible
      // without blocking a rule that is otherwise valid and executable.
      const required = ['category', 'severity'];
      for (const field of required) {
        if (!(field in rule)) {
          errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" missing "${field}" (when/then style)`);
        }
      }
      for (const field of ['name', 'description']) {
        if (!(field in rule)) {
          errors.push(`[${Severity.WARNING}] ${file}: rule "${id}" missing "${field}" (when/then style) - not required for execution, but recommended for documentation`);
        }
      }
      if (rule.when && typeof rule.when !== 'object') errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" "when" must be an object`);
      if (rule.then && typeof rule.then !== 'object') errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" "then" must be an object`);
      if ('status' in rule) {
        if (typeof rule.status !== 'string') {
          errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" "status" must be a string (if present)`);
        } else {
          const statusLower = rule.status.toLowerCase();
          if (!allowedStatuses.includes(statusLower)) {
            errors.push(`[${Severity.WARNING}] ${file}: rule "${id}" has unusual lifecycle status: ${rule.status}`);
          }
        }
      }
    } else if (hasConcept && hasLegalEffect) {
      const required = ['concept', 'category', 'severity', 'jurisdiction', 'rationale', 'recommendation', 'legal_effect'];
      for (const field of required) {
        if (!(field in rule)) {
          errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" missing "${field}" (concept style)`);
        }
      }
      if ('status' in rule) {
        if (typeof rule.status !== 'string') {
          errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" "status" must be a string (if present)`);
        } else {
          const statusLower = rule.status.toLowerCase();
          if (!allowedStatuses.includes(statusLower)) {
            errors.push(`[${Severity.WARNING}] ${file}: rule "${id}" has unusual lifecycle status: ${rule.status}`);
          }
        }
      }
    } else {
      errors.push(`[${Severity.ERROR}] ${file}: rule "${id}" does not match known rule format`);
    }
  });
  return errors;
}

function idExtractor(data) {
  const items = asItems(data);
  return items ? items.map(r => r.id).filter(Boolean) : [];
}

function getReferences(data) {
  const refs = [];
  const items = asItems(data);
  if (!items) return refs;
  for (const rule of items) {
    if (rule.concept && typeof rule.concept === 'string') {
      refs.push({ id: rule.concept, path: 'rules[*].concept', targetType: 'concept' });
    }
  }
  return refs;
}

export default {
  name: 'rules',
  filenamePattern: 'rules.json',
  fallbackBaseName: null,
  priority: 20,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
