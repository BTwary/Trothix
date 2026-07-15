/**
 * @fileoverview RuleEvaluator.js
 * Executes compiled rules against the Legal IR safely.
 */

import { RuleContext } from './RuleContext.js';

import crypto from 'crypto';

export class RuleEvaluator {
  /**
   * @param {Object[]} compiledRules - From RuleRegistry
   */
  constructor(compiledRules) {
    this.rules = compiledRules;
    this.errors = [];
  }

  /**
   * Evaluates all rules against the provided Legal IR Document.
   * Errors from individual rule failures are collected in `this.errors`
   * rather than thrown, so one bad rule never aborts the analysis.
   * @param {Object} ir 
   * @returns {Object[]} Array of Findings
   */
  evaluate(ir) {
    const context = new RuleContext(ir);
    const findings = [];
    this.errors = [];
    
    // In Phase 3, we execute sequentially. Later this can be parallelized.
    for (const rule of this.rules) {
       try {
          const isTriggered = rule.evaluate(context);
          if (isTriggered) {
             let matchedNode = null;
             if (ir.nodes) {
                for (const node of ir.nodes) {
                   context.scope = node;
                   try {
                      if (rule.evaluate(context)) {
                         matchedNode = node;
                         break;
                      }
                   } catch (e) {
                      // ignore local evaluation errors
                   }
                }
                context.scope = null; // reset scope
             }

             const nodePart = matchedNode ? matchedNode.id : 'global';
             const rawIdString = `${rule.id}_${nodePart}_${rule.category}_${rule.severity}`;
             const hash = crypto.createHash('sha256').update(rawIdString).digest('hex').substring(0, 16);
             const findingId = `FINDING_${hash.toUpperCase()}`;

             findings.push({
               id: findingId,
               type: rule.metadata.then ? (rule.metadata.then.trigger || rule.metadata.then.findingType || rule.id) : rule.id,
               category: rule.category,
               severity: rule.severity,
               confidence: rule.metadata.confidence || 1.0,
               rule: rule.id,
               node: matchedNode,
               span: matchedNode && matchedNode.span ? { start: matchedNode.span.start, end: matchedNode.span.end } : null
             });
          }
       } catch (err) {
          console.error(`[RuleEvaluator] Error evaluating rule ${rule.id}:`, err);
          this.errors.push(`Rule ${rule.id} failed to evaluate: ${err.message}`);
       }
    }
    
    return findings;
  }
}