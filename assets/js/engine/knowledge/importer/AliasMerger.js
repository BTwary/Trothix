/**
 * @fileoverview AliasMerger.js
 * Fourth stage of the KnowledgeImporter pipeline (offline engineering tool —
 * NOT part of runtime, per the approved importer architecture v3, reconciled
 * against the actual implemented module contracts).
 *
 * IdMapper
 *   ↓
 * AliasMerger   <-- this module
 *   ↓
 * ConflictDetector
 *
 * Input: the array returned by IdMapper.resolveBatch() — each entry shaped
 *   { originalId, resolvedId, confidence, tier, needsHumanReview,
 *     evidence, competingConcepts, semanticContext, canonicalizedCandidate }
 * plus the same ontology vocabulary Map used by SemanticCanonicalizer/IdMapper.
 *
 * Works ONLY on canonical objects: entries where needsHumanReview is false
 * and resolvedId is set. Anything still needing human review has no
 * canonical id to merge into and is passed through untouched in `skipped`
 * — never merged, never guessed at.
 *
 * Merges, per canonicalId:
 *   - aliases            (name / terms / synonyms / aliases / surfaceForms)
 *   - phrase variations   (text)
 *   - parser patterns      (patterns / parserPatterns — no production schema
 *                            exists for this yet, so it is treated the same
 *                            generic way as the others, not fabricated)
 * against what the ontology vocabulary already knows for that id, reporting
 * only what's genuinely new. Set-union only — no judgement calls.
 *
 * This module does NOT:
 *   - assign or alter canonical IDs (IdMapper's job)
 *   - write into the ontology vocabulary or production knowledge (read-only)
 *   - detect or resolve conflicts across DIFFERENT canonical ids (ConflictDetector's job)
 *   - construct provenance objects (KnowledgeImporter's/IdMapper's job)
 *   - parse markdown (KnowledgeNormalizer's job)
 */

import KnowledgeNormalizer from './KnowledgeNormalizer.js';

// ---------------------------------------------------------------------------
// Surface-text extraction from a canonicalized candidate (same field names
// SemanticCanonicalizer.extractSurfaceForms already established)
// ---------------------------------------------------------------------------

function collectStrings(candidate, field) {
  const value = candidate?.[field];
  if (typeof value === 'string' && value.trim() !== '') return [value];
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string' && v.trim() !== '');
  return [];
}

/** Buckets one candidate's surface text into aliases / phrases / patterns. */
function bucketCandidateText(candidate) {
  const aliases = [
    ...collectStrings(candidate, 'name'),
    ...collectStrings(candidate, 'terms'),
    ...collectStrings(candidate, 'synonyms'),
    ...collectStrings(candidate, 'aliases'),
    ...collectStrings(candidate, 'surfaceForms')
  ];
  const phrases = collectStrings(candidate, 'text');
  const patterns = [
    ...collectStrings(candidate, 'patterns'),
    ...collectStrings(candidate, 'parserPatterns')
  ];
  return { aliases, phrases, patterns };
}

// ---------------------------------------------------------------------------
// Existing (production) vocabulary reverse lookup
// ---------------------------------------------------------------------------

