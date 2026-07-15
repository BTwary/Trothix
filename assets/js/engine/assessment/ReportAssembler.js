import crypto from 'crypto';
import { CrossFindingSynthesizer } from './CrossFindingSynthesizer.js';
import { PortfolioObservations } from './PortfolioObservations.js';
import { EvidenceFormatter } from './EvidenceFormatter.js';
import { ReasoningTraceBuilder } from './ReasoningTraceBuilder.js';
import { AuditTrailBuilder } from './AuditTrailBuilder.js';

export class ReportAssembler {
  constructor() {
    this.crossFindingSynthesizer = new CrossFindingSynthesizer();
    this.portfolioObservations = new PortfolioObservations();
    // Evidence Traceability sprint: reusable, deterministic components that
    // turn already-computed finding/IR/knowledge-base data into a
    // per-finding Evidence Chain, a per-finding reasoning trace, and a
    // document-level audit trail. None of these evaluate rules, infer
    // ontology relationships, or call an LLM — see each file's header.
    this.evidenceFormatter = new EvidenceFormatter();
    this.reasoningTraceBuilder = new ReasoningTraceBuilder();
    this.auditTrailBuilder = new AuditTrailBuilder();
  }

  /**
   * Assembles the final deterministic 15-part report schema.
   * @param {Object} ir Legal IR document (nodes/edges/metadata)
   * @param {Object[]} actions
   * @param {Object[]} findings
   * @param {Object} assessments
   * @param {Object} scores
   * @param {Object} verdict
   * @param {Object[]} [narratives]
   * @param {Object[]} [pipelineTrace] Lightweight engine execution events captured by
   *   DeveloperInspector (already computed for every run) — surfaced here as
   *   `reasoningTimeline` so the UI can show pipeline execution without re-running anything.
   * @param {import('../knowledge/KnowledgeProvider.js').KnowledgeProvider} [knowledgeProvider]
   *   The same KnowledgeProvider instance Trothix.js already uses to enrich
   *   findings (f.concept, f.sources, f.matchedAliases, ...). Optional and
   *   defensive: when omitted (e.g. existing unit tests that construct
   *   ReportAssembler directly), the five explorer surfaces below degrade
   *   to empty structures instead of throwing.
   * @param {Object[]} [priorReports] Optional, opt-in: previously-assembled
   *   reports for the same portfolio/matter. Purely additive — omitting it
   *   (the default) preserves the exact prior single-document behavior;
   *   passing it enables `portfolioObservations.comparison`.
   */
  assemble(ir, actions, findings, assessments, scores, verdict, narratives = [], pipelineTrace = [], knowledgeProvider = null, priorReports = []) {
    // @todo: In the future, this naive filtering should be replaced by output 
    // from a dedicated ObligationEngine and RightsEngine that traverse the 
    // knowledge graph to determine true polarity (e.g. factoring in "shall not").
    const obligations = actions.filter(a => a.modal !== 'may');
    const rights = actions.filter(a => a.modal === 'may');
    const deadlines = actions.flatMap(a => a.deadlines || []);

    const knowledgeCoverage = this._buildKnowledgeCoverage(findings, knowledgeProvider);

    // Cross-finding synthesis: recurring themes, clauses that produced more
    // than one finding, and ontology-linked findings — pure grouping over
    // findings/narratives that already exist (see CrossFindingSynthesizer).
    const crossFindingSynthesis = this.crossFindingSynthesizer.synthesize(findings, narratives, knowledgeProvider);

    const portfolioObservations = {
      singleDocument: this.portfolioObservations.buildSingleDocumentObservations({
        knowledgeCoverage,
        executiveSummary: { stats: assessments.executiveSummary.stats }
      }),
      comparison: (priorReports && priorReports.length > 0)
        ? this.portfolioObservations.buildPortfolioComparison(
            { executiveSummary: { stats: assessments.executiveSummary.stats }, crossFindingSynthesis },
            priorReports
          )
        : null
    };

    // Computed once and reused by metadata.documentHash and auditTrail.documentHash
    // below, rather than hashed twice, so both surfaces stay identical by construction.
    const documentHash = crypto.createHash('sha256').update(JSON.stringify(ir)).digest('hex').substring(0, 16);

    // Evidence Traceability sprint: one deterministic Evidence Chain and
    // reasoning trace per finding, built purely from data already computed
    // by the frozen runtime/parser/Legal IR/ontology/rule engine/knowledge
    // system (finding fields, IR node tree, rule metadata). See
    // EvidenceFormatter.js and ReasoningTraceBuilder.js.
    const evidenceChains = findings.map(f => this.evidenceFormatter.build(f, ir, knowledgeProvider));
    const reasoningTraces = {};
    findings.forEach(f => {
      reasoningTraces[f.id] = this.reasoningTraceBuilder.build(f, ir, knowledgeProvider, pipelineTrace);
    });

    const report = {
      metadata: {
        pages: ir.metadata?.pages || 1,
        documentHash,
        documentType: ir.metadata?.category || "Mutual NDA",
        language: "en"
      },
      executiveSummary: {
        ...assessments.executiveSummary.stats,
        stats: assessments.executiveSummary.stats,
        executiveSummary: assessments.executiveSummary.executiveSummary,
        themeHeadline: assessments.executiveSummary.themeHeadline || null
      },
      documentInformation: ir.metadata || {},
      obligations,
      rights,
      deadlines,
      riskAssessment: assessments.riskAssessment,
      fairnessAssessment: assessments.fairnessAssessment,
      completenessAssessment: assessments.completenessAssessment,
      positiveFeatures: assessments.positiveAssessment.evidence,
      findings: findings.map(f => {
         const n = narratives.find(narr => narr.findingId === f.id);
         const evidenceChain = evidenceChains.find(c => c.findingId === f.id) || null;
         const reasoningTrace = reasoningTraces[f.id] || [];
         const base = n
           ? {
               ...f,
               narrative: n.narrative,
               title: n.title,
               summary: n.summary,
               businessImpact: n.businessImpact,
               legalImpact: n.legalImpact,
               impact: n.impact,
               recommendation: n.recommendation,
               negotiationTip: n.negotiationTip
             }
           : { ...f };
         // Evidence Traceability sprint: every finding now carries its own
         // deterministic Evidence Chain (fired rule, supporting evidence,
         // matched phrases/tokens, clause location, ontology concepts,
         // confidence rationale, applicable legal principle) and reasoning
         // trace, in addition to the top-level evidenceChains/auditTrail
         // report surfaces below.
         base.evidenceChain = evidenceChain;
         base.reasoningTrace = reasoningTrace;
         return base;
      }),
      scores,
      overallVerdict: verdict,
      traceability: this._buildTraceability(findings),
      // Explainability surfaces below are pure serializations of data the engine
      // already computes on every run (IR node tree, clause classifications,
      // pipeline execution events) — no new rule logic or reasoning is added here.
      clauseTree: this._buildClauseTree(ir, findings),
      clauseCoverage: this._buildClauseCoverage(ir, findings),
      reasoningTimeline: this._buildReasoningTimeline(pipelineTrace),
      // Knowledge-base explorer surfaces below are also pure serializations —
      // this time of KnowledgeProvider's already-loaded graph and rule
      // registry, cross-referenced against this run's already-enriched
      // findings (f.concept/f.rule/f.matchedAliases, set by Trothix.js via
      // EvidenceResolver + KnowledgeProvider accessors). No new rule
      // evaluation, ontology inference, or on-disk schema is introduced.
      ruleExplorer: this._buildRuleExplorer(findings, knowledgeProvider),
      ontologyExplorer: this._buildOntologyExplorer(knowledgeProvider, findings),
      definitionUsageMap: this._buildDefinitionUsageMap(findings, knowledgeProvider),
      crossReferenceGraph: this._buildCrossReferenceGraph(findings, knowledgeProvider),
      knowledgeCoverage,
      // Enterprise Narrative Layer, cross-finding synthesis pass: recurring
      // themes, clauses/concepts that interact, and (when priorReports is
      // supplied) portfolio-level positioning. All derived from data above —
      // no new rule evaluation or scoring.
      crossFindingSynthesis,
      portfolioObservations,
      // Evidence Traceability sprint: standalone, export-ready surfaces
      // mirroring the per-finding evidenceChain/reasoningTrace fields above,
      // for consumers that want the full set without walking `findings`.
      evidenceChains,
      auditTrail: this.auditTrailBuilder.build({
        findings,
        evidenceChains,
        documentHash,
        scores,
        verdict,
        pipelineTrace
      }),
      // Deterministic, ordered manifest of report sections so export tooling
      // (PDF/Word/HTML generators) can render sections in a stable order
      // without hard-coding the report schema themselves.
      reportManifest: this._buildReportManifest(),
      engineMetadata: {
        engineVersion: "1.0.0",
        knowledgeVersion: "1.0.0", // from manifest typically
        ruleVersion: "1.0.0",
        ontologyVersion: "1.0.0",
        analysisTime: new Date().toISOString()
      }
    };

    report.confidence = scores.confidenceRecord || null;

    return report;
  }

