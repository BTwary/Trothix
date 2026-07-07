/**
 * @fileoverview definitionEngine.js
 * Scans for defined terms ("means", "shall mean", "includes", etc.), tracks
 * redefinitions, resolves scope modifiers ("for purposes of..."), and links
 * every downstream usage of a term back to where it's defined.
 *
 * v2 upgrades over v1 (same Engine contract, same provides/invalidates):
 *  - Expanded verb-phrase set (9 verbs instead of 3)
 *  - Scope modifier extraction ("for purposes of this Agreement", etc.)
 *  - Multi-term definitions: `"Affiliate" and "Subsidiary" mean ...`
 *  - Quote normalisation (curly/smart quotes -> straight) before matching
 *  - Redefinitions are now tracked, not silently dropped (v1 bug: a later
 *    redefinition of an already-seen term was discarded entirely because of
 *    `if (!dictionary.has(term))`)
 *  - Word-boundary escaping fixed for the usage scan (a term containing
 *    regex metacharacters could previously throw or mismatch)
 *  - Two self-contained findings: DUPLICATE_DEFINITION and
 *    DEFINITION_WITHOUT_USE (both are extraction-integrity checks, not
 *    legal risk rules, so they're emitted directly here rather than added
 *    to the compiled rule DSL that findingEngine.js/RuleEvaluator.js own)
 *
 * Deliberately NOT done here (see chat writeup for why):
 *  - Promoting definitions to real `kind: 'Definition'` IR nodes / `defines`
 *    edges. Both are already reserved in core/types.js, but
 *    LegalIRBuilder._mutatePath() can't actually append new elements to the
 *    `nodes` array yet (its 'Add' path-mutation only supports updating an
 *    *existing* keyed object, not pushing into an array) - Add() will
 *    throw or set a bogus non-index property. Fixing that is an
 *    IR-builder-level change, out of scope for "don't rewrite existing
 *    modules." Recommended as an immediately-next, separately-scoped task.
 *  - CircularDefinition / ScopeMismatch rules - these need a cross-term
 *    reference graph (does definition A's body use term B, and B's body
 *    use A?) that's better built once usage-linking has been in production
 *    long enough to trust its accuracy. Flagged as follow-up, not stubbed.
 */

// Longest phrases first: JS regex alternation takes the first alternative
// that matches at a position, not the longest, so ordering matters whenever
// one phrase is a prefix of another's matching context.
const DEFINITION_VERBS = [
  'has the meaning set forth in',
  'shall be defined as',
  'is defined as',
  'shall not include',
  'does not include',
  'shall include',
  'shall mean',
  'includes',
  'include',   // plural agreement: `"A" and "B" include ...`
  'means',
  'mean',      // plural agreement: `"A" and "B" mean ...`
  'refers to',
  'refer to',  // plural agreement: `"A" and "B" refer to ...`
];

const SCOPE_MARKERS = [
  'solely for purposes of',
  'for all purposes of',
  'for the purpose of',
  'for purposes of',
  'when used in',
  'as used in',
];

const TERM_PREFIX = /^\s*the\s+term\s+/i;

/** Escapes a string for safe embedding inside a `new RegExp(...)` pattern.
 *  v1 built usage-scan regexes as `new RegExp('\\b' + term + '\\b')` with no
 *  escaping - a captured term containing `(`, `.`, `+`, etc. could throw or
 *  silently match the wrong thing. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAlternation(phrases) {
  return phrases.map(p => p.replace(/\s+/g, '\\s+')).join('|');
}

const VERB_PATTERN = new RegExp(`\\b(${buildAlternation(DEFINITION_VERBS)})\\b`, 'i');
const SCOPE_PATTERN = new RegExp(`\\b(${buildAlternation(SCOPE_MARKERS)})\\b`, 'i');

/** Normalises curly/smart quotes to a single straight-quote character so the
 *  rest of the extractor only has to deal with one quote form. Also handles
 *  the "the term ""Foo"" means" doubled-quote pattern some drafters use for
 *  the "the term X" construction by collapsing runs of quote chars to one. */
function normaliseQuotes(text) {
  return text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/"{2,}/g, '"');
}

