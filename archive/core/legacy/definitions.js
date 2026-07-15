// Resolves defined terms (e.g. "Tenant", "Disclosing Party") to the actual
// entity name they refer to, so downstream parsers/rules can reason about
// *who* a term refers to, not just that the term exists somewhere.
//
// Handles two common contract layouts:
//   1. Inline alias: `Acme Inc. ("Disclosing Party")` or
//      `Acme Inc. (hereinafter referred to as the "Disclosing Party")`
//   2. Label-style: `Disclosing Party:\nAcme Inc.` (common in templated /
//      generated documents, e.g. DocuSign exports)
//
// Returns: { [aliasTerm]: entityName }
// e.g. { "Disclosing Party": "Acme Inc.", "Receiving Party": "John Doe" }
export function parseDefinitions(text) {
  const definitions = {};

  // --- Pattern 1: inline alias ---
  // Captures a preceding entity-like phrase, then the quoted alias in parens.
  // The entity group is restricted to a run of Title-Case tokens (with
  // optional Inc./LLC/Corp.-style trailing periods) so it can't accidentally
  // swallow ordinary sentence text like "This Agreement is between Acme Inc."
  // — it stops at the last capitalized-word run immediately before the "(".
  const inlineRegex =
    /((?:[A-Z][\w&]*\.?,?\s+){0,5}[A-Z][\w&]*\.?,?)\s*\(\s*(?:hereinafter\s+)?(?:referred to as\s+)?(?:the\s+)?["']([A-Za-z][A-Za-z\s]{1,40})["']\s*\)/g;

  let match;
  while ((match = inlineRegex.exec(text)) !== null) {
    const entity = match[1].trim().replace(/,$/, '');
    const alias = match[2].trim();
    if (entity && alias && !definitions[alias]) {
      definitions[alias] = entity;
    }
  }

  // --- Pattern 2: label-style layout ---
  // "Disclosing Party:\nAcme Inc." — only checks known role-label terms
  // rather than any capitalized word, to avoid false positives on generic
  // section headers.
  const knownRoleLabels = [
    'Disclosing Party', 'Receiving Party', 'Landlord', 'Tenant',
    'Employer', 'Employee', 'Client', 'Contractor', 'Licensor', 'Licensee',
  ];
  for (const label of knownRoleLabels) {
    if (definitions[label]) continue; // inline pattern already found it
    const labelRegex = new RegExp(`${label}\\s*:\\s*\\n?\\s*([A-Z][A-Za-z0-9&\\s]{1,80}?)(?=,|\\.|\\n|$)`, 'i');
    const labelMatch = text.match(labelRegex);
    if (labelMatch) {
      const entity = labelMatch[1].trim();
      if (entity) definitions[label] = entity;
    }
  }

  return definitions;
}

// Convenience helper: given the definitions map and a role label, return the
// entity name if known, otherwise the label itself (safe fallback for
// display purposes).
export function resolveTerm(definitions, label) {
  return definitions?.[label] || label;
}
