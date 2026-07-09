/**
 * @fileoverview RuleCapability.js
 * Enterprise Hardening Sprint 1 — minimum safe fix for verified issue #4
 * (rule routing) and #5 (rule schema inconsistency).
 *
 * Single source of truth for "is this knowledge-domain entry executable,"
 * used by both KnowledgeProvider (routing) and RuleDiagnostics (reporting),
 * so the two can never silently disagree again. Deliberately does not
 * touch RuleCompiler.js — this only decides whether an entry should be
 * OFFERED to the compiler, not how the compiler evaluates it.
 *
 * Structure-driven, not name-driven: id prefixes (RULE_/CONCEPT_) are
 * metadata, not behavior, per the sprint objective. An entry is
 * considered executable if and only if it has both a `when` and a `then`
 * property, matching exactly the precondition RuleCompiler.compileRule()
 * itself requires to not throw — this doesn't invent a new definition of
 * "executable," it just checks the same thing the compiler already
 * checks, before deciding where to route the entry.
 */

/**
 * @param {object} entry - a raw knowledge-domain JSON entry
 * @returns {boolean}
 */
export function isExecutableRule(entry) {
  return !!(entry && typeof entry === 'object' && entry.when && entry.then);
}

/**
 * Verified issue #5 (rule schema inconsistency): a `when` clause can be
 * present and non-empty while still containing no condition RuleCompiler
 * actually understands — e.g. `{ "type": "conceptExists", "value": "X" }`
 * has neither a logical combinator (and/or/not/all/any) nor a `field` key,
 * which are the only two shapes RuleCompiler._compileCondition() handles.
 * Unrecognized shapes don't throw — they silently compile to a hardcoded
 * `() => false` predicate (RuleCompiler.js's own "Default fallback to
 * false" comment), meaning the rule "compiles" successfully but can never
 * produce a finding, ever, for any document. This is the exact "misleading
 * success" the Handbook warns about, so it needs its own detection
 * independent of RuleCompiler (which is frozen this sprint) rather than
 * being silently reported as active just because compilation didn't throw.
 *
 * @param {object} whenClause
 * @returns {{recognized: boolean, unrecognizedLeaves: object[]}}
 */
export function analyzeConditionShape(whenClause) {
  const unrecognizedLeaves = [];
  const LOGICAL_KEYS = ['and', 'or', 'not', 'all', 'any'];

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    const hasLogical = LOGICAL_KEYS.some(k => node[k] !== undefined);
    if (hasLogical) {
      for (const key of LOGICAL_KEYS) {
        if (node[key] === undefined) continue;
        if (key === 'not') walk(node[key]);
        else if (Array.isArray(node[key])) node[key].forEach(walk);
      }
      return;
    }
    if (typeof node.field === 'string') return; // recognized leaf
    // Neither a logical combinator nor a field-based leaf: this is the
    // shape RuleCompiler's default fallback silently turns into `false`.
    unrecognizedLeaves.push(node);
  }

  walk(whenClause);
  return { recognized: unrecognizedLeaves.length === 0, unrecognizedLeaves };
}
