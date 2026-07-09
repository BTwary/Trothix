/**
 * @fileoverview ConceptSchema.js
 * Ported verbatim from KnowledgeLinter._validateConcept / _extractIds('concept')
 * / _getReferences('concept'). No behavior changes.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  const required = ['id', 'name', 'description', 'category'];
  for (const field of required) {
    if (!(field in data)) {
      errors.push(`[${Severity.ERROR}] ${file}: missing required field "${field}"`);
    }
  }
  if (data.id !== undefined && typeof data.id !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "id" must be a string`);
  if (data.name !== undefined && typeof data.name !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "name" must be a string`);
  if (data.description !== undefined && typeof data.description !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "description" must be a string`);
  if (data.category !== undefined && typeof data.category !== 'string') errors.push(`[${Severity.ERROR}] ${file}: "category" must be a string`);

  const optionalFields = ['introduced', 'replacedBy', 'status', 'maturity'];
  for (const field of optionalFields) {
    if (field in data) {
      if (field === 'replacedBy') {
        if (data[field] !== null && typeof data[field] !== 'string') {
          errors.push(`[${Severity.ERROR}] ${file}: "${field}" must be a string or null (if present)`);
        }
      } else if (typeof data[field] !== 'string') {
        errors.push(`[${Severity.ERROR}] ${file}: "${field}" must be a string (if present)`);
      }
    }
  }
  if ('deprecated' in data && typeof data.deprecated !== 'boolean') {
    errors.push(`[${Severity.ERROR}] ${file}: "deprecated" must be a boolean (if present)`);
  }

  const arrayFields = ['actions', 'phrases', 'entities', 'documents', 'related', 'rules'];
  for (const field of arrayFields) {
    if (field in data) {
      if (!Array.isArray(data[field])) {
        errors.push(`[${Severity.ERROR}] ${file}: "${field}" must be an array (if present)`);
      } else {
        data[field].forEach((item, idx) => {
          if (typeof item !== 'string') {
            errors.push(`[${Severity.ERROR}] ${file}: "${field}" element at index ${idx} must be a string`);
          }
        });
      }
    }
  }
  return errors;
}

function idExtractor(data) {
  return data.id && typeof data.id === 'string' ? [data.id] : [];
}

function getReferences(data) {
  const refs = [];
  const fields = ['actions', 'phrases', 'entities', 'documents', 'related', 'rules'];
  for (const field of fields) {
    const arr = data[field];
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
  return refs;
}

export default {
  name: 'concept',
  filenamePattern: 'concept.json',
  fallbackBaseName: null,
  priority: 10,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
