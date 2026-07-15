// Deterministic report assembly.
//
// Everything below is template + lookup-table driven: given the IR
// (segmented/classified clauses, extracted obligations/rights/deadlines/
// placeholders, computed fairness/risk/confidence), it assembles the same
// section structure a human reviewer would produce by hand. There is no
// generative model anywhere in this file — every sentence is built by
// filling a template with values already sitting in the IR. If the IR
// doesn't contain a value, the template says so explicitly ("Not found")
// rather than inventing one.

const DOC_TYPE_LABELS = {
  NDA: 'Non-Disclosure Agreement',
  LEASE: 'Lease Agreement',
  TOS: 'Terms of Service',
  EMPLOYMENT: 'Employment Agreement',
  SERVICE_AGREEMENT: 'Service Agreement',
  CONSULTING: 'Consulting Agreement',
  LOAN: 'Loan Agreement',
  UNKNOWN: 'Legal Document (type not confidently identified)'
};

// Canned, pattern-specific guidance. Keyed by the same substrings used in
// the risk-rule pattern lists, so each triggered flag can carry a concrete
// "what to do about it" instead of just a severity label.
const RECOMMENDATIONS = {
  'indemnify': 'Consider negotiating a cap on indemnification liability, with carve-outs for fraud or willful misconduct.',
  'hold harmless': 'Consider negotiating a cap on this liability, with carve-outs for fraud or willful misconduct.',
  'injunct': 'Confirm this is mutual (available to both sides) rather than only to one party.',
  'equitable relief': 'Confirm this is mutual (available to both sides) rather than only to one party.',
  'binding arbitration': 'Check whether this conflicts with any separate court-jurisdiction clause elsewhere in the document, and confirm you understand you are giving up the right to sue in court.',
  'jury trial': 'Understand that you are waiving your right to a jury trial for disputes under this agreement.',
  'class action': 'Understand that you are waiving your right to join a class action lawsuit related to this agreement.',
  'perpetual': 'Consider whether a time-limited license/right would be more appropriate than a permanent one.',
  'irrevocable': 'Confirm you are comfortable granting a right that cannot later be withdrawn.',
  'shall not exceed': 'Check whether the liability cap is proportionate to the value of the agreement or your potential exposure.',
  'liquidated damages': 'Confirm the predetermined damages amount is reasonable relative to likely actual harm — courts can strike unreasonable liquidated-damages clauses.',
  'no liability': 'Confirm what protection (if any) you retain if the other party breaches or is negligent.',
  'sole discretion': 'Consider whether standards or notice requirements should constrain this discretion.',
  'at any time without notice': 'Consider negotiating a minimum notice period before this action can be taken.',
  'automatically renew': 'Confirm the cancellation deadline and method before the renewal window closes.',
  'auto-renew': 'Confirm the cancellation deadline and method before the renewal window closes.',
  'as is': 'Understand you may have limited recourse if the product/service doesn\'t perform as expected.',
  'without warranty': 'Understand you may have limited recourse if the product/service doesn\'t perform as expected.',
  'disclaims all warranties': 'Understand you may have limited recourse if the product/service doesn\'t perform as expected.',
  'non-compete': 'Check the scope (geography, duration, industry) is no broader than necessary — overly broad non-competes are unenforceable in some jurisdictions.',
  'shall not compete': 'Check the scope (geography, duration, industry) is no broader than necessary.',
  'any and all information': 'Consider whether the scope of covered information is broader than necessary for the stated purpose.',
  'information whatsoever': 'Consider whether the scope of covered information is broader than necessary for the stated purpose.',
};

function recommendationFor(message) {
  const lower = message.toLowerCase();
  for (const [pattern, rec] of Object.entries(RECOMMENDATIONS)) {
    if (lower.includes(pattern)) return rec;
  }
  return 'Review this clause carefully and consider whether it should be negotiated.';
}

function findClauseIdForDeadline(clauses, deadline) {
  const hit = clauses.find(c => c.text.includes(deadline.split(' ')[0]) && c.text.toLowerCase().includes(deadline.toLowerCase().split(' ').slice(-1)[0]));
  return hit ? hit.id : null;
}

