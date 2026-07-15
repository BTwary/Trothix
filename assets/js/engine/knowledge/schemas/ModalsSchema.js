/**
 * @fileoverview ModalsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened modal object at a time rather than
 * the whole modals.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every modals.json in the repository: Confidentiality/modals.json,
 * Termination/modals.json. Both are an array of {id, terms: string[]}.
 * id has no fixed prefix (OBLIGATION, PERMISSION - plain words, not
 * MODAL_-prefixed). No reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: modals must be an array, or a single modal object`);
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
  name: 'modals',
  filenamePattern: ['modals.json', 'legal_modals.json', 'legal_obligations.json'],
  fallbackBaseName: null,
  priority: 210,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
