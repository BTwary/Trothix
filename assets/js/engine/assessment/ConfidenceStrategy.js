/**
 * @fileoverview ConfidenceStrategy.js
 * Pluggable strategies for score aggregation in the Confidence System.
 */

export class ConfidenceAggregationStrategy {
  /**
   * Aggregates signals using their corresponding weights.
   * @param {Object} signals - Key-value pair of signal names to values [0,1]
   * @param {Object} weights - Key-value pair of signal names to weights
   * @returns {number} The aggregated confidence score [0,1]
   */
  aggregate(signals, weights) {
    throw new Error("aggregate() must be implemented by strategy subclasses.");
  }

  get name() {
    throw new Error("name getter must be implemented by strategy subclasses.");
  }
}

export class WeightedGeometricMeanStrategy extends ConfidenceAggregationStrategy {
  get name() {
    return "WeightedGeometricMean";
  }

  aggregate(signals, weights) {
    let logSum = 0;
    let weightSum = 0;

    for (const key of Object.keys(weights)) {
      const weight = weights[key] || 0;
      if (weight <= 0) continue;

      const rawVal = signals[key] !== undefined ? signals[key] : 1.0;
      // Clamp minimum to 0.1 to avoid log(0)
      const val = Math.max(0.1, Math.min(1.0, rawVal));

      logSum += weight * Math.log(val);
      weightSum += weight;
    }

    if (weightSum <= 0) return 1.0;
    return Math.exp(logSum / weightSum);
  }
}

export class WeightedArithmeticMeanStrategy extends ConfidenceAggregationStrategy {
  get name() {
    return "WeightedArithmeticMean";
  }

  aggregate(signals, weights) {
    let weightedSum = 0;
    let weightSum = 0;

    for (const key of Object.keys(weights)) {
      const weight = weights[key] || 0;
      if (weight <= 0) continue;

      const val = signals[key] !== undefined ? signals[key] : 1.0;
      weightedSum += weight * Math.max(0.0, Math.min(1.0, val));
      weightSum += weight;
    }

    if (weightSum <= 0) return 1.0;
    return weightedSum / weightSum;
  }
}
