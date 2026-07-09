/**
 * @fileoverview IRFieldInventory.js
 *
 * Read-only, evidence-based inventory of which Legal IR field paths are
 * actually populated by the current deterministic pipeline (Pipeline B:
 * Trothix.js -> EngineRegistry -> plugins/*).
 *
 * Every entry below was confirmed by reading the plugin source directly --
 * none are inferred from naming, from core/types.js JSDoc alone, or from
 * what the architecture *should* do. Where core/types.js declares a field
 * that no plugin ever assigns (e.g. Action.recipient), that is recorded
 * explicitly as populated: false.
 *
 * `resolverCompatible` captures a second, independent failure mode:
 * RuleContext.resolveField() only spreads a value when
 * `Array.isArray(obj[key])` is true for a `[*]` path segment. Some IR data
 * (metadata.parties, metadata.definitions) is stored as an id-keyed object,
 * not an array, so it is populated in the IR but structurally unreachable
 * by the current rule DSL's field syntax. A rule referencing such a field
 * would compile, but could never actually match real data -- which is
 * exactly the condition the Handbook and this task ask us not to call
 * "active".
 *
 * This file must be re-verified against the plugin source whenever any
 * plugin changes. It is not a spec; it is a snapshot of current behavior.
 */

export const IR_FIELD_INVENTORY = [
  // --- Actions (nodes[*].actions[*].*) ---
  {
    field: 'actions[*].actor',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/actionBuilder.js (raw parsed subject text)',
    caveats:
      'May be replaced with a canonical PARTY_* id by plugins/actionNormalizer.js if the raw text matches an alias recorded in ir.metadata.parties. Not guaranteed to be canonical.'
  },
  {
    field: 'actions[*].modal',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/actionBuilder.js (raw modal token, lowercased: shall/may/must/etc.)'
  },
  {
    field: 'actions[*].verb',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/actionBuilder.js (raw verb token)',
    caveats:
      "Canonicalized to an ACTION_* id by plugins/actionNormalizer.js only if knowledgeProvider.resolveActionSynonym() finds a matching ACTION_* ontology node whose synonyms/name include the raw verb. Today only Payment, Liability, and Indemnification ship an actions.json with synonyms -- other domains' verbs remain raw, uncanonicalized text."
  },
  {
    field: 'actions[*].object',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/actionBuilder.js (raw object text)',
    caveats:
      'Replaced with a definition id by plugins/referenceResolver.js only if it matches a term in ir.metadata.definitions.'
  },
  {
    field: 'actions[*].recipient',
    populated: false,
    resolverCompatible: true,
    populatedBy: null,
    caveats:
      "Declared in core/types.js Action typedef and initialized to null by actionBuilder.js. No plugin in the current pipeline (actionNormalizer, referenceResolver, constraintEngine, deadlineNormalizer) ever assigns it a value. Always null."
  },
  {
    field: 'actions[*].conditions[*]',
    populated: true,
    resolverCompatible: true,
    populatedBy: "plugins/actionBuilder.js, sourced from legalGrammarEngine's CAPTURE_CONDITION state (raw text)"
  },
  {
    field: 'actions[*].exceptions[*]',
    populated: true,
    resolverCompatible: true,
    populatedBy: "plugins/actionBuilder.js, sourced from legalGrammarEngine's CAPTURE_EXCEPTION state (raw text)"
  },
  {
    field: 'actions[*].deadlines[*].value',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/deadlineNormalizer.js',
    caveats:
      'Only populated when the action evidence.matchedText matches /(within|before|after|no later than)\\s+(\\d+)\\s+(day|month|year)s?/i. Empty array otherwise -- not every action gets a deadline.'
  },
  {
    field: 'actions[*].deadlines[*].unit',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/deadlineNormalizer.js',
    caveats: 'Same conditional regex match as deadlines[*].value.'
  },
  {
    field: 'actions[*].deadlines[*].relation',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/deadlineNormalizer.js',
    caveats: 'Same conditional regex match as deadlines[*].value.'
  },
  {
    field: 'actions[*].constraints[*].type',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/constraintEngine.js',
    caveats:
      "Regex-only extraction limited to three shapes: money ($/USD amount), duration (N day/month/year), percentage (N%). Constraints are extracted once per NODE and then broadcast identically onto every action on that node (see source comment 'Broadcast for now') -- not scoped to the specific action that mentions them."
  },
  {
    field: 'actions[*].constraints[*].value',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/constraintEngine.js',
    caveats: 'Same node-level broadcast caveat as constraints[*].type.'
  },
  {
    field: 'actions[*].constraints[*].currency',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/constraintEngine.js',
    caveats: "Hardcoded to 'USD' regardless of the matched symbol (source comment: 'Hardcoded for demo')."
  },
  {
    field: 'actions[*].references[*]',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/referenceResolver.js',
    caveats:
      "Only populated for literal 'Clause N' text inside conditions/exceptions, and the target id is fabricated as NODE_00N rather than resolved against the document's real node ids (source comment: 'we just fabricate a NODE_ reference')."
  },
  {
    field: 'actions[*].confidence',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/actionBuilder.js',
    caveats: 'Hardcoded constant 0.90 for every action -- not a computed confidence score.'
  },

  // --- Nodes (nodes[*].*) ---
  {
    field: 'nodes[*].text',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'core/parser/tokenizer.js'
  },
  {
    field: 'nodes[*].kind',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'core/parser/tokenizer.js',
    caveats:
      'Crude heuristic only (short all-caps line => Article, else Clause). Not refined by any later engine registered in Trothix.js today.'
  },
  {
    field: 'nodes[*].metadata.mentionedParties[*]',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/partyResolver.js',
    caveats:
      "Only detects 5 fixed literal alias strings (Company, Vendor, Client, Disclosing Party, Receiving Party) via substring match."
  },
  {
    field: 'nodes[*].metadata.candidates[*].id',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/clauseClassifier.js',
    caveats:
      "Only 3 keyword patterns recognized (confidential/disclose, terminate/expire, 'shall pay'/invoice). Explicitly a 'Very basic Mock Implementation for Phase 1' per its own source comment."
  },
  {
    field: 'nodes[*].metadata.candidates[*].score',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/clauseClassifier.js',
    caveats: 'Hardcoded literal scores (0.95 / 0.92 / 0.70 / 0.88), not computed.'
  },
  {
    field: 'nodes[*].metadata.entities[*].type',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/entityEngine.js',
    caveats: "Only two regex patterns: 'laws of X' and 'courts of X'."
  },
  {
    field: 'nodes[*].metadata.entities[*].value',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'plugins/entityEngine.js'
  },

  // --- Document-level metadata ---
  {
    field: 'metadata.parties',
    populated: true,
    resolverCompatible: false,
    populatedBy: 'plugins/partyResolver.js',
    caveats:
      "Stored as an id-keyed object (e.g. { PARTY_001: {...} }), not an array. RuleContext.resolveField() only spreads a value when Array.isArray(obj[key]) is true for a '[*]' segment, so this path can never be traversed with the wildcard syntax every existing rule uses. Populated in the IR, but unreachable by the current rule DSL."
  },
  {
    field: 'metadata.definitions',
    populated: true,
    resolverCompatible: false,
    populatedBy: 'plugins/definitionEngine.js',
    caveats: 'Same id-keyed-object issue as metadata.parties -- unreachable via [*] wildcard syntax in RuleContext.'
  },
  {
    field: 'category',
    populated: true,
    resolverCompatible: true,
    populatedBy: 'rules/RuleContext.js (hardcoded special case, not a real IR traversal)',
    caveats:
      "resolveField() special-cases any field starting with the literal string 'category' to return [ir.metadata?.category || \"Unknown\"] -- a single document-level literal, ignoring any node/clause scoping. Source comment: 'Mock category access.'"
  }
];

