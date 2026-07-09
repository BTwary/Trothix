/**
 * @fileoverview ActorsSchema.js
 * Ported verbatim from KnowledgeLinter._validateActors / _extractIds('actors').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: actors must be an array`);
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
  name: 'actors',
  filenamePattern: 'actors.json',
  fallbackBaseName: null,
  priority: 100,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
