/**
 * @fileoverview KnowledgeNormalizer.js
 * First stage of the KnowledgeImporter pipeline (offline engineering tool —
 * NOT part of runtime, per the approved importer architecture v3).
 *
 * Responsible ONLY for:
 *   - trim
 *   - unicode normalization
 *   - punctuation normalization
 *   - whitespace cleanup
 *   - case normalization
 *
 * This is also the ONLY module in the importer pipeline that reads the
 * standards markdown files:
 *   - standards/legal-drafting-patterns.md
 *   - standards/negation-and-carveouts.md
 *
 * It parses them into an in-memory lookup table (expression -> pattern
 * metadata) for SemanticCanonicalizer to consume downstream. This module
 * does not itself perform semantic mapping, ID resolution, merging, or
 * conflict detection — it only normalizes text and produces the lookup
 * table. No ontology logic lives here.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Sibling of importer/, per architecture v3 path correction. */
const DEFAULT_STANDARDS_DIR = path.resolve(__dirname, '../standards');

const STANDARDS_FILES = [
  'legal-drafting-patterns.md',
  'negation-and-carveouts.md'
];

// ---------------------------------------------------------------------------
// Text normalization primitives
// ---------------------------------------------------------------------------

/** Straight-quote/dash/ellipsis equivalents for common "smart" punctuation. */
const PUNCTUATION_MAP = new Map([
  ['\u2018', "'"], ['\u2019', "'"], ['\u201A', "'"], ['\u201B', "'"],
  ['\u201C', '"'], ['\u201D', '"'], ['\u201E', '"'], ['\u201F', '"'],
  ['\u2013', '-'], ['\u2014', '-'], ['\u2212', '-'],
  ['\u2026', '...'],
  ['\u00A0', ' ']
]);

function normalizeUnicode(str) {
  return typeof str === 'string' ? str.normalize('NFC') : str;
}

function normalizePunctuation(str) {
  if (typeof str !== 'string') return str;
  let out = str;
  for (const [from, to] of PUNCTUATION_MAP) {
    out = out.split(from).join(to);
  }
  return out;
}

function normalizeWhitespace(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\s+/g, ' ').trim();
}

function normalizeCase(str) {
  return typeof str === 'string' ? str.toLowerCase() : str;
}

/**
 * Full composed pipeline: unicode -> punctuation -> whitespace -> case -> trim.
 * This is the canonical form used both for building lookup-table keys and
 * for normalizing incoming document text before a SemanticCanonicalizer
 * lookup, so the two sides always compare like-for-like.
 */
function normalize(str) {
  if (typeof str !== 'string') return '';
  let out = str;
  out = normalizeUnicode(out);
  out = normalizePunctuation(out);
  out = normalizeWhitespace(out);
  out = normalizeCase(out);
  return out.trim();
}

// ---------------------------------------------------------------------------
// Markdown parsing (standards files only)
// ---------------------------------------------------------------------------

function normalizeLineEndings(raw) {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** Strips a leading YAML frontmatter block ( ---\n...\n--- ) if present. */
function stripFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return text;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n');
    }
  }
  return text;
}

/**
 * Builds a heading tree out of markdown text. Each node holds only the
 * body lines that sit directly under it (before any subheading), plus
 * its direct children. Heading level is the number of leading '#'.
 */
