/**
 * @fileoverview RelationsSchema.js
 * Ported verbatim from KnowledgeLinter._validateRelations / _extractIds('relations')
 * / _getReferences('relations'). No behavior changes.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: relations must be an array`);
    return errors;
  }
  if (data.length === 0) {
    errors.push(`[${Severity.ERROR}] ${file}: relations array cannot be empty`);
    return errors;
  }
  data.forEach((rel, idx) => {
    if (!rel || typeof rel !== 'object') {
      errors.push(`[${Severity.ERROR}] ${file}: relation at index ${idx} is not an object`);
      return;
    }
    const required = ['id', 'source', 'target', 'relation'];
    for (const field of required) {
      if (!(field in rel)) {
        errors.push(`[${Severity.ERROR}] ${file}: relation at index ${idx} missing "${field}"`);
      } else if (typeof rel[field] !== 'string') {
        errors.push(`[${Severity.ERROR}] ${file}: relation at index ${idx} "${field}" must be a string`);
      }
    }
    if (rel.strength !== undefined && typeof rel.strength !== 'string') {
      errors.push(`[${Severity.ERROR}] ${file}: relation at index ${idx} "strength" must be a string`);
    }
  });
  return errors;
}

function idExtractor(data) {
  return Array.isArray(data) ? data.map(r => r.id).filter(Boolean) : [];
}

function getReferences(data) {
  const refs = [];
  if (!Array.isArray(data)) return refs;
  for (const rel of data) {
    if (rel.source && typeof rel.source === 'string') {
      refs.push({ id: rel.source, path: 'relations[*].source', targetType: 'any' });
    }
    if (rel.target && typeof rel.target === 'string') {
      refs.push({ id: rel.target, path: 'relations[*].target', targetType: 'any' });
    }
  }
  return refs;
}

export default {
  name: 'relations',
  filenamePattern: 'relations.json',
  fallbackBaseName: null,
  priority: 30,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
