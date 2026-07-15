/**
 * @fileoverview KnowledgeImporter.js
 * Orchestrator of the KnowledgeImporter pipeline (offline engineering tool —
 * NOT part of runtime). Reconciled against the actual implemented module
 * contracts — no NormalizedCandidate envelope, no Event Stream, no Schema
 * Validation stage exist in this repository, so this module coordinates
 * the real, already-approved modules directly:
 *
 * candidates[]
 *   → SemanticCanonicalizer.canonicalizeBatch(candidates, { ontology })
 *   → IdMapper.resolveBatch(candidates, semanticResults, { ontology })
 *   → AliasMerger.mergeBatch(idMapperResults, { ontology })
 *   → ConflictDetector.detectConflicts(mergeOutput, { ontology })
 *   → ImportReport.generateReport({ batchMeta, idMapperResults, mergeOutput, conflictReport })
 *
 * Responsibilities (per the approved architecture):
 *   - reads the incoming batch (loadBatch — read-only)
 *   - coordinates all modules (importBatch)
 *   - owns provenance creation (the only module that stamps
 *     { batch, source, originalId, importedAt } onto resolved records —
 *     AliasMerger deliberately has none of this logic)
 *   - writes the generated bundle (writeBundle — the only function in this
 *     entire pipeline that touches the filesystem for output)
 *   - never contains merge logic itself (always delegates to AliasMerger)
 *
 * Type routing: Schema Validation doesn't exist, so this module cannot
 * infer whether a resolved candidate is an entity, action, phrase, etc.
 * Rather than guess, it only routes a candidate into a typed bundle file
 * (entities.json / concepts.json / actions.json / phrases.json /
 * exceptions.json / deadlines.json / parserPatterns.json) when the
 * candidate ALREADY carries an explicit `type` field naming one of those
 * categories. Anything else is recorded, not guessed — see
 * metadata.json's `unclassifiedCandidates`.
 *
 * Output path: per the same precedent established when `standards/` was
 * located as a sibling of `importer/` under the shared knowledge root,
 * "knowledge/imports/generated/<batch>/" resolves to
 * assets/js/engine/knowledge/imports/generated/<batch>/ — never anywhere
 * near v1/domains or clause-packs. Only the ten files the architecture
 * doc names are ever written.
 *
 * Does NOT:
 *   - modify KnowledgeNormalizer.js, SemanticCanonicalizer.js, or IdMapper.js
 *   - write into production knowledge (v1/domains, clause-packs)
 *   - perform alias merging or conflict detection itself
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import SemanticCanonicalizer from './SemanticCanonicalizer.js';
import IdMapper from './IdMapper.js';
import AliasMerger from './AliasMerger.js';
import ConflictDetector from './ConflictDetector.js';
import ImportReport from './ImportReport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Sibling of importer/, per the standards/ path-resolution precedent. */
const DEFAULT_GENERATED_DIR = path.resolve(__dirname, '../imports/generated');

const TYPE_TO_FILENAME = {
  entity: 'entities.json',
  concept: 'concepts.json',
  action: 'actions.json',
  phrase: 'phrases.json',
  exception: 'exceptions.json',
  deadline: 'deadlines.json',
  parserpattern: 'parserPatterns.json'
};

const BUNDLE_KEYS = {
  'entities.json': 'entities',
  'concepts.json': 'concepts',
  'actions.json': 'actions',
  'phrases.json': 'phrases',
  'exceptions.json': 'exceptions',
  'deadlines.json': 'deadlines',
  'parserPatterns.json': 'parserPatterns'
};

// ---------------------------------------------------------------------------
// Batch loading (read-only)
// ---------------------------------------------------------------------------

/**
 * Reads an incoming batch file from disk. Accepts either a top-level JSON
 * array of candidates, or { candidates: [...] }. Read-only — never writes.
 */
