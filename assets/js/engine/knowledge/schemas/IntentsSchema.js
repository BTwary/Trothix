/**
 * @fileoverview IntentsSchema.js
 * Inspected every intents.json in the repository: Notice/intents.json,
 * Definitions/intents.json, Confidentiality/intents.json,
 * Termination/intents.json. All four are an array of
 * {id, terms: string[]}, id always prefixed INTENT_. No reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: intents must be an array`);
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
  name: 'intents',
  filenamePattern: 'intents.json',
  fallbackBaseName: null,
  priority: 200,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
