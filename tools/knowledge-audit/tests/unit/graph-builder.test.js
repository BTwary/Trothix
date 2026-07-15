import assert from 'assert';
import { buildGraph } from '../../graph-builder.js';

console.log('Running graph-builder.test.js...');

// --- Fixture: two nodes, with an explicit relation duplicated by an
// implicit reference of the same source/target/relation shape, plus a
// genuinely distinct edge that must survive deduplication. ---
const nodes = [
  { id: 'CONCEPT_A', type: 'concept', domain: 'core', references: [
    { id: 'CONCEPT_B', relation: 'related_to', targetType: 'concept', path: 'related[0]' }
  ] },
  { id: 'CONCEPT_B', type: 'concept', domain: 'core', references: [] }
];

const relations = [
  // Same source/target/relation as CONCEPT_A's implicit reference above
  { id: 'REL_1', source: 'CONCEPT_A', target: 'CONCEPT_B', relation: 'related_to', domain: 'core', file: 'rel.json' },
  // A distinct relation (different relation type) between the same pair
  { id: 'REL_2', source: 'CONCEPT_A', target: 'CONCEPT_B', relation: 'depends_on', domain: 'core', file: 'rel.json' }
];

const edges = buildGraph(nodes, relations);

// Test 1: the duplicate (same source->target->relation) collapses to one edge
const relatedToEdges = edges.filter(e => e.source === 'CONCEPT_A' && e.target === 'CONCEPT_B' && e.relation === 'related_to');
assert.strictEqual(relatedToEdges.length, 1, 'duplicate source->target->relation edges must be deduplicated to one');

// Test 2: a distinct relation type between the same node pair is NOT deduplicated away
const dependsOnEdges = edges.filter(e => e.source === 'CONCEPT_A' && e.target === 'CONCEPT_B' && e.relation === 'depends_on');
assert.strictEqual(dependsOnEdges.length, 1, 'a distinct relation between the same nodes must be kept');

// Test 3: total edge count reflects dedup (2 relations + 1 implicit ref, 1 pair collapses) = 2
assert.strictEqual(edges.length, 2, 'expected exactly 2 edges after deduplication');

// Test 4: explicit relation wins ordering-wise (explicit flag correctly set)
assert.strictEqual(relatedToEdges[0].explicit, true, 'when an explicit relation and an implicit reference collide, the surviving edge must be the explicit one (processed first)');

// Test 5: dangling target (no matching node) still produces an edge with the
// reference's declared targetType, rather than being silently dropped
const nodesWithDangling = [
  { id: 'CONCEPT_C', type: 'concept', domain: 'core', references: [
    { id: 'ACTION_MISSING', relation: 'defines', targetType: 'action', path: 'actions[0]' }
  ] }
];
const danglingEdges = buildGraph(nodesWithDangling, []);
assert.strictEqual(danglingEdges.length, 1, 'a reference to a non-existent node must still produce an edge (caught later by validator.js as dangling)');
assert.strictEqual(danglingEdges[0].targetType, 'action', 'dangling edge should fall back to the reference-declared targetType');

console.log('✅ graph-builder.test.js passed!');