  _buildTraceability(findings) {
    const trace = {};
    findings.forEach(f => {
       trace[f.id] = {
          clauseNode: f.node?.id || "Unknown",
          rule: f.rule,
          evidenceType: f.type
       };
    });
    return trace;
  }

  /**
   * Serializes the Legal IR's node tree (already built by LegalIRBuilder /
   * clauseClassifier) into a UI-friendly Clause Tree, annotated with the
   * finding IDs each clause contributed to.
   */
  _buildClauseTree(ir, findings) {
    const nodes = (ir && ir.nodes) || [];
    const findingIdsByNode = {};
    findings.forEach(f => {
      const nodeId = f.node?.id || f.nodeId;
      if (!nodeId) return;
      (findingIdsByNode[nodeId] = findingIdsByNode[nodeId] || []).push(f.id);
    });

    return nodes.map(n => {
      const candidates = (n.metadata && n.metadata.candidates) || [];
      const text = n.text || '';
      return {
        id: n.id,
        kind: n.kind || 'Clause',
        parent: n.parent || null,
        children: n.children || [],
        text: text.length > 400 ? text.slice(0, 400) + '…' : text,
        category: candidates[0] ? candidates[0].id : null,
        categoryScore: candidates[0] ? candidates[0].score : null,
        candidates,
        findingIds: findingIdsByNode[n.id] || []
      };
    });
  }

