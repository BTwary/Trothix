/**
 * @fileoverview FindingNarrator.js
 * Converts deterministic findings into structured narrative objects.
 * The narrator never invents facts—it only combines:
 *   - Finding data
 *   - Rule metadata
 *   - Evidence variables
 *   - Explanation templates
 */

export class FindingNarrator {
  /**
   * @param {import('./ExplanationLibrary.js').ExplanationLibrary} explanationLibrary
   */
  constructor(explanationLibrary) {
    this.library = explanationLibrary;
  }

  /**
   * Escapes a string before using it inside a RegExp.
   * @param {string} value
   * @returns {string}
   */
  escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Performs placeholder substitution on a template.
   * Example:
   *   "Party {party} must pay {amount}"
   *
   * @param {string} text
   * @param {Object} variables
   * @returns {string}
   */
  fillTemplate(text = "", variables = {}) {
    let result = text;

    for (const [key, value] of Object.entries(variables)) {
      const replacement =
        typeof value === "string"
          ? value
          : String(value ?? "Unknown");

      result = result.replace(
        new RegExp(`{${this.escapeRegex(key)}}`, "g"),
        replacement
      );
    }

    return result;
  }

  /**
   * Generates a narrated finding.
   *
   * @param {Object} finding
   * @param {Object} resolvedMetadata
   * @param {Object} variables
   * @returns {Object}
   */
  narrate(finding, resolvedMetadata = {}, variables = {}) {
    const metadata = resolvedMetadata || {};

    const template =
      this.library.getTemplate(
        metadata.id,
        metadata.trigger
      ) || {};
    

    const title = template.title ??
      metadata.trigger ??
      finding.type ??
      null;

    const summary = this.fillTemplate(
      template.summary ??
      metadata.rationale ??
      finding.message ??
      "",
      variables
    );

    const businessImpact = this.fillTemplate(
      template.businessImpact ?? "",
      variables
    );

    const legalImpact = this.fillTemplate(
      template.legalImpact ?? "",
      variables
    );

    const recommendation = this.fillTemplate(
      template.recommendation ??
      metadata.recommendation ??
      "",
      variables
    );
    const negotiationTip = template.negotiationTip
    ? this.fillTemplate(template.negotiationTip, variables)
    : null;
    const impact = [businessImpact, legalImpact]
  .filter(Boolean)
  .join(" ");

    const evidence = {
      clause: variables.clause ?? null,
      extractedText: variables.extractedText ?? null,
      source: variables.source ?? "IR",
      confidence: variables.confidence ?? null
    };
    return Object.freeze({
      findingId: finding.id,

      ruleId: metadata.id ?? null,

      findingType: finding.type ?? null,

      title,

      summary,

      businessImpact,

      legalImpact,

      impact,

      recommendation,

      negotiationTip,

      rationale: metadata.rationale ?? null,

      evidence,

      confidence: evidence.confidence,

      category:
        finding.category ??
        metadata.category ??
        "General",

      severity:
        finding.severity ??
        metadata.severity ??
        "Medium",

      originalFinding: finding
    });
  }
}