function loadBatch(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`KnowledgeImporter.loadBatch: could not read "${filePath}": ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`KnowledgeImporter.loadBatch: "${filePath}" is not valid JSON: ${err.message}`);
  }

  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.candidates)) return parsed.candidates;

  throw new Error(`KnowledgeImporter.loadBatch: "${filePath}" must be a JSON array of candidates, or { candidates: [...] }.`);
}

// ---------------------------------------------------------------------------
// Type routing (explicit field only — never inferred)
// ---------------------------------------------------------------------------

function normalizeTypeKey(type) {
  return typeof type === 'string' ? type.trim().toLowerCase().replace(/[^a-z]/g, '') : '';
}

function classify(candidate) {
  return TYPE_TO_FILENAME[normalizeTypeKey(candidate?.type)] || null;
}

// ---------------------------------------------------------------------------
// Provenance (owned here, and only here)
// ---------------------------------------------------------------------------

function withProvenance(candidate, originalId, batchName, sourceLabel, importedAt) {
  const existing = Array.isArray(candidate.provenance) ? candidate.provenance : [];
  const alreadyStamped = existing.some(p =>
    p.batch === batchName && p.originalId === originalId && p.source === sourceLabel);
  const entry = { batch: batchName, source: sourceLabel, originalId, importedAt };
  return {
    ...candidate,
    provenance: alreadyStamped ? existing : [...existing, entry]
  };
}

// ---------------------------------------------------------------------------
// Orchestration (pure — no filesystem writes)
// ---------------------------------------------------------------------------

/**
 * Runs the full pipeline against an in-memory batch and returns the
 * assembled bundle. Does not touch the filesystem.
 *
 * @param {object} input
 * @param {string} input.batchName - required; identifies this import run
 * @param {object[]} input.candidates - the incoming batch (flat records)
 * @param {Map} [input.ontology] - production ontology vocabulary; defaults
 *        to SemanticCanonicalizer.buildOntologyVocabulary() over real
 *        production data if not supplied
 * @param {string} [input.sourceLabel] - provenance `source` value (e.g. "perplexity")
 */
function importBatch({ batchName, candidates, ontology, sourceLabel = 'unknown' }) {
  if (!batchName || typeof batchName !== 'string') {
    throw new Error('KnowledgeImporter.importBatch: batchName (string) is required.');
  }
  if (!Array.isArray(candidates)) {
    throw new Error('KnowledgeImporter.importBatch: candidates (array) is required.');
  }

  const ontologyVocab = ontology || SemanticCanonicalizer.buildOntologyVocabulary().vocab;
  const importedAt = new Date().toISOString();

  const semanticResults = SemanticCanonicalizer.canonicalizeBatch(candidates, { ontology: ontologyVocab });
  const idMapperResults = IdMapper.resolveBatch(candidates, semanticResults, { ontology: ontologyVocab });
  const mergeOutput = AliasMerger.mergeBatch(idMapperResults, { ontology: ontologyVocab });
  const conflictReport = ConflictDetector.detectConflicts(mergeOutput, { ontology: ontologyVocab });
  const { report, markdown } = ImportReport.generateReport({
    batchMeta: { name: batchName, source: sourceLabel, importedAt },
    idMapperResults,
    mergeOutput,
    conflictReport
  });

  const buckets = { entities: [], concepts: [], actions: [], phrases: [], exceptions: [], deadlines: [], parserPatterns: [] };
  const unclassifiedCandidates = [];

  for (const result of idMapperResults) {
    if (result.needsHumanReview || !result.resolvedId) continue; // only canonical records enter the bundle

    const filename = classify(result.canonicalizedCandidate);
    const record = withProvenance(
      result.canonicalizedCandidate,
      result.originalId,
      batchName,
      sourceLabel,
      importedAt
    );

    if (filename) {
      buckets[BUNDLE_KEYS[filename]].push(record);
    } else {
      unclassifiedCandidates.push({
        originalId: result.originalId,
        resolvedId: result.resolvedId,
        reason: 'No recognized `type` field on the candidate — Schema Validation is not implemented, so type is never inferred.'
      });
    }
  }

  const metadata = {
    batch: batchName,
    source: sourceLabel,
    importedAt,
    counts: {
      totalCandidates: candidates.length,
      ...Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
      unclassified: unclassifiedCandidates.length
    },
    unclassifiedCandidates
  };

  return {
    batchName,
    files: {
      'entities.json': buckets.entities,
      'concepts.json': buckets.concepts,
      'actions.json': buckets.actions,
      'phrases.json': buckets.phrases,
      'exceptions.json': buckets.exceptions,
      'deadlines.json': buckets.deadlines,
      'parserPatterns.json': buckets.parserPatterns,
      'metadata.json': metadata,
      'report.json': report,
      'report.md': markdown
    }
  };
}

// ---------------------------------------------------------------------------
// Writing (the only filesystem-writing function in this pipeline)
// ---------------------------------------------------------------------------

/**
 * Writes a bundle produced by importBatch() to
 * <baseDir>/<batchName>/<file>, for each of the ten files named in the
 * architecture doc. Never writes anywhere else.
 *
 * @param {object} bundle - return value of importBatch()
 * @param {object} [options]
 * @param {string} [options.baseDir] - defaults to assets/js/engine/knowledge/imports/generated
 * @returns {string} the directory written to
 */
function writeBundle(bundle, options = {}) {
  const baseDir = options.baseDir || DEFAULT_GENERATED_DIR;
  const outputDir = path.join(baseDir, bundle.batchName);

  fs.mkdirSync(outputDir, { recursive: true });

  for (const [filename, content] of Object.entries(bundle.files)) {
    const filePath = path.join(outputDir, filename);
    const text = filename.endsWith('.md') ? content : JSON.stringify(content, null, 2);
    fs.writeFileSync(filePath, text, 'utf8');
  }

  return outputDir;
}

/** Convenience: importBatch() followed by writeBundle(). */
function importAndWrite(input, writeOptions = {}) {
  const bundle = importBatch(input);
  const outputDir = writeBundle(bundle, writeOptions);
  return { bundle, outputDir };
}

export default {
  name: 'KnowledgeImporter',
  loadBatch,
  importBatch,
  writeBundle,
  importAndWrite
};