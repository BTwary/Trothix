/**
 * Lifecycle — real runtime integration test.
 *
 * The original file didn't call the engine at all: it read the compiled
 * bundle off disk (unused after that), then ran a local simulateTransitions()
 * function that printed a scripted trace and returned a hardcoded literal
 * `{ currentState: "STATE_NOTICE_PENDING" }`. There is no state-machine
 * runtime anywhere in Trothix to actually call — this test verifies that
 * fact directly against the real KnowledgeProvider instead of pretending
 * one exists.
 *
 * Ground truth, established by reading assets/js/engine/knowledge/v1/domains/
 * Lifecycle/*.json and querying the initialized KnowledgeProvider:
 *  - Lifecycle's states.json / events.json / transitions.json /
 *    illegal_transitions.json / timeline.json / deadlines.json entries still
 *    have no `id` field (states.json is a bare array of strings;
 *    transitions.json entries are shaped { from, event, to, preconditions,
 *    effects } with no `id`). KnowledgeProvider._loadFile() does
 *    `if (!entry.id) continue;`, so every one of these entries is still
 *    silently dropped at load time. This is unchanged by the Knowledge
 *    Expansion sprint, which stayed inside concept.json/rules.json/
 *    phrases.json/sources.json/jurisdiction-notes.json/examples.json and did
 *    not touch the state-machine files or KnowledgeProvider's loader.
 *  - What DID change: RULE_PROPER_NOTICE_TIMELINE and RULE_ILLEGAL_STATE_
 *    TRANSITION previously pointed at a bare "LIFECYCLE" concept string that
 *    matched nothing (CONCEPT_LIFECYCLE existed but the rules never
 *    referenced it correctly) and had no when/then. They now point at two
 *    real, narrower concepts (CONCEPT_NOTICE_TIMELINE, CONCEPT_
 *    ILLEGAL_STATE_TRANSITION) with phrase-backed detection and real
 *    when/then, and fire correctly against real clause text (verified
 *    below). This is phrase-based concept detection, not an actual state-
 *    machine evaluation — there is still no lifecycle-transition engine in
 *    the runtime, and this test does not pretend otherwise.
 */
import { getEngine, check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  const engine = await getEngine();
  const kb = engine.knowledgeProvider;

  check(
    'Lifecycle: STATE_CURE_PERIOD (defined only in Lifecycle/states.json, which lacks id fields) still does not load — unrelated to this sprint',
    kb.getNode('STATE_CURE_PERIOD') === null
  );

  check(
    'Lifecycle: STATE_SURVIVING (defined only in Lifecycle/states.json) still does not load — unrelated to this sprint',
    kb.getNode('STATE_SURVIVING') === null
  );

  const activeMeta = kb.getNodeMetadata('STATE_ACTIVE');
  check(
    'Lifecycle: STATE_ACTIVE resolves, but its real provenance is the Termination domain, not Lifecycle — unchanged by this sprint',
    activeMeta !== null && activeMeta.domain === 'Termination',
    `got metadata: ${JSON.stringify(activeMeta)}`
  );

  check(
    'Lifecycle: two executable rules are now compiled for the Lifecycle domain (Knowledge Expansion sprint authored real when/then)',
    kb.getCompiledRules().filter(r => kb.getRuleMetadata(r.id)?.domain === 'Lifecycle').length === 2
  );

  const noticeClause = "Either party may terminate this Agreement for convenience upon sixty (60) days' notice of non-renewal delivered in writing to the other party.";
  const noticeFindingIds = await analyzeAndGetFindingIds(noticeClause);
  check(
    'Lifecycle: RULE_PROPER_NOTICE_TIMELINE fires for real notice-timeline language',
    noticeFindingIds.includes('RULE_PROPER_NOTICE_TIMELINE'),
    `got findings: ${JSON.stringify(noticeFindingIds)}`
  );

  const illegalTransitionClause = "Upon written request by either party, the parties may reinstate this Agreement following termination without executing a new agreement.";
  const illegalTransitionFindingIds = await analyzeAndGetFindingIds(illegalTransitionClause);
  check(
    'Lifecycle: RULE_ILLEGAL_STATE_TRANSITION fires for reinstatement-after-termination language',
    illegalTransitionFindingIds.includes('RULE_ILLEGAL_STATE_TRANSITION'),
    `got findings: ${JSON.stringify(illegalTransitionFindingIds)}`
  );

  const unrelatedClause = "Notice shall be sent by email.";
  const unrelatedFindingIds = await analyzeAndGetFindingIds(unrelatedClause);
  check(
    'Lifecycle: neither RULE_PROPER_NOTICE_TIMELINE nor RULE_ILLEGAL_STATE_TRANSITION fires on unrelated text',
    !unrelatedFindingIds.includes('RULE_PROPER_NOTICE_TIMELINE') && !unrelatedFindingIds.includes('RULE_ILLEGAL_STATE_TRANSITION'),
    `got findings: ${JSON.stringify(unrelatedFindingIds)}`
  );

  summarize('lifecycle_runtime.test.js');
}

run();
