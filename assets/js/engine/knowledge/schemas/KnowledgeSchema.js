/**
 * @fileoverview KnowledgeSchema.js
 * Ported verbatim from KnowledgeLinter._validateKnowledge. No id extraction
 * or reference logic existed for this type (falls to `default: return []`
 * in the legacy switches), so idExtractor/getReferences are no-ops here too.
 *
 * fallbackBaseName: 'knowledge' preserves the legacy _detectType() special
 * case that matched filenames like "knowledge (2).json" via basename
 * normalization.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: knowledge must be an object`);
    return errors;
  }
  if (!('version' in data)) {
    errors.push(`[${Severity.ERROR}] ${file}: knowledge missing "version"`);
  }
  const keys = Object.keys(data);
  if (keys.length === 0) {
    errors.push(`[${Severity.ERROR}] ${file}: knowledge object is empty`);
  }
  for (const key of keys) {
    if (key === 'version') continue;
    const value = data[key];
    const isValid = typeof value === 'string' ||
      (Array.isArray(value) && value.every(v => typeof v === 'string'));
    if (!isValid) {
      errors.push(`[${Severity.ERROR}] ${file}: knowledge field "${key}" must be a string or array of strings (filename(s))`);
    }
  }
  return errors;
}

function idExtractor() {
  return [];
}

function getReferences() {
  return [];
}

export default {
  name: 'knowledge',
  filenamePattern: 'knowledge.json',
  fallbackBaseName: 'knowledge',
  priority: 40,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
