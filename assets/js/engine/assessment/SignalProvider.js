/**
 * @fileoverview SignalProvider.js
 * Abstract base classes for signal providers and signal records in the Confidence System.
 */

export class SignalProvider {
  /**
   * Retrieves the signal record for a given target identifier.
   * @param {string} targetId
   * @returns {SignalRecord}
   */
  get(targetId) {
    throw new Error("get() must be implemented by SignalProvider subclasses.");
  }
}

export class SignalRecord {
  /**
   * @param {Object} data
   * @param {string} data.id - The unique identifier for this record target
   * @param {number} data.overallScore - The aggregated score for this signal [0,1]
   * @param {Object} [data.signals] - Key-value pair of contributing signals
   * @param {string[]} [data.warnings] - Warnings collected during analysis
   * @param {string[]} [data.errors] - Errors collected during analysis
   * @param {string} [data.calculationVersion] - Code calculation version
   * @param {string} [data.schemaVersion] - Schema representation version
   */
  constructor(data) {
    if (!data.id) {
      throw new Error("SignalRecord requires a target id.");
    }
    this.id = data.id;
    this.overallScore = data.overallScore !== undefined ? data.overallScore : 1.0;
    this.signals = data.signals || {};
    this.warnings = data.warnings || [];
    this.errors = data.errors || [];
    this.calculationVersion = data.calculationVersion || "1.0.0";
    this.schemaVersion = data.schemaVersion || "1.0.0";
  }
}