// --- Fairness / risk / legal-protection ratings (1-5), derived from
// already-computed strings/lists rather than re-deriving new judgments ---
function fairnessRating(fairnessStr) {
  if (/^unknown/i.test(fairnessStr)) return null;
  if (/^mutual only/i.test(fairnessStr)) return 5;
  if (/^balanced/i.test(fairnessStr)) return 4;
  if (/^highly asymmetric/i.test(fairnessStr)) return 1;
  if (/^asymmetric/i.test(fairnessStr)) return 2;
  return 3;
}

function legalProtectionRating(ir) {
  let score = 5;
  ir.risks.forEach(r => {
    if (r.severity === 'HIGH') score -= 1;
    else if (r.severity === 'MEDIUM') score -= 0.5;
  });
  score -= ir.missingClauses.length * 0.5;
  if (ir.placeholders.length > 0) score -= 0.5;
  if (ir.signatureStatus && ir.signatureStatus.hasSignatureBlock && !ir.signatureStatus.likelySigned) score -= 1;
  return Math.max(1, Math.min(5, Math.round(score)));
}

function overallRecommendation(ir) {
  const hasCriticalGaps = ir.placeholders.length > 0 ||
    (ir.signatureStatus && ir.signatureStatus.hasSignatureBlock && !ir.signatureStatus.likelySigned) ||
    ir.missingClauses.length > 0;
  const highRiskCount = ir.risks.filter(r => r.severity === 'HIGH').length;

  if (highRiskCount > 0 || (ir.riskLevel || '').toLowerCase().includes('high')) {
    return 'Seek legal advice';
  }
  if (hasCriticalGaps || (ir.riskLevel || '').toLowerCase().includes('medium')) {
    return 'Review before signing';
  }
  return 'Safe to sign';
}

// --- Positive features: protective clause types present, paired with a
// plain-English reason they help — only reported if the type was actually
// classified in at least one clause ---
const POSITIVE_FEATURE_NOTES = {
  'Exceptions': 'Includes defined carve-outs/exceptions, which limits ambiguity about what is and isn\'t covered.',
  'Liability Limit': 'Includes a limitation on certain damages, capping some of your financial exposure.',
  'Severability': 'Includes a severability clause — if one provision is struck down, the rest of the agreement still stands.',
  'Return': 'Includes a defined process (and deadline) for returning or destroying materials, which adds accountability.',
  'Assignment': 'Restricts assignment without consent, so the agreement can\'t be handed off to an unknown third party without your say.',
  'Termination': 'Includes an explicit termination mechanism rather than leaving the end of the relationship undefined.',
};

function positiveFeatures(ir) {
  const found = new Set();
  ir.clauses.forEach(c => c.types.forEach(t => found.add(t)));
  const riskyClauseIds = new Set(ir.risks.map(r => r.clause));
  const notes = [];
  Object.entries(POSITIVE_FEATURE_NOTES).forEach(([type, note]) => {
    if (found.has(type)) notes.push(note);
  });
  return notes;
}

function formatObligation(o, definitions) {
  return `${o.subject} ${o.verb ? o.verb + ' ' : ''}${o.object}`.trim().replace(/\s+/g, ' ');
}