  /**
   * Computes clause-level coverage stats: how much of the document was
   * classified by clauseClassifier and how much triggered a finding.
   * Purely derived from existing IR node metadata + findings — no new
   * classification or rule evaluation happens here.
   */
  _buildClauseCoverage(ir, findings) {
    const nodes = (ir && ir.nodes) || [];
    const total = nodes.length;
    const nodeIdsWithFindings = new Set(
      findings.map(f => f.node?.id || f.nodeId).filter(Boolean)
    );

    const byCategory = {};
    let classifiedCount = 0;
    nodes.forEach(n => {
      const candidates = (n.metadata && n.metadata.candidates) || [];
      if (candidates.length === 0) return;
      classifiedCount += 1;
      const cat = candidates[0].id;
      if (!byCategory[cat]) byCategory[cat] = { category: cat, total: 0, withFindings: 0 };
      byCategory[cat].total += 1;
      if (nodeIdsWithFindings.has(n.id)) byCategory[cat].withFindings += 1;
    });

    const withFindingsCount = nodes.filter(n => nodeIdsWithFindings.has(n.id)).length;
    const pct = (num, den) => (den ? Math.round((num / den) * 1000) / 10 : 0);

    return {
      totalClauses: total,
      classifiedClauses: classifiedCount,
      unclassifiedClauses: total - classifiedCount,
      clausesWithFindings: withFindingsCount,
      classificationCoveragePercent: pct(classifiedCount, total),
      findingsCoveragePercent: pct(withFindingsCount, total),
      byCategory: Object.values(byCategory)
    };
  }

