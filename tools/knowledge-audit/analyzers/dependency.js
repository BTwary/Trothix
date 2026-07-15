// dependency.js
// ---------------------------------------------------------------------
// General-purpose transitive dependency / impact-analysis primitives on
// top of a KnowledgeGraph (see knowledge-graph.js). This is the shared
// foundation for "what happens downstream if I change node X" —
// rule-impact.js applies it specifically to rules, ontology.js uses it
// for concept reuse/impact, and run() below produces a graph-wide
// dependency_report.md view (critical nodes, longest chains,
// bottlenecks).
//
// Direction convention (matches graph-builder.js/knowledge-graph.js):
// an edge `{source, target, relation}` means `source` depends on /
// references `target` (e.g. a RULE --depends_on--> a CONCEPT). So:
//   - "what does X depend on" -> follow X's OUTGOING edges
//     (graph.findDependencies / graph.outgoing)
//   - "what would be affected if X changes" -> follow X's INCOMING
//     edges, transitively (graph.findDependents / graph.incoming),
//     since anything pointing at X (directly or via a chain) relies on
//     X in some way.
//
// This file introduces no new adjacency structures of its own (C2's
// lesson applied going forward) — it walks the graph's existing
// outgoing/incoming maps and degree primitives.
// ---------------------------------------------------------------------

/**
 * BFS over the graph in one direction, collecting every node reachable
 * from `id` (excluding `id` itself), with the shortest hop-distance at
 * which each was first reached.
 *
 * @param {import('../knowledge-graph.js').KnowledgeGraph} graph
 * @param {string} id
 * @param {'dependents'|'dependencies'} direction
 *   'dependents'   -> walk incoming edges (who is affected if `id` changes)
 *   'dependencies' -> walk outgoing edges (what `id` itself relies on)
 * @param {{maxDepth?: number}} [opts]
 * @returns {{ ids: string[], distanceById: Map<string, number> }}
 */
