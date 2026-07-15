/**
 * @fileoverview RuleReliabilityProvider.js
 * Implements the Rule Reliability Provider and Record schema.
 */

import { SignalProvider, SignalRecord } from './SignalProvider.js';
import { WeightedLinearComplexityStrategy } from './ComplexityStrategy.js';
import { extractFieldPaths, lookupField } from '../rules/RuleFieldRegistry.js';
import crypto from 'crypto';

export const DEFAULT_FIELD_POLICY = {
  active: 1.0,
  unverified: 0.5,
  inert: 0.1
};

export class RuleReliabilityRecord extends SignalRecord {
  /**
   * @param {Object} data
   */
  constructor(data) {
    // Call base SignalRecord constructor
    super({
      id: data.ruleId,
      overallScore: data.overallReliability !== undefined ? data.overallReliability : 1.0,
      signals: data.contributingSignals || {},
      warnings: data.warnings || [],
      errors: data.errors || [],
      calculationVersion: data.calculationVersion || "1.0.0",
      schemaVersion: data.schemaVersion || "1.0.0"
    });

    this.ruleId = data.ruleId;
    this.overallReliability = this.overallScore;
    this.fieldSupport = data.fieldSupport !== undefined ? data.fieldSupport : 1.0;
    this.fieldDiagnostics = data.fieldDiagnostics || [];
    
    // Compatibility alias
    this.fieldReliability = this.fieldSupport;
    
    this.diagnosticReliability = data.diagnosticReliability !== undefined ? data.diagnosticReliability : 1.0;
    this.coverageReliability = data.coverageReliability !== undefined ? data.coverageReliability : 1.0;
    this.complexityPenalty = data.complexityPenalty !== undefined ? data.complexityPenalty : 0.0;
    this.dependencyPenalty = data.dependencyPenalty !== undefined ? data.dependencyPenalty : 0.0;
    
    // Explainability fields
    this.reasons = data.reasons || [];
    this.penalties = data.penalties || {};
    this.contributingSignals = this.signals;
    this.recommendations = data.recommendations || [];

    Object.freeze(this); // Immutable record
  }
}

export class RuleReliabilityProvider extends SignalProvider {
  /**
   * @param {Object} registry - The RuleRegistry instance
   * @param {Object} [options]
   * @param {RuleComplexityStrategy} [options.complexityStrategy]
   * @param {Object} [options.fieldPolicy]
   */
  constructor(registry, options = {}) {
    super();
    this.registry = registry;
    this.complexityStrategy = options.complexityStrategy || new WeightedLinearComplexityStrategy();
    this.fieldPolicy = options.fieldPolicy || DEFAULT_FIELD_POLICY;

    // Cache metrics
    this.cache = new Map();
    this.lastFingerprint = null;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalLookups = 0;
  }

