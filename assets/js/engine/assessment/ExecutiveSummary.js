import { NarrativeFormatter } from './NarrativeFormatter.js';
import { CrossFindingSynthesizer } from './CrossFindingSynthesizer.js';

export class ExecutiveSummary {

  constructor(formatter = new NarrativeFormatter(), synthesizer = new CrossFindingSynthesizer()) {
    this.formatter = formatter;
    this.synthesizer = synthesizer;
  }

  /**
   * Generates a narrative summary alongside a factual, deterministic stats object.
   */
  evaluate(ir, findings, riskAssessment, positiveAssessment, narratives = []) {

    const criticalFindings = findings.filter(f => f.severity === 'Critical');
    const highFindings = findings.filter(f => f.severity === 'High');
    const mediumFindings = findings.filter(f => f.severity === 'Medium');

    const severityOrder = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1
    };

    const highestRiskFinding = findings
      .filter(f => f.category === 'Risk')
      .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])[0];

    const stats = {
      documentType: ir.metadata?.category || "Unknown Document Type",
      parties: ir.metadata?.parties || [],
      highestRisk: highestRiskFinding
        ? highestRiskFinding.type
        : "None identified",
      highestPositive:
        positiveAssessment.severity === "Positive" &&
          positiveAssessment.evidence.length > 0
          ? positiveAssessment.evidence[0].type
          : "None identified",
      findingCounts: {
        critical: criticalFindings.length,
        high: highFindings.length,
        medium: mediumFindings.length,
        total: findings.length
      }
    };

    const findingMap = new Map(
      findings.map(f => [f.id, f])
    );

    const riskNarratives = narratives.filter(n => {
      const finding = findingMap.get(n.findingId);
      return finding?.category === "Risk";
    });

    const positiveNarratives = narratives.filter(n => {
      const finding = findingMap.get(n.findingId);
      return finding?.category === "Positive";
    });

    const docType = ir.metadata?.category || "Agreement";
    const parties = ir.metadata?.parties || [];

    // Recurring-theme headline (e.g. "3 findings cluster around Payment &
    // Cash Flow") — pure grouping over findings/narratives that already
    // exist; see CrossFindingSynthesizer for the deterministic rules.
    const themes = this.synthesizer.groupThemes(findings, narratives);
    const themeHeadline = this.synthesizer.headline(themes);

    const executiveSummary = this.formatter.formatExecutiveSummary(
      docType,
      parties,
      riskNarratives,
      positiveNarratives,
      stats.findingCounts,
      themeHeadline
    );

    return {
      stats,
      executiveSummary,
      themes,
      themeHeadline
    };
  }
}