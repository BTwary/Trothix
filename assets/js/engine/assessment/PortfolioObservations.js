/**
 * @fileoverview PortfolioObservations.js
 * Deterministic portfolio-level reporting utilities for the Enterprise
 * Narrative Layer.
 *
 * This module never runs the analysis pipeline and never touches the
 * rule engine, parser, IR, ontology, or scoring system — it only reads
 * already-assembled Trothix report objects (the JSON `ReportAssembler`
 * produces) and computes simple, deterministic arithmetic (counts,
 * averages, rankings) over fields those reports already expose. It adds
 * no new scoring formula and infers no new facts about any document.
 *
 * Two independent entry points are provided:
 *   - buildSingleDocumentObservations(report): works from one report's own
 *     data (knowledge/clause coverage, finding severity mix) — always
 *     available, no other documents required.
 *   - buildPortfolioComparison(currentReport, priorReports): optional,
 *     opt-in multi-document comparison a caller can run by passing
 *     previously-generated reports. Nothing in the core pipeline calls
 *     this automatically, so existing single-document callers are
 *     completely unaffected.
 */

export class PortfolioObservations {

  /**
   * Rounds to 1 decimal place without floating-point noise.
   * @param {number} n
   * @returns {number}
   */
  _round1(n) {
    return Math.round(n * 10) / 10;
  }

  /**
   * Describes how "broad" this document's engagement with the platform's
   * known rule/ontology domains was, using knowledgeCoverage the report
   * already computes (ReportAssembler._buildKnowledgeCoverage). Purely
   * descriptive — no new coverage math beyond simple ratios of numbers
   * already in the report.
   * @param {Object[]} knowledgeCoverage
   * @returns {Object|null}
   */
  _coveragePosition(knowledgeCoverage = []) {
    if (!knowledgeCoverage || knowledgeCoverage.length === 0) return null;

    const totalRules = knowledgeCoverage.reduce((sum, d) => sum + (d.ruleCount || 0), 0);
    const firedRules = knowledgeCoverage.reduce((sum, d) => sum + (d.firedRuleCount || 0), 0);
    const domainsTouched = knowledgeCoverage.filter(d => d.firedRuleCount > 0).length;
    const domainsTotal = knowledgeCoverage.length;
    const pct = totalRules ? this._round1((firedRules / totalRules) * 100) : 0;

    let breadth;
    if (domainsTouched === 0) breadth = "narrow";
    else if (domainsTouched / domainsTotal >= 0.6) breadth = "broad";
    else if (domainsTouched / domainsTotal >= 0.3) breadth = "moderate";
    else breadth = "narrow";

    return {
      domainsTouched,
      domainsTotal,
      firedRuleCount: firedRules,
      totalRuleCount: totalRules,
      ruleFirePercent: pct,
      breadth,
      statement: `This document exercised ${domainsTouched} of ${domainsTotal} known rule domains (${pct}% of compiled rules fired), indicating ${breadth} engagement with the platform's contract-analysis knowledge base.`
    };
  }

  /**
   * Describes the concentration of severity within this document's own
   * findings — again purely a ratio over counts already present on the
   * report's executive summary stats.
   * @param {Object} findingCounts {critical, high, medium, total}
   * @returns {Object|null}
   */
  _riskConcentration(findingCounts = {}) {
    const total = findingCounts.total || 0;
    if (total === 0) return null;

    const severe = (findingCounts.critical || 0) + (findingCounts.high || 0);
    const pct = this._round1((severe / total) * 100);

    let statement;
    if (severe === 0) {
      statement = `None of the ${total} finding(s) identified reached High or Critical severity.`;
    } else {
      statement = `${severe} of ${total} finding(s) (${pct}%) are High or Critical severity, indicating where negotiation effort should be concentrated.`;
    }

    return { severeCount: severe, totalCount: total, severePercent: pct, statement };
  }

  /**
   * Builds portfolio-style observations from a single already-assembled
   * report, with no other documents required. Safe to call on every
   * report Trothix produces.
   * @param {Object} report Output of ReportAssembler.assemble()
   * @returns {Object}
   */
  buildSingleDocumentObservations(report = {}) {
    const coverage = this._coveragePosition(report.knowledgeCoverage);
    const risk = this._riskConcentration(report.executiveSummary?.stats?.findingCounts);

    const statements = [coverage?.statement, risk?.statement].filter(Boolean);

    return {
      coverage,
      riskConcentration: risk,
      statements
    };
  }

  /**
   * Opt-in comparison of one report against a set of previously-assembled
   * reports (e.g. other contracts of the same type reviewed earlier).
   * Every figure here is a plain average or ranking over counts the
   * reports already contain — no new scoring model.
   * @param {Object} currentReport
   * @param {Object[]} priorReports
   * @returns {Object}
   */
  buildPortfolioComparison(currentReport = {}, priorReports = []) {
    const history = (priorReports || []).filter(Boolean);
    if (history.length === 0) {
      return {
        documentCount: 1,
        comparable: false,
        statements: ["No prior documents were supplied for comparison; this is the first document in the portfolio."]
      };
    }

    const allReports = [...history, currentReport];
    const countsOf = r => r.executiveSummary?.stats?.findingCounts || { critical: 0, high: 0, medium: 0, total: 0 };

    const avg = key => this._round1(
      history.reduce((sum, r) => sum + (countsOf(r)[key] || 0), 0) / history.length
    );

    const averages = {
      critical: avg("critical"),
      high: avg("high"),
      medium: avg("medium"),
      total: avg("total")
    };

    const currentCounts = countsOf(currentReport);
    const totalsSorted = allReports.map(r => countsOf(r).total || 0).sort((a, b) => a - b);
    const rank = totalsSorted.indexOf(currentCounts.total || 0) + 1;

    let positioning;
    if (currentCounts.total > averages.total) {
      positioning = `above the portfolio average of ${averages.total} finding(s) per document`;
    } else if (currentCounts.total < averages.total) {
      positioning = `below the portfolio average of ${averages.total} finding(s) per document`;
    } else {
      positioning = `in line with the portfolio average of ${averages.total} finding(s) per document`;
    }

    // Tally recurring themes across the whole portfolio, if each report
    // carries a crossFindingSynthesis section (added by ReportAssembler).
    const themeTally = new Map();
    allReports.forEach(r => {
      (r.crossFindingSynthesis?.themes || []).forEach(t => {
        if (!t.recurring) return;
        themeTally.set(t.theme, (themeTally.get(t.theme) || 0) + t.findingCount);
      });
    });
    const topThemes = [...themeTally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme, count]) => ({ theme, count }));

    const statements = [
      `This document's ${currentCounts.total || 0} finding(s) fall ${positioning}, ranking ${rank} of ${allReports.length} documents reviewed by finding volume.`
    ];
    if (topThemes.length > 0) {
      const list = topThemes.map(t => `${t.theme} (${t.count})`).join(", ");
      statements.push(`Across this portfolio, the most recurring themes are: ${list}.`);
    }

    return {
      documentCount: allReports.length,
      comparable: true,
      averages,
      currentCounts,
      rank,
      topThemes,
      statements
    };
  }
}
