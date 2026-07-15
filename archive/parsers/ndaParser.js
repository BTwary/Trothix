export function parseNDA(text, definitions) {
  const extracted = {
    termYears: null,
    termYearsMissingButHandled: false,
    confidentialityScope: '',
    jurisdiction: null,
    counterpartyState: null,
    isUnilateral: false,
    mentionsTradeSecrets: false,
    disclosingPartyName: definitions?.['Disclosing Party'] || null,
    receivingPartyName: definitions?.['Receiving Party'] || null,
  };

  // 1. Duration / Term parsing
  // E.g. "for a period of 2 years", "term of three (3) years"
  const termRegex = /period of (\d+|one|two|three|four|five|ten) years?/i;
  const matchTerm = text.match(termRegex);
  if (matchTerm) {
    let num = matchTerm[1].toLowerCase();
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10 };
    extracted.termYears = map[num] || parseInt(num, 10);
  } else if (/perpetual|indefinite|survive termination/i.test(text)) {
    extracted.termYearsMissingButHandled = true;
  }

  // 2. Scope & Trade Secrets
  const scopeRegex = /Confidential Information(?: shall)? means (.*?)(?=\.|$)/i;
  const matchScope = text.match(scopeRegex);
  if (matchScope) {
    extracted.confidentialityScope = matchScope[1];
  } else if (/confidential information/i.test(text)) {
    extracted.confidentialityScope = 'Found mentions of confidential information.';
  }

  extracted.mentionsTradeSecrets = /trade secret/i.test(text);

  // 3. Jurisdiction (governing law / venue)
  const jurisdictionRegex = /(?:governed by the laws of|jurisdiction of) (the State of )?([A-Z][a-zA-Z\s]+)/i;
  const matchJur = text.match(jurisdictionRegex);
  if (matchJur && matchJur[2]) {
    extracted.jurisdiction = matchJur[2].trim();
  }

  // 4. Counterparty state of incorporation/residence.
  // Best-effort: looks for "a [State] corporation" / "a corporation organized
  // under the laws of [State]" near an entity name. This is distinct from
  // jurisdiction/governing law above -- a company can be incorporated in one
  // state but agree to litigate in another.
  const incorporationRegex =
    /a\s+([A-Z][a-zA-Z]+)\s+corporation|corporation organized under the laws of (?:the State of )?([A-Z][a-zA-Z]+)/i;
  const matchIncorp = text.match(incorporationRegex);
  if (matchIncorp) {
    extracted.counterpartyState = (matchIncorp[1] || matchIncorp[2] || '').trim();
  }

  // 5. Unilateral vs Mutual
  // Checks if both roles exist anywhere in the text independently, rather
  // than requiring them adjacent in one match (label-style layouts like
  // "Disclosing Party:\nAcme Inc." put a newline between them, which broke
  // the old adjacency-based regex).
  const hasMutual = /mutual(?: non-disclosure| confidentiality)/i.test(text);
  const hasDisclosing = /disclosing party/i.test(text);
  const hasReceiving = /receiving party/i.test(text);

  if (hasMutual) {
    extracted.isUnilateral = false;
  } else if (hasDisclosing && hasReceiving) {
    extracted.isUnilateral = true;
  }

  return extracted;
}