export function computeImpactSet(graph, id, direction = 'dependents', opts = {}) {
  const maxDepth = opts.maxDepth ?? Infinity;
  const adjacency = direction === 'dependencies' ? graph.outgoing : graph.incoming;
  const nextId = direction === 'dependencies'
    ? (edge) => edge.target
    : (edge) => edge.source;

  const distanceById = new Map();
  const queue = [{ id, depth: 0 }];
  distanceById.set(id, 0);

  while (queue.length > 0) {
    const { id: current, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    const edges = adjacency.get(current) || [];
    for (const edge of edges) {
      const neighbor = nextId(edge);
      if (distanceById.has(neighbor)) continue;
      distanceById.set(neighbor, depth + 1);
      queue.push({ id: neighbor, depth: depth + 1 });
    }
  }

  distanceById.delete(id);
  return { ids: [...distanceById.keys()], distanceById };
}

/**
 * Full downstream-impact summary for a single node: everything that
 * would need review if `id` were modified or removed, plus what `id`
 * itself relies on. Used directly by rule-impact.js and ontology.js so
 * neither reimplements the BFS.
 *
 * @param {import('../knowledge-graph.js').KnowledgeGraph} graph
 * @param {string} id
 */
export function computeImpact(graph, id) {
  const dependents = computeImpactSet(graph, id, 'dependents');
  const dependencies = computeImpactSet(graph, id, 'dependencies');

  const dependentsByType = {};
  const dependentsByDomain = new Set();
  for (const depId of dependents.ids) {
    const node = graph.getNode(depId);
    if (!node) continue;
    dependentsByType[node.type] = (dependentsByType[node.type] || 0) + 1;
    if (node.domain) dependentsByDomain.add(node.domain);
  }

  return {
    id,
    transitiveDependentCount: dependents.ids.length,
    transitiveDependencyCount: dependencies.ids.length,
    dependents: dependents.ids,
    dependencies: dependencies.ids,
    dependentsByType,
    impactedDomains: [...dependentsByDomain]
  };
}

/**
 * The single longest directed path starting from `id`, following
 * outgoing (dependency) edges. Cycle-safe: a node already on the
 * current path is not revisited (mirrors KnowledgeGraph.findCycles'
 * recursion-stack guard). Used to render human-readable example chains
 * in dependency_report.md / rule_impact_report.md.
 *
 * @param {import('../knowledge-graph.js').KnowledgeGraph} graph
 * @param {string} id
 * @returns {{ length: number, path: string[] }}
 */
export function longestChainFrom(graph, id) {
  let best = [id];

  const dfs = (nodeId, path, onPath) => {
    if (path.length > best.length) best = [...path];
    const edges = graph.outgoing.get(nodeId) || [];
    for (const edge of edges) {
      if (onPath.has(edge.target)) continue; // cycle guard
      onPath.add(edge.target);
      path.push(edge.target);
      dfs(edge.target, path, onPath);
      path.pop();
      onPath.delete(edge.target);
    }
  };

  dfs(id, [id], new Set([id]));
  return { length: best.length, path: best };
}

// Consumes a KnowledgeGraph (see knowledge-graph.js).
export function run(graph) {
  const nodes = graph.getAllNodes();

  if (nodes.length === 0) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      criticalNodes: [],
      longestChains: [],
      bottlenecks: [],
      connectedComponentCount: 0
    };
  }

  // Critical nodes: those whose transitive dependent set (everything
  // affected if this node changes) is largest. Computed for every node
  // once; at this tool's current scale (hundreds of nodes) a full
  // BFS-per-node pass is a cheap, single-digit-millisecond operation.
  const impactScored = nodes.map(n => {
    const impact = computeImpact(graph, n.id);
    return {
      id: n.id,
      type: n.type,
      domain: n.domain,
      transitiveDependents: impact.transitiveDependentCount,
      transitiveDependencies: impact.transitiveDependencyCount,
      impactedDomains: impact.impactedDomains
    };
  }).sort((a, b) => b.transitiveDependents - a.transitiveDependents);

  const criticalNodes = impactScored.filter(n => n.transitiveDependents > 0).slice(0, 15);

  // Longest chains: pick the handful of nodes with the deepest
  // dependency chain (graph.maxDependencyDepth() already knows the max
  // overall; here we reconstruct actual example paths from the nodes
  // most likely to produce them — the ones with no incoming edges at
  // all tend to sit at the top of the longest chains, so start there,
  // falling back to all nodes if none qualify).
  const roots = nodes.filter(n => graph.inDegree(n.id) === 0);
  const candidateIds = (roots.length > 0 ? roots : nodes).map(n => n.id);
  const chains = candidateIds
    .map(id => longestChainFrom(graph, id))
    .sort((a, b) => b.length - a.length)
    .slice(0, 5)
    .filter(c => c.length > 1);

  // Bottlenecks: nodes acting as a hinge point between many dependents
  // and many dependencies at once (both in- and out-degree non-trivial)
  // — a change here has both wide upstream and downstream ripple.
  const bottlenecks = nodes
    .map(n => ({ id: n.id, type: n.type, domain: n.domain, inDegree: graph.inDegree(n.id), outDegree: graph.outDegree(n.id) }))
    .filter(n => n.inDegree >= 2 && n.outDegree >= 2)
    .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree))
    .slice(0, 10);

  return {
    totalNodes: nodes.length,
    totalEdges: graph.getAllEdges().length,
    criticalNodes,
    longestChains: chains,
    bottlenecks,
    connectedComponentCount: graph.connectedComponents().length
  };
}

export function toMarkdown(result) {
  const lines = [];
  lines.push('# Dependency Report');
  lines.push('');
  lines.push(`Generated from ${result.totalNodes} nodes / ${result.totalEdges} edges, spread across ${result.connectedComponentCount} connected component(s).`);
  lines.push('');

  lines.push('## Critical Nodes (widest downstream impact)');
  lines.push('');
  if (result.criticalNodes.length === 0) {
    lines.push('_No node currently has downstream dependents._');
  } else {
    lines.push('| ID | Type | Domain | Transitive Dependents | Transitive Dependencies | Domains Touched |');
    lines.push('|---|---|---|---|---|---|');
    for (const n of result.criticalNodes) {
      lines.push(`| ${n.id} | ${n.type} | ${n.domain || '-'} | ${n.transitiveDependents} | ${n.transitiveDependencies} | ${n.impactedDomains.join(', ') || '-'} |`);
    }
  }
  lines.push('');

  lines.push('## Longest Dependency Chains');
  lines.push('');
  if (result.longestChains.length === 0) {
    lines.push('_No multi-hop dependency chain found._');
  } else {
    for (const chain of result.longestChains) {
      lines.push(`- (${chain.length} nodes) ${chain.path.join(' → ')}`);
    }
  }
  lines.push('');

  lines.push('## Bottleneck Nodes (high in- and out-degree)');
  lines.push('');
  if (result.bottlenecks.length === 0) {
    lines.push('_No bottleneck nodes detected (none with in-degree ≥ 2 and out-degree ≥ 2)._');
  } else {
    lines.push('| ID | Type | Domain | In-Degree | Out-Degree |');
    lines.push('|---|---|---|---|---|');
    for (const n of result.bottlenecks) {
      lines.push(`| ${n.id} | ${n.type} | ${n.domain || '-'} | ${n.inDegree} | ${n.outDegree} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}
