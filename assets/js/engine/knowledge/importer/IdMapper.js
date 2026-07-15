/**
 * @fileoverview IdMapper.js
 * Third stage of the KnowledgeImporter pipeline (offline engineering tool —
 * NOT part of runtime, per the approved importer architecture v3).
 *
 * SemanticCanonicalizer
 *   ↓
 * IdMapper   <-- this module
 *   ↓
 * Schema Validation
 *
 * Responsible ONLY for canonical ID resolution. Consumes the semantic
 * annotations produced by SemanticCanonicalizer and searches:
 *   - existing production vocabulary / existing domains (context.ontology —
 *     the same Map shape SemanticCanonicalizer.buildOntologyVocabulary()
 *     produces)
 *   - the current import batch (built internally from already-resolved
 *     sibling candidates — see resolveBatch())
 *
 * Implements the approved confidence tiers:
 *   100  Exact ID              candidate.id already IS a known production canonical ID
 *    95  Exact canonical name  candidate.name is byte-identical to an existing alias/term
 *    90  Normalized name       candidate.name matches after normalization only
 *    80  Two+ matching aliases 2+ of terms/synonyms/aliases normalize-match the same concept
 *   <80  Needs Human Review    single weak alias, no match, or genuine ambiguity
 *
 * This module does NOT:
 *   - modify the ontology vocabulary passed in (read-only; a fresh batch
 *     vocabulary is built separately and never merged back)
 *   - merge aliases onto records (AliasMerger's job)
 *   - validate schemas (Schema Validation's job)
 *   - detect conflicts (ConflictDetector's job — not implemented yet)
 * It never guesses: whenever more than one distinct canonical concept is
 * in contention, the mapping is left unresolved with every competing
 * concept preserved for human review, rather than picking one.
 */

import KnowledgeNormalizer from './KnowledgeNormalizer.js';

const CONFIDENCE = {
  EXACT_ID: 100,
  EXACT_NAME: 95,
  NORMALIZED_NAME: 90,
  MULTI_ALIAS: 80,
  SINGLE_ALIAS: 60,
  AMBIGUOUS: 0,
  UNRESOLVED: 0
};

const HUMAN_REVIEW_THRESHOLD = 80;

/** "Alias" fields for the 80%-tier corroboration check — deliberately excludes `name`, which has its own dedicated 95/90 tiers. */
const ALIAS_FIELD_PREFIXES = ['terms[', 'synonyms[', 'aliases[', 'surfaceForms['];

function isAliasField(field) {
  return ALIAS_FIELD_PREFIXES.some(p => field.startsWith(p));
}

// ---------------------------------------------------------------------------
// Vocabulary search helpers
// ---------------------------------------------------------------------------

/** Union of every canonicalId appearing anywhere in a vocabulary Map. */
function collectCanonicalIds(vocab) {
  const ids = new Set();
  if (!vocab) return ids;
  for (const entries of vocab.values()) {
    for (const e of entries) ids.add(e.canonicalId);
  }
  return ids;
}

/**
 * Looks up a normalized key across one or more tagged vocabularies and
 * returns every entry found, tagged with which vocabulary it came from.
 */
function lookupNormalized(normalizedKey, taggedVocabs) {
  const results = [];
  for (const { vocab, sourceType } of taggedVocabs) {
    const entries = vocab?.get ? vocab.get(normalizedKey) : undefined;
    if (!entries) continue;
    for (const e of entries) {
      results.push({ ...e, sourceType, matchType: 'normalized' });
    }
  }
  return results;
}

/** Same as lookupNormalized, but additionally requires byte-identical surface text. */
function lookupExact(original, normalizedKey, taggedVocabs) {
  return lookupNormalized(normalizedKey, taggedVocabs)
    .filter(e => e.surfaceForm === original)
    .map(e => ({ ...e, matchType: 'exact' }));
}

function distinctConcepts(entries) {
  return [...new Set(entries.map(e => e.canonicalId))];
}

function toEvidence(entries, field, original, normalized) {
  return entries.map(e => ({
    field,
    original,
    normalized,
    matchType: e.matchType,
    sourceType: e.sourceType,
    canonicalConcept: e.canonicalId,
    domain: e.domain ?? null,
    sourceFile: e.sourceFile ?? null
  }));
}

