/**
 * @fileoverview ReasoningTraceBuilder.js
 * Reporting-layer component (Evidence Traceability sprint).
 *
 * Builds a deterministic, ordered, step-by-step "reasoning trace" for a
 * single finding: how the frozen pipeline got from raw text to this
 * finding — parsing, clause classification, rule condition evaluation,
 * evidence resolution, and confidence assignment — followed by a compact
 * summary of the upstream engine stages (already captured by
 * DeveloperInspector and passed in as pipelineTrace) that ran before the
 * finding was emitted.
 *
 * Every step is a plain read of data the frozen runtime/parser/rule
 * engine already computed, stitched into template sentences. No rule is
 * re-evaluated, no new classification happens, and no LLM is invoked —
 * the same finding/ir/knowledgeProvider/pipelineTrace input always
 * produces the same ordered trace.
 */

import { describeCondition } from './EvidenceFormatter.js';

const RELEVANT_ENGINES = new Set([
  'partyResolver',
  'definitionEngine',
  'entityEngine',
  'legalGrammarEngine',
  'clauseClassifier',
  'actionBuilder',
  'referenceResolver',
  'constraintEngine',
  'actionNormalizer',
  'deadlineNormalizer',
  'forceMajeureExtractor',
  'findingEngine'
]);

export class ReasoningTraceBuilder {
  /**
   * Builds the ordered reasoning trace for one finding.
   * @param {Object} finding A finding already enriched by Trothix.js
   * @param {Object} ir The Legal IR document
   * @param {import('../knowledge/KnowledgeProvider.js').KnowledgeProvider} [knowledgeProvider]
   * @param {Object[]} [pipelineTrace] DeveloperInspector's captured engine
   *   execution events for this run (the same array ReportAssembler
   *   serializes into `reasoningTimeline`).
   * @returns {Object[]} Ordered trace steps: {step, stage, engine, description}
   */
  build(finding, ir, knowledgeProvider = null, pipelineTrace = []) {
    const f = finding || {};
    const steps = [];
    let stepNumber = 1;

    steps.push(this._parsingStep(stepNumber++, ir));

    const classificationStep = this._classificationStep(stepNumber, f);
    if (classificationStep) {
      steps.push(classificationStep);
      stepNumber++;
    }

    const ruleStep = this._ruleEvaluationStep(stepNumber, f, knowledgeProvider);
    if (ruleStep) {
      steps.push(ruleStep);
      stepNumber++;
    }

    const evidenceStep = this._evidenceResolutionStep(stepNumber, f);
    if (evidenceStep) {
      steps.push(evidenceStep);
      stepNumber++;
    }

    steps.push(this._confidenceStep(stepNumber++, f));

    const pipelineStep = this._pipelineContextStep(stepNumber, pipelineTrace);
    if (pipelineStep) {
      steps.push(pipelineStep);
      stepNumber++;
    }

    return steps;
  }

  _parsingStep(step, ir) {
    const totalNodes = (ir && Array.isArray(ir.nodes)) ? ir.nodes.length : 0;
    return {
      step,
      stage: 'Parsing',
      engine: 'LegalIRBuilder',
      description: `The document was parsed into a Legal IR containing ${totalNodes} clause node(s).`
    };
  }

  _classificationStep(step, f) {
    if (!f.node) return null;
    const candidates = (f.node.metadata && f.node.metadata.candidates) || [];
    if (candidates.length === 0) return null;
    const top = candidates[0];
    return {
      step,
      stage: 'Classification',
      engine: 'clauseClassifier',
      description: `Clause node "${f.node.id}" was classified as "${top.id}" with a category score of ${top.score}.`
    };
  }

  _ruleEvaluationStep(step, f, knowledgeProvider) {
    if (!f.rule) return null;
    const ruleMeta = knowledgeProvider ? (knowledgeProvider.getRuleMetadata(f.rule) || {}) : {};
    const conditionText = ruleMeta.when ? describeCondition(ruleMeta.when) : 'its authored condition';
    const location = f.node ? ` at clause node "${f.node.id}"` : ' at the document level';
    return {
      step,
      stage: 'Rule Evaluation',
      engine: 'findingEngine',
      description: `Rule "${f.rule}" evaluated its authored condition (${conditionText}) against the Legal IR${location} and triggered, producing finding "${f.id || 'unknown'}".`
    };
  }

  _evidenceResolutionStep(step, f) {
    const matchedPhrases = (f.evidence && f.evidence.matchedPhrases) || [];
    const matchedAliases = f.matchedAliases || [];
    if (matchedPhrases.length === 0 && matchedAliases.length === 0) return null;
    return {
      step,
      stage: 'Evidence Resolution',
      engine: 'KnowledgeProvider',
      description: `${matchedPhrases.length} matched phrase(s) and ${matchedAliases.length} matched alias(es) were resolved against the clause text, linking the finding to concept "${f.concept || 'unknown'}".`
    };
  }

  _confidenceStep(step, f) {
    const confidence = typeof f.confidence === 'number' ? f.confidence : 1.0;
    return {
      step,
      stage: 'Confidence Assignment',
      engine: 'RuleEvaluator',
      description: `The finding was assigned a confidence score of ${confidence}, carried from the rule's authored metadata.`
    };
  }

  /**
   * Summarizes (rather than repeats-per-finding) the relevant upstream
   * engine execution events already captured in pipelineTrace, so every
   * finding's trace stays traceable to the pipeline without duplicating
   * the full reasoningTimeline on each one.
   */
  _pipelineContextStep(step, pipelineTrace) {
    const events = (pipelineTrace || []).filter(e => e && e.type === 'END' && RELEVANT_ENGINES.has(e.engine));
    if (events.length === 0) return null;
    const totalDuration = events.reduce((sum, e) => sum + (typeof e.duration === 'number' ? e.duration : 0), 0);
    const engineList = events.map(e => e.engine).join(', ');
    return {
      step,
      stage: 'Pipeline Context',
      engine: 'EngineRegistry',
      description: `${events.length} upstream engine stage(s) (${engineList}) executed in a combined ${totalDuration.toFixed(2)}ms as part of this run; full detail is available in the report's reasoningTimeline.`
    };
  }
}
