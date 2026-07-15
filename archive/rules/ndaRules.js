// Severity taxonomy is shared across ndaRules.js, leaseRules.js, and
// universalRules.js: 'LOW' | 'MEDIUM' | 'HIGH'. Previously this file used
// YELLOW/RED/INFO while universalRules.js used MEDIUM/HIGH -- that mismatch
// meant the UI's risk-level badge could never register HIGH/MEDIUM for NDA
// or Lease results, and the flag list showed inconsistent labels
// ("yellow severity" vs "high severity") to the user. Normalized here.
export const evaluateNDARisk = (extractedData, userContext, ruleThresholds) => {
  const flags = [];

  // 1. Duration Risk (Strict Trade Secret logic)
  const isPerpetual = !extractedData.termYears && extractedData.termYearsMissingButHandled;
  const hasTradeSecretClause = extractedData.mentionsTradeSecrets;

  if (!extractedData.termYears && !extractedData.termYearsMissingButHandled && !hasTradeSecretClause) {
    flags.push({ severity: 'MEDIUM', clause: 'Term', message: 'No expiration date found. Standard confidential info should have a fixed term (unlike Trade Secrets).' });
  } else if (isPerpetual && !hasTradeSecretClause) {
    flags.push({ severity: 'MEDIUM', clause: 'Term', message: 'Term is perpetual but no trade secret exception was found.' });
  } else if (extractedData.termYears > ruleThresholds.ndaMaxTerm && !hasTradeSecretClause) {
    flags.push({ severity: 'MEDIUM', clause: 'Term', message: `Duration exceeds standard ${ruleThresholds.ndaMaxTerm} years for non-trade-secret information.` });
  }

  // 2. Jurisdiction Risk (only flag 3rd-party venues; counterpartyState now
  // populated by ndaParser.js's incorporation-state extraction)
  if (extractedData.jurisdiction && userContext?.homeState) {
    const isMyState = extractedData.jurisdiction.toLowerCase() === userContext.homeState.toLowerCase();
    const isOtherPartyState = extractedData.counterpartyState && extractedData.jurisdiction.toLowerCase() === extractedData.counterpartyState.toLowerCase();

    if (!isMyState && !isOtherPartyState && !ruleThresholds.neutralStates.map(s => s.toLowerCase()).includes(extractedData.jurisdiction.toLowerCase())) {
      flags.push({ severity: 'MEDIUM', clause: 'Governing Law', message: `Jurisdiction is ${extractedData.jurisdiction}, which matches neither party's location.` });
    } else if (!isMyState) {
      flags.push({ severity: 'LOW', clause: 'Governing Law', message: `Governing law is ${extractedData.jurisdiction} (Counterparty's state).` });
    }
  }

  // 3. Unilateral Risk Context
  if (extractedData.isUnilateral && userContext?.role === 'Receiving Party') {
    flags.push({ severity: 'LOW', clause: 'Scope', message: 'This is a unilateral NDA where you are the receiving party. Verify you are not required to disclose any of your own confidential information.' });
  }

  return flags;
};
