/**
 * @fileoverview ExceptionsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened exception object at a time rather than
 * the whole exceptions.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every exceptions.json in the repository before writing this:
 * Assignment/exceptions.json, Confidentiality/exceptions.json,
 * Termination/exceptions.json. All three are an array of
 * {id, terms: string[]}. No fixed id prefix (EXCEPTION_MERGER vs
 * EXC_CONSENT/EXC_LAW/EXC_FRAUD both occur) - id is not prefix-checked.
 * No reference fields in any of them.
 * Follows ActorsSchema.js's established minimal convention for this file
 * family (array-shape check only; id presence is not hard-enforced,
 * matching the existing vocabulary schemas' precedent).
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: exceptions must be an array, or a single exception object`);
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
  name: 'exceptions',
  filenamePattern: ['exceptions.json', 'legal_exceptions.json'],
  fallbackBaseName: null,
  priority: 190,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
