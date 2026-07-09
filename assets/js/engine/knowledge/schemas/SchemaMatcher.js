/**
 * @fileoverview SchemaMatcher.js
 *
 * Resolves a filename to a registered schema. This is a direct, literal
 * generalization of the legacy `KnowledgeLinter._detectType()` method:
 * it replicates the exact same two-phase algorithm (exact filename match,
 * then normalized-basename fallback for schemas that opt in), just
 * iterating over whatever schemas SchemaRegistry holds instead of a
 * hardcoded TYPE_MAP.
 *
 * No fuzzy matching, no AI, no runtime heuristics — same rules as before,
 * only reorganized.
 */

/**
 * Normalizes a filename the same way the legacy code did:
 * strip "(n)" numbering, strip whitespace, strip a trailing ".json".
 * @param {string} normalizedName - already-lowercased basename
 * @returns {string}
 */
function toFallbackBaseName(normalizedName) {
  return normalizedName
    .replace(/\(\d+\)/g, '')
    .replace(/\s+/g, '')
    .replace(/\.json$/, '');
}

/**
 * @typedef {Object} MatchResult
 * @property {import('./SchemaContract.js').SchemaModule} schema
 * @property {'exact'|'fallback'} matchedBy
 * @property {import('./SchemaContract.js').SchemaModule[]} [ambiguousWith] - other schemas that also matched, if any
 */

/**
 * Matches a lowercased basename against a set of schemas.
 *
 * Phase 1 (exact): a schema matches if `normalizedName` equals its
 * `filenamePattern` (or is included in it, when filenamePattern is an array).
 *
 * Phase 2 (fallback): only consulted if no exact match was found. A schema
 * matches if it declares a `fallbackBaseName` and that value equals the
 * normalized base name of the file (digits-in-parens and whitespace
 * stripped, ".json" suffix stripped). This exists solely to preserve the
 * legacy special-casing of "knowledge" and "metadata" files that have
 * variant filenames (e.g. "knowledge (2).json", "meta data.json").
 *
 * If more than one schema matches in the same phase, the schemas are
 * ordered by `priority` (ascending) and the first is returned; the rest
 * are reported via `ambiguousWith` so callers can log/flag it. With the
 * current 15 schemas this never happens (filenames are 1:1 with types),
 * but the mechanism exists so future schema additions fail loudly instead
 * of silently picking an arbitrary one.
 *
 * @param {string} filename - basename or path of the file being detected
 * @param {import('./SchemaContract.js').SchemaModule[]} schemas
 * @returns {MatchResult | null}
 */
function match(filename, schemas) {
  const name = filename.split(/[\\/]/).pop();
  const normalized = name.toLowerCase();

  const exactMatches = schemas.filter(schema => {
    const patterns = Array.isArray(schema.filenamePattern) ? schema.filenamePattern : [schema.filenamePattern];
    return patterns.includes(normalized);
  });

  if (exactMatches.length > 0) {
    exactMatches.sort((a, b) => a.priority - b.priority);
    return {
      schema: exactMatches[0],
      matchedBy: 'exact',
      ambiguousWith: exactMatches.slice(1)
    };
  }

  const baseName = toFallbackBaseName(normalized);
  const fallbackMatches = schemas.filter(schema => schema.fallbackBaseName && schema.fallbackBaseName === baseName);

  if (fallbackMatches.length > 0) {
    fallbackMatches.sort((a, b) => a.priority - b.priority);
    return {
      schema: fallbackMatches[0],
      matchedBy: 'fallback',
      ambiguousWith: fallbackMatches.slice(1)
    };
  }

  return null;
}

export const SchemaMatcher = { match };
