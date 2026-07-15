/**
 * @fileoverview ActorsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened actor object at a time rather than
 * the whole actors.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Ported verbatim from KnowledgeLinter._validateActors / _extractIds('actors').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: actors must be an array, or a single actor object`);
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
  name: 'actors',
  filenamePattern: 'actors.json',
  fallbackBaseName: null,
  priority: 100,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
