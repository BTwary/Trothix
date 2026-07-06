import { parseDefinitions } from './definitions.js';
import { runPipeline } from './pipeline.js';

import { logMiss } from '../../telemetry.js';

import { NDAPlugin } from '../../plugins/nda/index.js';
import { LeasePlugin } from '../../plugins/lease/index.js';
import { UniversalPlugin } from '../../plugins/universal/index.js';
import { EmploymentPlugin } from '../../plugins/employment/index.js';
import { LoanPlugin } from '../../plugins/loan/index.js';
import { ServicePlugin } from '../../plugins/service/index.js';

const PLUGIN_BY_DOC_TYPE = {
  NDA: NDAPlugin,
  LEASE: LeasePlugin,
  EMPLOYMENT: EmploymentPlugin,
  LOAN: LoanPlugin,
  CONSULTING: ServicePlugin,
  SERVICE_AGREEMENT: ServicePlugin,
};

export async function processDocument(documentText, providedType, userContext, rules, consentTelemetry) {
  const normalizedText = documentText.replace(/\r\n/g, '\n');
  const definedTerms = parseDefinitions(normalizedText);
  
  const docType = providedType || identifyType(normalizedText);
  
  // Load the appropriate plugin configuration
  const pluginConfig = PLUGIN_BY_DOC_TYPE[docType] || UniversalPlugin;
  
  // 1. Run the Deterministic NLP Pipeline (Layer 1)
  const ir = await runPipeline(normalizedText, docType, pluginConfig, definedTerms);
  
  // 2. Decide if we need AI Fallback (Layer 2)
  let requiresAIFallback = false;
  let missingClausesPayload = [];

  const getContextSnippet = (keyword) => {
      const idx = normalizedText.toLowerCase().indexOf(keyword);
      if (idx === -1) return normalizedText.substring(0, 2000);
      const start = Math.max(0, idx - 1000);
      const end = Math.min(normalizedText.length, idx + 1000);
      return normalizedText.substring(start, end);
  };

  // If the confidence is too low or we missed crucial elements, engage AI
  if (ir.confidenceScore < 60 || ir.obligations.length === 0) {
      requiresAIFallback = true;
      missingClausesPayload.push({
        type: 'low_confidence',
        context: 'The deterministic parser could not confidently extract core clauses. Please perform a deep review.',
        rawTextToAnalyze: normalizedText.substring(0, 4000)
      });
      if (consentTelemetry) logMiss(docType, 'low_confidence');
  }

  // Ensure compatibility with existing front-end by mapping IR to old variables where needed
  return {
    docType,
    isFullyLocal: !requiresAIFallback,
    extractedData: {}, // Deprecated, but kept for UI compatibility
    flags: ir.risks, // Replace old flags with new IR risks
    aiPayloadRecommendation: requiresAIFallback ? missingClausesPayload : null,
    
    // New Advanced Metrics
    fairness: ir.fairness,
    missingClauses: ir.missingClauses,
    confidenceScore: ir.confidenceScore,
    riskScore: ir.riskScore,
    riskLevel: ir.riskLevel,
    deadlines: ir.deadlines,
    exceptions: ir.exceptions,
    rights: ir.rights,
    signatureStatus: ir.signatureStatus,

    // Full deterministic report matching the human-review report structure
    report: ir.report,

    // Document metadata (previously extracted internally but never
    // returned to the caller, so the UI had no way to show it)
    document: {
      jurisdiction: ir.document.jurisdiction,
      governingLaw: ir.document.governingLaw,
      effectiveDate: ir.document.effectiveDate,
      effectiveDateIsBlank: ir.document.effectiveDateIsBlank,
      parties: ir.document.parties
    }
  };
}

function identifyType(text) {
  const topText = text.substring(0, 1500).toLowerCase();
  if (topText.includes('non-disclosure') || topText.includes('confidentiality agreement')) {
    return 'NDA';
  }
  if (topText.includes('lease agreement') || (topText.includes('tenant') && topText.includes('landlord'))) {
    return 'LEASE';
  }
  if (topText.includes('terms of service') || topText.includes('terms and conditions') || topText.includes('terms of use')) {
    return 'TOS';
  }
  if (topText.includes('employment agreement') || (topText.includes('employer') && topText.includes('employee') && topText.includes('agreement'))) {
    return 'EMPLOYMENT';
  }
  if (topText.includes('consulting agreement')) {
    return 'CONSULTING';
  }
  if (topText.includes('loan agreement') || topText.includes('promissory note')) {
    return 'LOAN';
  }
  if (topText.includes('service agreement') || topText.includes('master service agreement') || topText.includes('statement of work')) {
    return 'SERVICE_AGREEMENT';
  }
  return 'UNKNOWN';
}
