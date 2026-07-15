/**
 * @fileoverview ImportReport.js
 * Final reporting stage of the KnowledgeImporter pipeline (offline
 * engineering tool — NOT part of runtime), reconciled against the actual
 * implemented module contracts.
 *
 * ConflictDetector
 *   ↓
 * ImportReport   <-- this module
 *   ↓
 * (KnowledgeImporter writes report.json / report.md to the generated bundle)
 *
 * Reconciliation note: the architecture doc has this module consuming an
 * "Event Stream" emitted by every prior stage. No EventStream module
 * exists anywhere in this repository, so — matching the same principle
 * used to reconcile SemanticCanonicalizer/IdMapper earlier — this module
 * consumes the REAL, already-implemented return values directly instead:
 *   - IdMapper.resolveBatch() output
 *   - AliasMerger.mergeBatch() output
 *   - ConflictDetector.detectConflicts() output
 * No new event-emission abstraction is introduced.
 *
 * Three of the architecture doc's report sections depend on pipeline
 * stages that don't exist yet (Schema Validation, KnowledgeImporter's
 * batch intake, relationship extraction). Rather than fabricate data for
 * them, they are included with `available: false` and a plain reason —
 * stable shape, honest content.
 *
 * This module does NOT write files. Per the architecture doc,
 * KnowledgeImporter "owns... writes generated bundle" — ImportReport only
 * produces the report.json / report.md CONTENT for KnowledgeImporter to
 * persist under knowledge/imports/generated/<batch>/.
 */

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildImported(idMapperResults) {
  return idMapperResults
    .filter(r => !r.needsHumanReview)
    .map(r => ({ originalId: r.originalId, resolvedId: r.resolvedId, confidence: r.confidence, tier: r.tier }));
}

function buildNeedsHumanReview(idMapperResults) {
  return idMapperResults
    .filter(r => r.needsHumanReview)
    .map(r => ({
      originalId: r.originalId,
      tier: r.tier,
      confidence: r.confidence,
      evidence: r.evidence,
      competingConcepts: r.competingConcepts
    }));
}

function buildUnknownIds(idMapperResults) {
  return idMapperResults
    .filter(r => r.tier === 'unresolved')
    .map(r => ({ originalId: r.originalId }));
}

function buildMerged(mergeResults) {
  return mergeResults.map(m => ({
    canonicalId: m.canonicalId,
    contributingCandidates: m.contributingCandidates,
    aliasesAdded: m.aliases.added.length,
    phrasesAdded: m.phraseVariations.added.length,
    patternsAdded: m.parserPatterns.added.length
  }));
}

function buildAdditions(mergeResults, field) {
  return mergeResults
    .filter(m => m[field].added.length > 0)
    .map(m => ({ canonicalId: m.canonicalId, added: m[field].added }));
}