/** Splits a raw defined-term span like `"Affiliate" and "Subsidiary"` or
 *  `"Affiliate", "Subsidiary",` into individual term strings. */
function splitMultiTerm(span) {
  return span
    .split(/"\s*(?:,\s*(?:and\s+)?|and\s+)"/i)
    .map(s => s.replace(/^"|"$/g, '').trim())
    .filter(Boolean);
}

/**
 * Finds the defined-term span (one or more quoted terms) immediately
 * preceding a definition verb, plus an optional unquoted fallback for
 * documents that don't use quote marks at all.
 *
 * The unquoted fallback only fires at the very start of the node's text -
 * this is the same false-positive mitigation the proposal called for
 * ("ordinary quoted speech... require the sentence to be in a definitions
 * section"), implemented as a cheap positional heuristic rather than a
 * separate heading-detector: a capitalised phrase followed by "means"
 * mid-paragraph is very commonly just a proper noun; the same pattern at
 * the very start of a clause is very commonly an actual definition.
 */
function findDefinedTermSpan(text, verbMatchIndex) {
  const before = text.slice(0, verbMatchIndex);

  // Quoted form: walk backwards from the verb over a run of `"..."`
  // optionally joined by `,`/`and`, optionally preceded by "the term".
  const quotedRun = before.match(/("(?:[^"]{1,80})"(?:\s*,?\s*and\s*"(?:[^"]{1,80})")*)\s*$/);
  if (quotedRun) {
    const prefixStripped = before.slice(0, before.length - quotedRun[0].length);
    const hasTermPrefix = TERM_PREFIX.test(prefixStripped.slice(-15));
    return { raw: quotedRun[1], terms: splitMultiTerm(quotedRun[1]), quoted: true, hasTermPrefix };
  }

  // Unquoted fallback, start-of-node only.
  const unquoted = before.match(/^\s*([A-Z][A-Za-z0-9]*(?:\s+(?:of|the|and|in|to|for|[A-Z][A-Za-z0-9]*))*)\s*$/);
  if (unquoted && before.trim().length > 0 && before.trim().length < 60) {
    return { raw: unquoted[1], terms: [unquoted[1].trim()], quoted: false, hasTermPrefix: false };
  }

  return null;
}

/** Given the text right after a verb match, returns the definition body and
 *  an optional {marker, scopeTarget}, cut at the first sentence-ending
 *  period (naive but matches the rest of this codebase's sentence
 *  handling - no dedicated sentence segmenter exists upstream yet). */
function extractBodyAndScope(afterVerb) {
  const periodIdx = afterVerb.search(/\.\s|\.$/);
  const clause = periodIdx === -1 ? afterVerb : afterVerb.slice(0, periodIdx);

  const scopeMatch = clause.match(SCOPE_PATTERN);
  if (!scopeMatch) {
    return { body: clause.trim(), scope: null };
  }

  const body = clause.slice(0, scopeMatch.index).trim().replace(/,\s*$/, '');
  const scopeTarget = clause.slice(scopeMatch.index + scopeMatch[0].length).trim();
  return { body, scope: { marker: scopeMatch[0], scopeTarget } };
}

