/**
 * @fileoverview ModifiersSchema.js
 * Inspected every modifiers.json in the repository: only one exists,
 * Termination/modifiers.json - an array of {id, terms: string[]},
 * id prefixed MOD_. No reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: modifiers must be an array`);
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
  name: 'modifiers',
  filenamePattern: 'modifiers.json',
  fallbackBaseName: null,
  priority: 220,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
