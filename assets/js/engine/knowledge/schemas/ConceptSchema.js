/**
 * @fileoverview ConceptSchema.js
 * Ported verbatim from KnowledgeLinter._validateConcept / _extractIds('concept')
 * / _getReferences('concept'). No behavior changes.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  const items = asItems(data);
  if (items === null) {
    errors.push(`[${Severity.ERROR}] ${file}: concepts must be an array, or a single concept object`);
    return errors;
  }
  for (const concept of items) {
    const required = ['id', 'name', 'description', 'category'];
    for (const field of required) {
      if (!(field in concept)) {
        errors.push(`[${Severity.ERROR}] ${file}: missing required field "${field}"`);
      }
    }
    if (concept.id !== undefined && typeof concept.id !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "id" must be a string`);
    if (concept.name !== undefined && typeof concept.name !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "name" must be a string`);
    if (concept.description !== undefined && typeof concept.description !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "description" must be a string`);
    if (concept.category !== undefined && typeof concept.category !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "category" must be a string`);

    const optionalFields = ['introduced', 'replacedBy', 'status', 'maturity'];
    for (const field of optionalFields) {
      if (field in concept) {
        if (field === 'replacedBy') {
          if (concept[field] !== null && typeof concept[field] !== 'string') {
            errors.push(`[${Severity.ERROR}] ${file}: "${field}" must be a string or null (if present)`);
          }
        } else if (typeof concept[field] !== 'string') {
          errors.push(`[${Severity.ERROR}] ${file}: "${field}" must be a string (if present)`);
        }
      }
    }
    if ('deprecated' in concept && typeof concept.deprecated !== 'boolean') {
      errors.push(`[${Severity.ERROR}] ${file}: "deprecated" must be a boolean (if present)`);
    }

    const arrayFields = ['actions', 'phrases', 'entities', 'documents', 'related', 'rules'];
    for (const field of arrayFields) {
      if (field in concept) {
        if (!Array.isArray(concept[field])) {
          errors.push(`[${Severity.ERROR}] ${file}: "${field}" must be an array (if present)`);
        } else {
          concept[field].forEach((item, idx) => {
            if (typeof item !== 'string') {
              errors.push(`[${Severity.ERROR}] ${file}: "${field}" element at index ${idx} must be a string`);
            }
          });
        }
      }
    }
  }
  return errors;
}

function idExtractor(data) {
  const items = asItems(data);
  if (!items) return [];
  return items.map(c => c.id).filter(id => typeof id === 'string');
}

function getReferences(data) {
  const refs = [];
  const items = asItems(data);
  if (!items) return [];
  for (const concept of items) {
    const fields = ['actions', 'phrases', 'entities', 'documents', 'related', 'rules'];
    for (const field of fields) {
      const arr = concept[field];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (typeof item === 'string') {
            let targetType = 'any';
            if (field === 'related') targetType = 'concept';
            else if (field === 'rules') targetType = 'rules';
            else if (field === 'actions') targetType = 'actions';
            else if (field === 'phrases') targetType = 'phrases';
            else if (field === 'entities') targetType = 'entities';
            refs.push({ id: item, path: `concept.${field}`, targetType });
          }
        }
      }
    }
  }
  return refs;
}

export default {
  name: 'concept',
  filenamePattern: ['concept.json', 'legal_concepts.json'],
  fallbackBaseName: null,
  priority: 10,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
