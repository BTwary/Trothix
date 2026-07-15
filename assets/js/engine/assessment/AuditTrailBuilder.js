/**
 * @fileoverview AuditTrailBuilder.js
 * Reporting-layer component (Evidence Traceability sprint).
 *
 * Aggregates the per-finding Evidence Chains (EvidenceFormatter) and
 * reasoning traces (ReasoningTraceBuilder) — plus data ReportAssembler
 * already computes (documentHash, pipelineTrace, scores, verdict) — into
 * a single document-level audit trail: which rules fired and how often,
 * which ontology concepts and clause nodes were touched, and a
 * chain-of-custody summary of engine execution.
 *
 * Purely a deterministic rollup over already-computed data. No rule
 * evaluation, scoring, or LLM-backed reasoning happens here, and no
 * fields are fabricated: counts are derived from the findings/evidence
 * chains passed in, and the only values not already present elsewhere in
 * the report are simple aggregates (sums, sorted unique sets) of them.
 */

export class AuditTrailBuilder {
  /**
   * Builds the document-level audit trail.
   * @param {Object} params
   * @param {Object[]} params.findings
   * @param {Object[]} params.evidenceChains Output of EvidenceFormatter.build() per finding
   * @param {string|null} [params.documentHash] The report's documentHash (metadata.documentHash)
   * @param {Object} [params.scores]
   * @param {Object} [params.verdict]
   * @param {Object[]} [params.pipelineTrace] DeveloperInspector's captured engine execution events
   * @returns {Object} The document's deterministic audit trail
   */
  build({ findings = [], evidenceChains = [], documentHash = null, scores = null, verdict = null, pipelineTrace = [] } = {}) {
    const ruleFireCounts = this._countRuleFirings(findings);
    const conceptsInvoked = this._uniqueSorted(findings.map(f => f.concept).filter(Boolean));
    const clauseNodesTouched = this._uniqueSorted(
      findings.map(f => (f.node && f.node.id) || f.nodeId).filter(Boolean)
    );

    const evidenceChainSummaries = evidenceChains.map(c => ({
      findingId: c.findingId,
      ruleId: (c.firedRule && c.firedRule.id) || null,
      concept: (c.ontologyConcepts && c.ontologyConcepts.concept) || null,
      clauseNodeId: (c.clauseLocation && c.clauseLocation.nodeId) || null,
      matchedEvidenceCount: (c.matchedPhrasesAndTokens && c.matchedPhrasesAndTokens.totalMatches) || 0,
      confidence: (c.confidenceRationale && c.confidenceRationale.baseConfidence) ?? null
    }));

    const engineExecutionSummary = (pipelineTrace || [])
      .filter(e => e && e.type === 'END')
      .map(e => ({
        engine: e.engine,
        duration: typeof e.duration === 'number' ? e.duration : null,
        findingsEmitted: e.findingsEmitted || 0,
        warnings: e.warnings || []
      }));

    return {
      documentHash,
      totalFindings: findings.length,
      totalEvidenceChains: evidenceChains.length,
      rulesFired: ruleFireCounts,
      conceptsInvoked,
      clauseNodesTouched,
      evidenceChainSummaries,
      engineExecutionSummary,
      verdictSummary: verdict
        ? { verdict: verdict.verdict || null, confidence: verdict.confidence ?? null }
        : null,
      overallScore: scores ? (scores.overallScore ?? null) : null,
      integrity: {
        deterministic: true,
        llmDependent: false,
        schemaVersion: "1.0.0"
      }
    };
  }

  /**
   * Counts how many findings each rule id produced, sorted alphabetically
   * by rule id for stable, reproducible output.
   * @param {Object[]} findings
   * @returns {{ruleId: string, count: number}[]}
   */
  _countRuleFirings(findings) {
    const counts = {};
    findings.forEach(f => {
      if (!f.rule) return;
      counts[f.rule] = (counts[f.rule] || 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map(ruleId => ({ ruleId, count: counts[ruleId] }));
  }

  /**
   * @param {string[]} values
   * @returns {string[]} Deduplicated, alphabetically sorted values
   */
  _uniqueSorted(values) {
    return [...new Set(values)].sort();
  }
}
