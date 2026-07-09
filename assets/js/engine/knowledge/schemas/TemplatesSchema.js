/**
 * @fileoverview TemplatesSchema.js
 * Ported verbatim from KnowledgeLinter._validateTemplates / _extractIds('templates').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: templates must be an array`);
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
  name: 'templates',
  filenamePattern: 'templates.json',
  fallbackBaseName: null,
  priority: 120,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
