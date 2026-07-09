/**
 * @fileoverview DecisionTablesSchema.js
 * Ported verbatim from KnowledgeLinter._validateDecisionTables / _extractIds('decision_tables').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: decision_tables must be an array`);
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
  name: 'decision_tables',
  filenamePattern: 'decision_tables.json',
  fallbackBaseName: null,
  priority: 130,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
