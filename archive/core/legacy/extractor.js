export function extractEntities(clauses) {
  const entities = new Set();
  clauses.forEach(c => {
     // Naive entity extraction (Capitalized words like Receiving Party, Disclosing Party, Tenant)
     const match = c.text.match(/(?:Receiving Party|Disclosing Party|Tenant|Landlord|Company|Client|Consultant|Contractor)/gi);
     if (match) {
        match.forEach(m => entities.add(m));
     }
  });
  return Array.from(entities);
}

// Recognized role-subject phrases. The subject capture is restricted to
// this list (rather than an open-ended `[A-Z][a-zA-Z\s]+?`) so a modal verb
// buried deep in a long sentence ("...and further agrees that the other
// Party shall be entitled...") can't cause the regex to backtrack across
// the whole preceding clause and report a 40-word run-on as the "subject".
const ROLE_SUBJECTS = [
  'The Receiving Party', 'The Disclosing Party', 'Receiving Party', 'Disclosing Party',
  'Either Party', 'Each Party', 'Neither Party', 'Both Parties', 'The Parties', 'Parties',
  'The Tenant', 'Tenant', 'The Landlord', 'Landlord',
  'The Company', 'Company', 'The Client', 'Client',
  'The Consultant', 'Consultant', 'The Contractor', 'Contractor',
  'The Employer', 'Employer', 'The Employee', 'Employee',
  'The Licensor', 'Licensor', 'The Licensee', 'Licensee',
  'The Lender', 'Lender', 'The Borrower', 'Borrower',
  'Party 1', 'Party A', 'Party B',
  // Second-person / consumer-facing phrasing common in ToS, EULAs, and
  // privacy policies ("You agree to...", "The User shall...").
  'You', 'The User', 'User', 'The Customer', 'Customer', 'The Subscriber', 'Subscriber', 'We',
];

const DUTY_MODALS = ['shall', 'must', 'will', 'cannot', 'agrees to', 'agree to', 'acknowledges', 'acknowledge', 'consents to', 'consent to', 'undertakes to', 'undertake to'];
const RIGHT_MODALS = ['may', 'is entitled to', 'has the right to', 'reserves the right to'];

function buildModalRegex(modalWords) {
  const subjectAlternation = [...ROLE_SUBJECTS]
    .sort((a, b) => b.length - a.length)
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const modalAlternation = modalWords.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(
    `\\b(${subjectAlternation})\\s+(?:is\\s+|has\\s+|reserves\\s+)?(${modalAlternation})\\s*(?:to\\s+)?([a-z]+)?\\s*([^.,;]+)`,
    'gi'
  );
}

function extractByModal(clauses, modalWords) {
  const results = [];
  const modalRegex = buildModalRegex(modalWords);
  clauses.forEach(c => {
    let match;
    while ((match = modalRegex.exec(c.text)) !== null) {
      const verb = match[3] || '';
      const object = match[4] ? match[4].trim() : '';
      // Skip naming/definitional boilerplate ("...shall hereinafter be
      // referred to as Company") — it labels a party, it doesn't impose a
      // duty, and counting it as an obligation skews fairness scoring.
      if (verb.toLowerCase() === 'hereinafter' || /referred to as/i.test(object)) {
        continue;
      }
      results.push({
        subject: match[1].trim(),
        verb,
        object,
        clauseId: c.id
      });
    }
  });
  return results;
}

export function extractObligations(clauses) {
  return extractByModal(clauses, DUTY_MODALS);
}

export function extractRights(clauses) {
  return extractByModal(clauses, RIGHT_MODALS);
}

