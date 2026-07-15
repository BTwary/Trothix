export class VerdictEngine {
  evaluate(scores, findings) {
    let verdict = "Standard Risk";
    let confidence = scores.confidenceRecord ? scores.confidenceRecord.finalScore : 0.95;
    const reasons = [];

    if (scores.overallScore < 50) {
      verdict = "Critical Risk";
      reasons.push("Overall score is below acceptable threshold.");
    } else if (scores.overallScore < 80) {
      verdict = "High Risk";
      reasons.push("Significant risk or fairness issues detected.");
    } else if (scores.riskScore > 30) {
      verdict = "High Risk";
      reasons.push("Cumulative risk score is elevated.");
    }

    const criticalFindings = findings.filter(f => f.severity === 'Critical');
    if (criticalFindings.length > 0) {
       verdict = "Unacceptable";
       reasons.push(`Detected ${criticalFindings.length} critical finding(s).`);
    }

    if (reasons.length === 0) {
       reasons.push("Document falls within standard acceptable parameters.");
    }

    return {
      verdict,
      confidence,
      reason: reasons
    };
  }
}