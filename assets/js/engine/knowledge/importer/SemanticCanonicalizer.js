/**
 * @fileoverview SemanticCanonicalizer.js
 * Second stage of the KnowledgeImporter pipeline (offline engineering tool —
 * NOT part of runtime, per the approved importer architecture v3).
 *
 * KnowledgeNormalizer
 *   ↓
 * SemanticCanonicalizer   <-- this module
 *   ↓
 * IdMapper
 *
 * Responsible ONLY for semantic normalization: mapping the surface-form
 * text on an import candidate to the canonical concepts they express,
 * using:
 *   - normalized text (via KnowledgeNormalizer.normalize)
 *   - the standards lookup table (via KnowledgeNormalizer.getLookupTable)
 *   - existing ontology vocabulary (supplied by the caller — see
 *     buildOntologyVocabulary() below for a convenience loader over the
 *     real production domain files)
 *
 * This module does NOT:
 *   - assign canonical IDs (IdMapper's job — the candidate's `id` field
 *     is never read or written here)
 *   - merge aliases (AliasMerger's job)
 *   - detect conflicts (ConflictDetector's job)
 *   - read markdown files (KnowledgeNormalizer's job)
 *   - perform schema validation (Schema Validation's job)
 *
 * Where a surface form maps to more than one distinct canonical concept,
 * that ambiguity is preserved on the output (`ambiguous: true`, all
 * candidate matches listed) rather than guessed at — IdMapper is the
 * module responsible for resolving it via confidence tiers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import KnowledgeNormalizer from './KnowledgeNormalizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Sibling of importer/: assets/js/engine/knowledge/v1/domains */
const DEFAULT_DOMAINS_DIR = path.resolve(__dirname, '../v1/domains');

// ---------------------------------------------------------------------------
// Candidate surface-form extraction
// ---------------------------------------------------------------------------

/**
 * Fields on an import candidate that may carry human-readable surface
 * text worth canonicalizing. The batch/bundle schema isn't finalized yet
 * (Schema Validation runs after this stage), so extraction is deliberately
 * generic rather than tied to one record shape — it covers every surface
 * text field observed across the real production domain files (entities,
 * actors/objects, actions+synonyms, phrases, exceptions/terms, aliases).
 */
function extractSurfaceForms(candidate) {
  const forms = [];
  if (!candidate || typeof candidate !== 'object') return forms;

  const pushIfString = (field, value) => {
    if (typeof value === 'string' && value.trim() !== '') {
      forms.push({ field, original: value });
    }
  };
  const pushArray = (field, arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((value, i) => pushIfString(`${field}[${i}]`, value));
    }
  };

  pushIfString('name', candidate.name);
  pushIfString('text', candidate.text);
  pushArray('terms', candidate.terms);
  pushArray('synonyms', candidate.synonyms);
  pushArray('aliases', candidate.aliases);
  // Explicit escape hatch for callers/future formats that already know
  // which strings on the object are surface forms.
  pushArray('surfaceForms', candidate.surfaceForms);

  return forms;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** Looks up a normalized surface form against the standards lookup table. */
function matchLookupTable(normalizedText, lookupTable) {
  const hits = lookupTable?.expressionMap?.get(normalizedText);
  if (!hits || hits.length === 0) return [];
  return hits.map(hit => ({
    source: 'standardsLookup',
    canonicalConcept: hit.semanticMeaning,
    patternId: hit.patternId,
    category: hit.category,
    sourceFile: hit.sourceFile
  }));
}

/** Looks up a normalized surface form against the existing ontology vocabulary. */
function matchOntology(normalizedText, ontology) {
  const hits = ontology?.get ? ontology.get(normalizedText) : undefined;
  if (!hits || hits.length === 0) return [];
  return hits.map(hit => ({
    source: 'ontology',
    canonicalConcept: hit.canonicalId,
    domain: hit.domain,
    sourceFile: hit.sourceFile
  }));
}

/**
 * Canonicalizes one surface form: normalizes it, matches it against both
 * inputs, and resolves it only if every match agrees on a single concept.
 */
