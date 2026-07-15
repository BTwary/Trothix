import fs from 'fs';
import path from 'path';
import { ConfidenceResolver } from './ConfidenceResolver.js';

export class ScoringEngine {
  constructor(weightsPath) {
    if (!weightsPath) {
      throw new Error("[ScoringEngine] weightsPath is required to initialize ScoringEngine.");
    }
    this.weightsPath = weightsPath;

    try {
      const riskRaw = fs.readFileSync(path.join(weightsPath, 'risk.json'), 'utf-8');
      const fairnessRaw = fs.readFileSync(path.join(weightsPath, 'fairness.json'), 'utf-8');
      const completenessRaw = fs.readFileSync(path.join(weightsPath, 'completeness.json'), 'utf-8');

      this.weights = {
         risk: JSON.parse(riskRaw),
         fairness: JSON.parse(fairnessRaw),
         completeness: JSON.parse(completenessRaw)
      };
    } catch (e) {
      throw new Error(`[ScoringEngine] Critical Failure: Could not load weights from ${weightsPath}. Knowledge base is corrupt or missing. Details: ${e.message}`);
    }
  }

  evaluate(assessments, findings) {
    let riskScore = 0;
    let fairnessScore = 0;
    let completenessScore = 0;

    for (const finding of findings) {
       if (finding.category === 'Risk') {
          riskScore += this.weights.risk[finding.severity] || 0;
       } else if (finding.category === 'Fairness') {
          fairnessScore += this.weights.fairness[finding.severity] || 0;
       } else if (finding.category === 'Completeness') {
          completenessScore += this.weights.completeness[finding.severity] || 0;
       }
    }

    // Example synthetic overall base score (starting at 100, subtracting points)
    const overallScore = Math.max(0, 100 - (riskScore + fairnessScore + completenessScore));

    const result = {
      riskScore,
      fairnessScore,
      completenessScore,
      overallScore,
      negotiabilityScore: Math.max(0, 100 - (fairnessScore * 1.5)),
      enforceabilityScore: Math.max(0, 100 - (completenessScore * 2))
    };

    const resolver = new ConfidenceResolver({ weightsPath: this.weightsPath });
    result.confidenceRecord = resolver.resolve(assessments, findings);

    return result;
  }
}