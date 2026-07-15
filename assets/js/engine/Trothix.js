/**
 * @fileoverview Trothix.js
 * The public facade and stable API for the Trothix Legal Intelligence Platform.
 */

import { LegalIRBuilder } from './core/ir/legalIRBuilder.js';
import { EngineRegistry } from './core/ir/engineRegistry.js';
import crypto from 'crypto';

// Knowledge
import { KnowledgeProvider } from './knowledge/KnowledgeProvider.js';

// Plugins (Pipeline)
import partyResolver from './plugins/partyResolver.js';
import definitionEngine from './plugins/definitionEngine.js';
import entityEngine from './plugins/entityEngine.js';
import legalGrammarEngine from './plugins/legalGrammarEngine.js';
import clauseClassifier from './plugins/clauseClassifier.js';
import actionBuilder from './plugins/actionBuilder.js';
import referenceResolver from './plugins/referenceResolver.js';
import constraintEngine from './plugins/constraintEngine.js';
import actionNormalizer from './plugins/actionNormalizer.js';
import deadlineNormalizer from './plugins/deadlineNormalizer.js';
import forceMajeureExtractor from './plugins/forceMajeureExtractor.js';
import findingEngine from './plugins/findingEngine.js';

// Assessment Layer
import { RiskAssessment } from './assessment/RiskAssessment.js';
import { FairnessAssessment } from './assessment/FairnessAssessment.js';
import { CompletenessAssessment } from './assessment/CompletenessAssessment.js';
import { PositiveAssessment } from './assessment/PositiveAssessment.js';
import { ExecutiveSummary } from './assessment/ExecutiveSummary.js';
import { ScoringEngine } from './assessment/ScoringEngine.js';
import { VerdictEngine } from './assessment/VerdictEngine.js';
import { ReportAssembler } from './assessment/ReportAssembler.js';

// Telemetry
import { DeveloperInspector } from './core/inspector.js';
import { TelemetryBus } from './telemetry/TelemetryBus.js';
import { ConsoleProvider } from './telemetry/ConsoleProvider.js';

// Narrative Helpers
import { RuleMetadataResolver } from './assessment/RuleMetadataResolver.js';
import { ExplanationLibrary } from './assessment/ExplanationLibrary.js';
import { EvidenceResolver } from './assessment/EvidenceResolver.js';
import { FindingNarrator } from './assessment/FindingNarrator.js';
import { NarrativeFormatter } from './assessment/NarrativeFormatter.js';

export class Trothix {
  constructor(options = {}) {
    this.kbPath = options.kbPath || process.cwd() + '/assets/js/engine/knowledge/v1';
    this.weightsPath = options.weightsPath || this.kbPath + '/weights';
    this.knowledgeProvider = new KnowledgeProvider(this.kbPath);

    this.metadataResolver = null;
    this.explanationLibrary = null;
    this.evidenceResolver = null;
    this.findingNarrator = null;
    this.narrativeFormatter = null;

    // Centralized Observability & Telemetry Bus
    this.telemetryBus = new TelemetryBus();
    this.telemetryBus.registerProvider(new ConsoleProvider());
  }

  /**
   * Initializes the Trothix Engine, pre-compiling all rules and schemas.
   */
  async initialize() {
    await this.knowledgeProvider.initialize();

    this.metadataResolver = new RuleMetadataResolver(this.knowledgeProvider);
    this.explanationLibrary = new ExplanationLibrary();
    this.evidenceResolver = new EvidenceResolver();
    this.findingNarrator = new FindingNarrator(this.explanationLibrary);
    this.narrativeFormatter = new NarrativeFormatter();
  }

