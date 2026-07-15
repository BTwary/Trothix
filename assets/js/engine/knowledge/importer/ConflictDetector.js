/**
 * @fileoverview ConflictDetector.js
 * Fifth stage of the KnowledgeImporter pipeline (offline engineering tool —
 * NOT part of runtime, per the approved importer architecture v3, reconciled
 * against the actual implemented module contracts).
 *
 * AliasMerger
 *   ↓
 * ConflictDetector   <-- this module
 *   ↓
 * Event Stream / ImportReport
 *
 * Input: the { mergeResults, skipped } object returned by
 * AliasMerger.mergeBatch() — this module operates on already schema-valid,
 * canonical-id, alias-merged data, per the approved pipeline — plus the
 * same ontology vocabulary Map used throughout the pipeline.
 *
 * Detects, using only data that actually exists in this pipeline today:
 *   - duplicateOriginalIds            same raw candidate id appearing more
 *                                       than once across the batch
 *   - crossConceptProductionCollisions a newly-merged alias/phrase/pattern
 *                                       for concept A already belongs to a
 *                                       DIFFERENT concept B in production
 *   - crossConceptBatchCollisions      the same kind of collision, but
 *                                       between two different concepts
 *                                       within this same batch
 *
 * Deliberately NOT implemented (rather than fabricated):
 *   - "incompatible descriptions"      no candidate field in this pipeline
 *                                       is called `description`; nothing to
 *                                       compare
 *   - "incompatible ontology categories" no ruleset anywhere in production
 *                                       data defines which categories are
 *                                       mutually exclusive
 *   - "possible-missed-alias" fuzzy warnings — would require similarity /
 *                                       heuristic matching, which the
 *                                       project rules explicitly forbid
 *                                       ("Do NOT add heuristics")
 *
 * This module NEVER resolves what it finds — it only reports. No merging,
 * no ID reassignment, no writes to the ontology vocabulary or production
 * knowledge.
 */

import KnowledgeNormalizer from './KnowledgeNormalizer.js';

// ---------------------------------------------------------------------------
// Duplicate original IDs
// ---------------------------------------------------------------------------

/**
 * Finds any raw candidate id that appears more than once across the batch,
 * whether within the same merge group (benign re-submission) or across
 * different groups / skipped (a real data-integrity signal).
 */
function detectDuplicateOriginalIds(mergeOutput) {
  const occurrences = new Map(); // originalId -> [{ context, resolvedId, tier }]

  for (const group of mergeOutput?.mergeResults || []) {
    for (const c of group.contributingCandidates) {
      if (!c.originalId) continue;
      if (!occurrences.has(c.originalId)) occurrences.set(c.originalId, []);
      occurrences.get(c.originalId).push({ context: 'merged', resolvedId: group.canonicalId, tier: c.tier });
    }
  }
  for (const s of mergeOutput?.skipped || []) {
    if (!s.originalId) continue;
    if (!occurrences.has(s.originalId)) occurrences.set(s.originalId, []);
    occurrences.get(s.originalId).push({ context: 'skipped', resolvedId: null, tier: s.tier });
  }

  const duplicates = [];
  for (const [originalId, occ] of occurrences) {
    if (occ.length > 1) duplicates.push({ originalId, occurrences: occ });
  }
  return duplicates.sort((a, b) => a.originalId.localeCompare(b.originalId));
}

// ---------------------------------------------------------------------------
// Cross-concept alias collisions
// ---------------------------------------------------------------------------

function collectAddedTexts(group) {
  const withField = (texts, field) => texts.map(text => ({ text, field }));
  return [
    ...withField(group.aliases.added, 'aliases'),
    ...withField(group.phraseVariations.added, 'phraseVariations'),
    ...withField(group.parserPatterns.added, 'parserPatterns')
  ];
}

/**
 * Cross-checks every newly-merged alias/phrase/pattern against (a) the real
 * production ontology vocabulary and (b) every other group in this same
 * batch, flagging any normalized text that's claimed by more than one
 * canonical concept.
 */
function detectCrossConceptCollisions(mergeOutput, ontology) {
  const groups = mergeOutput?.mergeResults || [];
  const productionCollisions = [];
  const batchCollisions = [];

  // normalizedText -> Set(canonicalId) contributed by THIS batch, across all groups
  const batchIndex = new Map();

  for (const group of groups) {
    for (const { text, field } of collectAddedTexts(group)) {
      const normalized = KnowledgeNormalizer.normalize(text);
      if (!normalized) continue;

      // (a) against real production vocabulary
      const productionHits = (ontology?.get ? ontology.get(normalized) : undefined) || [];
      const foreignHits = productionHits.filter(h => h.canonicalId !== group.canonicalId);
      if (foreignHits.length > 0) {
        productionCollisions.push({
          text,
          normalized,
          field,
          group: group.canonicalId,
          collidesWith: foreignHits.map(h => ({
            canonicalId: h.canonicalId,
            domain: h.domain ?? null,
            sourceFile: h.sourceFile ?? null
          }))
        });
      }

      // (b) against the rest of this batch
      if (!batchIndex.has(normalized)) batchIndex.set(normalized, new Set());
      batchIndex.get(normalized).add(group.canonicalId);
    }
  }

  for (const [normalized, canonicalIds] of batchIndex) {
    if (canonicalIds.size > 1) {
      batchCollisions.push({ normalized, canonicalIds: [...canonicalIds].sort() });
    }
  }

  return {
    crossConceptProductionCollisions: productionCollisions,
    crossConceptBatchCollisions: batchCollisions.sort((a, b) => a.normalized.localeCompare(b.normalized))
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Runs every implemented conflict check against AliasMerger's output.
 *
 * @param {object} mergeOutput - { mergeResults, skipped } from AliasMerger.mergeBatch()
 * @param {object} context
 * @param {Map} context.ontology - production ontology vocabulary (read-only)
 */
function detectConflicts(mergeOutput, context = {}) {
  const ontology = context.ontology || new Map();

  const duplicateOriginalIds = detectDuplicateOriginalIds(mergeOutput);
  const { crossConceptProductionCollisions, crossConceptBatchCollisions } =
    detectCrossConceptCollisions(mergeOutput, ontology);

  const clean = duplicateOriginalIds.length === 0 &&
    crossConceptProductionCollisions.length === 0 &&
    crossConceptBatchCollisions.length === 0;

  return {
    duplicateOriginalIds,
    crossConceptProductionCollisions,
    crossConceptBatchCollisions,
    clean
  };
}

export default {
  name: 'ConflictDetector',
  detectConflicts,
  detectDuplicateOriginalIds,
  detectCrossConceptCollisions
};