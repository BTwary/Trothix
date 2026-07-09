/**
 * @fileoverview NarrativeFormatter.js
 * Formats structured narrative components into cohesive, natural, and fluent paragraphs
 * that read like reports from an experienced legal analyst.
 */

export class NarrativeFormatter {
  /**
   * Combines finding summary, impact, and recommendation into a single cohesive paragraph.
   * @param {Object} narratedFinding An object with summary, impact, and recommendation fields.
   * @returns {string} Combined and formatted narrative string
   */
  formatFinding(narratedFinding) {
    const parts = [];
    if (narratedFinding.summary) {
      parts.push(narratedFinding.summary);
    }
    if (narratedFinding.impact) {
      parts.push(narratedFinding.impact);
    }
    if (narratedFinding.recommendation) {
      // Append recommendation with a clean introductory prefix
      const rec = narratedFinding.recommendation.trim();
      const prefix = rec.toLowerCase().startsWith("recommendation:") ? "" : "Recommendation: ";
      parts.push(`${prefix}${rec}`);
    }
    return parts.join(" ");
  }

  /**
   * Constructs a cohesive executive summary narrative paragraph.
   * @param {string} docType The category/type of the document
   * @param {string[]} parties The parties involved
   * @param {Object[]} riskNarratives List of narrated risk findings
   * @param {Object[]} positiveNarratives List of narrated positive findings
   * @returns {string} Fluent narrative paragraph
   */
  formatExecutiveSummary(docType, parties, riskNarratives = [], positiveNarratives = []) {
    const docName = docType || "Agreement";
    const partiesStr = parties && parties.length > 0 ? parties.join(" and ") : "the parties";
    let narrative = `This is a review of the ${docName} between ${partiesStr}. `;

    if (riskNarratives.length === 0 && positiveNarratives.length === 0) {
      narrative += "Based on our deterministic analysis, the contract adheres to standard terms with no notable deviations identified.";
      return narrative;
    }

    if (riskNarratives.length > 0) {
      const topRisk = riskNarratives[0];
      const riskTitle = topRisk.title || "unspecified issue";
      const riskSummary = topRisk.summary ? topRisk.summary.charAt(0).toLowerCase() + topRisk.summary.slice(1) : "";
      
      narrative += `The primary area of risk centers on the ${riskTitle}. Specifically, ${riskSummary} ${topRisk.impact} `;
    }

    if (positiveNarratives.length > 0) {
      const topPositive = positiveNarratives[0];
      const posTitle = topPositive.title || "protection";
      const posSummary = topPositive.summary ? topPositive.summary.charAt(0).toLowerCase() + topPositive.summary.slice(1) : "";

      narrative += `On the positive side, the contract features solid protections concerning the ${posTitle}. In particular, ${posSummary} ${topPositive.impact} `;
    }

    const remainingRisks = riskNarratives.length;
    if (remainingRisks > 1) {
      narrative += `Overall, we identified ${remainingRisks} risk factors that merit attention. `;
      narrative += "We recommend negotiating these key clauses to limit risk exposure prior to signing.";
    } else {
      narrative += "We suggest conducting standard due diligence and correcting the noted items before execution.";
    }

    return narrative;
  }
}
