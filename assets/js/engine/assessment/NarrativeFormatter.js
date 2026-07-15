/**
 * @fileoverview NarrativeFormatter.js
 * Formats structured narrative components (produced deterministically by
 * FindingNarrator from finding data + rule metadata + templates) into
 * cohesive, natural, and fluent paragraphs that read like a report written
 * by an experienced legal analyst.
 *
 * This module performs no rule evaluation, invents no facts, and pulls no
 * data beyond what it is handed — it only decides how to phrase and stitch
 * together text that already exists on the narrated finding.
 */

export class NarrativeFormatter {

  /**
   * Lower-cases the first character of a sentence so it can be spliced
   * into the middle of another sentence (e.g. after "Specifically, ").
   * @param {string} text
   * @returns {string}
   */
  _lowerFirst(text) {
    if (!text) return "";
    return text.charAt(0).toLowerCase() + text.slice(1);
  }

  /**
   * Ensures a sentence fragment ends with terminal punctuation before it
   * is concatenated with the next sentence, and trims stray whitespace.
   * @param {string} text
   * @returns {string}
   */
  _sentence(text) {
    if (!text) return "";
    const trimmed = text.trim();
    if (!trimmed) return "";
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }

  /**
   * Joins non-empty sentence fragments with single spaces, skipping any
   * that are missing rather than inserting blank gaps or "undefined".
   * @param {Array<string|null|undefined>} fragments
   * @returns {string}
   */
  _join(fragments) {
    return fragments
      .map(f => this._sentence(f))
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Combines a narrated finding's summary, business impact, legal impact,
   * and recommendation into a single cohesive analyst-style paragraph.
   *
   * Structure: what the finding is -> what it means for the business ->
   * what it means legally -> what to do about it -> (optional) how to
   * negotiate it, for findings where a negotiation angle applies.
   *
   * @param {Object} narratedFinding Output of FindingNarrator.narrate()
   * @returns {string} Combined and formatted narrative string
   */
  formatFinding(narratedFinding = {}) {
    const parts = [];

    if (narratedFinding.summary) {
      parts.push(narratedFinding.summary);
    }

    if (narratedFinding.businessImpact) {
      parts.push(narratedFinding.businessImpact);
    }

    if (narratedFinding.legalImpact) {
      parts.push(narratedFinding.legalImpact);
    }

    if (narratedFinding.recommendation) {
      const rec = narratedFinding.recommendation.trim();
      const prefix = /^recommendation:/i.test(rec) ? "" : "Recommendation: ";
      parts.push(`${prefix}${rec}`);
    }

    if (narratedFinding.negotiationTip) {
      const tip = narratedFinding.negotiationTip.trim();
      const prefix = /^negotiation tip:/i.test(tip) ? "" : "Negotiation tip: ";
      parts.push(`${prefix}${tip}`);
    }

    return this._join(parts);
  }

  /**
   * Picks an opening qualifier for the risk paragraph based on how severe
   * the worst finding is and how many risk findings were identified —
   * purely a deterministic lookup over already-computed severity data,
   * not a judgment call made at formatting time.
   * @param {Object[]} riskNarratives
   * @param {Object} [severityCounts]
   * @returns {string}
   */
  _riskTone(riskNarratives, severityCounts = {}) {
    const critical = severityCounts.critical || 0;
    const high = severityCounts.high || 0;

    if (critical > 0) {
      return "presents material risk that should be resolved before signing";
    }
    if (high > 0) {
      return "raises meaningful concerns worth addressing during negotiation";
    }
    if (riskNarratives.length > 1) {
      return "carries a handful of moderate issues worth reviewing";
    }
    return "carries a modest issue worth noting";
  }

  /**
   * Constructs a cohesive executive summary narrative paragraph in the
   * voice of an experienced legal analyst: what the document is, the
   * headline risk (with its real-world impact), the headline strength,
   * and a closing recommendation whose tone tracks the severity mix.
   *
   * @param {string} docType The category/type of the document
   * @param {string[]} parties The parties involved
   * @param {Object[]} riskNarratives List of narrated risk findings
   * @param {Object[]} positiveNarratives List of narrated positive findings
   * @param {Object} [severityCounts] { critical, high, medium, total } counts
   *   already computed by ExecutiveSummary — used only to choose tone, never
   *   to invent new figures.
   * @param {string|null} [themeHeadline] Optional one-line recurring-theme
   *   sentence from CrossFindingSynthesizer.headline() — already fully
   *   composed text, inserted as-is rather than reconstructed here.
   * @returns {string} Fluent narrative paragraph
   */
  formatExecutiveSummary(docType, parties, riskNarratives = [], positiveNarratives = [], severityCounts = {}, themeHeadline = null) {
    const docName = docType || "Agreement";
    const partiesStr = parties && parties.length > 0 ? parties.join(" and ") : "the parties";

    const sentences = [`This is a review of the ${docName} between ${partiesStr}.`];

    if (riskNarratives.length === 0 && positiveNarratives.length === 0) {
      sentences.push("Based on our deterministic analysis, the contract adheres to standard terms with no notable deviations identified.");
      return this._join(sentences);
    }

    if (riskNarratives.length > 0) {
      const topRisk = riskNarratives[0];
      const riskTitle = topRisk.title || "unspecified issue";
      const tone = this._riskTone(riskNarratives, severityCounts);

      sentences.push(`The primary area of risk centers on ${this._lowerFirst(riskTitle)}, which ${tone}.`);
      if (topRisk.summary) {
        sentences.push(`Specifically, ${this._lowerFirst(topRisk.summary)}`);
      }
      if (topRisk.impact) {
        sentences.push(topRisk.impact);
      }
    }

    if (positiveNarratives.length > 0) {
      const topPositive = positiveNarratives[0];
      const posTitle = topPositive.title || "protection";

      sentences.push(`On the positive side, the contract features solid protections concerning ${this._lowerFirst(posTitle)}.`);
      if (topPositive.summary) {
        sentences.push(`In particular, ${this._lowerFirst(topPositive.summary)}`);
      }
      if (topPositive.impact) {
        sentences.push(topPositive.impact);
      }
    }

    if (themeHeadline) {
      sentences.push(themeHeadline);
    }

    const remainingRisks = riskNarratives.length;
    if (remainingRisks > 1) {
      sentences.push(`Overall, we identified ${remainingRisks} risk factors that merit attention.`);
      sentences.push("We recommend negotiating these key clauses to limit risk exposure prior to signing.");
    } else if (remainingRisks === 1) {
      sentences.push("We suggest conducting standard due diligence and correcting the noted item before execution.");
    } else {
      sentences.push("We suggest conducting standard due diligence before execution.");
    }

    return this._join(sentences);
  }
}
