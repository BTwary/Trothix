import assert from 'assert';
import { extractReferencedIds, getSchema, getAllSchemas } from '../../schema-registry.js';

console.log('Running schema-registry.test.js...');

// Test 1: extracts IDs matching the UPPER_SNAKE node-id pattern out of
// nested arrays/objects, and classifies targetType by known prefix.
const shape = {
  when: {
    all: [
      { field: 'actions', value: 'ACTION_PAY' },
      { field: 'entities', value: ['ENTITY_MONEY', 'ENTITY_DURATION'] }
    ]
  },
  concept: 'CONCEPT_PAYMENT',
  note: 'not an id, just a lowercase sentence.'
};

const refs = extractReferencedIds(shape);
const refIds = refs.map(r => r.id).sort();
assert.deepStrictEqual(refIds, ['ACTION_PAY', 'CONCEPT_PAYMENT', 'ENTITY_DURATION', 'ENTITY_MONEY'],
  'should extract every UPPER_SNAKE-shaped string, regardless of nesting depth');

const byId = Object.fromEntries(refs.map(r => [r.id, r]));
assert.strictEqual(byId['ACTION_PAY'].targetType, 'action', 'ACTION_ prefix should classify as action');
assert.strictEqual(byId['CONCEPT_PAYMENT'].targetType, 'concept', 'CONCEPT_ prefix should classify as concept');
assert.strictEqual(byId['ENTITY_MONEY'].targetType, 'entity', 'ENTITY_ prefix should classify as entity');

// Test 2: a plain lowercase sentence is never mistaken for a node reference
assert.ok(!refIds.includes('not an id, just a lowercase sentence.'.toUpperCase()),
  'a prose string should not appear in extracted refs');
assert.strictEqual(refs.some(r => r.id.includes(' ')), false, 'no extracted id should contain whitespace');

// Test 3: path is tracked so callers can tell where a reference came from
const pathForAction = byId['ACTION_PAY'].path;
assert.ok(pathForAction.includes('all'), 'extracted path should reflect the traversal (e.g. contains "all")');

// Test 4: unknown-prefix ids still get extracted, just typed as 'other'
const unknownRefs = extractReferencedIds('SOMETHING_UNMAPPED');
assert.strictEqual(unknownRefs.length, 1);
assert.strictEqual(unknownRefs[0].targetType, 'other');

// Test 5: registered schemas expose the expected node types (sanity check
// that the registry itself is populated as parser.js expects)
const allSchemas = getAllSchemas();
['concept', 'rule', 'decision_table', 'template', 'source', 'example', 'exception', 'entity', 'action'].forEach(type => {
  assert.ok(allSchemas[type], `expected a registered schema for node type "${type}"`);
  assert.strictEqual(typeof getSchema(type).referenceExtractor, 'function');
});
assert.strictEqual(getSchema('__not_a_real_type__'), null, 'unregistered type should return null, not throw');

console.log('✅ schema-registry.test.js passed!');
