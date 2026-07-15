/**
 * @fileoverview EntitiesSchema.js
 * Ported verbatim from KnowledgeLinter._validateEntities / _extractIds('entities').
 * No reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  // Entities can be either an array (entities.json) or a single object (entity_*.json)
  if (Array.isArray(data)) {
    data.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors.push(`[${Severity.ERROR}] ${file}: entity at index ${idx} is not an object`);
      } else if (!('id' in item)) {
        errors.push(`[${Severity.ERROR}] ${file}: entity at index ${idx} missing "id"`);
      }
    });
  } else if (data && typeof data === 'object') {
    if (!('id' in data)) {
      errors.push(`[${Severity.ERROR}] ${file}: entity missing "id"`);
    }
  } else {
    errors.push(`[${Severity.ERROR}] ${file}: entities must be an array or an object`);
  }
  return errors;
}

function idExtractor(data) {
  if (Array.isArray(data)) {
    return data.map(e => e.id).filter(Boolean);
  } else if (data && typeof data === 'object' && data.id) {
    return [data.id];
  }
  return [];
}

function getReferences() {
  return [];
}

export default {
  name: 'entities',
  filenamePattern: ['entities.json', 'legal_entities.json'],
  fallbackBaseName: null,
  priority: 80,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
