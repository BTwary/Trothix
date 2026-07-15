import assert from 'assert';
import { KnowledgeGraph } from '../../knowledge-graph.js';

console.log('Running knowledge-graph.test.js...');

function edge(source, target, relation = 'references') {
  return { source, target, relation, sourceType: 'concept', targetType: 'concept', domain: 'core', explicit: true };
}

function node(id, type = 'concept') {
  return { id, type, domain: 'core', references: [], metadata: { status: 'production', label: id, summary: null, file: 'x.json', raw: {} }, sourceFile: 'x.json' };
}

// --- Hand-built cyclic fixture: A -> B -> C -> A, plus D hanging off B,
// and an isolated node E with no edges at all. ---
const nodes = [node('A'), node('B'), node('C'), node('D'), node('E')];
const edges = [
  edge('A', 'B'),
  edge('B', 'C'),
  edge('C', 'A'),
  edge('B', 'D')
];

const graph = new KnowledgeGraph(nodes, edges);

// Test 1: findCycles() detects the A->B->C->A cycle
const cycles = graph.findCycles();
assert.strictEqual(cycles.length, 1, 'expected exactly one cycle in the fixture');
const cycleIds = new Set(cycles[0]);
['A', 'B', 'C'].forEach(id => assert.ok(cycleIds.has(id), `cycle should include ${id}`));

// Test 2: degree/inDegree/outDegree precomputed correctly
assert.strictEqual(graph.outDegree('A'), 1, 'A has one outgoing edge (A->B)');
assert.strictEqual(graph.inDegree('A'), 1, 'A has one incoming edge (C->A)');
assert.strictEqual(graph.degree('B'), 3, 'B has in=1 (A->B) + out=2 (B->C, B->D) = 3');
assert.strictEqual(graph.degree('E'), 0, 'E is an isolated node with degree 0');

// Test 3: hasNode() / getNode() (C3 — replaces direct nodesMap access)
assert.strictEqual(graph.hasNode('A'), true);
assert.strictEqual(graph.hasNode('ZZZZ'), false);
assert.strictEqual(graph.getNode('A').id, 'A');
assert.strictEqual(graph.getNode('ZZZZ'), null);

// Test 4: connectedComponents() — everything here is one component except E
const components = graph.connectedComponents();
assert.strictEqual(components.length, 2, 'expected 2 connected components (A-B-C-D, and isolated E)');
const sizes = components.map(c => c.length).sort((a, b) => a - b);
assert.deepStrictEqual(sizes, [1, 4], 'component sizes should be [1] (E) and [4] (A,B,C,D)');

// Test 5: maxDependencyDepth() — longest directed path ignoring cycle contributions.
// From D (a leaf with no outgoing edges): depth 0. From B: max(1+depth(C), 1+depth(D)).
// C's only outgoing edge goes to A, which is on B's own recursion stack when reached
// via B->C->A, so that branch contributes 0 rather than recursing forever.
const maxDepth = graph.maxDependencyDepth();
assert.ok(Number.isFinite(maxDepth), 'maxDependencyDepth must terminate and return a finite number even with a cycle present');
assert.ok(maxDepth >= 1, 'expected at least depth 1 given B->D and B->C edges');

console.log('✅ knowledge-graph.test.js passed!');
