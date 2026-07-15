/**
 * @fileoverview ConfidenceResolver.js
 * Core class coordinating finding-level and document-level confidence calculation.
 */

import { DefaultConfidenceProfile } from './ConfidenceProfile.js';
import { WeightedGeometricMeanStrategy } from './ConfidenceStrategy.js';

export class ConfidenceResolver {
  /**
   * @param {Object} options
   * @param {ConfidenceProfile} [options.profile]
   * @param {ConfidenceAggregationStrategy} [options.strategy]
   * @param {string} [options.weightsPath]
   */
  constructor(options = {}) {
    this.profile = options.profile || new DefaultConfidenceProfile(options.weightsPath);
    this.strategy = options.strategy || new WeightedGeometricMeanStrategy();
    
    // Caches for expensive lookups to avoid repeated evaluation
    this.ruleReliabilityCache = new Map();
    this.fieldStatusCache = new Map();
  }

  /**
   * Evaluates overall document and finding-level confidence scores.
   * @param {Object} assessments
   * @param {Object[]} findings
   * @returns {Object} A structured confidence record
   */
  resolve(assessments, findings) {
    const weights = this.profile.getWeights();

    // 1. Extraction quality score (aggregate finding confidences)
    let extractionScore = 1.0;
    if (findings && findings.length > 0) {
      const sum = findings.reduce((s, f) => s + (f.confidence !== undefined ? f.confidence : 1.0), 0);
      extractionScore = sum / findings.length;
    }

    // 2. Evidence quality score (ratio of findings with associated physical nodes)
    let evidenceScore = 1.0;
    if (findings && findings.length > 0) {
      const nodesWithEvidence = findings.filter(f => f.node !== null && f.node !== undefined).length;
      evidenceScore = 0.5 + (nodesWithEvidence / findings.length) * 0.5; // ranges from 0.5 to 1.0
    }

    // 3. Completeness score
    let completenessScore = 1.0;
    if (assessments && assessments.completenessAssessment) {
      completenessScore = assessments.completenessAssessment.confidence !== undefined 
        ? assessments.completenessAssessment.confidence 
        : 1.0;
    }

    // 4. Contradiction score (derived from conflicting findings)
    const contradictionScore = this._calculateContradictionScore(findings);

    // Prepare signals for aggregation strategy
    const signals = {
      extraction: extractionScore,
      evidence: evidenceScore,
      coverage: completenessScore, // coverage mapped to completeness in this phase
      contradiction: contradictionScore
    };

    const finalScore = this.strategy.aggregate(signals, weights);

    // Build the explanation breakdown
    const explanation = Object.keys(weights).map(key => {
      const w = weights[key];
      const val = signals[key] !== undefined ? signals[key] : 1.0;
      return {
        signal: key,
        rawValue: val,
        normalizedValue: Math.max(0.1, Math.min(1.0, val)),
        weight: w,
        contribution: parseFloat((Math.max(0.1, Math.min(1.0, val)) * w).toFixed(4))
      };
    });

    return {
      finalScore: parseFloat(finalScore.toFixed(4)),
      metadata: {
        algorithmVersion: "1.0.0",
        aggregationStrategy: this.strategy.name,
        profileIdentifier: this.profile.id,
        confidenceSchemaVersion: "1.0.0",
        buildVersion: "reproducible-build-v1" // deterministic build/version identifier instead of runtime timestamp
      },
      explanation
    };
  }

  /**
   * Detects contradiction signals in findings.
   * If there are conflicting severities for the same category, confidence decreases.
   * @param {Object[]} findings
   * @returns {number} Contradiction score [0,1]
   */
  _calculateContradictionScore(findings) {
    if (!findings || findings.length <= 1) return 1.0;

    // Detect if there are opposing findings, e.g. Indemnification/Liability having both a Favorable and Unfair finding
    let contradictionCount = 0;
    const categorySeverities = {};

    for (const f of findings) {
      const cat = f.category || "General";
      const sev = f.severity || "Neutral";
      if (!categorySeverities[cat]) {
        categorySeverities[cat] = new Set();
      }
      categorySeverities[cat].add(sev);
    }

    for (const cat of Object.keys(categorySeverities)) {
      const sevs = categorySeverities[cat];
      // If we have contradictory severities, e.g. Positive and Critical/High in same category
      if (sevs.has('Positive') && (sevs.has('Critical') || sevs.has('High'))) {
        contradictionCount++;
      }
    }

    // Saturating penalty: 1 / (1 + count)
    return 1.0 / (1.0 + contradictionCount);
  }
}