/**
 * Looks up a field path against the confirmed inventory.
 * Unknown paths fail safe (treated as not populated) -- absence of
 * evidence is not evidence of population.
 * @param {string} fieldPath
 */
export function classifyFieldPath(fieldPath) {
  const trimmed = (fieldPath || '').trim();
  const found = IR_FIELD_INVENTORY.find((f) => f.field === trimmed);
  if (found) return found;

  return {
    field: trimmed,
    populated: false,
    resolverCompatible: false,
    populatedBy: null,
    caveats:
      'Field path not found in the current IR field inventory. No engine in the inspected pipeline (partyResolver, definitionEngine, entityEngine, legalGrammarEngine, clauseClassifier, actionBuilder, referenceResolver, constraintEngine, actionNormalizer, deadlineNormalizer) is confirmed to populate this path.'
  };
}

/**
 * Recursively walks a rule's `when` condition tree (same shape
 * RuleCompiler._compileCondition consumes: and/or/not/all/any/field) and
 * collects every `field` string referenced, in first-seen order,
 * deduplicated.
 * @param {Object} condition
 * @returns {string[]}
 */
export function collectConditionFields(condition) {
  const fields = [];
  const seen = new Set();

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node.and)) node.and.forEach(walk);
    if (Array.isArray(node.or)) node.or.forEach(walk);
    if (node.not) walk(node.not);
    if (Array.isArray(node.all)) node.all.forEach(walk);
    if (Array.isArray(node.any)) node.any.forEach(walk);

    if (typeof node.field === 'string' && !seen.has(node.field)) {
      seen.add(node.field);
      fields.push(node.field);
    }

    // RuleCompiler also supports a bare { missing: "field.path" } shorthand
    if (typeof node.missing === 'string' && !seen.has(node.missing)) {
      seen.add(node.missing);
      fields.push(node.missing);
    }
  };

  walk(condition);
  return fields;
}
