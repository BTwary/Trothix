/**
 * @fileoverview ModifiersSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened modifier object at a time rather than
 * the whole modifiers.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every modifiers.json in the repository: only one exists,
 * Termination/modifiers.json - an array of {id, terms: string[]},
 * id prefixed MOD_. No reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: modifiers must be an array, or a single modifier object`);
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
  name: 'modifiers',
  filenamePattern: 'modifiers.json',
  fallbackBaseName: null,
  priority: 220,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