  /**
   * Deterministically analyzes a legal document and returns a unified 15-part JSON report.
   * @param {string} text The raw text of the document
   * @param {Object} metadata Metadata such as category, parties, etc.
   */
  async analyze(text, metadata = {}) {
    const startAnalysis = performance.now();
    const analysisId = 'analysis_' + crypto.randomUUID().substring(0, 8);
    
    // Telemetry calls should never block execution of the engine (best effort)
    this.telemetryBus.logAnalysisStarted(analysisId, metadata).catch(() => {});

    // 1. IR Builder
    const startParser = performance.now();
    const irBuilder = new LegalIRBuilder();
    irBuilder.buildFromText(text);
    const parserLatency = performance.now() - startParser;
    
    // Fallback if ir doesn't expose metadata normally
    if (irBuilder.document) {
       irBuilder.document.metadata = metadata;
       irBuilder.document.knowledgeProvider = this.knowledgeProvider;
    } else {
       irBuilder.ir.metadata = metadata;
       irBuilder.ir.knowledgeProvider = this.knowledgeProvider;
    }

    // 2. Engine Registry (Compiler Pipeline)
    const registry = new EngineRegistry(irBuilder, this.knowledgeProvider);
    const inspector = new DeveloperInspector(registry);

    // Collect engine/rule failures as they occur so a partially-broken run
    // is never reported as if it succeeded cleanly.
    const pipelineErrors = [];

    // Per-engine diagnostics (warnings/statistics/duration) are already
    // computed by every engine on each run (result.diagnostics.warnings,
    // result.diagnostics.statistics, result.duration) but were previously
    // discarded here — only errors were kept. This mirrors DeveloperInspector's
    // engineStats bookkeeping so it can be surfaced through the report instead
    // of only a console printout. Populated unconditionally (cheap, in-memory)
    // but only included in the response when telemetry is requested, below.
    const engineDiagnostics = [];

    // Wire up telemetry execution events to TelemetryBus (non-blocking)
    registry.on('engine:end', (e) => {
       this.telemetryBus.logEngineRun(analysisId, e.engine, e.result).catch(() => {});
       if (e.result && Array.isArray(e.result.diagnostics?.errors) && e.result.diagnostics.errors.length > 0) {
          e.result.diagnostics.errors.forEach(msg => {
             pipelineErrors.push(`[${e.engine}] ${msg}`);
          });
       }
       if (e.result) {
          const warnings = e.result.diagnostics?.warnings || [];
          const statistics = e.result.diagnostics?.statistics || {};
          if (warnings.length > 0 || Object.keys(statistics).length > 0) {
             engineDiagnostics.push({
                engine: e.engine,
                duration: typeof e.result.duration === 'number' ? parseFloat(e.result.duration.toFixed(2)) : e.result.duration,
                warnings,
                statistics
             });
          }
       }
    });
    registry.on('engine:error', (e) => {
       pipelineErrors.push(`[${e.engine}] Engine failed: ${e.error?.message || e.error}`);
    });
    registry.on('findings:emitted', (e) => {
       if (Array.isArray(e.findings)) {
          e.findings.forEach(f => this.telemetryBus.logFinding(analysisId, f).catch(() => {}));
       }
    });

    // Register all core engines
    registry.register(partyResolver);
    registry.register(definitionEngine);
    registry.register(entityEngine);
    registry.register(legalGrammarEngine);
    registry.register(clauseClassifier);
    registry.register(actionBuilder);
    registry.register(referenceResolver);
    registry.register(constraintEngine);
    registry.register(actionNormalizer);
    registry.register(deadlineNormalizer);
    registry.register(forceMajeureExtractor);

    // Inject Finding Engine
    registry.register(findingEngine);

    // Execute Pipeline
    const startRules = performance.now();
    await registry.run();
    const ruleEvaluationTime = performance.now() - startRules;

    // 4. Extract Findings from Inspector Timeline
    const findings = [];
    inspector.timeline.forEach(h => {
       if (h.type === 'END' && h.result && h.result.findings) {
          findings.push(...h.result.findings);
       }
    });

    // Narrative generation helper pipeline (non-mutating, per-finding variables)
    const narratives = [];
    findings.forEach(f => {
       const variables = this.evidenceResolver.resolveVariables(irBuilder.document, f);
       const resolvedMetadata = this.metadataResolver.resolve(f);
       const narrated = this.findingNarrator.narrate(f, resolvedMetadata, variables);
       const fullNarrativeText = this.narrativeFormatter.formatFinding(narrated);
       
       // Expose enterprise traceability metadata directly on the finding object
       f.concept = resolvedMetadata.concept;
       f.ontologyNode = f.node ? f.node.type : null;

       // Enterprise KB enrichment: sources, jurisdiction notes, exceptions,
       // examples, and matched alias/phrase surface forms — all resolved
       // from KnowledgeProvider's new accessors, keyed off f.concept.
       // Every call is defensive (returns [] rather than throwing) so a
       // concept with no authored enrichment yet degrades to empty arrays
       // instead of breaking the finding.
       const conceptRecord = f.concept ? this.knowledgeProvider.getConcept(f.concept) : null;
       const matchedText = f.node && typeof f.node.text === 'string' ? f.node.text : (variables.message || '');
       const surfaceForms = f.concept ? this.knowledgeProvider.getMatchedSurfaceForms(f.concept, matchedText) : { matchedAliases: [], matchedPhrases: [] };

       f.evidence = {
         matchedText,
         matchedPhrases: surfaceForms.matchedPhrases,
         span: f.span || null
       };
       f.conceptRecord = conceptRecord ? { id: conceptRecord.id, name: conceptRecord.name, description: conceptRecord.description } : null;
       f.recommendationDetail = this.knowledgeProvider.getRecommendation(f.rule);
       f.sources = f.concept ? this.knowledgeProvider.getSources(f.concept) : [];
       f.jurisdictionNotes = f.concept ? this.knowledgeProvider.getJurisdictionNotes(f.concept) : [];
       f.exceptions = f.concept ? this.knowledgeProvider.getExceptions(f.concept) : [];
       f.examples = f.concept ? this.knowledgeProvider.getExamples(f.concept) : [];
       f.matchedAliases = surfaceForms.matchedAliases;

       narratives.push({
          findingId: f.id,
          title: narrated.title,
          summary: narrated.summary,
          businessImpact: narrated.businessImpact,
          legalImpact: narrated.legalImpact,
          impact: narrated.impact,
          recommendation: narrated.recommendation,
          negotiationTip: narrated.negotiationTip,
          narrative: fullNarrativeText
       });
     });

    // 5. Assessment Layer
    const riskA = new RiskAssessment();
    const fairA = new FairnessAssessment();
    const compA = new CompletenessAssessment();
    const posA = new PositiveAssessment();
    const execSum = new ExecutiveSummary();

    const actions = (irBuilder.document || irBuilder.ir).nodes.flatMap(n => n.actions || []);
    
    const assessments = {
       riskAssessment: riskA.evaluate(findings, narratives),
       fairnessAssessment: fairA.evaluate(actions, findings),
       completenessAssessment: compA.evaluate(findings),
       positiveAssessment: posA.evaluate(findings, narratives)
    };
    
    assessments.executiveSummary = execSum.evaluate(
       irBuilder.document, 
       findings, 
       assessments.riskAssessment, 
       assessments.positiveAssessment,
       narratives
    );

    // 6. Scoring & Verdict Layer
    const scoringEngine = new ScoringEngine(this.weightsPath);
    const verdictEngine = new VerdictEngine();
    
    const scores = scoringEngine.evaluate(assessments, findings);
    const verdict = verdictEngine.evaluate(scores, findings);

    // 7. Report Assembler
    const startAssembly = performance.now();
    const assembler = new ReportAssembler();
    // The DeveloperInspector timeline is already fully captured above (used
    // to extract findings) — this just serializes it into a compact,
    // JSON-safe trace for the Reasoning Timeline UI instead of discarding it.
    const pipelineTrace = inspector.timeline.map(ev => {
      const base = {
        type: ev.type,
        engine: ev.engine,
        offsetMs: Math.max(0, ev.time - inspector.startTime)
      };
      if (ev.type === 'START') {
        base.iteration = ev.iteration;
      } else if (ev.type === 'PATCH') {
        base.patchCount = ev.count;
      } else if (ev.type === 'END') {
        base.duration = typeof ev.result?.duration === 'number'
          ? parseFloat(ev.result.duration.toFixed(2))
          : ev.result?.duration ?? null;
        base.findingsEmitted = Array.isArray(ev.result?.findings) ? ev.result.findings.length : 0;
        base.warnings = ev.result?.diagnostics?.warnings || [];
        base.statistics = ev.result?.diagnostics?.statistics || {};
      }
      return base;
    });
    const finalReport = assembler.assemble(irBuilder.document, actions, findings, assessments, scores, verdict, narratives, pipelineTrace, this.knowledgeProvider);
    const reportAssemblyTime = performance.now() - startAssembly;

    const analysisLatency = performance.now() - startAnalysis;
    this.telemetryBus.logAnalysisCompleted(analysisId, { duration: analysisLatency }).catch(() => {});

    if (finalReport) {
      if (Array.isArray(finalReport.findings)) {
        finalReport.findings.forEach(f => {
          if (f.rule && !f.ruleId) {
            f.ruleId = f.rule;
          }
        });
      }

      // Expose telemetry performance baseline metrics under engineMetadata ONLY if requested via includeTelemetry or debug
      if (!finalReport.engineMetadata) finalReport.engineMetadata = {};

      // Unlike metrics, errors are always surfaced — a partially-broken run
      // must never look identical to a clean one.
      finalReport.engineMetadata.errors = pipelineErrors;

      const includeTelemetry = metadata.includeTelemetry === true || metadata.debug === true;
      if (includeTelemetry) {
        finalReport.engineMetadata.metrics = {
           analysisLatency: parseFloat(analysisLatency.toFixed(2)),
           parserLatency: parseFloat(parserLatency.toFixed(2)),
           ruleEvaluationTime: parseFloat(ruleEvaluationTime.toFixed(2)),
           reportAssemblyTime: parseFloat(reportAssemblyTime.toFixed(2))
        };
        finalReport.engineMetadata.diagnostics = engineDiagnostics;
      }
    }

    return finalReport;
  }
}