function canonicalizeSurfaceForm(surfaceForm, { lookupTable, ontology }) {
  const normalized = KnowledgeNormalizer.normalize(surfaceForm.original);
  const matches = [
    ...matchOntology(normalized, ontology),
    ...matchLookupTable(normalized, lookupTable)
  ];

  const distinctConcepts = [...new Set(matches.map(m => m.canonicalConcept))];

  return {
    field: surfaceForm.field,
    original: surfaceForm.original,
    normalized,
    matches,
    resolvedConcept: distinctConcepts.length === 1 ? distinctConcepts[0] : null,
    ambiguous: distinctConcepts.length > 1
  };
}

// ---------------------------------------------------------------------------
// Candidate-level canonicalization
// ---------------------------------------------------------------------------

/**
 * Canonicalizes a single import candidate. Never reads or writes
 * candidate.id — that field passes through untouched for IdMapper.
 *
 * @param {object} candidate - one record from the current import batch
 * @param {object} context
 * @param {object} context.lookupTable - result of KnowledgeNormalizer.getLookupTable()
 * @param {Map}    context.ontology    - result of buildOntologyVocabulary() (or equivalent)
 * @returns {object} candidate, unmodified, plus semantic annotations
 */
function canonicalize(candidate, context = {}) {
  const lookupTable = context.lookupTable || KnowledgeNormalizer.getLookupTable();
  const ontology = context.ontology || new Map();

  const surfaceForms = extractSurfaceForms(candidate);
  const semanticAnnotations = surfaceForms.map(sf =>
    canonicalizeSurfaceForm(sf, { lookupTable, ontology })
  );

  const resolvedConcepts = [...new Set(
    semanticAnnotations
      .filter(a => a.resolvedConcept)
      .map(a => a.resolvedConcept)
  )];

  const anyAmbiguous = semanticAnnotations.some(a => a.ambiguous);
  const anyMatch = semanticAnnotations.some(a => a.matches.length > 0);

  return {
    candidate, // pass-through, untouched — id is never read or reassigned here
    semanticAnnotations,
    // Only set when every resolved field agrees on exactly one concept;
    // left null the moment there's more than one distinct resolved
    // concept across fields, or none at all. IdMapper decides what to
    // do with ambiguity/no-match — this module never guesses.
    suggestedConcept: resolvedConcepts.length === 1 ? resolvedConcepts[0] : null,
    ambiguous: anyAmbiguous || resolvedConcepts.length > 1,
    unresolved: !anyMatch
  };
}

/** Canonicalizes every candidate in a batch (array of records). */
function canonicalizeBatch(candidates, context = {}) {
  const lookupTable = context.lookupTable || KnowledgeNormalizer.getLookupTable();
  const ontology = context.ontology || new Map();
  return (candidates || []).map(c => canonicalize(c, { lookupTable, ontology }));
}

// ---------------------------------------------------------------------------
// Ontology vocabulary loader (convenience utility, read-only)
// ---------------------------------------------------------------------------
//
// Nothing else in the pipeline yet owns "load existing production
// vocabulary" (IdMapper will need the same kind of index for its own
// searches). This loader is deliberately narrow: it only reads known
// vocabulary-shaped JSON files (never .md, never rules/templates/decision
// tables) and only harvests existing surface-form -> id associations that
// are already present in production data — it invents nothing. It is not
// wired into `canonicalize()` by default; callers (or eventually
// KnowledgeImporter) pass the result in via `context.ontology`.

const VOCAB_FILENAMES = new Set([
  'aliases.json',
  'defined_terms.json',
  'deadlines.json',
  'actors.json',
  'objects.json',
  'exceptions.json',
  'entities.json',
  'concept.json',
  'concepts.json',
  'actions.json',
  'phrases.json',
  'parserPatterns.json'
]);

