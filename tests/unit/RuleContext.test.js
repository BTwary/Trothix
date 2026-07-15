import { RuleContext } from '../../assets/js/engine/rules/RuleContext.js';
import assert from 'assert';

console.log("Running RuleContext.test.js...");

// Mock Legal IR
const mockIr = {
  metadata: { category: "NDA" },
  nodes: [
    {
      text: "The Vendor shall pay USD 100.",
      actions: [
        { verb: "pay", object: "money" }
      ]
    }
  ]
};

const context = new RuleContext(mockIr);

// Test 1: resolve category
const category = context.resolveField("category");
assert.deepStrictEqual(category, ["NDA"]);

// Test 2: resolve actions[*].verb
const verbs = context.resolveField("actions[*].verb");
assert.deepStrictEqual(verbs, ["pay"]);

console.log("✅ RuleContext.test.js passed!");
