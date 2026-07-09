/**
 * @fileoverview PhrasesSchema.js
 * Ported verbatim from KnowledgeLinter._validatePhrases / _extractIds('phrases').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: phrases must be an array`);
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
  name: 'phrases',
  filenamePattern: 'phrases.json',
  fallbackBaseName: null,
  priority: 90,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
