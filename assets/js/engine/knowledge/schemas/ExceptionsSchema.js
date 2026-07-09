/**
 * @fileoverview ExceptionsSchema.js
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

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: exceptions must be an array`);
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
  name: 'exceptions',
  filenamePattern: 'exceptions.json',
  fallbackBaseName: null,
  priority: 190,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
