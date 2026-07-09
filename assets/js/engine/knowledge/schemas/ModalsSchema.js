/**
 * @fileoverview ModalsSchema.js
 * Inspected every modals.json in the repository: Confidentiality/modals.json,
 * Termination/modals.json. Both are an array of {id, terms: string[]}.
 * id has no fixed prefix (OBLIGATION, PERMISSION - plain words, not
 * MODAL_-prefixed). No reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: modals must be an array`);
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
  name: 'modals',
  filenamePattern: 'modals.json',
  fallbackBaseName: null,
  priority: 210,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
