/**
 * @fileoverview RuleMetadataResolver.js
 * Thin adapter over KnowledgeProvider that resolves findings to their compiled rule metadata.
 */

export class RuleMetadataResolver {
  /**
   * @param {Object} knowledgeProvider The Trothix KnowledgeProvider instance
   */
  constructor(knowledgeProvider) {
    this.knowledgeProvider = knowledgeProvider;
  }

  /**
   * Resolves a finding to its originating rule metadata.
   * @param {Object} finding
   * @returns {Object} Structured rule metadata
   */
  resolve(finding) {
    const ruleId = finding.rule || finding.id;
    const ruleMeta = this.knowledgeProvider ? this.knowledgeProvider.getRuleMetadata(ruleId) : null;

    if (ruleMeta) {
      return {
        id: ruleMeta.id,
        concept: ruleMeta.concept || null,
        category: ruleMeta.category || finding.category || "General",
        severity: ruleMeta.severity || finding.severity || "Medium",
        rationale: ruleMeta.rationale || (ruleMeta.then ? ruleMeta.then.message : ""),
        recommendation: ruleMeta.recommendation || (ruleMeta.then ? ruleMeta.then.recommendation : ""),
        trigger: ruleMeta.then ? ruleMeta.then.trigger : (ruleMeta.findingType || finding.type),
        raw: ruleMeta
      };
    }

    // Default metadata fallback if the rule is not registered/compiled
    return {
      id: ruleId,
      concept: finding.category || null,
      category: finding.category || "General",
      severity: finding.severity || "Medium",
      rationale: finding.message || `Rule ${ruleId} was triggered.`,
      recommendation: "Review the clause for compliance.",
      trigger: finding.type || ruleId,
      raw: {}
    };
  }
}
