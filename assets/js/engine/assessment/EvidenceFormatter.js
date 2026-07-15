/**
 * @fileoverview EvidenceFormatter.js
 * Reporting-layer component (Evidence Traceability sprint).
 *
 * Builds a deterministic, per-finding "Evidence Chain" by re-shaping data
 * the frozen runtime/parser/Legal IR/ontology/rule engine/knowledge system
 * already computed on this run: finding fields set by Trothix.js
 * (f.rule, f.concept, f.node, f.evidence, f.matchedAliases,
 * f.conceptRecord, f.sources, f.jurisdictionNotes, f.exceptions, ...), the
 * Legal IR node tree, and the compiled rule's authored metadata
 * (knowledgeProvider.getRuleMetadata()).
 *
 * This module performs no rule evaluation, no ontology inference, no
 * scoring, and no LLM-backed reasoning — every field below is either a
 * direct read of already-resolved data or a deterministic string-template
 * composition over it. Given the same finding/ir/knowledgeProvider input,
 * it always produces byte-identical output.
 *
 * Defensive by design (mirrors ReportAssembler's existing explainability
 * surfaces): a missing knowledgeProvider or an under-populated finding
 * degrades individual fields to null/empty rather than throwing, so this
 * remains safe to call from existing unit tests that construct
 * ReportAssembler directly without a full Trothix.js run.
 */

const MAX_EXCERPT_LENGTH = 400;

/**
 * Deterministically renders a compiled rule's authored `when` condition
 * tree (see RuleCompiler.js's `_compileCondition` schema) into a short,
 * human-readable sentence. Pure recursive string composition over the
 * rule's already-authored JSON — no evaluation happens here, since the
 * rule has already fired by the time a finding reaches this formatter.
 * @param {Object|null|undefined} condition
 * @returns {string}
 */
export function describeCondition(condition) {
  if (!condition || typeof condition !== 'object') return 'an unspecified condition';

  if (Array.isArray(condition.and)) {
    return condition.and.map(describeCondition).join(' AND ');
  }
  if (Array.isArray(condition.all)) {
    return condition.all.map(describeCondition).join(' AND ');
  }
  if (Array.isArray(condition.or)) {
    return `(${condition.or.map(describeCondition).join(' OR ')})`;
  }
  if (Array.isArray(condition.any)) {
    return `(${condition.any.map(describeCondition).join(' OR ')})`;
  }
  if (condition.not) {
    return `NOT (${describeCondition(condition.not)})`;
  }
  if (condition.type === 'conceptExists') {
    return `concept "${condition.value}" is present in the document`;
  }
  if (condition.type === 'conceptMissing') {
    return `concept "${condition.value}" is absent from the document`;
  }
  if (condition.type === 'documentRequiresConcept') {
    return `the document type requires concept "${condition.value}"`;
  }
  if (condition.field) {
    const field = condition.field;
    if (condition.exists === true) return `field "${field}" exists`;
    if (condition.missing === true) return `field "${field}" is missing`;
    if (condition.equals !== undefined) return `field "${field}" equals "${condition.equals}"`;
    if (condition.not_equals !== undefined) return `field "${field}" does not equal "${condition.not_equals}"`;
    if (condition.contains !== undefined) return `field "${field}" contains "${condition.contains}"`;
    if (condition.starts_with !== undefined) return `field "${field}" starts with "${condition.starts_with}"`;
    if (condition.ends_with !== undefined) return `field "${field}" ends with "${condition.ends_with}"`;
    if (condition.in !== undefined) return `field "${field}" is one of [${(condition.in || []).join(', ')}]`;
    if (condition.greater_than !== undefined) return `field "${field}" is greater than ${condition.greater_than}`;
    if (condition.less_than !== undefined) return `field "${field}" is less than ${condition.less_than}`;
    return `field "${field}" matched the rule's condition`;
  }
  if (typeof condition.missing === 'string') {
    return `field "${condition.missing}" is missing`;
  }
  return 'an unspecified condition';
}

export class EvidenceFormatter {
  /**
   * Builds the Evidence Chain for a single finding.
   * @param {Object} finding A finding already enriched by Trothix.js
   * @param {Object} ir The Legal IR document (nodes/edges/metadata)
   * @param {import('../knowledge/KnowledgeProvider.js').KnowledgeProvider} [knowledgeProvider]
   * @returns {Object} The finding's deterministic Evidence Chain
   */
  build(finding, ir, knowledgeProvider = null) {
    const f = finding || {};
    const ruleMeta = (knowledgeProvider && f.rule) ? (knowledgeProvider.getRuleMetadata(f.rule) || {}) : {};
    const then = ruleMeta.then || {};

    const matchedPhrasesAndTokens = this._buildMatchedPhrasesAndTokens(f);

    return {
      findingId: f.id || null,
      firedRule: this._buildFiredRule(f, ruleMeta, then),
      supportingEvidence: this._buildSupportingEvidence(f),
      matchedPhrasesAndTokens,
      clauseLocation: this._buildClauseLocation(f),
      ontologyConcepts: this._buildOntologyConcepts(f, knowledgeProvider),
      confidenceRationale: this._buildConfidenceRationale(f, matchedPhrasesAndTokens),
      applicableLegalPrinciple: this._buildApplicableLegalPrinciple(f, knowledgeProvider)
    };
  }

