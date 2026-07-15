/**
 * @fileoverview NegationsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened negation object at a time rather than
 * the whole negations.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every negations.json in the repository:
 * Confidentiality/negations.json, Termination/negations.json. Both are
 * an array of {id, terms: string[]}, id always prefixed NEG_. No
 * reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: negations must be an array, or a single negation object`);
  }
  return errors;
}

function idExtractor(data) {
  const items = asItems(data);
  return items ? items.map(r => r.id).filter(Boolean) : [];
}

function getReferences() {
  return [];
}

export default {
  name: 'negations',
  filenamePattern: 'negations.json',
  fallbackBaseName: null,
  priority: 230,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
