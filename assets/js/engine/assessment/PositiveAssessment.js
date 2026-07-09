import { AssessmentContract } from './AssessmentContract.js';

export class PositiveAssessment {
  /**
   * Consumes all findings and produces a singular Positive Assessment.
   * @param {Array<Object>} findings
   * @param {Array<Object>} narratives List of resolved narratives
   * @returns {AssessmentContract}
   */
  evaluate(findings, narratives = []) {
    const positiveFindings = findings.filter(f => f.category === 'Positive');

    if (positiveFindings.length === 0) {
      return new AssessmentContract(
        'Positive',
        'Neutral',
        'No specific strong protections detected.',
        [],
        [],
        1.0
      );
    }

    const strengths = positiveFindings.map(f => f.type);
    const originalSummary =
      `Detected ${positiveFindings.length} strong protections: ${strengths.join(', ')}.`;

    // Build lookup set once
    const positiveIds = new Set(
      positiveFindings.map(f => f.id)
    );

    // Collect matching narratives
    const positiveNarratives = narratives.filter(
      n => positiveIds.has(n.findingId)
    );

    // Fast lookup by finding id
    const narrativeMap = new Map(
      positiveNarratives.map(n => [n.findingId, n])
    );

    const summaryNarratives = positiveNarratives
      .map(n => n.narrative)
      .filter(Boolean);

    const summary =
      summaryNarratives.length > 0
        ? summaryNarratives.join("\n\n")
        : originalSummary;

    const evidence = positiveFindings.map(f => ({
      findingId: f.id,
      type: f.type
    }));

    const recommendations = [
      ...new Set(
        positiveFindings
          .map(f => narrativeMap.get(f.id)?.recommendation)
          .filter(Boolean)
      )
    ];

    const contract = new AssessmentContract(
      'Positive',
      'Positive',
      summary,
      evidence,
      recommendations,
      0.95
    );

    // Preserve backward compatibility
    contract.originalSummary = originalSummary;
    contract.narrative = summary;

    return contract;
  }
}