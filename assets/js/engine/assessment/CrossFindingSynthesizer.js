/**
 * @fileoverview CrossFindingSynthesizer.js
 * Deterministic cross-finding synthesis for the Enterprise Narrative Layer.
 *
 * Everything here is pure post-processing over data the engine has already
 * produced (findings, narrated findings, and — optionally — the read-only
 * KnowledgeProvider graph/edges the report explorers already consume). No
 * rule evaluation, ontology inference, scoring, or LLM reasoning happens in
 * this file: it only groups, counts, and re-phrases text that already
 * exists, the same way NarrativeFormatter stitches template output into
 * prose.
 *
 * Three kinds of synthesis are produced:
 *   1. Themes       — recurring subject-matter clusters across findings
 *                      (e.g. multiple Payment findings, multiple Liability
 *                      findings), so a reviewer sees the pattern rather than
 *                      a flat list.
 *   2. Interacting
 *      clauses      — findings that share the same clause node (multiple
 *                      issues concentrated in one provision) or whose
 *                      concepts are linked by an authored ontology edge
 *                      (e.g. Liability REFERENCES Indemnification).
 *   3. Cumulative
 *      impact        — a synthesized statement of what a theme's findings
 *                      mean *together*, built by deduplicating and joining
 *                      the businessImpact sentences the narrative layer
 *                      already generated for each finding in the group.
 */

// Deterministic, authored lookup table mapping a finding's rule id / type
// to a human-facing theme label. This is a reporting-layer classification
// only — it does not change which rules fire or how findings are produced,
// it only labels findings that already exist for grouping purposes.
const THEME_RULES = [
  { theme: "Payment & Cash Flow", match: /PAYMENT/i },
  { theme: "Liability & Risk Allocation", match: /LIABILIT(Y|IES)/i },
  { theme: "Indemnification", match: /INDEMNIF/i },
  { theme: "Assignment & Change of Control", match: /ASSIGNMENT|CONSENT_REQUIRED/i },
  { theme: "Intellectual Property Ownership", match: /OWNERSHIP|\bIP\b/i },
  { theme: "Notices & Communication", match: /NOTICE/i },
  { theme: "Termination & Lifecycle", match: /STATE_TRANSITION|TERMINATION|LIFECYCLE/i },
  { theme: "Dispute Resolution & Governing Law", match: /VENUE|GOVERNING_LAW|JURISDICTION/i },
  { theme: "Definitions & Completeness", match: /DEFINITION/i }
];

const DEFAULT_THEME = "General Contractual Terms";