  /**
   * Converts DeveloperInspector's captured engine execution events (already
   * recorded on every run in Trothix.analyze) into a lightweight, JSON-safe
   * timeline of the deterministic pipeline's reasoning steps.
   */
  _buildReasoningTimeline(pipelineTrace) {
    return (pipelineTrace || []).map(e => ({ ...e }));
  }

  /** @returns {string} the id-prefix "type" bucket (CONCEPT/ENTITY/ACTION/...) for an ontology id. */
  _idType(id) {
    const m = /^([A-Z]+)_/.exec(id || '');
    return m ? m[1] : 'OTHER';
  }

  /**
   * Rule Explorer: every rule KnowledgeProvider actually compiled and
   * registered (knowledgeProvider.getCompiledRules()), enriched with its
   * authored metadata (knowledgeProvider.getRuleMetadata()) and whether it
   * fired on THIS document (cross-referenced against findings, which
   * already carry the rule id that produced them).
   */
  _buildRuleExplorer(findings, knowledgeProvider) {
    if (!knowledgeProvider) return [];
    const firedRuleIds = new Map();
    (findings || []).forEach(f => {
      if (!f.rule) return;
      if (!firedRuleIds.has(f.rule)) firedRuleIds.set(f.rule, []);
      firedRuleIds.get(f.rule).push(f.id);
    });

    return knowledgeProvider.getCompiledRules().map(rule => {
      const meta = knowledgeProvider.getRuleMetadata(rule.id) || {};
      const then = meta.then || {};
      return {
        id: rule.id,
        domain: meta.domain || null,
        category: meta.category || rule.category || null,
        severity: meta.severity || rule.severity || null,
        jurisdiction: meta.jurisdiction || null,
        legalEffect: meta.legal_effect || null,
        rationale: meta.rationale || then.rationale || null,
        recommendation: meta.recommendation || then.recommendation || null,
        linkedTests: meta.linkedTests || [],
        fired: firedRuleIds.has(rule.id),
        firedFindingIds: firedRuleIds.get(rule.id) || []
      };
    }).sort((a, b) => (b.fired - a.fired) || a.id.localeCompare(b.id));
  }

  /**
   * Ontology Explorer: every node in KnowledgeProvider's loaded graph
   * (knowledgeProvider.getAllNodes()), grouped by domain and id-prefix
   * type, trimmed to display fields. Findings' already-resolved
   * `f.concept` ids are marked so the UI can highlight what this specific
   * document actually touched inside the wider ontology.
   */
  _buildOntologyExplorer(knowledgeProvider, findings) {
    if (!knowledgeProvider) return { totalNodes: 0, byDomain: {} };
    const touched = new Set((findings || []).map(f => f.concept).filter(Boolean));
    const byDomain = {};
    const all = knowledgeProvider.getAllNodes();
    all.forEach(({ id, node, metadata }) => {
      const domain = (metadata && (metadata.domain || metadata.source)) || 'Unknown';
      const type = this._idType(id);
      byDomain[domain] ??= {};
      byDomain[domain][type] ??= [];
      byDomain[domain][type].push({
        id,
        label: node.name || node.term || node.concept || node.label || id,
        summary: node.description || node.definition || node.rationale || null,
        touchedByThisDocument: touched.has(id)
      });
    });
    return { totalNodes: all.length, byDomain };
  }

