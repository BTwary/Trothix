import crypto from 'crypto';

export class ReportAssembler {
  /**
   * Assembles the final deterministic 15-part report schema.
   */
  assemble(ir, actions, findings, assessments, scores, verdict, narratives = []) {
    // @todo: In the future, this naive filtering should be replaced by output 
    // from a dedicated ObligationEngine and RightsEngine that traverse the 
    // knowledge graph to determine true polarity (e.g. factoring in "shall not").
    const obligations = actions.filter(a => a.modal !== 'may');
    const rights = actions.filter(a => a.modal === 'may');
    const deadlines = actions.flatMap(a => a.deadlines || []);

    const report = {
      metadata: {
        pages: ir.metadata?.pages || 1,
        documentHash: crypto.createHash('sha256').update(JSON.stringify(ir)).digest('hex').substring(0, 16),
        documentType: ir.metadata?.category || "Mutual NDA",
        language: "en"
      },
      executiveSummary: {
        ...assessments.executiveSummary.stats,
        stats: assessments.executiveSummary.stats,
        executiveSummary: assessments.executiveSummary.executiveSummary
      },
      documentInformation: ir.metadata || {},
      obligations,
      rights,
      deadlines,
      riskAssessment: assessments.riskAssessment,
      fairnessAssessment: assessments.fairnessAssessment,
      completenessAssessment: assessments.completenessAssessment,
      positiveFeatures: assessments.positiveAssessment.evidence,
      findings: findings.map(f => {
         const n = narratives.find(narr => narr.findingId === f.id);
         if (n) {
            return {
               ...f,
               narrative: n.narrative,
               title: n.title,
               summary: n.summary,
               impact: n.impact,
               recommendation: n.recommendation
            };
         }
         return f;
      }),
      scores,
      overallVerdict: verdict,
      traceability: this._buildTraceability(findings),
      engineMetadata: {
        engineVersion: "1.0.0",
        knowledgeVersion: "1.0.0", // from manifest typically
        ruleVersion: "1.0.0",
        ontologyVersion: "1.0.0",
        analysisTime: new Date().toISOString()
      }
    };

    return report;
  }

  _buildTraceability(findings) {
    const trace = {};
    findings.forEach(f => {
       trace[f.id] = {
          clauseNode: f.node?.id || "Unknown",
          rule: f.rule,
          evidenceType: f.type
       };
    });
    return trace;
  }
}
