// schema-registry.js
// ---------------------------------------------------------------------
// Per-node-type schema definitions for the knowledge-audit tool: which
// fields on a raw knowledge-base entry are structural references to
// other ontology ids, and which fields are required for a minimally
// well-formed entry of that type. Used by parser.js to build each IR
// node's `.references` array (consumed by graph-builder.js) and to
// collect schema-violation errors (consumed by validator.js's CI gate).
//
// Audit note (C1): this is an *independent* structural/schema layer,
// not a reimplementation of the production KnowledgeProvider's loader.
// KnowledgeProvider exists to compile a working rule engine (it cares
// about executable predicates, ontology resolution for matching, and
// is deliberately lenient/defensive so a single malformed entry never
// crashes analysis of a real document). This registry exists to answer
// a different question — "is this knowledge base internally
// consistent as a graph" (orphans, dangling refs, cycles, schema
// completeness) — for offline CI gating, where being strict and
// exhaustive is the point rather than a liability. The two are kept
// deliberately separate (see tests/parser-production-parity.test.js
// for the automated check that they don't silently drift apart on the
// one thing they *do* need to agree on: which node ids exist).
// ---------------------------------------------------------------------

// First-segment id prefix -> node type. Mirrors the prefix conventions
// already observed across assets/js/engine/knowledge/v1/**/*.json.
const PREFIX_TYPE_MAP = {
  CONCEPT: 'concept',
  RULE: 'rule',
  DT: 'decision_table',
  TEMPLATE: 'template',
  TPL: 'template',
  SOURCE: 'source',
  EXAMPLE: 'example',
  EXCEPTION: 'exception',
  EXC: 'exception',
  ENTITY: 'entity',
  ACTION: 'action',
  PHRASE: 'phrase',
  PARTY: 'party',
  EVENT: 'event',
  DOC: 'document',
  JNOTE: 'jurisdiction_note',
  INTENT: 'intent',
  STATE: 'state',
  CONSTRAINT: 'constraint',
  MODAL: 'modal',
  MOD: 'modal',
  OBLIGATION: 'obligation',
  PATTERN: 'pattern',
  NEG: 'negation',
  COND: 'condition',
  OWNER: 'owner',
  LICENSE: 'license',
  COURT: 'court',
  JURISDICTION: 'jurisdiction',
  CAPABILITY: 'capability',
  COV: 'coverage_term',
  DELEGATION: 'delegation',
  RESTRICTION: 'restriction',
  CONSENT: 'consent',
  REL: 'relation'
};

// An ontology-id-shaped string: uppercase letters/digits, at least two
// underscore-joined segments (excludes plain enum-like values such as
// "OBLIGATION" or "Universal" that happen to be a single ALL-CAPS word
// or aren't ALL-CAPS at all).
const ID_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

function classify(id) {
  const prefix = id.split('_')[0];
  return PREFIX_TYPE_MAP[prefix] || 'other';
}

/**
 * Recursively walks any value (string/array/object), extracting every
 * ontology-id-shaped string found, regardless of nesting depth.
 * @param {*} value
 * @param {string} [path] dot/bracket path accumulated so far, for
 *   callers that want to know where a reference was found.
 * @returns {{id: string, targetType: string, path: string}[]}
 */
export function extractReferencedIds(value, path = '') {
  if (typeof value === 'string') {
    if (ID_PATTERN.test(value)) {
      return [{ id: value, targetType: classify(value), path }];
    }
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => extractReferencedIds(item, `${path}[${i}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) =>
      extractReferencedIds(v, path ? `${path}.${key}` : key)
    );
  }
  return [];
}

// Reference extractor per node type: which fields on the raw entry are
// actually structural relationships (as opposed to free text, numeric
// scores, or bookkeeping like linkedTests/requires that name *test*
// ids rather than *ontology* ids). Each extractor receives the raw
// parsed JSON entry and returns extractReferencedIds()-shaped refs,
// with `id` itself excluded so a node never references itself.
function fieldExtractor(fields) {
  return (raw) => {
    const refs = [];
    for (const field of fields) {
      if (raw[field] !== undefined) refs.push(...extractReferencedIds(raw[field], field));
    }
    return refs.filter(r => r.id !== raw.id);
  };
}

const SCHEMAS = {
  concept: {
    requiredFields: ['id', 'name'],
    referenceExtractor: fieldExtractor(['related', 'actions', 'entities', 'documents', 'phrases', 'aliases'])
  },
  rule: {
    requiredFields: ['id', 'when', 'then'],
    referenceExtractor: fieldExtractor(['when', 'then', 'concept'])
  },
  decision_table: {
    requiredFields: ['id', 'inputs', 'outputs'],
    referenceExtractor: fieldExtractor(['inputs', 'outputs', 'concept'])
  },
  template: {
    requiredFields: ['id'],
    // Template entries are keyed by `family` (see parser.js's
    // TEMPLATE_ID_FIELD_FALLBACK) and their only structural content is
    // `templates`: nested arrays of grammar-slot tokens, some of which
    // (e.g. "INTENT_KEEP_SECRET") are real ontology ids and some of
    // which (ACTOR/MODAL/OBJECT) are generic slot placeholders that
    // don't match ID_PATTERN (no underscore) and are naturally skipped.
    referenceExtractor: fieldExtractor(['templates'])
  },
  source: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['concept'])
  },
  example: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['concept'])
  },
  exception: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['concept', 'domain'])
  },
  entity: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['related', 'concept'])
  },
  action: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['related', 'concept', 'synonyms'])
  },
  phrase: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['concept'])
  },
  party: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['concept'])
  },
  event: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['concept', 'related'])
  },
  document: {
    requiredFields: ['id'],
    referenceExtractor: fieldExtractor(['expectedRules', 'expectedConcepts', 'minimumSections', 'recommendedSections'])
  }
};

// Fallback for any node type not explicitly registered above (e.g. the
// long tail of smaller enterprise-KB node types like jurisdiction_note,
// modal, condition, ...): require only `id`, and extract references
// generically from the whole entry. Keeps the tool from silently
// ignoring a node type it hasn't been taught about yet (audit C1's
// "won't recognize it until someone remembers to update this tool"
// concern) — it still gets *some* reference extraction, just not a
// hand-tuned field list.
const DEFAULT_SCHEMA = {
  requiredFields: ['id'],
  referenceExtractor: (raw) => extractReferencedIds(raw).filter(r => r.id !== raw.id)
};

/**
 * @param {string} type
 * @returns {{requiredFields: string[], referenceExtractor: Function}|null}
 */
export function getSchema(type) {
  if (SCHEMAS[type]) return SCHEMAS[type];
  return null;
}

/**
 * @param {string} type
 * @returns {{requiredFields: string[], referenceExtractor: Function}}
 */
export function getSchemaOrDefault(type) {
  return SCHEMAS[type] || DEFAULT_SCHEMA;
}

/** @returns {Object<string, {requiredFields: string[], referenceExtractor: Function}>} */
export function getAllSchemas() {
  return { ...SCHEMAS };
}

export { PREFIX_TYPE_MAP, ID_PATTERN, classify as classifyId };
