import { AssessmentContract } from './AssessmentContract.js';

export class RiskAssessment {
  /**
   * Consumes all findings and produces a singular Risk Assessment.
   * @param {Array<Object>} findings
   * @param {Array<Object>} narratives List of resolved narratives
   * @returns {AssessmentContract}
   */
  evaluate(findings, narratives = []) {
    const riskFindings = findings.filter(f => f.category === 'Risk');

    if (riskFindings.length === 0) {
      return new AssessmentContract('Risk', 'Low', 'No significant contractual risks were identified.', [], [], 1.0);
    }

    let maxSeverity = 'Low';
    if (riskFindings.some(f => f.severity === 'Critical')) maxSeverity = 'Critical';
    else if (riskFindings.some(f => f.severity === 'High')) maxSeverity = 'High';
    else if (riskFindings.some(f => f.severity === 'Medium')) maxSeverity = 'Medium';

    const evidence = riskFindings.map(f => ({
      findingId: f.id,
      type: f.type,
      rule: f.rule,
      severity: f.severity
    }));

    // Deterministic summary generation
    const findingTypes = [...new Set(riskFindings.map(f => f.type))];
    const originalSummary = `Detected ${riskFindings.length} risk(s) related to: ${findingTypes.join(', ')}.`;

    // Generate narrative risk analysis explaining business impact from narratives array
    const riskIds = new Set(
      riskFindings.map(f => f.id)
    );

    const riskNarratives = narratives.filter(
      n => riskIds.has(n.findingId)
    );

    const narrativeMap = new Map(
      riskNarratives.map(n => [n.findingId, n])
    );

    const summaryNarratives = riskNarratives
      .map(rn => rn.narrative)
      .filter(Boolean);

    const summary =
      summaryNarratives.length > 0
        ? summaryNarratives.join("\n\n")
        : originalSummary;

    const recommendations = [
      ...new Set(
        riskFindings.map(f => {
          const narrative = narrativeMap.get(f.id);
          return (
            narrative?.recommendation ??
            `Review ${f.type} clause for excessive exposure.`
          );
        })
      )
    ];
    const contract = new AssessmentContract('Risk', maxSeverity, summary, evidence, recommendations, 1.0);
    // Augment existing output instead of replacing fields
    contract.originalSummary = originalSummary;
    contract.narrative = summary;

    return contract;
  }
}
