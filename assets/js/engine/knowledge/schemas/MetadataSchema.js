/**
 * @fileoverview MetadataSchema.js
 * Ported verbatim from KnowledgeLinter._validateMetadata. No id extraction
 * or reference logic existed for this type.
 *
 * fallbackBaseName: 'metadata' preserves the legacy _detectType() special
 * case for variant filenames (e.g. "meta data.json").
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: metadata must be an object`);
    return errors;
  }
  if (!('source' in data) && !('knowledgeFingerprint' in data)) {
    errors.push(`[${Severity.WARNING}] ${file}: metadata missing "source" or "knowledgeFingerprint"`);
  }
  if (!('reviewStatus' in data)) {
    errors.push(`[${Severity.WARNING}] ${file}: metadata missing "reviewStatus"`);
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
  name: 'metadata',
  filenamePattern: 'metadata.json',
  fallbackBaseName: 'metadata',
  priority: 50,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