  /**
   * Definition Usage Map: every ontology node with authored aliases or
   * phrases (i.e. a defined term Trothix can recognize surface forms
   * for), via knowledgeProvider.getAliases()/getPhrasesForConcept() —
   * the exact same accessors Trothix.js already calls per-finding — with
   * usage on THIS document taken directly from findings' already-resolved
   * f.matchedAliases / f.evidence.matchedPhrases.
   */
  _buildDefinitionUsageMap(findings, knowledgeProvider) {
    if (!knowledgeProvider) return [];
    const usageByConcept = {};
    (findings || []).forEach(f => {
      if (!f.concept) return;
      const entry = usageByConcept[f.concept] ??= { matchedAliases: new Set(), matchedPhrases: new Set(), findingIds: [] };
      (f.matchedAliases || []).forEach(a => entry.matchedAliases.add(a));
      (f.evidence && f.evidence.matchedPhrases || []).forEach(p => entry.matchedPhrases.add(p));
      entry.findingIds.push(f.id);
    });

    const terms = [];
    knowledgeProvider.getAllNodes().forEach(({ id, metadata }) => {
      const aliases = knowledgeProvider.getAliases(id);
      const phrases = knowledgeProvider.getPhrasesForConcept(id);
      if (aliases.length === 0 && phrases.length === 0) return;
      const usage = usageByConcept[id];
      terms.push({
        conceptId: id,
        domain: (metadata && (metadata.domain || metadata.source)) || 'Unknown',
        aliases,
        phrases,
        usedInThisDocument: !!usage,
        matchedAliasesInThisDocument: usage ? [...usage.matchedAliases] : [],
        matchedPhrasesInThisDocument: usage ? [...usage.matchedPhrases] : [],
        findingIds: usage ? usage.findingIds : []
      });
    });
    return terms.sort((a, b) => (b.usedInThisDocument - a.usedInThisDocument) || a.conceptId.localeCompare(b.conceptId));
  }

  /**
   * Cross-reference Graph: the ontology's authored relationship edges
   * (knowledgeProvider.getAllEdges(), the REL_* entries the knowledge base
   * already defines) plus every node, with the subset of concepts/rules
   * this specific document touched (from findings' f.concept / f.rule)
   * flagged so the UI can highlight this run's path through the graph.
   */
  _buildCrossReferenceGraph(findings, knowledgeProvider) {
    if (!knowledgeProvider) return { nodes: [], edges: [], touchedNodeIds: [], touchedRuleIds: [] };
    const touchedNodeIds = [...new Set((findings || []).map(f => f.concept).filter(Boolean))];
    const touchedRuleIds = [...new Set((findings || []).map(f => f.rule).filter(Boolean))];
    const nodes = knowledgeProvider.getAllNodes().map(({ id, metadata }) => ({
      id,
      type: this._idType(id),
      domain: (metadata && (metadata.domain || metadata.source)) || 'Unknown',
      touched: touchedNodeIds.includes(id)
    }));
    return {
      nodes,
      edges: knowledgeProvider.getAllEdges(),
      touchedNodeIds,
      touchedRuleIds
    };
  }

