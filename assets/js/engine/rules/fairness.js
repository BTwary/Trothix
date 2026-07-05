import { resolveTerm } from '../core/definitions.js';

// Buckets recognized role-subjects into two conceptual sides. Mutual
// clauses ("Either Party", "Each Party", "Both Parties", "Neither Party",
// "The Parties") impose the same duty on both sides at once, so they're
// counted toward both buckets rather than dropped or arbitrarily assigned
// to one side — attributing a mutual duty to only one party would itself
// misrepresent the agreement as more one-sided than it is.
const SIDE_A_TERMS = ['receiving party', 'tenant', 'consultant', 'employee', 'licensee'];
const SIDE_B_TERMS = ['disclosing party', 'landlord', 'client', 'employer', 'licensor', 'company', 'contractor'];
const MUTUAL_TERMS = ['either party', 'each party', 'neither party', 'both parties', 'the parties', 'parties'];

function normalizedRole(subject) {
  return subject.toLowerCase().replace(/^the\s+/, '').trim();
}

function labelFor(role, definitions) {
  // Try to show the actual resolved entity name if we have one, e.g.
  // "Acme Inc. (Disclosing Party)" instead of just "Disclosing Party".
  const titleCased = role.replace(/\b\w/g, ch => ch.toUpperCase());
  const resolved = resolveTerm(definitions, titleCased);
  return resolved !== titleCased ? `${resolved} (${titleCased})` : titleCased;
}

export function calculateFairness(obligations, definitions = {}) {
  if (!obligations || obligations.length === 0) {
    return "Unknown (0 obligations detected)";
  }

  // uniqueA/uniqueB count obligations that fall on only one side. Mutual
  // obligations are tracked separately and never added into either side's
  // total — a duty that binds both parties equally can't be evidence that
  // the agreement favors one of them, so folding it into both counts would
  // inflate both sides and obscure the actual imbalance.
  let uniqueA = 0;
  let uniqueB = 0;
  let mutualCount = 0;
  let sideALabel = null;
  let sideBLabel = null;

  obligations.forEach(o => {
    const role = normalizedRole(o.subject);
    if (MUTUAL_TERMS.includes(role)) {
      mutualCount++;
    } else if (SIDE_A_TERMS.some(t => role.includes(t))) {
      uniqueA++;
      if (!sideALabel) sideALabel = labelFor(role, definitions);
    } else if (SIDE_B_TERMS.some(t => role.includes(t))) {
      uniqueB++;
      if (!sideBLabel) sideBLabel = labelFor(role, definitions);
    }
  });

  const labelA = sideALabel || 'Party A';
  const labelB = sideBLabel || 'Party B';
  const mutualNote = mutualCount ? ` (plus ${mutualCount} mutual obligation${mutualCount === 1 ? '' : 's'} binding both sides equally)` : '';

  if (uniqueA === 0 && uniqueB === 0) {
    return `Mutual only — no one-sided obligations detected${mutualNote || ` (${mutualCount} shared obligations found)`}`;
  }
  if (uniqueA > 0 && uniqueB === 0) {
    return `Highly Asymmetric (${labelA} carries all ${uniqueA} one-sided obligation${uniqueA === 1 ? '' : 's'}, with no matching one-sided duty found for the counterparty)${mutualNote}`;
  }
  if (uniqueB > 0 && uniqueA === 0) {
    return `Highly Asymmetric (${labelB} carries all ${uniqueB} one-sided obligation${uniqueB === 1 ? '' : 's'}, with no matching one-sided duty found for the counterparty)${mutualNote}`;
  }

  const diff = Math.abs(uniqueA - uniqueB);
  if (diff <= 2) {
    return `Balanced (${labelA}: ${uniqueA} one-sided vs ${labelB}: ${uniqueB} one-sided)${mutualNote}`;
  }

  const favored = uniqueA > uniqueB ? labelB : labelA;
  return `Asymmetric (Favors ${favored} — ${labelA}: ${uniqueA} one-sided vs ${labelB}: ${uniqueB} one-sided)${mutualNote}`;
}
