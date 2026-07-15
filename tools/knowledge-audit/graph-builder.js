// graph-builder.js
// ---------------------------------------------------------------------
// Combines two edge sources into one deduplicated edge list:
//   1. Explicit relationship entries (REL_* nodes elsewhere in the
//      knowledge base, already parsed into {id, source, target,
//      relation, domain, file} shape by parser.js) — processed first.
//   2. Implicit references (parser.js's per-node `.references`, built
//      via schema-registry.js's referenceExtractor) — processed second,
//      so where an implicit reference and an explicit relation agree
//      on source/target/relation, the explicit one wins (audit R1/C2:
//      IR_SCHEMA_VERSION below documents this shape as a versioned
//      contract other tools, e.g. drift.js, can check against).
//
// Dedup key: `${source}->${target}->${relation}`. A distinct relation
// type between the same node pair is NOT collapsed — only an exact
// source/target/relation triple is deduplicated to one edge.
// ---------------------------------------------------------------------

// Bumped whenever the shape of the objects in the returned edge array
// (or the node objects graph-builder/parser hand around) changes.
// Threaded through to every audit JSON output (see index.js) and
// checked by drift.js before doing structural diffing (audit R1).
export const IR_SCHEMA_VERSION = '1.0.0';

/**
 * @param {Object[]} nodes IR nodes, each optionally carrying a
 *   `.references` array of {id, relation, targetType, path} (see
 *   schema-registry.js's extractReferencedIds()).
 * @param {Object[]} relations Explicit relation entries:
 *   {id, source, target, relation, domain, file}.
 * @returns {Object[]} deduplicated edges: {source, target, relation,
 *   sourceType, targetType, domain, file, explicit}
 */
export function buildGraph(nodes, relations) {
  const nodesById = new Map(nodes.map(n => [n.id, n]));
  const edgesByKey = new Map();

  function addEdge(edge) {
    const key = `${edge.source}->${edge.target}->${edge.relation}`;
    if (edgesByKey.has(key)) return; // first writer wins
    edgesByKey.set(key, edge);
  }

  // 1. Explicit relations first, so they win any dedup collision.
  for (const rel of relations || []) {
    const sourceNode = nodesById.get(rel.source);
    const targetNode = nodesById.get(rel.target);
    addEdge({
      source: rel.source,
      target: rel.target,
      relation: rel.relation,
      sourceType: (sourceNode && sourceNode.type) || 'other',
      targetType: (targetNode && targetNode.type) || 'other',
      domain: rel.domain || (sourceNode && sourceNode.domain) || null,
      file: rel.file || null,
      explicit: true
    });
  }

  // 2. Implicit references derived from each node's own fields.
  for (const node of nodes || []) {
    for (const ref of node.references || []) {
      const targetNode = nodesById.get(ref.id);
      addEdge({
        source: node.id,
        target: ref.id,
        relation: ref.relation || 'references',
        sourceType: node.type,
        targetType: (targetNode && targetNode.type) || ref.targetType || 'other',
        domain: node.domain || null,
        file: node.sourceFile || null,
        explicit: false
      });
    }
  }

  return Array.from(edgesByKey.values());
}