export default {
  id: "definitionEngine",
  version: "2.0.0",
  priority: 20,
  dependsOn: [],
  provides: ["definitions", "links"],
  invalidates: ["clauseClassifier"],
  cost: 3,

  /**
   * @param {import('../core/types.js').Context} context
   * @returns {import('../core/types.js').ExecutionResult}
   */
  execute: (context) => {
    const { ir } = context;
    const patches = [];
    const findings = [];
    const warnings = [];

    /** @type {Map<string, Array<{defId:string, term:string, verbPhrase:string, body:string, scope:?object, sourceNode:string}>>} */
    const dictionary = new Map();

    // --- Pass 1: extract definitions -----------------------------------
    ir.nodes.forEach(node => {
      const text = normaliseQuotes(node.text || '');
      let verbMatch;
      const verbScanner = new RegExp(VERB_PATTERN.source, 'gi');

      while ((verbMatch = verbScanner.exec(text)) !== null) {
        const span = findDefinedTermSpan(text, verbMatch.index);
        if (!span) continue;

        const afterVerb = text.slice(verbScanner.lastIndex);
        const { body, scope } = extractBodyAndScope(afterVerb);
        if (!body) continue; // definition verb with nothing after it - not a real definition

        for (const rawTerm of span.terms) {
          const term = rawTerm.trim();
          if (term.length < 2) continue;
          const key = term.toLowerCase();

          const existing = dictionary.get(key) || [];
          const occurrenceIndex = existing.length + 1;
          const defId = occurrenceIndex === 1
            ? `DEF_${term.replace(/\s+/g, '').toUpperCase()}`
            : `DEF_${term.replace(/\s+/g, '').toUpperCase()}_${occurrenceIndex}`;

          const entry = {
            defId,
            term,
            verbPhrase: verbMatch[1],
            body,
            scope,
            sourceNode: node.id,
          };
          existing.push(entry);
          dictionary.set(key, existing);

          patches.push({
            op: 'Annotate',
            path: `/metadata/definitions/${defId}`,
            value: {
              term,
              verbPhrase: entry.verbPhrase,
              body: entry.body,
              scope: entry.scope,
              sourceNode: node.id,
              redefinition: occurrenceIndex > 1,
            },
          });
        }
      }
    });

    // --- Pass 2: link usages back to their definition ------------------
    const usageCounts = new Map(); // key -> number of OTHER nodes referencing it

    if (dictionary.size > 0) {
      ir.nodes.forEach(node => {
        dictionary.forEach((entries, key) => {
          const first = entries[0];
          if (node.id === first.sourceNode) return;

          const usageRegex = new RegExp(`\\b${escapeRegex(first.term)}\\b`, 'i');
          if (usageRegex.test(node.text || '')) {
            usageCounts.set(key, (usageCounts.get(key) || 0) + 1);
            patches.push({
              op: 'Link',
              from: node.id,
              to: first.sourceNode,
              relation: 'references',
            });
          }
        });
      });
    }

    // --- Findings: extraction-integrity checks --------------------------
    // (Legal-risk rules like ScopeMismatch/InconsistentVerb belong in the
    // compiled rule DSL that findingEngine.js/RuleEvaluator.js already own -
    // not duplicated here. These two are about the definitions data itself.)
    dictionary.forEach((entries, key) => {
      if (entries.length > 1) {
        findings.push({
          id: `FINDING_DUPDEF_${key.replace(/\s+/g, '_')}`,
          type: 'DataIntegrity',
          severity: 'medium',
          confidence: 1.0,
          reason: `"${entries[0].term}" is defined ${entries.length} times in this document.`,
          nodeId: entries[0].sourceNode,
          partyId: null,
          ruleId: 'DUPLICATE_DEFINITION',
          title: 'Duplicate definition',
          description: `The term "${entries[0].term}" has ${entries.length} separate definitions. This may be an intentional redefinition (e.g. in an amendment) or a drafting error - verify the definitions are consistent.`,
          evidence: entries.map(e => ({ matchedText: e.body, nodeId: e.sourceNode })),
          recommendation: 'Confirm every definition of this term is intentional and consistent; conflicting definitions of the same term are a common source of contract ambiguity.',
        });
      }

      if (!usageCounts.has(key)) {
        findings.push({
          id: `FINDING_UNUSEDDEF_${key.replace(/\s+/g, '_')}`,
          type: 'DataIntegrity',
          severity: 'low',
          confidence: 0.8,
          reason: `"${entries[0].term}" is defined but never used elsewhere in the document.`,
          nodeId: entries[0].sourceNode,
          partyId: null,
          ruleId: 'DEFINITION_WITHOUT_USE',
          title: 'Unused definition',
          description: `The term "${entries[0].term}" is defined but doesn't appear to be referenced anywhere else in the document. This is often harmless (leftover from a template) but can also indicate a missing cross-reference.`,
          evidence: [{ matchedText: entries[0].body, nodeId: entries[0].sourceNode }],
          recommendation: 'Verify this definition is actually needed, or check whether an intended usage elsewhere used different wording than the defined term.',
        });
      }
    });

    return {
      patches,
      findings,
      diagnostics: { warnings, errors: [], statistics: { nodesVisited: ir.nodes.length, definitionsFound: dictionary.size } },
    };
  }
};
