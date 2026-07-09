/**
 * @fileoverview CoverageSchema.js
 * Ported verbatim from KnowledgeLinter._validateCoverage. No id extraction
 * or reference logic existed for this type.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function validate(data, file) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(`[${Severity.ERROR}] ${file}: coverage must be an object`);
    return errors;
  }
  if (!('domain' in data) && !('supportedDocuments' in data)) {
    errors.push(`[${Severity.WARNING}] ${file}: coverage missing "domain" or "supportedDocuments"`);
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
  name: 'coverage',
  filenamePattern: 'coverage.json',
  fallbackBaseName: null,
  priority: 60,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