// --- Document-level metadata extraction ---
// Previously missing entirely: nothing extracted parties, jurisdiction,
// governing law, or effective date, so the IR had no way to surface a
// "Document Information" section.
export function extractMetadata(text, definitions = {}) {
  const metadata = {
    parties: [],
    jurisdiction: null,
    governingLaw: null,
    effectiveDate: null,
    effectiveDateIsBlank: false,
  };

  // Parties: pull from the resolved definitions map (role label -> entity name).
  for (const [role, entity] of Object.entries(definitions)) {
    if (entity) metadata.parties.push({ role, name: entity });
  }

  // Governing law, e.g. "governed by the laws of India" / "the laws of the
  // State of New York".
  const govLawMatch = text.match(
    /governed by(?: and construed in accordance with)? the laws of(?: the (?:State|Republic|Province) of)?\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/i
  );
  if (govLawMatch) metadata.governingLaw = govLawMatch[1].trim();

  // Jurisdiction / venue, e.g. "exclusive jurisdiction of the Courts in
  // Bangalore" or "jurisdiction of the courts of New York".
  const jurisdictionMatch = text.match(
    /jurisdiction of the\s+courts?\s+(?:in|of)\s+([A-Za-z][A-Za-z\s]*?)(?=,|\.|;|\s+for\b|\s+under\b|\s+in connection\b|$)/i
  );
  if (jurisdictionMatch) metadata.jurisdiction = jurisdictionMatch[1].trim();

  // Effective date. Two cases: an actual date is present, or the date slot
  // is a blank template field (e.g. "day of _________, 2016").
  const blankDateMatch = text.match(/day of\s*_{2,}\s*,?\s*(\d{4})/i);
  if (blankDateMatch) {
    metadata.effectiveDateIsBlank = true;
    metadata.effectiveDate = `Blank (year shown as ${blankDateMatch[1]})`;
  } else {
    const dateMatch = text.match(
      /(?:effective as of|entered into on|dated as of|made on this the)\s+([A-Za-z0-9,\s]{4,30}?(?:\d{4}))/i
    );
    if (dateMatch) metadata.effectiveDate = dateMatch[1].trim();
  }

  return metadata;
}

export function extractExceptions(clauses) {
  const exceptions = [];
  clauses.forEach(c => {
    if (/however|except|unless|provided that|notwithstanding|shall not include/i.test(c.text)) {
      exceptions.push({ clauseId: c.id, text: c.text.substring(0, 150) + "..." });
    }
  });
  return exceptions;
}

export function extractDeadlines(text) {
  const deadlines = [];
  // Supports plain numerals ("30 days"), word numerals ("thirty days"),
  // parenthetical numerals directly after a word numeral with no space
  // before the unit ("seven (7) days", "thirty (30)days" — no space between
  // ")" and the unit is common in generated contracts), and "year(s)"-style
  // plurals where "(s)" sits between the root word and end of the match.
  const regex = /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|thirty|sixty|ninety)\b\s*(?:\(\d+\))?\s*(?:days?|months?|years?)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    deadlines.push(match[0].replace(/\s+/g, ' ').trim());
  }
  return [...new Set(deadlines)];
}

export function extractPlaceholders(text) {
  const placeholders = [];
  const regex = /_{3,}|\[[A-Za-z\s]+\]|<[A-Za-z\s]+>|TBD|Please Fill|Lorem Ipsum/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    placeholders.push(match[0]);
  }
  return [...new Set(placeholders)];
}

// Heuristic execution-status check. We can't reliably parse "is this PDF
// actually signed" from text alone, so this is deliberately conservative:
// it looks for a signature-related section, then checks whether the tail
// of the document (where signature blocks conventionally live) still
// contains blank-line placeholders. This will misfire on documents with
// unconventional layouts — flagged as a known limitation, not a guarantee.
export function extractSignatureStatus(text) {
  const hasSignatureBlock = /signature/i.test(text);
  if (!hasSignatureBlock) {
    return { hasSignatureBlock: false, likelySigned: false };
  }
  const tail = text.slice(Math.floor(text.length * 0.7));
  const blankLinesInTail = (tail.match(/_{3,}/g) || []).length;
  return { hasSignatureBlock: true, likelySigned: blankLinesInTail === 0 };
}
