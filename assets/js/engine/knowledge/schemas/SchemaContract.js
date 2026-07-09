/**
 * @fileoverview SchemaContract.js
 *
 * Defines the shape every schema module must satisfy, and a fail-fast
 * validator used by SchemaRegistry at registration time. This is a plain
 * shape check (property/type presence) — no reflection, no decorators,
 * no dynamic behavior.
 *
 * Contract (as specified in the DLIF migration design):
 *   {
 *     name,             // string — canonical type key (e.g. "rules")
 *     filenamePattern,  // string | string[] — exact lowercase filename(s) this schema owns
 *     priority,         // number — registration/resolution priority (lower = higher priority)
 *     fingerprint(),    // (data) => boolean — content-based match hook
 *     validate(),       // (data, file) => string[] — returns diagnostic strings
 *     idExtractor(),    // (data) => string[] — returns IDs found in this file
 *     referenceFields   // see DEVIATION note below
 *   }
 *
 * DEVIATION FROM DESIGN DOCUMENT (documented per repository-is-authoritative
 * instruction):
 *
 * The original design document specifies `referenceFields` as a static list
 * of field names, with KnowledgeLinter performing "generic resolution" over
 * them. The actual legacy behavior in KnowledgeLinter._getReferences() is
 * NOT a generic field walk — it is type-specific: for "concept" it walks a
 * fixed set of array fields and assigns a different targetType per field;
 * for "rules" it inspects `rule.concept` on each array item; for "relations"
 * it inspects `rel.source`/`rel.target`. This cannot be represented as a
 * flat field-name list without changing behavior.
 *
 * To satisfy requirement 3 ("preserve current behavior exactly"), this
 * contract instead uses `getReferences(data)` — a function each schema
 * owns, returning `{ id, path, targetType }[]`. KnowledgeLinter calls this
 * generically (it does not know or care which schema is being asked), so
 * the "no schema-specific code inside KnowledgeLinter" requirement is still
 * met. Only "concept", "rules", and "relations" implement non-trivial
 * logic here; all other schemas return an empty array, matching the
 * legacy `default: break` behavior exactly.
 *
 * Similarly, `fingerprint()` is part of the contract (per the design doc)
 * but the legacy system never did content-based disambiguation — detection
 * was purely filename-based. Every schema's fingerprint() therefore returns
 * `true` unconditionally. It is kept as a required hook so future schemas
 * can add real content-based disambiguation without changing the contract
 * or Detector/SchemaMatcher again.
 */

/**
 * @typedef {Object} ReferenceDescriptor
 * @property {string} id - The referenced ID.
 * @property {string} path - Human-readable path describing where the reference was found.
 * @property {string} targetType - Expected type of the referenced ID ("any" to skip type checking).
 */

/**
 * @typedef {Object} SchemaModule
 * @property {string} name
 * @property {string|string[]} filenamePattern
 * @property {string|null} [fallbackBaseName]
 * @property {number} priority
 * @property {(data: any) => boolean} fingerprint
 * @property {(data: any, file: string) => string[]} validate
 * @property {(data: any) => string[]} idExtractor
 * @property {(data: any) => ReferenceDescriptor[]} getReferences
 */

const REQUIRED_STRING_FIELDS = ['name'];
const REQUIRED_FUNCTION_FIELDS = ['fingerprint', 'validate', 'idExtractor', 'getReferences'];

/**
 * Validates that a schema module conforms to the shared contract.
 * Throws synchronously at registration time (fail-fast) rather than
 * allowing a malformed schema to silently produce wrong or missing
 * diagnostics at lint time.
 *
 * @param {SchemaModule} schema
 * @throws {Error} if the schema does not conform to the contract
 */
export function assertSchemaShape(schema) {
  if (!schema || typeof schema !== 'object') {
    throw new Error('Schema module must be an object.');
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof schema[field] !== 'string' || schema[field].length === 0) {
      throw new Error(`Schema module missing required string field "${field}".`);
    }
  }

  const hasFilenamePattern =
    typeof schema.filenamePattern === 'string' ||
    (Array.isArray(schema.filenamePattern) && schema.filenamePattern.every(p => typeof p === 'string'));
  if (!hasFilenamePattern) {
    throw new Error(`Schema "${schema.name}": "filenamePattern" must be a string or an array of strings.`);
  }

  if (schema.fallbackBaseName !== undefined && schema.fallbackBaseName !== null && typeof schema.fallbackBaseName !== 'string') {
    throw new Error(`Schema "${schema.name}": "fallbackBaseName" must be a string or null (if present).`);
  }

  if (typeof schema.priority !== 'number') {
    throw new Error(`Schema "${schema.name}": "priority" must be a number.`);
  }

  for (const field of REQUIRED_FUNCTION_FIELDS) {
    if (typeof schema[field] !== 'function') {
      throw new Error(`Schema "${schema.name}": "${field}" must be a function.`);
    }
  }
}
