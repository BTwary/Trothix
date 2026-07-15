/**
 * @fileoverview ComplexityStrategy.js
 * Pluggable complexity computation strategies for rule reliability evaluation.
 */

export class RuleComplexityStrategy {
  /**
   * Computes the complexity penalty for a rule.
   * @param {Object} rule - The compiled rule metadata
   * @returns {Object} Complexity metrics and penalty
   */
  compute(rule) {
    throw new Error("compute() must be implemented by RuleComplexityStrategy subclasses.");
  }

  get name() {
    throw new Error("name getter must be implemented by RuleComplexityStrategy subclasses.");
  }
}

export class WeightedLinearComplexityStrategy extends RuleComplexityStrategy {
  get name() {
    return "WeightedLinearComplexity";
  }

  compute(rule) {
    // Commit A placeholder: return zero penalty
    return {
      predicateCount: 0,
      nestingDepth: 0,
      wildcardCount: 0,
      dependencyCount: 0,
      penalty: 0.0
    };
  }
}
