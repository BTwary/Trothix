/**
 * @fileoverview StatesSchema.js
 * Ported verbatim from KnowledgeLinter._validateStates / _extractIds('states').
 * No reference logic existed for this type.
 *
 * Fix: this schema has two legitimate whole-file shapes (array of
 * string/object state items, per real data — Lifecycle/states.json is
 * bare strings, Termination/states.json is {id, name} objects; and,
 * potentially, a dictionary-of-states object keyed by state id, which
 * no current file uses but which KnowledgeLinter's whole-file calling
 * convention must still support). The compiler instead feeds one
 * flattened state item at a time — a bare string, or a single {id, name}
 * object. Feeding a single {id, name} object into the old "is this a
 * dictionary?" branch produced Object.keys(data) = ["id", "name"],
 * fabricating fake IDs; feeding a bare string matched neither branch and
 * was falsely rejected as invalid.
 *
 * asItems() disambiguates using the same rule EntitiesSchema already
 * established for its own array/single-object duality: an object with
 * an "id" key is one item, not a dictionary. A dictionary-of-states
 * object (no top-level "id" key) still falls through to the preserved
 * dictionary-handling code below, so KnowledgeLinter's whole-file
 * behavior for that shape is unchanged.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') return [data];
  if (data && typeof data === 'object' && 'id' in data) return [data];
  return null;
}

function isDictionaryShape(data) {
  return !!data && typeof data === 'object' && !Array.isArray(data) && !('id' in data);
}

function validate(data, file) {
  const errors = [];
  const items = asItems(data);
  if (items) {
    items.forEach((item, idx) => {
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
    return errors;
  }
  if (isDictionaryShape(data)) {
    for (const key of Object.keys(data)) {
      if (typeof data[key] !== 'object' || data[key] === null) {
        errors.push(`[${Severity.ERROR}] ${file}: state "${key}" must be an object (if present)`);
      }
    }
    return errors;
  }
  errors.push(`[${Severity.ERROR}] ${file}: states must be an array, a single state (string or object), or a dictionary of states`);
  return errors;
}

function idExtractor(data) {
  const items = asItems(data);
  if (items) {
    const ids = [];
    for (const item of items) {
      if (typeof item === 'string') {
        ids.push(item);
      } else if (item && typeof item === 'object' && item.id) {
        ids.push(item.id);
      }
    }
    return ids;
  }
  if (isDictionaryShape(data)) {
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