function addVocabEntry(vocab, surfaceText, canonicalId, provenance) {
  if (typeof surfaceText !== 'string' || surfaceText.trim() === '') return;
  if (typeof canonicalId !== 'string' || canonicalId.trim() === '') return;
  const key = KnowledgeNormalizer.normalize(surfaceText);
  if (!key) return;
  if (!vocab.has(key)) vocab.set(key, []);
  const entries = vocab.get(key);
  if (!entries.some(e => e.canonicalId === canonicalId && e.sourceFile === provenance.sourceFile)) {
    entries.push({ canonicalId, surfaceForm: surfaceText, ...provenance });
  }
}

/** Harvests id/name/terms/synonyms/aliases/text+concept off one record. */
function harvestRecord(record, vocab, provenance) {
  if (!record || typeof record !== 'object') return;
  const id = record.id;
  if (typeof id !== 'string') return;

  addVocabEntry(vocab, record.name, id, provenance);
  if (Array.isArray(record.terms)) {
    record.terms.forEach(t => addVocabEntry(vocab, t, id, provenance));
  }
  if (Array.isArray(record.synonyms)) {
    record.synonyms.forEach(t => addVocabEntry(vocab, t, id, provenance));
  }
  if (Array.isArray(record.aliases)) {
    record.aliases.forEach(t => addVocabEntry(vocab, t, id, provenance));
  }
  if (typeof record.text === 'string' && typeof record.concept === 'string') {
    addVocabEntry(vocab, record.text, record.concept, provenance);
  }
}

/** Harvests one whitelisted vocabulary JSON file's contents into vocab. */
function harvestFile(filename, data, vocab, provenance) {
  if (Array.isArray(data)) {
    data.forEach(record => harvestRecord(record, vocab, provenance));
    return;
  }
  if (!data || typeof data !== 'object') return;

  const values = Object.values(data);
  const isFlatPhraseMap = 'id' in data === false &&
    values.length > 0 &&
    values.every(v => typeof v === 'string');

  if (isFlatPhraseMap) {
    if (filename === 'deadlines.json') {
      // deadlines.json is inverted relative to aliases/defined_terms:
      // { CANONICAL_ID: "surface phrase" }
      for (const [canonicalId, surfaceText] of Object.entries(data)) {
        addVocabEntry(vocab, surfaceText, canonicalId, provenance);
      }
    } else {
      // aliases.json / defined_terms.json: { "surface phrase": CANONICAL_ID }
      for (const [surfaceText, canonicalId] of Object.entries(data)) {
        addVocabEntry(vocab, surfaceText, canonicalId, provenance);
      }
    }
    return;
  }

  // Single record object (e.g. actions.json / concept.json not wrapped in an array).
  harvestRecord(data, vocab, provenance);
}

/**
 * Scans the real production domain directory (v1/domains/<Domain>/*.json)
 * and builds an ontology vocabulary Map<normalizedSurfaceForm, entry[]>.
 * Read-only; never touches markdown, rules, templates, or decision tables.
 */
function buildOntologyVocabulary(domainsDir = DEFAULT_DOMAINS_DIR) {
  const vocab = new Map();
  const warnings = [];

  let domainDirs;
  try {
    domainDirs = fs.readdirSync(domainsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch (err) {
    return { vocab, warnings: [`Could not read domains directory: ${err.message}`] };
  }

  for (const domain of domainDirs) {
    const domainPath = path.join(domainsDir, domain);
    let files;
    try {
      files = fs.readdirSync(domainPath);
    } catch (err) {
      warnings.push(`Could not read domain "${domain}": ${err.message}`);
      continue;
    }

    for (const filename of files) {
      if (!VOCAB_FILENAMES.has(filename)) continue;
      const filePath = path.join(domainPath, filename);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        warnings.push(`Could not parse "${domain}/${filename}": ${err.message}`);
        continue;
      }
      harvestFile(filename, data, vocab, { domain, sourceFile: `${domain}/${filename}` });
    }
  }

  return { vocab, warnings, builtAt: new Date().toISOString() };
}

export default {
  name: 'SemanticCanonicalizer',
  canonicalize,
  canonicalizeBatch,
  buildOntologyVocabulary
};
