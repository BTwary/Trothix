/**
 * @fileoverview forceMajeureExtractor.js
 * Phase 1 (Rule Coverage Restoration).
 *
 * ForceMajeure/rules.json's four rules were never compiler-blocked — they
 * use plain `field` conditions RuleCompiler already understands
 * (`extractedData.hasForceMajeure`, `extractedData.forceMajeureDelayDays`,
 * `extractedData.requiresForceMajeureNotice`). The gap was upstream: no
 * plugin in the live pipeline (Pipeline B) ever populated `extractedData`
 * — it only existed as an empty placeholder in the deprecated legacy
 * router (originally `core/legacy/router.js`, now archived at
 * `archive/core/router.js` / `archive/core/legacy/`). This plugin is a
 * new, additive file; it does not modify any frozen engine internals.
 *
 * Detection is grounded in the domain's own already-authored, real (not
 * placeholder) phrase markers in ForceMajeure/phrases.json:
 *   - PHRASE_FORCE_MAJEURE_INCIDENT: act of God, fire, flood, earthquake,
 *     strikes, epidemic, war, riots, governmental action
 *   - PHRASE_FORCE_MAJEURE_DELAY_LIMIT: "exceeds thirty days" / "delay of
 *     more than sixty days" style day-count language
 *   - PHRASE_FORCE_MAJEURE_NOTICE: "promptly notify the other party in
 *     writing" style notice-obligation language
 *
 * This mirrors clauseClassifier.js's own documented approach ("Regex ->
 * Heading -> Phrase Graph -> Ontology" — currently regex-only, same tier
 * this plugin operates at) rather than inventing a new detection
 * philosophy for the engine.
 */

const INCIDENT_MARKERS = [
  'force majeure',
  'act of god',
  'act of nature',
  'earthquake',
  'flood',
  'epidemic',
  'pandemic',
  'war',
  'riot',
  'governmental action',
  'strike',
  'natural disaster'
];

const NOTICE_MARKERS = [
  'promptly notify',
  'notify the other party',
  'shall give notice',
  'written notice of',
  'notice of such event'
];

// Matches "thirty (30) days", "60 days", "sixty days", etc. near a delay/
// duration context. Deliberately conservative: only fires within a
// sentence that also contains an incident marker, so an unrelated
// "within 30 days" payment clause elsewhere in the document doesn't get
// misattributed to force majeure delay.
const DAY_COUNT_REGEX = /(\d{1,3})\s*(?:calendar\s+)?days?/i;

const WORD_TO_NUMBER = {
  ten: 10, fifteen: 15, twenty: 20, thirty: 30, forty: 40,
  fortyfive: 45, sixty: 60, ninety: 90, hundred: 100, hundredtwenty: 120
};

function extractDelayDays(sentence) {
  const numericMatch = sentence.match(DAY_COUNT_REGEX);
  if (numericMatch) return parseInt(numericMatch[1], 10);

  const lower = sentence.toLowerCase();
  for (const [word, value] of Object.entries(WORD_TO_NUMBER)) {
    if (lower.includes(word)) return value;
  }
  return null;
}

function splitSentences(text) {
  return text.split(/(?<=[.;])\s+/).filter(Boolean);
}

/** @type {import('../core/types.js').Engine} */
export default {
  id: "forceMajeureExtractor",
  version: "1.0.0",
  priority: 35,
  dependsOn: ["entityEngine"],
  provides: ["extractedData"],
  invalidates: [],
  cost: 5,

  /**
   * @param {import('../core/types.js').Context} context
   * @returns {import('../core/types.js').PatchSet}
   */
  execute: (context) => {
    const { ir } = context;

    let hasForceMajeure = false;
    let forceMajeureDelayDays = null;
    let requiresForceMajeureNotice = false;

    ir.nodes.forEach(node => {
      if (!node.text) return;
      const sentences = splitSentences(node.text);

      sentences.forEach(sentence => {
        const lower = sentence.toLowerCase();
        const isForceMajeureSentence = INCIDENT_MARKERS.some(marker => lower.includes(marker));
        if (!isForceMajeureSentence) return;

        hasForceMajeure = true;

        const days = extractDelayDays(sentence);
        if (days !== null && (forceMajeureDelayDays === null || days > forceMajeureDelayDays)) {
          forceMajeureDelayDays = days;
        }

        if (NOTICE_MARKERS.some(marker => lower.includes(marker))) {
          requiresForceMajeureNotice = true;
        }
      });
    });

    const patches = [
      {
        op: 'Annotate',
        path: '/extractedData',
        value: {
          hasForceMajeure,
          forceMajeureDelayDays,
          requiresForceMajeureNotice
        }
      }
    ];

    return {
      patches,
      findings: [],
      diagnostics: {
        warnings: [],
        errors: [],
        statistics: { nodesVisited: ir.nodes.length, hasForceMajeure }
      }
    };
  }
};
