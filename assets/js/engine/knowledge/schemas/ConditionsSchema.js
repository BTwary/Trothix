/**
 * @fileoverview ConditionsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened condition object at a time rather than
 * the whole conditions.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every conditions.json in the repository: only one exists,
 * Termination/conditions.json - an array of {id, terms: string[]},
 * id prefixed COND_. No reference fields. Single occurrence, but shape
 * follows the same {id, terms[]} convention as the other vocabulary
 * files, so it's treated the same way rather than over-fit to one file.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: conditions must be an array, or a single condition object`);
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
  name: 'conditions',
  filenamePattern: 'conditions.json',
  fallbackBaseName: null,
  priority: 160,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
