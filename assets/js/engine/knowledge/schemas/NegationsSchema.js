/**
 * @fileoverview NegationsSchema.js
 * Inspected every negations.json in the repository:
 * Confidentiality/negations.json, Termination/negations.json. Both are
 * an array of {id, terms: string[]}, id always prefixed NEG_. No
 * reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: negations must be an array`);
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
  name: 'negations',
  filenamePattern: 'negations.json',
  fallbackBaseName: null,
  priority: 230,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
