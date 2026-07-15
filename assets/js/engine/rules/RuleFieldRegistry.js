/**
 * @fileoverview RuleFieldRegistry.js
 * 
 * TEMPORARY METADATA OBSERVATION REGISTRY:
 * This registry documents the current state of Legal IR paths populated by the 
 * pipeline engines. It is a snapshot of repository observations, not an 
 * authoritative runtime schema.
 * 
 * MIGRATION PATH:
 * When pipeline components (e.g. ActionBuilder, ConstraintEngine, etc.) are refactored
 * to export their own structured output schemas (e.g. via a static `writesFields` array),
 * this registry should be replaced by a build-time script that automatically generates
 * this list from the active plugins in process.
 */

export const RULE_FIELD_REGISTRY = [
  { pattern: 'actions[*].id', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].actor', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].modal', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].verb', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].object', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].recipient', status: 'inert', reason: 'actionBuilder sets this to null; no downstream plugin writes it.' },
  { pattern: 'actions[*].conditions', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].conditions[*]', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].exceptions', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].confidence', status: 'active', populatedBy: 'actionBuilder' },
  { pattern: 'actions[*].evidence.matchedText', status: 'active', populatedBy: 'actionBuilder' },

  { 
    pattern: 'actions[*].constraints[*].type', 
    status: 'active', 
    populatedBy: 'constraintEngine',
    caveat: 'Constraints are broadcast from node level to all actions on that node.' 
  },
  { pattern: 'actions[*].constraints[*].value', status: 'active', populatedBy: 'constraintEngine' },
  { pattern: 'actions[*].constraints[*].unit', status: 'active', populatedBy: 'constraintEngine' },

  { pattern: 'actions[*].deadlines[*].value', status: 'active', populatedBy: 'deadlineNormalizer' },
  { pattern: 'actions[*].deadlines[*].unit', status: 'active', populatedBy: 'deadlineNormalizer' },
  { pattern: 'actions[*].deadlines[*].relation', status: 'active', populatedBy: 'deadlineNormalizer' },

  { 
    pattern: 'actions[*].references[*]', 
    status: 'active', 
    populatedBy: 'referenceResolver',
    provenanceWarning: 'Clause number references are synthetic (fabricated NODE_00N ids).' 
  },

  { 
    pattern: 'category', 
    status: 'inert',
    reason: 'RuleContext resolves category to a mock "Unknown" string, ignoring node scopes.' 
  },

  { 
    pattern: 'metadata.parties[*]', 
    status: 'inert',
    reason: 'metadata.parties is an ID-keyed object, not an array. Wildcard traversal resolves to [].' 
  },

  { 
    pattern: 'metadata.definitions[*]', 
    status: 'inert',
    reason: 'metadata.definitions is an ID-keyed object, not an array. Wildcard traversal resolves to [].' 
  },

  { 
    pattern: 'nodes[*].metadata.candidates[*]', 
    status: 'unverified',
    reason: 'Populated in IR, but nested [*] pattern is not exercised by current rule corpus.' 
  },

  {
    pattern: 'extractedData.hasForceMajeure',
    status: 'active',
    populatedBy: 'forceMajeureExtractor',
    caveat: 'Detected via a curated incident-marker phrase list, not a full semantic parse. See ForceMajeure/phrases.json for the source phrases.'
  },
  {
    pattern: 'extractedData.forceMajeureDelayDays',
    status: 'active',
    populatedBy: 'forceMajeureExtractor',
    caveat: 'Only populated within a sentence that also matched an incident marker; the largest matched day-count across such sentences is kept.'
  },
  {
    pattern: 'extractedData.requiresForceMajeureNotice',
    status: 'active',
    populatedBy: 'forceMajeureExtractor',
    caveat: 'Detected via a curated notice-phrase list within force-majeure sentences only.'
  },
];

/**
 * Collects all `field` path strings in a condition tree.
 * @param {object} whenClause
 * @returns {string[]}
 */
export function extractFieldPaths(whenClause) {
  const fields = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.field === 'string') fields.push(node.field);
    for (const key of ['and', 'or', 'any', 'all']) {
      if (Array.isArray(node[key])) node[key].forEach(walk);
    }
    if (node.not) walk(node.not);
  }
  walk(whenClause);
  return fields;
}

function toPatternShape(fieldPath) {
  return fieldPath.replace(/\[\d+\]/g, '[*]');
}

/**
 * Looks up a field path status.
 * @param {string} fieldPath
 */
export function lookupField(fieldPath) {
  const patternShape = toPatternShape(fieldPath);
  const entry = RULE_FIELD_REGISTRY.find(e => e.pattern === patternShape);
  if (entry) return entry;
  return {
    pattern: patternShape,
    status: 'unverified',
    reason: `"${fieldPath}" is not defined in the field registry.`
  };
}