  /**
   * The fired rule: which rule triggered, its authored condition (rendered
   * to plain English), and the rationale/recommendation/legal effect the
   * knowledge base already authored for it.
   */
  _buildFiredRule(f, ruleMeta, then) {
    return {
      id: f.rule || null,
      name: ruleMeta.name || null,
      category: ruleMeta.category || f.category || null,
      severity: ruleMeta.severity || f.severity || null,
      status: ruleMeta.status || null,
      trigger: then.trigger || f.type || null,
      conditionSummary: ruleMeta.when ? describeCondition(ruleMeta.when) : null,
      rationale: then.rationale || ruleMeta.rationale || null,
      recommendation: then.recommendation || ruleMeta.recommendation || null,
      legalEffect: ruleMeta.legal_effect || null,
      jurisdiction: ruleMeta.jurisdiction || null
    };
  }

  /**
   * The raw supporting evidence: the matched clause text (truncated for
   * display) and the physical span/node it was extracted from.
   */
  _buildSupportingEvidence(f) {
    const matchedText = (f.evidence && f.evidence.matchedText) || (f.node && f.node.text) || null;
    return {
      matchedText,
      excerpt: matchedText
        ? (matchedText.length > MAX_EXCERPT_LENGTH ? `${matchedText.slice(0, MAX_EXCERPT_LENGTH)}…` : matchedText)
        : null,
      nodeId: (f.node && f.node.id) || null,
      nodeKind: (f.node && f.node.kind) || null,
      span: (f.evidence && f.evidence.span) || f.span || null
    };
  }

  /**
   * The specific matched phrases (from phrases.json) and matched aliases
   * (from the concept's authored alias list) that link this finding's
   * clause text to its ontology concept.
   */
  _buildMatchedPhrasesAndTokens(f) {
    const matchedPhrases = (f.evidence && f.evidence.matchedPhrases) || [];
    const matchedAliases = f.matchedAliases || [];
    return {
      matchedPhrases,
      matchedAliases,
      totalMatches: matchedPhrases.length + matchedAliases.length
    };
  }

  /**
   * Where in the document this finding's evidence physically lives:
   * clause node id, structural parent, classified category, and character
   * span — all already computed by clauseClassifier/actionBuilder/the rule
   * evaluator, simply surfaced here.
   */
  _buildClauseLocation(f) {
    const node = f.node || null;
    const candidates = (node && node.metadata && node.metadata.candidates) || [];
    const span = (f.evidence && f.evidence.span) || f.span || null;
    return {
      nodeId: node ? node.id : null,
      parentNodeId: node ? (node.parent || null) : null,
      nodeKind: node ? node.kind : null,
      clauseCategory: candidates[0] ? candidates[0].id : null,
      clauseCategoryScore: candidates[0] ? candidates[0].score : null,
      spanStart: span ? (span.start ?? null) : null,
      spanEnd: span ? (span.end ?? null) : null
    };
  }

  /**
   * The ontology concept this finding is linked to, plus the concept's
   * full authored surface-form vocabulary (for context on what could have
   * matched versus what actually did, in matchedPhrasesAndTokens above).
   */
  _buildOntologyConcepts(f, knowledgeProvider) {
    const concept = f.concept || null;
    return {
      concept,
      conceptRecord: f.conceptRecord || null,
      ontologyNodeType: f.ontologyNode || null,
      knownAliases: (knowledgeProvider && concept) ? knowledgeProvider.getAliases(concept) : [],
      knownPhrases: (knowledgeProvider && concept) ? knowledgeProvider.getPhrasesForConcept(concept) : []
    };
  }

  /**
   * A deterministic, factor-by-factor explanation of the finding's
   * confidence value. No new confidence number is computed here — this
   * only explains the already-assigned f.confidence (set by RuleEvaluator
   * from the rule's authored metadata) in terms of the evidence that
   * backs it.
   */
  _buildConfidenceRationale(f, matchedPhrasesAndTokens) {
    const baseConfidence = typeof f.confidence === 'number' ? f.confidence : 1.0;
    const hasNodeEvidence = !!f.node;
    const matchCount = matchedPhrasesAndTokens.totalMatches;

    const factors = [
      {
        factor: 'ruleBaseConfidence',
        value: baseConfidence,
        description: `The compiled rule "${f.rule || 'unknown'}" was authored with a base confidence of ${baseConfidence}.`
      },
      {
        factor: 'clauseEvidencePresent',
        value: hasNodeEvidence,
        description: hasNodeEvidence
          ? `The finding is anchored to clause node "${f.node.id}".`
          : 'The finding is document-level and is not anchored to a specific clause node.'
      },
      {
        factor: 'surfaceFormMatches',
        value: matchCount,
        description: matchCount > 0
          ? `${matchCount} matched phrase(s)/alias(es) were found linking the clause text to its ontology concept.`
          : 'No matched phrases or aliases were recorded for this finding.'
      }
    ];

    return {
      baseConfidence,
      factors,
      rationale: factors.map(x => x.description).join(' ')
    };
  }

  /**
   * The applicable legal principle(s) backing this finding: authoritative
   * citations, jurisdiction-specific guidance, and carve-outs already
   * resolved from the knowledge base for this finding's concept.
   * Prefers the values already resolved onto the finding by Trothix.js
   * (f.sources/f.jurisdictionNotes/f.exceptions) so the Evidence Chain
   * stays consistent with what the rest of the report shows; falls back
   * to a direct KnowledgeProvider lookup when those weren't populated
   * (e.g. ReportAssembler exercised directly in a unit test).
   */
  _buildApplicableLegalPrinciple(f, knowledgeProvider) {
    const concept = f.concept || null;
    const sources = f.sources || (knowledgeProvider && concept ? knowledgeProvider.getSources(concept) : []);
    const jurisdictionNotes = f.jurisdictionNotes || (knowledgeProvider && concept ? knowledgeProvider.getJurisdictionNotes(concept) : []);
    const exceptions = f.exceptions || (knowledgeProvider && concept ? knowledgeProvider.getExceptions(concept) : []);

    return { sources, jurisdictionNotes, exceptions };
  }
}
