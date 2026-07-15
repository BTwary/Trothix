/**
 * @fileoverview PhrasesSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened phrase object at a time rather than
 * the whole phrases.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Ported verbatim from KnowledgeLinter._validatePhrases / _extractIds('phrases').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: phrases must be an array, or a single phrase object`);
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
  name: 'phrases',
  filenamePattern: 'phrases.json',
  fallbackBaseName: null,
  priority: 90,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
