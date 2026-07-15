import { RuleCompiler } from '../../assets/js/engine/rules/RuleCompiler.js';
import { RuleContext } from '../../assets/js/engine/rules/RuleContext.js';
import assert from 'assert';

console.log("Running RuleCompiler.test.js...");

const compiler = new RuleCompiler();

// 1. Basic properties and validity
const rule1 = {
  id: "RULE_TEST_1",
  when: { field: "actions[*].verb", equals: "pay" },
  then: { trigger: "FINDING_TEST", message: "Rule test 1 fired." }
};
const compiled1 = compiler.compileRule(rule1);
assert.strictEqual(compiled1.id, "RULE_TEST_1");
assert.strictEqual(compiled1.severity, "Medium");

// Test missing fields throws error
assert.throws(() => {
  compiler.compileRule({ id: "ERR_RULE" });
}, /missing required fields/);

// 2. Logical Operators
const andRule = compiler.compileRule({
  id: "AND_RULE",
  when: {
    and: [
      { field: "category", equals: "NDA" },
      { field: "actions[*].verb", equals: "pay" }
    ]
  },
  then: { trigger: "T" }
});

const ctxNDA = new RuleContext({ metadata: { category: "NDA" }, nodes: [{ actions: [{ verb: "pay" }] }] });
const ctxLease = new RuleContext({ metadata: { category: "LEASE" }, nodes: [{ actions: [{ verb: "pay" }] }] });

assert.strictEqual(andRule.evaluate(ctxNDA), true);
assert.strictEqual(andRule.evaluate(ctxLease), false);

// Test OR, NOT, ALL, ANY
const complexRule = compiler.compileRule({
  id: "COMPLEX_RULE",
  when: {
    or: [
      { not: { field: "category", equals: "NDA" } },
      { any: [{ field: "actions[*].verb", equals: "terminate" }] }
    ]
  },
  then: { trigger: "T" }
});
assert.strictEqual(complexRule.evaluate(ctxLease), true); // NOT NDA passes

// 3. Field-based Operators
const fieldRule = compiler.compileRule({
  id: "FIELD_RULE",
  when: {
    and: [
      { field: "actions[*].verb", exists: true },
      { field: "actions[*].object", missing: true },
      { field: "actions[*].verb", not_equals: "assign" },
      { field: "actions[*].verb", contains: "pa" },
      { field: "actions[*].verb", starts_with: "p" },
      { field: "actions[*].verb", ends_with: "y" },
      { field: "actions[*].verb", in: ["pay", "notify"] },
      { field: "actions[*].confidence", greater_than: 0.8 },
      { field: "actions[*].confidence", less_than: 1.0 }
    ]
  },
  then: { trigger: "T" }
});

const ctxMatch = new RuleContext({
  nodes: [{ actions: [{ verb: "pay", confidence: 0.9 }] }]
});
const ctxNoMatch = new RuleContext({
  nodes: [{ actions: [{ verb: "assign", confidence: 0.9 }] }]
});
assert.strictEqual(fieldRule.evaluate(ctxMatch), true);
assert.strictEqual(fieldRule.evaluate(ctxNoMatch), false);

// 4. Concept-based checks fallback (static table)
const conceptExistRule = compiler.compileRule({
  id: "CONCEPT_EXISTS",
  when: { type: "conceptExists", value: "CONCEPT_LIABILITY" },
  then: { trigger: "T" }
});
const conceptMissingRule = compiler.compileRule({
  id: "CONCEPT_MISSING",
  when: { type: "conceptMissing", value: "CONCEPT_LIABILITY" },
  then: { trigger: "T" }
});
const ctxConceptPresent = new RuleContext({
  nodes: [{ text: "Vendor limit of liability is $100." }]
});
const ctxConceptAbsent = new RuleContext({
  nodes: [{ text: "Hello World." }]
});
assert.strictEqual(conceptExistRule.evaluate(ctxConceptPresent), true);
assert.strictEqual(conceptExistRule.evaluate(ctxConceptAbsent), false);
assert.strictEqual(conceptMissingRule.evaluate(ctxConceptAbsent), true);

console.log("✅ RuleCompiler.test.js exhaustive coverage passed!");
