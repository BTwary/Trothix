// Universal/generic parser -- runs on any document type that doesn't have a
// dedicated parser (NDA, Lease). Covers the clause taxonomy from the
// Phase 2.2 roadmap: Definitions, Payment, Termination, Liability, Warranty,
// Confidentiality, IP, Indemnity, Arbitration, Jurisdiction, Signatures,
// Schedules.
export function parseUniversal(text, definitions) {
  const extracted = {
    // Dispute resolution
    hasBindingArbitration: false,
    hasJuryWaiver: false,
    hasClassActionWaiver: false,
    // Liability / risk
    hasUnilateralIndemnification: false,
    hasLiquidatedDamages: false,
    hasLiabilityCap: false,
    // IP
    hasPerpetualLicense: false,
    // Payment
    hasPaymentTerms: false,
    paymentTermsDays: null,
    // Termination
    hasTerminationClause: false,
    hasAutoRenewal: false,
    terminationNoticeDays: null,
    // Warranty
    hasWarrantyDisclaimer: false,
    // Signatures
    hasSignatureBlock: false,
    // Schedules / Exhibits
    referencesSchedules: false,
    // Jurisdiction
    jurisdiction: null,
    isFullyLocal: false,
  };

  // 1. Dispute Resolution
  if (/binding arbitration|submit to arbitration/i.test(text)) extracted.hasBindingArbitration = true;
  if (/waive(?:s)?.*?jury trial|waiver of jury/i.test(text)) extracted.hasJuryWaiver = true;
  if (/class action waiver|waive.*?class action/i.test(text)) extracted.hasClassActionWaiver = true;

  // 2. Indemnification (looking for one-sided terms without "mutual")
  const hasIndemnify = /indemnify and hold harmless|agree to indemnify/i.test(text);
  const hasMutualIndemnify = /mutual indemnification|mutually indemnify/i.test(text);
  if (hasIndemnify && !hasMutualIndemnify) {
    extracted.hasUnilateralIndemnification = true;
  }

  // 3. Damages & Liability
  if (/liquidated damages/i.test(text)) extracted.hasLiquidatedDamages = true;
  if (/limitation of liability|liability.{0,40}?shall not exceed/i.test(text)) extracted.hasLiabilityCap = true;

  // 4. IP / Rights
  if (/perpetual, irrevocable.*?license|irrevocable, perpetual/i.test(text)) extracted.hasPerpetualLicense = true;

  // 5. Payment terms
  // Looks for "Net 30/60/90" style terms and generic "payment due within X
  // days" phrasing.
  const netTermsMatch = text.match(/net\s?(\d{1,3})\b/i);
  const dueWithinMatch = text.match(/(?:payment|invoice).{0,30}?due within (\d{1,3}) days/i);
  if (netTermsMatch || dueWithinMatch || /payment terms|compensation|fees payable/i.test(text)) {
    extracted.hasPaymentTerms = true;
    if (netTermsMatch) extracted.paymentTermsDays = parseInt(netTermsMatch[1], 10);
    else if (dueWithinMatch) extracted.paymentTermsDays = parseInt(dueWithinMatch[1], 10);
  }

  // 6. Termination
  if (/termination|terminate this agreement|right to terminate/i.test(text)) {
    extracted.hasTerminationClause = true;
  }
  if (/automatically renew/i.test(text)) {
    extracted.hasAutoRenewal = true;
  }
  const noticeMatch = text.match(/(\d{1,3})\s*days?.{0,20}?(?:written )?notice.{0,20}?terminat/i)
    || text.match(/terminat.{0,40}?(\d{1,3})\s*days?.{0,20}?(?:written )?notice/i);
  if (noticeMatch) {
    extracted.terminationNoticeDays = parseInt(noticeMatch[1], 10);
  }

  // 7. Warranty
  if (/disclaims? all warrant|no warrant|"as is"|as-is basis|without warranty of any kind/i.test(text)) {
    extracted.hasWarrantyDisclaimer = true;
  }

  // 8. Signatures
  if (/in witness whereof|signature:|signed:|_{3,}\s*\n.{0,20}(signature|date)/i.test(text)) {
    extracted.hasSignatureBlock = true;
  }

  // 9. Schedules / Exhibits
  if (/schedule [a-z0-9]|exhibit [a-z0-9]|appendix [a-z0-9]/i.test(text)) {
    extracted.referencesSchedules = true;
  }

  // 10. Jurisdiction
  const jurisdictionRegex = /(?:governed by the laws of|jurisdiction of) (the State of )?([A-Z][a-zA-Z\s]+)/i;
  const matchJur = text.match(jurisdictionRegex);
  if (matchJur && matchJur[2]) {
    extracted.jurisdiction = matchJur[2].trim();
  }

  // Determine if we found enough generic signals to consider this a
  // successful local parse (i.e. we don't need to fall back to AI).
  const foundGenericFlags =
    extracted.hasBindingArbitration || extracted.hasUnilateralIndemnification ||
    extracted.hasLiquidatedDamages || extracted.hasLiabilityCap || extracted.hasPerpetualLicense ||
    extracted.hasPaymentTerms || extracted.hasTerminationClause || extracted.hasWarrantyDisclaimer;

  if (foundGenericFlags || extracted.jurisdiction) {
    extracted.isFullyLocal = true;
  }

  return extracted;
}
