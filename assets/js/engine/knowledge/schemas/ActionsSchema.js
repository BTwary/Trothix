/**
 * @fileoverview ActionsSchema.js
 * Ported verbatim from KnowledgeLinter._validateActions / _extractIds('actions').
 * No reference logic existed for this type.
 *
 * Fix: the repository's actual, established convention (already relied on
 * by KnowledgeProvider._loadDomains(): `Array.isArray(data) ? data : [data]`)
 * is that a domain data file may be EITHER an array of multiple entries OR
 * a single bare object representing one entry — Payment/actions.json,
 * Liability/actions.json, and Indemnification/actions.json all use the
 * single-object form intentionally (one action per domain). The previous
 * `if (!Array.isArray(data))` check rejected that already-valid,
 * already-loaded shape. Fixed to accept both, and idExtractor updated to
 * match so a single-object action's id is still tracked for duplicate-id
 * checking instead of silently returning [] for it.
 */

const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARNING: 'WARNING' };

function asItems(data) {
  return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);
}

function validate(data, file) {
  const errors = [];
  const items = asItems(data);
  if (items.length === 0 && !(data && typeof data === 'object')) {
    errors.push(`[${Severity.ERROR}] ${file}: actions must be an array, or a single action object`);
  }
  return errors;
}

function idExtractor(data) {
  return asItems(data).map(r => r.id).filter(Boolean);
}

function getReferences() {
  return [];
}

export default {
  name: 'actions',
  filenamePattern: ['actions.json', 'legal_actions.json'],
  fallbackBaseName: null,
  priority: 70,
  fingerprint: () => true,
  validate,
  idExtractor,
  getReferences
};
