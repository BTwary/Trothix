/**
 * @fileoverview Trothix.js
 * The public facade and stable API for the Trothix Legal Intelligence Platform.
 */

import { LegalIRBuilder } from './core/ir/legalIRBuilder.js';
import { EngineRegistry } from './core/ir/engineRegistry.js';

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
    // 1. IR Builder
    const irBuilder = new LegalIRBuilder();
    irBuilder.buildFromText(text);
    
    // Fallback if ir doesn't expose metadata normally
    if (irBuilder.document) {
       irBuilder.document.metadata = metadata;
    } else {
       irBuilder.ir.metadata = metadata;
    }

    // 2. Engine Registry (Compiler Pipeline)
    const registry = new EngineRegistry(irBuilder, this.knowledgeProvider);
    const inspector = new DeveloperInspector(registry);

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

    // Inject Finding Engine
    registry.register(findingEngine);

    // Execute Pipeline
    await registry.run();

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
       
       narratives.push({
          findingId: f.id,
          title: narrated.title,
          summary: narrated.summary,
          impact: narrated.impact,
          recommendation: narrated.recommendation,
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
    const assembler = new ReportAssembler();
    const finalReport = assembler.assemble(irBuilder.document, actions, findings, assessments, scores, verdict, narratives);

    return finalReport;
  }
}