const SEVERITY_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export class CrossFindingSynthesizer {

  /**
   * Classifies a single finding into a theme label using the static
   * lookup table above. Falls back to the finding's own category when no
   * keyword matches, and finally to a generic default.
   * @param {Object} finding
   * @returns {string}
   */
  classifyTheme(finding) {
    const key = String(finding.rule || finding.type || "");
    const match = THEME_RULES.find(t => t.match.test(key));
    if (match) return match.theme;
    return finding.category ? `${finding.category} Terms` : DEFAULT_THEME;
  }

  /**
   * Deduplicates and joins businessImpact sentences from a set of narrated
   * findings into one cumulative statement, capped so the paragraph stays
   * readable regardless of how many findings share a theme.
   * @param {Object[]} narrationsForTheme
   * @returns {string|null}
   */
  _cumulativeImpactText(narrationsForTheme) {
    const impacts = [...new Set(
      narrationsForTheme
        .map(n => n?.businessImpact)
        .filter(Boolean)
    )].slice(0, 3);

    if (impacts.length === 0) return null;
    if (impacts.length === 1) return impacts[0];

    return `Taken together: ${impacts.join(" ")}`;
  }

  /**
   * Groups findings into recurring themes, each with a severity breakdown
   * and a synthesized cumulative-impact statement drawn from the
   * businessImpact text the narrative layer already generated per finding.
   * @param {Object[]} findings
   * @param {Object[]} narratives Output of the FindingNarrator/formatFinding pipeline
   * @returns {Object[]} Themes sorted by finding count, descending
   */
  groupThemes(findings = [], narratives = []) {
    const narrativeMap = new Map(narratives.map(n => [n.findingId, n]));
    const byTheme = new Map();

    findings.forEach(f => {
      const theme = this.classifyTheme(f);
      if (!byTheme.has(theme)) {
        byTheme.set(theme, { theme, findingIds: [], severityBreakdown: { Critical: 0, High: 0, Medium: 0, Low: 0 } });
      }
      const bucket = byTheme.get(theme);
      bucket.findingIds.push(f.id);
      const sev = f.severity && bucket.severityBreakdown[f.severity] !== undefined ? f.severity : null;
      if (sev) bucket.severityBreakdown[sev] += 1;
    });

    return [...byTheme.values()]
      .map(bucket => {
        const narrationsForTheme = bucket.findingIds
          .map(id => narrativeMap.get(id))
          .filter(Boolean);
        return {
          theme: bucket.theme,
          findingCount: bucket.findingIds.length,
          findingIds: bucket.findingIds,
          severityBreakdown: bucket.severityBreakdown,
          recurring: bucket.findingIds.length > 1,
          cumulativeImpact: bucket.findingIds.length > 1
            ? this._cumulativeImpactText(narrationsForTheme)
            : null
        };
      })
      .sort((a, b) => b.findingCount - a.findingCount || a.theme.localeCompare(b.theme));
  }

  /**
   * Finds findings that share the same clause/node — i.e. one provision
   * that gave rise to more than one finding, which usually signals a
   * clause worth closer drafting attention rather than several unrelated
   * issues scattered across the document.
   * @param {Object[]} findings
   * @returns {Object[]}
   */
  findInteractingClauses(findings = []) {
    const byNode = new Map();
    findings.forEach(f => {
      const nodeId = f.node?.id || f.nodeId;
      if (!nodeId) return;
      if (!byNode.has(nodeId)) byNode.set(nodeId, []);
      byNode.get(nodeId).push(f);
    });

    return [...byNode.entries()]
      .filter(([, fs]) => fs.length > 1)
      .map(([nodeId, fs]) => ({
        nodeId,
        findingIds: fs.map(f => f.id),
        findingTypes: [...new Set(fs.map(f => f.type).filter(Boolean))],
        note: `This clause gives rise to ${fs.length} distinct findings, indicating concentrated risk or complexity in a single provision rather than issues spread evenly across the document.`
      }));
  }

  /**
   * Finds findings whose underlying concepts are connected by an authored
   * ontology relationship edge (e.g. Liability REFERENCES Indemnification).
   * Purely a read of KnowledgeProvider.getAllEdges(), the same accessor
   * ReportAssembler's Cross-reference Graph already uses — no new edges,
   * inference, or graph traversal logic is introduced. Degrades to an
   * empty array when no KnowledgeProvider is supplied.
   * @param {Object[]} findings
   * @param {import('../knowledge/KnowledgeProvider.js').KnowledgeProvider} [knowledgeProvider]
   * @returns {Object[]}
   */
  findRelatedConcepts(findings = [], knowledgeProvider = null) {
    if (!knowledgeProvider) return [];

    const conceptToFindings = new Map();
    findings.forEach(f => {
      if (!f.concept) return;
      if (!conceptToFindings.has(f.concept)) conceptToFindings.set(f.concept, []);
      conceptToFindings.get(f.concept).push(f.id);
    });

    const edges = knowledgeProvider.getAllEdges() || [];
    const results = [];

    edges.forEach(edge => {
      const sourceFindingIds = conceptToFindings.get(edge.source);
      const targetFindingIds = conceptToFindings.get(edge.target);
      if (!sourceFindingIds || !targetFindingIds) return;

      results.push({
        relation: edge.relation || edge.id,
        sourceConcept: edge.source,
        targetConcept: edge.target,
        sourceFindingIds,
        targetFindingIds,
        note: `Findings on ${edge.source} and ${edge.target} are connected in the knowledge graph (${edge.relation || "related"}); review them together rather than in isolation.`
      });
    });

    return results;
  }

  /**
   * One-line, deterministic headline describing the overall pattern
   * across findings — used by the executive summary and report exports
   * that want a single synthesis sentence rather than the full breakdown.
   * @param {Object[]} themes Output of groupThemes()
   * @returns {string|null}
   */
  headline(themes = []) {
    const recurring = themes.filter(t => t.recurring);
    if (recurring.length === 0) return null;

    if (recurring.length === 1) {
      const t = recurring[0];
      return `Findings cluster around a single recurring theme: ${t.theme} (${t.findingCount} related findings).`;
    }

    const top = recurring.slice(0, 2).map(t => `${t.theme} (${t.findingCount})`).join(" and ");
    return `Findings cluster around ${recurring.length} recurring themes, most notably ${top}.`;
  }

  /**
   * Runs the full synthesis pass and returns all three views together,
   * plus the headline sentence.
   * @param {Object[]} findings
   * @param {Object[]} narratives
   * @param {import('../knowledge/KnowledgeProvider.js').KnowledgeProvider} [knowledgeProvider]
   * @returns {Object}
   */
  synthesize(findings = [], narratives = [], knowledgeProvider = null) {
    const themes = this.groupThemes(findings, narratives);
    const interactingClauses = this.findInteractingClauses(findings);
    const relatedConcepts = this.findRelatedConcepts(findings, knowledgeProvider);

    return {
      themes,
      interactingClauses,
      relatedConcepts,
      headline: this.headline(themes)
    };
  }
}