function buildProvenance(idMapperResults) {
  // Full provenance-object construction (batch/source/importedAt) belongs
  // to KnowledgeImporter/IdMapper per the approved architecture; this is
  // only an echo of the id pairs ImportReport already has on hand.
  return idMapperResults
    .filter(r => !r.needsHumanReview)
    .map(r => ({ originalId: r.originalId, resolvedId: r.resolvedId }));
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

/**
 * @param {object} input
 * @param {object} [input.batchMeta] - optional cosmetic header info, e.g. { name, importedAt }
 * @param {object[]} input.idMapperResults - IdMapper.resolveBatch() output
 * @param {object} input.mergeOutput - AliasMerger.mergeBatch() output ({ mergeResults, skipped })
 * @param {object} input.conflictReport - ConflictDetector.detectConflicts() output
 * @returns {{ report: object, markdown: string }}
 */
function generateReport({ batchMeta = null, idMapperResults, mergeOutput, conflictReport }) {
  if (!Array.isArray(idMapperResults)) {
    throw new Error('ImportReport.generateReport: idMapperResults is required (IdMapper.resolveBatch() output).');
  }
  if (!mergeOutput || !Array.isArray(mergeOutput.mergeResults) || !Array.isArray(mergeOutput.skipped)) {
    throw new Error('ImportReport.generateReport: mergeOutput is required (AliasMerger.mergeBatch() output).');
  }
  if (!conflictReport) {
    throw new Error('ImportReport.generateReport: conflictReport is required (ConflictDetector.detectConflicts() output).');
  }

  const imported = buildImported(idMapperResults);
  const merged = buildMerged(mergeOutput.mergeResults);
  const needsHumanReview = buildNeedsHumanReview(idMapperResults);

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      batch: batchMeta
    },
    summary: {
      totalCandidates: idMapperResults.length,
      imported: imported.length,
      mergedConcepts: merged.length,
      needsHumanReview: needsHumanReview.length,
      duplicateOriginalIds: conflictReport.duplicateOriginalIds.length,
      crossConceptProductionCollisions: conflictReport.crossConceptProductionCollisions.length,
      crossConceptBatchCollisions: conflictReport.crossConceptBatchCollisions.length,
      clean: conflictReport.clean
    },
    imported,
    merged,
    skipped: mergeOutput.skipped,
    duplicateIds: conflictReport.duplicateOriginalIds,
    unknownIds: buildUnknownIds(idMapperResults),
    conflicts: {
      crossConceptProductionCollisions: conflictReport.crossConceptProductionCollisions,
      crossConceptBatchCollisions: conflictReport.crossConceptBatchCollisions
    },
    aliasAdditions: buildAdditions(mergeOutput.mergeResults, 'aliases'),
    phraseAdditions: buildAdditions(mergeOutput.mergeResults, 'phraseVariations'),
    parserAdditions: buildAdditions(mergeOutput.mergeResults, 'parserPatterns'),
    provenance: buildProvenance(idMapperResults),
    needsHumanReview,
    unsupportedSchemaTypes: {
      available: false,
      reason: 'Schema Validation stage not yet implemented in this repository.'
    },
    notImported: {
      available: false,
      reason: 'KnowledgeImporter batch intake / rule-and-signal-file filtering not yet implemented.'
    },
    relationshipHints: {
      available: false,
      reason: 'Relationship extraction is deferred per the approved architecture.'
    }
  };

  return { report, markdown: renderMarkdown(report) };
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function mdList(items, formatter) {
  if (!items || items.length === 0) return '_None._\n';
  return items.map(item => `- ${formatter(item)}`).join('\n') + '\n';
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Import Report`);
  lines.push('');
  lines.push(`Generated: ${report.meta.generatedAt}`);
  if (report.meta.batch) lines.push(`Batch: ${JSON.stringify(report.meta.batch)}`);
  lines.push('');

  lines.push(`## Summary`);
  lines.push('');
  for (const [key, value] of Object.entries(report.summary)) {
    lines.push(`- **${key}**: ${value}`);
  }
  lines.push('');

  lines.push(`## Imported`);
  lines.push('');
  lines.push(mdList(report.imported, r => `\`${r.originalId}\` → \`${r.resolvedId}\` (${r.tier}, ${r.confidence}%)`));

  lines.push(`## Merged`);
  lines.push('');
  lines.push(mdList(report.merged, m =>
    `\`${m.canonicalId}\` — ${m.contributingCandidates.length} candidate(s), +${m.aliasesAdded} alias(es), +${m.phrasesAdded} phrase(s), +${m.patternsAdded} pattern(s)`));

  lines.push(`## Skipped`);
  lines.push('');
  lines.push(mdList(report.skipped, s => `\`${s.originalId}\` (${s.tier}, ${s.confidence}%)`));

  lines.push(`## Duplicate IDs`);
  lines.push('');
  lines.push(mdList(report.duplicateIds, d => `\`${d.originalId}\` appears ${d.occurrences.length} times`));

  lines.push(`## Unknown IDs`);
  lines.push('');
  lines.push(mdList(report.unknownIds, u => `\`${u.originalId}\``));

  lines.push(`## Conflicts`);
  lines.push('');
  lines.push(`### Cross-concept production collisions`);
  lines.push('');
  lines.push(mdList(report.conflicts.crossConceptProductionCollisions,
    c => `"${c.text}" added to \`${c.group}\` already belongs to ${c.collidesWith.map(h => `\`${h.canonicalId}\``).join(', ')}`));
  lines.push(`### Cross-concept batch collisions`);
  lines.push('');
  lines.push(mdList(report.conflicts.crossConceptBatchCollisions,
    c => `"${c.normalized}" claimed by ${c.canonicalIds.map(id => `\`${id}\``).join(', ')} within this batch`));

  lines.push(`## Alias Additions`);
  lines.push('');
  lines.push(mdList(report.aliasAdditions, a => `\`${a.canonicalId}\`: ${a.added.join(', ')}`));

  lines.push(`## Phrase Additions`);
  lines.push('');
  lines.push(mdList(report.phraseAdditions, a => `\`${a.canonicalId}\`: ${a.added.join(', ')}`));

  lines.push(`## Parser Additions`);
  lines.push('');
  lines.push(mdList(report.parserAdditions, a => `\`${a.canonicalId}\`: ${a.added.join(', ')}`));

  lines.push(`## Provenance`);
  lines.push('');
  lines.push(mdList(report.provenance, p => `\`${p.originalId}\` → \`${p.resolvedId}\``));

  lines.push(`## Needs Human Review`);
  lines.push('');
  lines.push(mdList(report.needsHumanReview, r =>
    `\`${r.originalId}\` (${r.tier}, ${r.confidence}%)${r.competingConcepts.length ? ' — competing: ' + r.competingConcepts.join(', ') : ''}`));

  lines.push(`## Unsupported Schema Types`);
  lines.push('');
  lines.push(report.unsupportedSchemaTypes.available ? '' : `_Not available: ${report.unsupportedSchemaTypes.reason}_`);
  lines.push('');

  lines.push(`## Not Imported`);
  lines.push('');
  lines.push(report.notImported.available ? '' : `_Not available: ${report.notImported.reason}_`);
  lines.push('');

  lines.push(`## Relationship Hints`);
  lines.push('');
  lines.push(report.relationshipHints.available ? '' : `_Not available: ${report.relationshipHints.reason}_`);
  lines.push('');

  return lines.join('\n');
}

export default {
  name: 'ImportReport',
  generateReport,
  renderMarkdown
};