  /**
   * Knowledge Coverage: per-domain rollup of ontology size and rule
   * compilation/firing counts, built entirely from
   * knowledgeProvider.getAllNodes() + knowledgeProvider.getCompiledRules()
   * + knowledgeProvider.getRuleMetadata(), cross-referenced against this
   * run's findings so "how much of what the engine knows did this
   * document actually exercise" is visible domain-by-domain.
   */
  _buildKnowledgeCoverage(findings, knowledgeProvider) {
    if (!knowledgeProvider) return [];
    const touchedNodeIds = new Set((findings || []).map(f => f.concept).filter(Boolean));
    const firedRuleIds = new Set((findings || []).map(f => f.rule).filter(Boolean));

    const domains = {};
    knowledgeProvider.getAllNodes().forEach(({ id, metadata }) => {
      const domain = (metadata && (metadata.domain || metadata.source)) || 'Unknown';
      domains[domain] ??= { domain, ontologyNodeCount: 0, touchedNodeCount: 0, ruleCount: 0, firedRuleCount: 0 };
      domains[domain].ontologyNodeCount += 1;
      if (touchedNodeIds.has(id)) domains[domain].touchedNodeCount += 1;
    });
    knowledgeProvider.getCompiledRules().forEach(rule => {
      const meta = knowledgeProvider.getRuleMetadata(rule.id) || {};
      const domain = meta.domain || 'Unknown';
      domains[domain] ??= { domain, ontologyNodeCount: 0, touchedNodeCount: 0, ruleCount: 0, firedRuleCount: 0 };
      domains[domain].ruleCount += 1;
      if (firedRuleIds.has(rule.id)) domains[domain].firedRuleCount += 1;
    });

    return Object.values(domains).sort((a, b) => a.domain.localeCompare(b.domain));
  }

  /**
   * Static, deterministic ordered list of report sections with export
   * metadata (id, title, path into the report object, and whether the
   * section is always present or only appears under certain conditions).
   * Lets export tooling (PDF/Word/HTML renderers) walk the report in a
   * stable, predictable order instead of hard-coding field names or
   * relying on JS object key ordering.
   * @returns {Object[]}
   */
  _buildReportManifest() {
    return [
      { id: "metadata", title: "Document Metadata", path: "metadata", always: true },
      { id: "executiveSummary", title: "Executive Summary", path: "executiveSummary", always: true },
      { id: "documentInformation", title: "Document Information", path: "documentInformation", always: true },
      { id: "obligations", title: "Obligations", path: "obligations", always: true },
      { id: "rights", title: "Rights", path: "rights", always: true },
      { id: "deadlines", title: "Deadlines", path: "deadlines", always: true },
      { id: "riskAssessment", title: "Risk Assessment", path: "riskAssessment", always: true },
      { id: "fairnessAssessment", title: "Fairness Assessment", path: "fairnessAssessment", always: true },
      { id: "completenessAssessment", title: "Completeness Assessment", path: "completenessAssessment", always: true },
      { id: "positiveFeatures", title: "Positive Features", path: "positiveFeatures", always: true },
      { id: "findings", title: "Detailed Findings", path: "findings", always: true },
      { id: "crossFindingSynthesis", title: "Cross-Finding Synthesis", path: "crossFindingSynthesis", always: true },
      { id: "portfolioObservations", title: "Portfolio Observations", path: "portfolioObservations", always: true },
      { id: "scores", title: "Scores", path: "scores", always: true },
      { id: "overallVerdict", title: "Overall Verdict", path: "overallVerdict", always: true },
      { id: "traceability", title: "Traceability", path: "traceability", always: true },
      { id: "evidenceChains", title: "Evidence Chains", path: "evidenceChains", always: true },
      { id: "auditTrail", title: "Audit Trail", path: "auditTrail", always: true },
      { id: "clauseTree", title: "Clause Tree", path: "clauseTree", always: false },
      { id: "clauseCoverage", title: "Clause Coverage", path: "clauseCoverage", always: false },
      { id: "reasoningTimeline", title: "Reasoning Timeline", path: "reasoningTimeline", always: false },
      { id: "ruleExplorer", title: "Rule Explorer", path: "ruleExplorer", always: false },
      { id: "ontologyExplorer", title: "Ontology Explorer", path: "ontologyExplorer", always: false },
      { id: "definitionUsageMap", title: "Definition Usage Map", path: "definitionUsageMap", always: false },
      { id: "crossReferenceGraph", title: "Cross-Reference Graph", path: "crossReferenceGraph", always: false },
      { id: "knowledgeCoverage", title: "Knowledge Coverage", path: "knowledgeCoverage", always: false }
    ];
  }
}