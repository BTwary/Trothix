/**
 * @fileoverview ConstraintsSchema.js
 * Fix: same repository-wide convention as ActionsSchema/RulesSchema — the
 * compiler feeds one flattened constraint object at a time rather than
 * the whole constraints.json array; asItems() normalizes either shape so
 * validate/idExtractor behave identically whether called by KnowledgeLinter
 * (whole-file) or the compiler (single entry).
 * Inspected every constraints.json in the repository: only one exists,
 * Termination/constraints.json - an array of {id, terms: string[]}
 * (id values are generic labels TIME/MONEY, not prefixed). No reference
 * fields.
 * Follows ActorsSchema.js's established minimal convention.
 */
const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : null);
}

function validate(data, file) {
  const errors = [];
  if (asItems(data) === null) {
    errors.push(`[${Severity.ERROR}] ${file}: constraints must be an array, or a single constraint object`);
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
  name: 'constraints',
  filenamePattern: ['constraints.json', 'legal_constraints.json'],
  fallbackBaseName: null,
  priority: 170,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