  /**
   * Generates a deterministic SHA-256 fingerprint of the registry's state.
   * @returns {string}
   */
  getFingerprint() {
    if (!this.registry) return "";
    const rules = this.registry.getRules() || [];
    const rawString = rules
      .map(r => `${r.id}_${r.metadata?.status || 'active'}_${r.severity || 'Medium'}`)
      .sort()
      .join(',');
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  /**
   * Invalidates cache if the registry state has changed.
   */
  _validateCache() {
    const currentFingerprint = this.getFingerprint();
    if (currentFingerprint !== this.lastFingerprint) {
      this.cache.clear();
      this.lastFingerprint = currentFingerprint;
    }
  }

  /**
   * Retrieves or computes rule reliability record for the given rule ID.
   * @param {string} ruleId
   * @returns {RuleReliabilityRecord}
   */
  get(ruleId) {
    this.totalLookups++;
    this._validateCache();

    if (this.cache.has(ruleId)) {
      this.cacheHits++;
      return this.cache.get(ruleId);
    }

    this.cacheMisses++;
    const record = this._computeReliability(ruleId);
    this.cache.set(ruleId, record);
    return record;
  }

  /**
   * Helper to aggregate field status weights and build structured diagnostics.
   * @param {Object} rule
   * @returns {Object}
   */
  _computeFieldSupport(rule) {
    let fields = [];
    const diagnostics = [];
    const penalties = {};
    const warnings = [];
    const recommendations = [];

    try {
      if (rule.metadata && rule.metadata.when) {
        if (typeof rule.metadata.when !== 'object') {
          warnings.push(`Rule ${rule.id} "when" clause is not a valid object.`);
        } else {
          fields = [...new Set(extractFieldPaths(rule.metadata.when))];
        }
      }
    } catch (e) {
      warnings.push(`Malformed rule metadata or structure in rule ${rule.id}: ${e.message}`);
    }

    if (fields.length === 0) {
      return {
        score: 1.0,
        diagnostics: [],
        penalties: {},
        warnings: warnings,
        recommendations: []
      };
    }

    let totalWeight = 0;
    for (const field of fields) {
      const registryEntry = lookupField(field);
      const status = registryEntry.status;
      const weight = this.fieldPolicy[status] !== undefined ? this.fieldPolicy[status] : 0.5;
      totalWeight += weight;

      const diag = {
        field,
        status,
        weight,
        reason: registryEntry.reason || `Field has status "${status}".`,
        recommendation: registryEntry.reason ? `Verify usage of "${field}".` : undefined
      };
      diagnostics.push(diag);

      if (weight < 1.0) {
        const penaltyAmount = 1.0 - weight;
        penalties[`field_${field}`] = penaltyAmount;
        warnings.push(`Field "${field}" has status "${status}" with weight ${weight}.`);
        if (status === 'inert') {
          recommendations.push(`Replace inert field "${field}" with an active pipeline output.`);
        } else if (status === 'unverified') {
          recommendations.push(`Register and verify field "${field}" in the pipeline schema.`);
        }
      }
    }

    const score = totalWeight / fields.length;
    return {
      score,
      diagnostics,
      penalties,
      warnings,
      recommendations
    };
  }

  /**
   * Computes the reliability score for a rule.
   * @param {string} ruleId
   * @returns {RuleReliabilityRecord}
   */
  _computeReliability(ruleId) {
    const rules = this.registry ? this.registry.getRules() : [];
    const rule = rules.find(r => r.id === ruleId);

    if (!rule) {
      // Deterministic fallback record for invalid rules
      return new RuleReliabilityRecord({
        ruleId,
        overallReliability: 0.5,
        fieldSupport: 1.0,
        fieldDiagnostics: [],
        diagnosticReliability: 0.5,
        coverageReliability: 1.0,
        complexityPenalty: 0.0,
        dependencyPenalty: 0.0,
        reasons: ["Rule not registered in registry."],
        penalties: { missingRule: 0.5 },
        contributingSignals: { existence: 0.5 },
        recommendations: ["Register rule in rule pack."]
      });
    }

    const fieldSupportResult = this._computeFieldSupport(rule);

    return new RuleReliabilityRecord({
      ruleId,
      overallReliability: fieldSupportResult.score,
      fieldSupport: fieldSupportResult.score,
      fieldDiagnostics: fieldSupportResult.diagnostics,
      diagnosticReliability: 1.0,
      coverageReliability: 1.0,
      complexityPenalty: 0.0,
      dependencyPenalty: 0.0,
      reasons: fieldSupportResult.warnings.length > 0 ? fieldSupportResult.warnings : ["Baseline initialized"],
      penalties: fieldSupportResult.penalties,
      contributingSignals: { fieldSupport: fieldSupportResult.score },
      warnings: fieldSupportResult.warnings,
      errors: [],
      recommendations: fieldSupportResult.recommendations
    });
  }

  /**
   * Resets cache metrics for testing purposes.
   */
  resetMetrics() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalLookups = 0;
  }
}