// ---------------------------------------------------------------------------
// Core resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the canonical ID for one candidate.
 *
 * @param {object} candidate - the original import-batch record (read-only)
 * @param {object} semanticResult - SemanticCanonicalizer.canonicalize() output for this candidate
 * @param {object} context
 * @param {Map} context.ontology - production ontology vocabulary (read-only)
 * @param {Map} [context.batchVocab] - vocabulary derived from already-resolved batch siblings (read-only)
 */
function resolveCandidate(candidate, semanticResult, context = {}) {
  const ontology = context.ontology || new Map();
  const batchVocab = context.batchVocab || new Map();
  const productionIds = context.productionIds || collectCanonicalIds(ontology);

  const taggedVocabs = [
    { vocab: ontology, sourceType: 'productionOntology' },
    { vocab: batchVocab, sourceType: 'currentBatch' }
  ];

  const annotations = semanticResult?.semanticAnnotations || [];
  const originalId = candidate?.id ?? null;

  // Non-authoritative context carried through from SemanticCanonicalizer's
  // standards-pattern matches (e.g. PROHIBITION) — informative only, never
  // used to decide a confidence tier here.
  const semanticContext = annotations
    .filter(a => a.matches.some(m => m.source === 'standardsLookup'))
    .flatMap(a => a.matches
      .filter(m => m.source === 'standardsLookup')
      .map(m => ({
        field: a.field,
        patternId: m.patternId,
        canonicalConcept: m.canonicalConcept,
        category: m.category,
        sourceFile: m.sourceFile
      })));

  const build = (resolvedId, confidence, tier, evidence, competingConcepts = []) => {
    const needsHumanReview = confidence < HUMAN_REVIEW_THRESHOLD;
    const canonicalizedCandidate = (!needsHumanReview && resolvedId)
      ? { ...candidate, id: resolvedId }
      : { ...candidate };
    return {
      originalId,
      resolvedId: needsHumanReview ? null : resolvedId,
      confidence,
      tier,
      needsHumanReview,
      evidence,
      competingConcepts,
      semanticContext,
      canonicalizedCandidate
    };
  };

  // Tier 1 — Exact ID: candidate's own id already IS a known production canonical ID.
  if (typeof originalId === 'string' && productionIds.has(originalId)) {
    return build(originalId, CONFIDENCE.EXACT_ID, 'exact_id', [{
      field: 'id',
      original: originalId,
      normalized: KnowledgeNormalizer.normalize(originalId),
      matchType: 'exact',
      sourceType: 'candidateId',
      canonicalConcept: originalId,
      domain: null,
      sourceFile: null
    }]);
  }

  const nameAnnotation = annotations.find(a => a.field === 'name');
  const aliasAnnotations = annotations.filter(a => isAliasField(a.field));

  // Tier 2 / 3 — name-based resolution (exact, then normalized).
  if (nameAnnotation) {
    const exact = lookupExact(nameAnnotation.original, nameAnnotation.normalized, taggedVocabs);
    const exactConcepts = distinctConcepts(exact);
    if (exactConcepts.length === 1) {
      return build(
        exactConcepts[0],
        CONFIDENCE.EXACT_NAME,
        'exact_name',
        toEvidence(exact, 'name', nameAnnotation.original, nameAnnotation.normalized)
      );
    }

    const normalized = lookupNormalized(nameAnnotation.normalized, taggedVocabs);
    const normalizedConcepts = distinctConcepts(normalized);
    if (normalizedConcepts.length === 1) {
      return build(
        normalizedConcepts[0],
        CONFIDENCE.NORMALIZED_NAME,
        'normalized_name',
        toEvidence(normalized, 'name', nameAnnotation.original, nameAnnotation.normalized)
      );
    }

    if (exactConcepts.length > 1 || normalizedConcepts.length > 1) {
      const competing = [...new Set([...exactConcepts, ...normalizedConcepts])];
      return build(null, CONFIDENCE.AMBIGUOUS, 'ambiguous', [
        ...toEvidence(exact, 'name', nameAnnotation.original, nameAnnotation.normalized),
        ...toEvidence(normalized, 'name', nameAnnotation.original, nameAnnotation.normalized)
      ], competing);
    }
  }

  // Tier 4 — two or more alias-type fields (terms/synonyms/aliases) agreeing on one concept.
  const aliasMatchesByField = aliasAnnotations.map(a => ({
    annotation: a,
    matches: lookupNormalized(a.normalized, taggedVocabs)
  })).filter(m => m.matches.length > 0);

  const perFieldConcepts = aliasMatchesByField.map(m => distinctConcepts(m.matches));
  const allAliasConcepts = [...new Set(perFieldConcepts.flat())];

  if (allAliasConcepts.length === 1) {
    const concept = allAliasConcepts[0];
    const contributingFields = aliasMatchesByField.filter(m =>
      distinctConcepts(m.matches).includes(concept));

    if (contributingFields.length >= 2) {
      const evidence = contributingFields.flatMap(m =>
        toEvidence(m.matches, m.annotation.field, m.annotation.original, m.annotation.normalized));
      return build(concept, CONFIDENCE.MULTI_ALIAS, 'multi_alias', evidence);
    }

    if (contributingFields.length === 1) {
      const m = contributingFields[0];
      const evidence = toEvidence(m.matches, m.annotation.field, m.annotation.original, m.annotation.normalized);
      return build(concept, CONFIDENCE.SINGLE_ALIAS, 'single_alias', evidence);
    }
  }

  if (allAliasConcepts.length > 1) {
    const evidence = aliasMatchesByField.flatMap(m =>
      toEvidence(m.matches, m.annotation.field, m.annotation.original, m.annotation.normalized));
    return build(null, CONFIDENCE.AMBIGUOUS, 'ambiguous', evidence, allAliasConcepts);
  }

  // Nothing matched anywhere.
  return build(null, CONFIDENCE.UNRESOLVED, 'unresolved', []);
}

