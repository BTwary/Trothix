/**
 * @fileoverview TemplatesSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened template object at a time rather than
 * the whole templates.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Ported verbatim from KnowledgeLinter._validateTemplates / _extractIds('templates').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: templates must be an array, or a single template object`);
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
  name: 'templates',
  filenamePattern: 'templates.json',
  fallbackBaseName: null,
  priority: 120,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