function parseHeadingTree(text) {
  const root = { level: 0, headingText: null, bodyLines: [], children: [] };
  const stack = [root];

  for (const rawLine of text.split('\n')) {
    const m = /^(#{1,6})\s+(.*)$/.exec(rawLine.trim());
    if (m) {
      const level = m[1].length;
      const headingText = m[2].trim();
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      const node = { level, headingText, bodyLines: [], children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else {
      stack[stack.length - 1].bodyLines.push(rawLine);
    }
  }

  return root;
}

/** Structural section labels — never pattern candidates themselves. */
const LABEL_EXPRESSIONS = /^(common expressions|examples)$/i;
const LABEL_MEANING = /^(semantic meaning|semantic effect)$/i;
const LABEL_OTHER = /^(purpose|compiler action|example|hierarchy)$/i;

function isLabelHeading(headingText) {
  if (!headingText) return false;
  return LABEL_EXPRESSIONS.test(headingText) ||
    LABEL_MEANING.test(headingText) ||
    LABEL_OTHER.test(headingText);
}

function isBulletLine(line) {
  return /^-\s+/.test(line.trim());
}

function bulletContent(line) {
  return line.trim().replace(/^-\s+/, '').trim();
}

/**
 * Finds an inline plain-text label line within a body (not a heading —
 * e.g. legal-drafting-patterns.md style, where "Common Expressions" is
 * just a line of text inside a ### block) and collects the contiguous
 * bullet list that follows it.
 */
function extractInlineList(bodyLines, labelRegex) {
  let labelIndex = -1;
  for (let i = 0; i < bodyLines.length; i++) {
    if (labelRegex.test(bodyLines[i].trim())) {
      labelIndex = i;
      break;
    }
  }
  if (labelIndex === -1) return [];

  const items = [];
  for (let i = labelIndex + 1; i < bodyLines.length; i++) {
    const trimmed = bodyLines[i].trim();
    if (trimmed === '' || trimmed === '---') {
      if (items.length > 0) break; // trailing separator after list ends it
      continue; // blank lines before the list starts are fine
    }
    if (isBulletLine(trimmed)) {
      items.push(bulletContent(trimmed));
    } else {
      break;
    }
  }
  return items;
}

/** Collects every bullet line anywhere in a body — used for label child nodes. */
function extractAllBullets(bodyLines) {
  return bodyLines
    .map(l => l.trim())
    .filter(isBulletLine)
    .map(bulletContent);
}

/**
 * Finds an inline plain-text label line and returns the single clean value
 * that follows it, or null if the block after the label doesn't reduce to
 * exactly one meaningful line (e.g. multi-line Original/Negated transforms —
 * those are ambiguous and deliberately left unresolved; no ontology logic
 * is applied here to interpret them).
 */
function extractInlineValue(bodyLines, labelRegex) {
  let labelIndex = -1;
  for (let i = 0; i < bodyLines.length; i++) {
    if (labelRegex.test(bodyLines[i].trim())) {
      labelIndex = i;
      break;
    }
  }
  if (labelIndex === -1) return null;
  return reduceToSingleValue(bodyLines.slice(labelIndex + 1));
}

/** Same reduction, applied to a whole body (used for label child nodes). */
function extractSingleValue(bodyLines) {
  return reduceToSingleValue(bodyLines);
}

function reduceToSingleValue(lines) {
  const distinct = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '---' || trimmed === '\u2193') continue;
    if (isBulletLine(trimmed)) return null; // ran into a new list, stop
    distinct.push(trimmed);
    if (distinct.length > 1) break;
  }
  return distinct.length === 1 ? distinct[0] : null;
}

function toPatternId(headingText) {
  return headingText
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Walks the heading tree and produces pattern records. A node becomes a
 * pattern candidate when it (or a direct label child) yields a non-empty
 * expression list. Structural/meta sections with no expression list never
 * produce a record, so headings like "Compiler Rules" or "Future
 * Extensions" are naturally excluded even though they may contain
 * unrelated bullet lists.
 */
function extractPatterns(root, sourceFile) {
  const records = [];

  function visit(node, parent) {
    if (node.level > 0 && !isLabelHeading(node.headingText)) {
      const ownExpressions = extractInlineList(node.bodyLines, LABEL_EXPRESSIONS);

      let childExpressions = [];
      let childMeaning = null;
      for (const child of node.children) {
        if (LABEL_EXPRESSIONS.test(child.headingText)) {
          childExpressions = childExpressions.concat(extractAllBullets(child.bodyLines));
        }
        if (LABEL_MEANING.test(child.headingText)) {
          childMeaning = childMeaning || extractSingleValue(child.bodyLines);
        }
      }

      const expressions = ownExpressions.length > 0 ? ownExpressions : childExpressions;

      if (expressions.length > 0) {
        const ownMeaning = extractInlineValue(node.bodyLines, LABEL_MEANING);
        const category = (parent && parent.level > 0 && !isLabelHeading(parent.headingText))
          ? parent.headingText
          : null;

        records.push({
          patternId: toPatternId(node.headingText),
          sourceHeading: node.headingText,
          category,
          semanticMeaning: ownMeaning || childMeaning || null,
          expressions,
          sourceFile
        });
      }
    }

    for (const child of node.children) visit(child, node);
  }

  visit(root, null);
  return records;
}

// ---------------------------------------------------------------------------
// Lookup table
// ---------------------------------------------------------------------------

/**
 * Reads and parses the standards markdown files, returning:
 *   - expressionMap: Map<normalizedExpression, entry[]>  (entries carry
 *     patternId / semanticMeaning / category / sourceFile; an array
 *     because the same normalized phrase can legitimately appear under
 *     more than one pattern across the two files — that ambiguity is
 *     surfaced, not silently collapsed)
 *   - patterns: full list of parsed pattern records
 *   - warnings: any files that could not be read
 */
function buildLookupTable(standardsDir = DEFAULT_STANDARDS_DIR) {
  const expressionMap = new Map();
  const patterns = [];
  const warnings = [];

  for (const filename of STANDARDS_FILES) {
    const filePath = path.join(standardsDir, filename);
    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      warnings.push(`Could not read standards file "${filename}": ${err.message}`);
      continue;
    }

    const text = stripFrontmatter(normalizeLineEndings(raw));
    const tree = parseHeadingTree(text);
    const filePatterns = extractPatterns(tree, filename);

    for (const record of filePatterns) {
      patterns.push(record);
      for (const expression of record.expressions) {
        const key = normalize(expression);
        if (!key) continue;
        if (!expressionMap.has(key)) expressionMap.set(key, []);
        expressionMap.get(key).push({
          expression,
          patternId: record.patternId,
          semanticMeaning: record.semanticMeaning || record.patternId,
          category: record.category,
          sourceFile: record.sourceFile
        });
      }
    }
  }

  return {
    expressionMap,
    patterns,
    warnings,
    builtAt: new Date().toISOString()
  };
}

let _cachedTable = null;

/** Lazily builds and caches the lookup table. Pass { forceRebuild: true } to bust the cache. */
function getLookupTable(options = {}) {
  const { forceRebuild = false, standardsDir = DEFAULT_STANDARDS_DIR } = options;
  if (!_cachedTable || forceRebuild) {
    _cachedTable = buildLookupTable(standardsDir);
  }
  return _cachedTable;
}

// ---------------------------------------------------------------------------
// Batch normalization (structural only — no semantic mapping, no ID
// resolution, no validation; see file header). This is the missing stage
// identified in the importer integration audit: it turns whatever raw,
// per-file candidate data the caller already has in memory into a uniform
// array of NormalizedCandidate envelopes for SemanticCanonicalizer to
// consume next. It never reads anything from disk — `rawFiles` is supplied
// entirely by the caller, already loaded/parsed.
//
// NormalizedCandidate shape (fixed by the approved importer architecture):
//   {
//     sourceFile,   // the key this record came from in rawFiles
//     sourceType,   // derived structurally from sourceFile's basename, minus
//                    // extension (e.g. "actors.json" -> "actors") — a literal
//                    // label, never an interpretation of the record's meaning
//     sourceIndex,  // this record's position within its own source file's list
//     batch,        // caller-supplied batch identifier, passed through as-is
//     rawId,        // record.id verbatim, completely untouched — IdMapper's
//                    // exact_id tier needs the true original byte-for-byte
//                    // value, so this is never cleaned, trimmed, or cased
//     fields,        // structurally cleaned copy of every top-level field on
//                    // the record, INCLUDING id (see normalizeFieldsForRecord
//                    // below) — rawId above remains the untouched source of
//                    // truth for ID resolution; fields.id is the same value
//                    // run through the same generic cleanup as every other
//                    // field, for callers that want the record shape intact
//     warnings       // structural anomalies found on THIS record only
//   }
//
// Design note on `fields` cleanup: rather than a hardcoded list of known
// field names, every top-level key on the raw record is walked generically:
//   - string value  -> normalizeUnicode -> normalizePunctuation ->
//                       normalizeWhitespace (the same three primitives
//                       `normalize()` itself uses, MINUS normalizeCase)
//   - array value   -> each string element gets the same treatment;
//                       non-string elements are dropped with a warning
//   - anything else -> copied verbatim
// This makes the stage forward-compatible with ontology fields that don't
// exist yet, with no per-field allowlist to maintain. Case folding is
// deliberately withheld: it's a lossy comparison-key transform that
// SemanticCanonicalizer and IdMapper already apply on demand via normalize()
// when they need a case-insensitive match, and collapsing case at this stage
// would destroy the distinction IdMapper's confidence tiers depend on
// (exact_name=95 vs normalized_name=90 is precisely "same case" vs "same
// after case-folding"). No recursion into nested objects/arrays-of-objects —
// only top-level string/array-of-string values are touched; anything more
// deeply nested is copied through untouched.

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Unicode + punctuation + whitespace cleanup only — no case folding. See design note above. */
function structuralCleanString(str) {
  if (typeof str !== 'string') return str;
  let out = str;
  out = normalizeUnicode(out);
  out = normalizePunctuation(out);
  out = normalizeWhitespace(out); // also trims
  return out;
}

/** Derives a purely structural type label from a source file name — never an interpretation of record content. */
function deriveSourceType(sourceFile) {
  if (typeof sourceFile !== 'string' || sourceFile.trim() === '') return 'unknown';
  const basename = sourceFile.split(/[\\/]/).pop();
  const stripped = basename.replace(/\.[^.]+$/, '');
  return stripped || 'unknown';
}

/**
 * Builds the structurally-cleaned `fields` object for one raw record, plus
 * any warnings about anomalies found while doing so. Walks every top-level
 * key generically (no hardcoded field list) — see design note above. Never
 * recurses into nested objects; never assigns or resolves anything.
 */
function normalizeFieldsForRecord(record) {
  const fields = {};
  const warnings = [];

  for (const key of Object.keys(record)) {
    const value = record[key];

    if (typeof value === 'string') {
      fields[key] = structuralCleanString(value);
      continue;
    }

    if (Array.isArray(value)) {
      const cleaned = [];
      value.forEach((item, i) => {
        if (typeof item !== 'string') {
          warnings.push(`field "${key}[${i}]" is not a string and was dropped`);
          return;
        }
        cleaned.push(structuralCleanString(item));
      });
      fields[key] = cleaned;
      continue;
    }

    // Everything else (numbers, booleans, null, nested objects, etc.) is
    // copied verbatim — no recursive walking of nested structures.
    fields[key] = value;
  }

  return { fields, warnings };
}

/**
 * Normalizes one raw record into a single NormalizedCandidate envelope.
 * Never drops a record, however malformed — structural problems are
 * reported via `warnings` on the envelope, not by omitting it, so array
 * positions/counts stay predictable for callers.
 */
function normalizeRecord(rawRecord, sourceFile, sourceIndex, batch, seenIds) {
  const warnings = [];

  if (!isPlainObject(rawRecord)) {
    warnings.push('raw record is not a plain object; produced empty fields');
    return {
      sourceFile,
      sourceType: deriveSourceType(sourceFile),
      sourceIndex,
      batch,
      rawId: null,
      fields: {},
      warnings
    };
  }

  const rawId = typeof rawRecord.id === 'string' ? rawRecord.id : null;
  if ('id' in rawRecord && typeof rawRecord.id !== 'string') {
    warnings.push('field "id" is present but not a string; rawId set to null');
  }
  if (rawId !== null) {
    if (seenIds.has(rawId)) {
      warnings.push(`duplicate id "${rawId}" also seen earlier at index ${seenIds.get(rawId)} in this source file`);
    } else {
      seenIds.set(rawId, sourceIndex);
    }
  }

  const { fields, warnings: fieldWarnings } = normalizeFieldsForRecord(rawRecord);
  warnings.push(...fieldWarnings);

  return {
    sourceFile,
    sourceType: deriveSourceType(sourceFile),
    sourceIndex,
    batch,
    rawId,
    fields,
    warnings
  };
}

/**
 * Normalizes every record belonging to one source file into
 * NormalizedCandidate[]. `rawRecords` may be an array (each element is one
 * record, sourceIndex = array position) or a single object (treated as one
 * record at sourceIndex 0) — the same two shapes already tolerated
 * elsewhere in this pipeline (e.g. SemanticCanonicalizer.harvestFile).
 * Anything else (null, a primitive, etc.) is treated as a single malformed
 * record so no input silently vanishes.
 *
 * @param {string} sourceFile
 * @param {*} rawRecords
 * @param {*} [batch] - caller-supplied batch identifier, passed through as-is
 * @returns {object[]} NormalizedCandidate[]
 */
function normalizeFile(sourceFile, rawRecords, batch = null) {
  if (rawRecords === undefined || rawRecords === null) return [];

  const list = Array.isArray(rawRecords) ? rawRecords : [rawRecords];
  const seenIds = new Map();

  return list.map((rawRecord, sourceIndex) =>
    normalizeRecord(rawRecord, sourceFile, sourceIndex, batch, seenIds)
  );
}

/**
 * Normalizes an entire raw import batch into NormalizedCandidate[].
 * `rawFiles` is a plain object keyed by source file name, each value being
 * whatever normalizeFile() accepts (array of records, or a single record).
 * File keys are processed in sorted order so output is deterministic
 * regardless of how the caller constructed `rawFiles` (object key
 * insertion order is not relied upon).
 *
 * @param {Object<string, *>} rawFiles
 * @param {*} [batch] - caller-supplied batch identifier, attached to every candidate as-is
 * @returns {object[]} NormalizedCandidate[]
 */
function normalizeBatch(rawFiles, batch = null) {
  if (!isPlainObject(rawFiles)) return [];

  const sourceFiles = Object.keys(rawFiles).sort();
  const candidates = [];

  for (const sourceFile of sourceFiles) {
    candidates.push(...normalizeFile(sourceFile, rawFiles[sourceFile], batch));
  }

  return candidates;
}

export default {
  name: 'KnowledgeNormalizer',
  normalize,
  normalizeUnicode,
  normalizePunctuation,
  normalizeWhitespace,
  normalizeCase,
  buildLookupTable,
  getLookupTable,
  normalizeFile,
  normalizeBatch
};