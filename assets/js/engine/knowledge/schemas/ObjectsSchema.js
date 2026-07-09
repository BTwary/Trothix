/**
 * @fileoverview ObjectsSchema.js
 * Ported verbatim from KnowledgeLinter._validateObjects / _extractIds('objects').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: objects must be an array`);
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
  name: 'objects',
  filenamePattern: 'objects.json',
  fallbackBaseName: null,
  priority: 110,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
