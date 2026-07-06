import { segmentClauses } from './segmenter.js';
import { extractEntities, extractObligations, extractRights, extractExceptions, extractDeadlines, extractPlaceholders, extractMetadata, extractSignatureStatus } from './extractor.js';
import { classifyClauses } from './classifier.js';
import { calculateFairness } from '../../rules/fairness.js';
import { calculateRisk } from '../../rules/riskEngine.js';
import { verifyChecklist } from './checklist.js';
import { calculateConfidence } from './confidence.js';
import { generateReport } from './reportGenerator.js';

export async function runPipeline(text, docType, pluginConfig, definitions = {}) {
  // 1. Setup IR
  const ir = {
    document: { type: docType, jurisdiction: "Unknown", governingLaw: "Unknown", effectiveDate: "Unknown", parties: [] },
    clauses: [],
    entities: [],
    obligations: [],
    rights: [],
    exceptions: [],
    deadlines: [],
    placeholders: [],
    signatureStatus: { hasSignatureBlock: false, likelySigned: false },
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
  ir.rights = extractRights(ir.clauses);
  ir.exceptions = extractExceptions(ir.clauses);
  ir.deadlines = extractDeadlines(text);
  ir.placeholders = extractPlaceholders(text);
  ir.signatureStatus = extractSignatureStatus(text);

  const metadata = extractMetadata(text, definitions);
  ir.document.jurisdiction = metadata.jurisdiction || "Unknown";
  ir.document.governingLaw = metadata.governingLaw || "Unknown";
  ir.document.effectiveDate = metadata.effectiveDate || "Unknown";
  ir.document.effectiveDateIsBlank = metadata.effectiveDateIsBlank;
  ir.document.parties = metadata.parties;

  // 4. Classification
  ir.clauses = classifyClauses(ir.clauses, ir.entities, ir.obligations);

  // 5. Rules & Scoring Engines
  ir.fairness = calculateFairness(ir.obligations, definitions, docType);
  
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

  ir.confidenceScore = calculateConfidence(ir, text);

  // 6. Full deterministic report assembly
  ir.report = generateReport(ir, { docType });

  return ir;
}