export function generateReport(ir, meta) {
  const docTypeLabel = DOC_TYPE_LABELS[meta.docType] || DOC_TYPE_LABELS.UNKNOWN;

  // --- Document Information ---
  const documentInfo = {
    documentType: docTypeLabel,
    jurisdiction: ir.document.jurisdiction || 'Not found',
    governingLaw: ir.document.governingLaw || 'Not found',
    effectiveDate: ir.document.effectiveDate || 'Not found',
    parties: ir.document.parties.length > 0
      ? ir.document.parties.map(p => `${p.role}: ${p.name}`)
      : ['Not found — likely a blank template or the parser could not resolve named entities']
  };

  // --- Obligations / Rights ---
  const keyObligations = ir.obligations.map(o => `${formatObligation(o)} (Clause ${o.clauseId})`);
  const keyRights = ir.rights.map(r => `${formatObligation(r)} (Clause ${r.clauseId})`);

  // --- Dates & Deadlines ---
  const datesDeadlines = ir.deadlines.map(d => {
    const clauseId = findClauseIdForDeadline(ir.clauses, d);
    return clauseId ? `${d} (Clause ${clauseId})` : d;
  });
  if (ir.document.effectiveDateIsBlank) {
    datesDeadlines.unshift(`Execution date: ${ir.document.effectiveDate}`);
  }

  // --- Risk Analysis ---
  const riskAnalysis = ir.risks.map(r => ({
    issue: r.message,
    level: r.severity,
    clause: r.clause,
    recommendation: recommendationFor(r.message)
  }));
  if (ir.placeholders.length > 0) {
    riskAnalysis.push({
      risk: `Found ${ir.placeholders.length} blank field(s)/placeholder(s) in the document.`,
      level: 'HIGH',
      clause: 'Multiple',
      recommendation: 'All bracketed/blank fields must be completed before this is a valid, signable agreement.'
    });
  }
  if (ir.signatureStatus && ir.signatureStatus.hasSignatureBlock && !ir.signatureStatus.likelySigned) {
    riskAnalysis.push({
      issue: 'Document appears to have a signature section that is not filled in.',
      level: 'HIGH',
      clause: 'Signature block',
      recommendation: 'Ensure the agreement is fully executed by authorized representatives before relying on it.'
    });
  }
  if (ir.missingClauses.length > 0) {
    riskAnalysis.push({
      risk: `Missing expected clause type(s): ${ir.missingClauses.join(', ')}.`,
      level: 'MEDIUM',
      clause: 'Document-wide',
      recommendation: 'Consider whether these clause types should be added for this document type.'
    });
  }

  // --- Fairness Assessment ---
  const fairnessAssessment = ir.fairness;

  // --- Missing / Incomplete Information ---
  const missingInfo = [...ir.placeholders];
  if (ir.missingClauses.length > 0) missingInfo.push(`Missing clause types: ${ir.missingClauses.join(', ')}`);
  if (ir.signatureStatus && ir.signatureStatus.hasSignatureBlock && !ir.signatureStatus.likelySigned) {
    missingInfo.push('Signature block present but appears unsigned (blank lines detected near the end of the document).');
  }

  // --- Positive Features ---
  const positives = positiveFeatures(ir);

  // --- Overall Verdict ---
  const fRating = fairnessRating(ir.fairness);
  const lpRating = legalProtectionRating(ir);
  const recommendation = overallRecommendation(ir);

  // --- Executive Summary (templated, not generated) ---
  const blankNote = ir.placeholders.length > 0
    ? `This document contains ${ir.placeholders.length} unfilled placeholder field(s), indicating it is a template rather than a signed, deal-ready contract. `
    : '';
  const signedNote = (ir.signatureStatus && ir.signatureStatus.hasSignatureBlock)
    ? (ir.signatureStatus.likelySigned ? '' : 'The signature section appears to be blank. ')
    : '';
  
  // --- Process Walkthrough ---
  const processWalkthrough = `Here is a step-by-step walkthrough of how the deterministic engine worked through this document locally:

**1. Document type identification**
I scanned the structural and textual markers of the document and identified it as a **${docTypeLabel}**.

**2. Extracting parties/jurisdiction/law/duration**
I located the jurisdiction (${documentInfo.jurisdiction}) and governing law (${documentInfo.governingLaw}). I identified the parties as: ${documentInfo.parties.join(', ')}.

**3. Clause segmentation and classification**
I mechanically split the document into ${ir.clauses.length} distinct clauses and tagged each by its legal function. This fed directly into the Rights and Obligations sections.

**4. Extracting obligations vs. rights**
I extracted ${ir.obligations.length} distinct obligations and ${ir.rights.length} rights by checking for modal verbs and directional phrasing.

**5. Risk detection**
I ran deterministic heuristics against the text and flagged ${ir.risks.length} specific risks, plus ${ir.placeholders.length} blank placeholders.

**6. Fairness assessment**
Based on the distribution of obligations and rights, I determined this document is structurally ${ir.fairness}.

**7. Confidence score**
My final confidence score for this local deterministic analysis is ${ir.confidenceScore}%.`;

  const executiveSummary = `This is a ${docTypeLabel}. ${blankNote}${signedNote}Overall risk is assessed as ${ir.riskLevel}, and the obligations in this document are best described as: ${ir.fairness}.`;

  return {
    executiveSummary,
    processWalkthrough,
    isDocument: true,
    documentType: docTypeLabel,
    documentInformation: documentInfo,
    keyObligations,
    keyRights,
    importantDates: datesDeadlines,
    riskAnalysis,
    fairnessAssessment,
    missingInformation: missingInfo,
    positiveFeatures: positives,
    overallVerdict: {
      overallRisk: ir.riskLevel,
      fairnessRating: fRating,
      legalProtectionRating: lpRating,
      recommendation
    },
    confidenceScore: ir.confidenceScore
  };
}
