/**
 * @fileoverview IntentsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened intent object at a time rather than
 * the whole intents.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every intents.json in the repository: Notice/intents.json,
 * Definitions/intents.json, Confidentiality/intents.json,
 * Termination/intents.json. All four are an array of
 * {id, terms: string[]}, id always prefixed INTENT_. No reference fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: intents must be an array, or a single intent object`);
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
  name: 'intents',
  filenamePattern: 'intents.json',
  fallbackBaseName: null,
  priority: 200,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
