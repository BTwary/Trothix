/**
 * @fileoverview StatesSchema.js
 * Ported verbatim from KnowledgeLinter._validateStates / _extractIds('states').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  // States can be either an array (list of state names/objects) or an object (state -> details)
  if (Array.isArray(data)) {
    data.forEach((item, idx) => {
      if (typeof item === 'string') {
        // Simple state name — valid
      } else if (item && typeof item === 'object') {
        if (!('id' in item) && !('name' in item)) {
          errors.push(`[${Severity.WARNING}] ${file}: state at index ${idx} should have "id" or "name"`);
        }
      } else {
        errors.push(`[${Severity.ERROR}] ${file}: state at index ${idx} must be a string or object`);
      }
    });
  } else if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (typeof data[key] !== 'object' || data[key] === null) {
        errors.push(`[${Severity.ERROR}] ${file}: state "${key}" must be an object (if present)`);
      }
    }
  } else {
    errors.push(`[${Severity.ERROR}] ${file}: states must be an array or an object`);
  }
  return errors;
}

function idExtractor(data) {
  if (Array.isArray(data)) {
    const ids = [];
    for (const item of data) {
      if (typeof item === 'string') {
        ids.push(item);
      } else if (item && typeof item === 'object' && item.id) {
        ids.push(item.id);
      }
    }
    return ids;
  } else if (data && typeof data === 'object') {
    return Object.keys(data);
  }
  return [];
}

function getReferences() {
  return [];
}

export default {
  name: 'states',
  filenamePattern: 'states.json',
  fallbackBaseName: null,
  priority: 150,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
