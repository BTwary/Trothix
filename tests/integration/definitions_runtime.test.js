/**
 * Definitions — real runtime integration test.
 *
 * Previously this file defined a local evaluateClause() that returned a
 * hardcoded { finding: "RULE_DEFINITIONS_PRESENT", resolvedTerm: "ENTITY_
 * CONFIDENTIAL_INFORMATION" } literal regardless of the clause text. This
 * version calls the real engine.
 *
 * Updated by the Knowledge Expansion sprint: RULE_DEFINITIONS_PRESENT,
 * RULE_ALIASES_RESOLVED, and RULE_UNDEFINED_CAPITALIZED_TERM were
 * previously concept-only (no when/then), confirmed compiled-failed by
 * test_ruleDiagnostics.mjs. They now have real when/then, backed by real
 * CONCEPT_DEFINED_TERM / CONCEPT_ALIAS_RESOLUTION / CONCEPT_DEFINED_TERM_
 * REFERENCE concepts and phrases.json entries, and fire correctly against
 * the real engine (verified below, not assumed).
 *
 * A separate, genuinely-authored rule (DEFINITION_WITHOUT_USE, reported
 * on the finding's `ruleId` field rather than `rule` — a real shape
 * inconsistency worth tracking) also fires, because the term defined in
 * this clause is never used again in the same snippet.
 */
import { check, summarize, analyzeAndGetFindingIds } from './_lib.mjs';

async function run() {
  const clause = "\"Confidential Information\" means all non-public, confidential or proprietary information disclosed by the Disclosing Party to the Receiving Party.";

  const findingIds = await analyzeAndGetFindingIds(clause);

  check(
    'Definitions: DEFINITION_WITHOUT_USE fires for a defined term with no further use in the text (real, currently-active logic)',
    findingIds.includes('DEFINITION_WITHOUT_USE'),
    `got findings: ${JSON.stringify(findingIds)}`
  );

  check(
    'Definitions: RULE_DEFINITIONS_PRESENT fires now that CONCEPT_DEFINED_TERM has real phrases and when/then (Knowledge Expansion sprint)',
    findingIds.includes('RULE_DEFINITIONS_PRESENT'),
    `got findings: ${JSON.stringify(findingIds)}`
  );

  check(
    'Definitions: RULE_ALIASES_RESOLVED does not fire on a "means" clause (no alias language like "hereinafter referred to as" present)',
    !findingIds.includes('RULE_ALIASES_RESOLVED'),
    `got findings: ${JSON.stringify(findingIds)}`
  );

  // Alias resolution has its own dedicated positive control, since the
  // primary clause above only exercises the "means" definitional pattern.
  const aliasClause = "ABC Corp. and XYZ Inc. are hereinafter referred to as the \"Parties.\"";
  const aliasFindingIds = await analyzeAndGetFindingIds(aliasClause);
  check(
    'Definitions: RULE_ALIASES_RESOLVED fires for real alias language (Knowledge Expansion sprint)',
    aliasFindingIds.includes('RULE_ALIASES_RESOLVED'),
    `got findings: ${JSON.stringify(aliasFindingIds)}`
  );

  // RULE_UNDEFINED_CAPITALIZED_TERM: fires when a defined-term reference
  // ("as defined herein") appears with no definitional pattern anywhere
  // in the analyzed text, and does NOT fire once a definition is present.
  const undefinedRefClause = "The Receiving Party shall use the Confidential Information, as defined herein, solely for the Permitted Purpose.";
  const undefinedRefFindingIds = await analyzeAndGetFindingIds(undefinedRefClause);
  check(
    'Definitions: RULE_UNDEFINED_CAPITALIZED_TERM fires when a defined-term reference has no matching definition (Knowledge Expansion sprint)',
    undefinedRefFindingIds.includes('RULE_UNDEFINED_CAPITALIZED_TERM'),
    `got findings: ${JSON.stringify(undefinedRefFindingIds)}`
  );

  const definedThenReferencedClause = "\"Confidential Information\" shall mean any non-public information. The Receiving Party shall use the Confidential Information, as defined herein, solely for the Permitted Purpose.";
  const definedThenReferencedFindingIds = await analyzeAndGetFindingIds(definedThenReferencedClause);
  check(
    'Definitions: RULE_UNDEFINED_CAPITALIZED_TERM does NOT fire once a real definitional pattern is present in the same text',
    !definedThenReferencedFindingIds.includes('RULE_UNDEFINED_CAPITALIZED_TERM'),
    `got findings: ${JSON.stringify(definedThenReferencedFindingIds)}`
  );

  // Positive control: DEFINITION_WITHOUT_USE keys off IR-level node
  // references, not raw substring reuse of the term in the surrounding
  // text — a single reused sentence did NOT clear it when this test was
  // first written (that surprising result is exactly the kind of thing a
  // mocked test would never have surfaced). The multi-sentence pattern
  // below (from benchmark/nda/nda_02.txt, a document confirmed via the
  // Pipeline B regression benchmark to define AND reuse "Confidential
  // Information" across three sentences without tripping the flag) is
  // used here as the real, verified positive control instead of a
  // synthetic one-liner.
  const usedClause = "2. Confidential Information. Confidential Information means any non-public business, financial, or technical information disclosed by either Party. 3. Obligations. Each Party agrees to protect the other's Confidential Information with the same degree of care it uses for its own confidential information, and not to disclose it to third parties.";
  const usedFindingIds = await analyzeAndGetFindingIds(usedClause);
  check(
    'Definitions: DEFINITION_WITHOUT_USE does NOT fire on a real multi-sentence define-then-reuse pattern (positive control, sourced from the benchmark corpus)',
    !usedFindingIds.includes('DEFINITION_WITHOUT_USE'),
    `got findings: ${JSON.stringify(usedFindingIds)}`
  );

  summarize('definitions_runtime.test.js');
}

run();
