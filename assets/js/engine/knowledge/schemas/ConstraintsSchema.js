/**
 * @fileoverview ConstraintsSchema.js
 * Inspected every constraints.json in the repository: only one exists,
 * Termination/constraints.json - an array of {id, terms: string[]}
 * (id values are generic labels TIME/MONEY, not prefixed). No reference
 * fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: constraints must be an array`);
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
  name: 'constraints',
  filenamePattern: 'constraints.json',
  fallbackBaseName: null,
  priority: 170,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
