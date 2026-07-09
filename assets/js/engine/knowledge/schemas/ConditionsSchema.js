/**
 * @fileoverview ConditionsSchema.js
 * Inspected every conditions.json in the repository: only one exists,
 * Termination/conditions.json - an array of {id, terms: string[]},
 * id prefixed COND_. No reference fields. Single occurrence, but shape
 * follows the same {id, terms[]} convention as the other vocabulary
 * files, so it's treated the same way rather than over-fit to one file.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: conditions must be an array`);
  }
  return errors;
}

function idExtractor(data) {
  return Array.isArray(data) ? data.map(r => r.id).filter(Boolean) : [];
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
