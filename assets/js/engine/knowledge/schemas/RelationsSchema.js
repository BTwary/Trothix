/**
 * @fileoverview RelationsSchema.js
 * Ported verbatim from KnowledgeLinter._validateRelations / _extractIds('relations')
 * / _getReferences('relations'). No behavior changes to the per-relation checks.
 *
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened relation object at a time rather than the
 * whole relations.json array; asItems() normalizes either shape so
 * validate/idExtractor/getReferences behave identically whether called by
 * KnowledgeLinter (whole-file) or the compiler (single entry).
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  const items = asItems(data);
  if (items === null) {
    errors.push(`[${Severity.ERROR}] ${file}: relations must be an array, or a single relation object`);
    return errors;
  }
  if (items.length === 0) {
    errors.push(`[${Severity.ERROR}] ${file}: relations array cannot be empty`);
    return errors;
  }
  items.forEach((rel, idx) => {
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
  const items = asItems(data);
  return items ? items.map(r => r.id).filter(Boolean) : [];
}

function getReferences(data) {
  const refs = [];
  const items = asItems(data);
  if (!items) return refs;
  for (const rel of items) {
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
  filenamePattern: ['relations.json', 'legal_relations.json'],
  fallbackBaseName: null,
  priority: 30,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
