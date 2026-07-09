/**
 * @fileoverview EventsSchema.js
 * Inspected every events.json in the repository: Lifecycle/events.json
 * and Termination/events.json. These are NOT the same shape:
 *   - Lifecycle/events.json:   ["EVENT_SIGNED", "EVENT_NOTICE_SENT", ...]
 *                              (bare array of id strings)
 *   - Termination/events.json: [{"id": "EVENT_NOTICE", "trigger": "..."},
 *                                ...] (array of {id, trigger} objects)
 * This is the same duality StatesSchema.js already handles for
 * states.json (Lifecycle/states.json is also bare strings while
 * Termination/states.json is {id, name} objects) - same repository,
 * same pattern, so this mirrors StatesSchema.js's array branch exactly
 * rather than inventing a new approach for what is evidently an
 * established convention in this knowledge base (Lifecycle domain uses
 * flat id lists; Termination domain uses richer per-entry objects for
 * the same conceptual vocabulary type). No reference fields in either
 * shape.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: events must be an array`);
    return errors;
  }
  data.forEach((item, idx) => {
    if (typeof item === 'string') {
      // Bare event id string (Lifecycle/events.json shape) — valid.
    } else if (item && typeof item === 'object') {
      if (!('id' in item)) {
        errors.push(`[${Severity.WARNING}] ${file}: event at index ${idx} should have "id"`);
      }
    } else {
      errors.push(`[${Severity.ERROR}] ${file}: event at index ${idx} must be a string or object`);
    }
  });
  return errors;
}

function idExtractor(data) {
  if (!Array.isArray(data)) return [];
  const ids = [];
  for (const item of data) {
    if (typeof item === 'string') {
      ids.push(item);
    } else if (item && typeof item === 'object' && item.id) {
      ids.push(item.id);
    }
  }
  return ids;
}

function getReferences() {
  return [];
}

export default {
  name: 'events',
  filenamePattern: 'events.json',
  fallbackBaseName: null,
  priority: 180,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
