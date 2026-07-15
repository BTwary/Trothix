export function parseLease(text, definitions) {
  const extracted = {
    monthlyRent: null,
    securityDepositMonths: null,
    lateFeePercentage: null,
    landlordNoticeHours: null,
    autoRenewalFlag: false,
    rentCapPercentage: null,
    landlordName: definitions?.['Landlord'] || null,
    tenantName: definitions?.['Tenant'] || null,
  };

  // 1. Rent Amount
  // Scans every "rent ... $X" candidate in the document (not just the
  // first) and skips any candidate whose surrounding text mentions
  // "deposit" -- otherwise a security deposit described as "one month rent,
  // $2,000" gets misread as the monthly rent figure. [^.]{0,60}? keeps the
  // match from crossing into an unrelated sentence.
  extracted.monthlyRent = extractMonthlyRent(text);

  // 2. Security Deposit (checking if it matches X months rent)
  const depositRegex = /security deposit.*?equal to (\d+|one|two|three) months? rent/i;
  const matchDeposit = text.match(depositRegex);
  if (matchDeposit) {
    let num = matchDeposit[1].toLowerCase();
    const map = { one: 1, two: 2, three: 3 };
    extracted.securityDepositMonths = map[num] || parseInt(num, 10);
  }

  // 3. Late Fee
  const lateFeeRegex = /late fee.{0,30}?(\d+)%/i;
  const matchLateFee = text.match(lateFeeRegex);
  if (matchLateFee) {
    extracted.lateFeePercentage = parseInt(matchLateFee[1], 10);
  }

  // 4. Notice of Entry
  // Scans sentence-by-sentence for one that mentions entry, rather than
  // requiring "hours...notice...entry" in that literal order -- common
  // phrasing like "Landlord may enter with 12 hours notice" never contains
  // the word "entry" at all, and the old fixed-order regex missed it.
  extracted.landlordNoticeHours = extractNoticeHours(text);

  // 5. Renewal
  if (/automatically renew/i.test(text)) {
    extracted.autoRenewalFlag = true;
  }

  // 6. Rent Cap
  const rentCapRegex = /rent increase shall not exceed (\d+)%/i;
  const matchCap = text.match(rentCapRegex);
  if (matchCap) {
    extracted.rentCapPercentage = parseInt(matchCap[1], 10);
  }

  return extracted;
}

function extractNoticeHours(text) {
  const numberWordMap = { twentyfour: 24, fortyeight: 48 };
  // Split into rough sentences so "enter" and "notice"/"hours" can be
  // matched together regardless of which comes first.
  const sentences = text.match(/[^.]*\.(?:\s|$)/g) || [text];
  for (const sentence of sentences) {
    if (!/\b(?:enter|entry)\b/i.test(sentence)) continue;
    const match = sentence.match(/(\d+|twenty-?four|forty-?eight)\s*(?:hours|hrs)/i);
    if (match) {
      const num = match[1].toLowerCase().replace('-', '');
      return numberWordMap[num] || parseInt(num, 10);
    }
  }
  return null;
}

function extractMonthlyRent(text) {
  const regex = /rent[^.]{0,60}?\$([0-9,]+)(?:\.[0-9]{2})?/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const windowStart = Math.max(0, match.index - 50);
    const surrounding = text.slice(windowStart, match.index + match[0].length);
    if (/deposit/i.test(surrounding)) {
      continue; // this $ figure belongs to a deposit clause, not rent -- keep scanning
    }
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}