// ---------------------------------------------------------------------------
// Batch resolution (adds "search the current import batch")
// ---------------------------------------------------------------------------

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

/** Builds a batch-local vocabulary out of already-confidently-resolved sibling candidates. */
function buildBatchVocab(candidates, semanticResults, resolvedResults) {
  const batchVocab = new Map();
  resolvedResults.forEach((result, i) => {
    if (result.needsHumanReview || !result.resolvedId) return;
    const provenance = { domain: null, sourceFile: `batch:${result.originalId ?? `#${i}`}` };
    addVocabEntry(batchVocab, result.originalId, result.resolvedId, provenance);
    for (const a of (semanticResults[i]?.semanticAnnotations || [])) {
      addVocabEntry(batchVocab, a.original, result.resolvedId, provenance);
    }
  });
  return batchVocab;
}

/**
 * Resolves every candidate in a batch. Two deterministic passes:
 *   1. Resolve each candidate independently against production vocabulary.
 *   2. Any candidate that still needs human review is re-resolved once
 *      more, this time also searching a batch-local vocabulary built from
 *      Pass 1's confidently-resolved siblings — this is the "search the
 *      current import batch" requirement. No further passes are run, so
 *      the result is deterministic and batch order never causes cycles.
 *
 * @param {object[]} candidates
 * @param {object[]} semanticResults - SemanticCanonicalizer output, same order/length as candidates
 * @param {object} context - { ontology }
 */
function resolveBatch(candidates, semanticResults, context = {}) {
  if (candidates.length !== semanticResults.length) {
    throw new Error('IdMapper.resolveBatch: candidates and semanticResults must be the same length and order.');
  }

  const ontology = context.ontology || new Map();
  const productionIds = collectCanonicalIds(ontology);
  const emptyVocab = new Map();

  const pass1 = candidates.map((c, i) =>
    resolveCandidate(c, semanticResults[i], { ontology, batchVocab: emptyVocab, productionIds })
  );

  const batchVocab = buildBatchVocab(candidates, semanticResults, pass1);

  return pass1.map((result, i) => {
    if (!result.needsHumanReview) return result;
    const pass2 = resolveCandidate(candidates[i], semanticResults[i], { ontology, batchVocab, productionIds });
    return pass2.confidence > result.confidence ? pass2 : result;
  });
}

export default {
  name: 'IdMapper',
  CONFIDENCE,
  HUMAN_REVIEW_THRESHOLD,
  resolveCandidate,
  resolveBatch
};