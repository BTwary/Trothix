import { segmentClauses } from './segmenter.js';
import { extractEntities, extractObligations, extractExceptions, extractDeadlines, extractPlaceholders } from './extractor.js';
import { classifyClauses } from './classifier.js';
import { calculateFairness } from '../rules/fairness.js';
import { calculateRisk } from '../rules/riskEngine.js';
import { verifyChecklist } from './checklist.js';
import { calculateConfidence } from './confidence.js';

export async function runPipeline(text, docType, pluginConfig) {
  // 1. Setup IR
  const ir = {
    document: { type: docType, jurisdiction: "Unknown" },
    clauses: [],
    entities: [],
    obligations: [],
    exceptions: [],
    deadlines: [],
    placeholders: [],
    risks: [],
    fairness: "",
    missingClauses: [],
    confidenceScore: 0,
    riskScore: 0,
    riskLevel: "Low"
  };

  // 2. Segmentation
  ir.clauses = segmentClauses(text);

  // 3. Extraction
  ir.entities = extractEntities(ir.clauses);
  ir.obligations = extractObligations(ir.clauses);
  ir.exceptions = extractExceptions(ir.clauses);
  ir.deadlines = extractDeadlines(text);
  ir.placeholders = extractPlaceholders(text);

  // 4. Classification
  ir.clauses = classifyClauses(ir.clauses, ir.entities, ir.obligations);

  // 5. Rules & Scoring Engines
  ir.fairness = calculateFairness(ir.obligations);
  
  if (pluginConfig && pluginConfig.riskRules) {
     const riskResult = calculateRisk(ir.clauses, ir.placeholders, pluginConfig.riskRules);
     ir.riskScore = riskResult.score;
     ir.riskLevel = riskResult.level;
     ir.risks = riskResult.flags;
  }

  if (pluginConfig && pluginConfig.manifest) {
     const chkResult = verifyChecklist(ir.clauses, pluginConfig.manifest);
     ir.missingClauses = chkResult.missing;
  }

  ir.confidenceScore = calculateConfidence(ir);

  return ir;
}