/** Every surface form the ontology vocabulary already has on record for one canonicalId. */
function existingSurfaceFormsFor(canonicalId, ontology) {
  const seen = new Map(); // normalized -> original (first-seen casing)
  if (!ontology) return [];
  for (const entries of ontology.values()) {
    for (const e of entries) {
      if (e.canonicalId !== canonicalId) continue;
      const key = KnowledgeNormalizer.normalize(e.surfaceForm);
      if (key && !seen.has(key)) seen.set(key, e.surfaceForm);
    }
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Deduped set-union helpers (compare normalized, keep first-seen original casing)
// ---------------------------------------------------------------------------

function dedupeBySeed(seedTexts) {
  const seen = new Map();
  for (const text of seedTexts) {
    const key = KnowledgeNormalizer.normalize(text);
    if (key && !seen.has(key)) seen.set(key, text);
  }
  return seen;
}

/** Splits incoming texts into { added, alreadyKnown } relative to an existing set. */
function diffAgainstExisting(existingTexts, incomingTexts) {
  const existingKeys = new Set(existingTexts.map(t => KnowledgeNormalizer.normalize(t)));
  const incomingDeduped = dedupeBySeed(incomingTexts);
  const added = [];
  for (const [key, original] of incomingDeduped) {
    if (!existingKeys.has(key)) added.push(original);
  }
  return added;
}

// ---------------------------------------------------------------------------
// Group-level merge
// ---------------------------------------------------------------------------

/**
 * Merges one already-grouped set of same-resolvedId canonical results.
 *
 * @param {string} canonicalId
 * @param {object[]} group - subset of IdMapper.resolveBatch() results sharing this resolvedId
 * @param {Map} ontology - production ontology vocabulary (read-only)
 */
function mergeGroup(canonicalId, group, ontology) {
  const existingAliases = existingSurfaceFormsFor(canonicalId, ontology);

  const allAliasTexts = [];
  const allPhraseTexts = [];
  const allPatternTexts = [];

  for (const result of group) {
    const { aliases, phrases, patterns } = bucketCandidateText(result.canonicalizedCandidate);
    allAliasTexts.push(...aliases);
    allPhraseTexts.push(...phrases);
    allPatternTexts.push(...patterns);
  }

  // Phrases and patterns aren't separately tracked in the ontology vocab's
  // existing-surface-form set (it's a flat surface-form -> id index built
  // across all vocabulary file types), so "already known" for those is
  // checked against the same existingAliases set — anything the vocabulary
  // already associates with this id, regardless of which file it came
  // from, counts as already known.
  const newAliases = diffAgainstExisting(existingAliases, allAliasTexts);
  const newPhrases = diffAgainstExisting(existingAliases, allPhraseTexts);
  const newPatterns = diffAgainstExisting(existingAliases, allPatternTexts);

  const mergedAliases = [...dedupeBySeed([...existingAliases, ...allAliasTexts]).values()];

  return {
    canonicalId,
    aliases: {
      existing: existingAliases,
      added: newAliases,
      merged: mergedAliases
    },
    phraseVariations: {
      added: newPhrases
    },
    parserPatterns: {
      added: newPatterns
    },
    contributingCandidates: group.map(r => ({
      originalId: r.originalId,
      resolvedId: r.resolvedId,
      confidence: r.confidence,
      tier: r.tier
    }))
  };
}

// ---------------------------------------------------------------------------
// Batch entry point
// ---------------------------------------------------------------------------

/**
 * Groups IdMapper.resolveBatch() results by resolvedId and merges each
 * group. Results still needing human review are reported separately in
 * `skipped`, never merged.
 *
 * @param {object[]} idMapperResults - output of IdMapper.resolveBatch()
 * @param {object} context
 * @param {Map} context.ontology - production ontology vocabulary (read-only)
 */
function mergeBatch(idMapperResults, context = {}) {
  const ontology = context.ontology || new Map();

  const canonical = [];
  const skipped = [];
  for (const result of (idMapperResults || [])) {
    if (result.needsHumanReview || !result.resolvedId) {
      skipped.push({ originalId: result.originalId, tier: result.tier, confidence: result.confidence });
    } else {
      canonical.push(result);
    }
  }

  const groups = new Map(); // resolvedId -> results[]
  for (const result of canonical) {
    if (!groups.has(result.resolvedId)) groups.set(result.resolvedId, []);
    groups.get(result.resolvedId).push(result);
  }

  const mergeResults = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b)) // deterministic output order
    .map(([canonicalId, group]) => mergeGroup(canonicalId, group, ontology));

  return { mergeResults, skipped };
}

export default {
  name: 'AliasMerger',
  mergeBatch,
  mergeGroup
};