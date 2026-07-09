/**
 * @fileoverview EnumsSchema.js
 * Ported verbatim from KnowledgeLinter._validateEnums / _extractIds('enums').
 * No reference logic existed for this type.
 *
 * Fix: idExtractor() already recognized a second, real repository
 * convention for enums.json — a grouped object like
 * `{ deliveryMethods: [{id,...}], temporalExpressions: [{id,...}] }`
 * (this is exactly Notice/enums.json's real, intentional shape) — but
 * validate() only ever accepted a flat array, so it flagged this
 * already-supported shape as an error. Fixed validate() to accept both
 * shapes, matching idExtractor's existing (and correct) assumption
 * instead of the other way around.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (Array.isArray(data)) {
    return errors; // flat array of {id,...} entries - always valid
  }
  if (data && typeof data === 'object') {
    // Grouped-object shape: every top-level value should be an array of
    // enum entries. This mirrors idExtractor's own tolerance below rather
    // than inventing a new rule — if idExtractor can already pull ids out
    // of this shape, validate() rejecting the same shape was the bug.
    for (const key of Object.keys(data)) {
      if (!Array.isArray(data[key])) {
        errors.push(`[${Severity.ERROR}] ${file}: enum group "${key}" must be an array`);
      }
    }
    return errors;
  }
  errors.push(`[${Severity.ERROR}] ${file}: enums must be an array, or an object of named enum groups`);
  return errors;
}

function idExtractor(data) {
  // Enums can be array of objects OR an object with enum groups
  if (Array.isArray(data)) {
    return data.map(r => r.id).filter(Boolean);
  } else if (data && typeof data === 'object') {
    const ids = [];
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && item.id) {
            ids.push(item.id);
          }
        }
      }
    }
    return ids;
  }
  return [];
}

function getReferences() {
  return [];
}

export default {
  name: 'enums',
  filenamePattern: 'enums.json',
  fallbackBaseName: null,
  priority: 140,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
