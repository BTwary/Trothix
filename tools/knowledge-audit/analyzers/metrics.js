// Consumes a KnowledgeGraph (see knowledge-graph.js). Degree/adjacency/
// component/depth primitives are no longer re-derived here (audit
// finding C2) — they're computed once by the graph and asked for.
export function run(graph) {
  const nodes = graph.getAllNodes();
  const edges = graph.getAllEdges();
  const nodeIds = nodes.map(n => n.id);
  const numNodes = nodeIds.length;
  const numEdges = edges.length;

  if (numNodes === 0) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      density: 0,
      connectedComponents: 0,
      largestComponentSize: 0,
      avgDegree: 0,
      maxDepth: 0,
      avgRuleFanOut: 0,
      avgConceptFanIn: 0,
      topHubs: []
    };
  }

  // 1. Density
  const density = numEdges / (numNodes * (numNodes - 1));

  // 2. Average Degree
  const avgDegree = (2 * numEdges) / numNodes;

  // 3. Hub Nodes (degree already precomputed by the graph)
  const sortedNodes = [...nodeIds].sort((a, b) => graph.degree(b) - graph.degree(a));
  const topHubs = sortedNodes.slice(0, 10).map(id => ({
    id,
    type: graph.getNode(id).type,
    domain: graph.getNode(id).domain,
    degree: graph.degree(id),
    in: graph.inDegree(id),
    out: graph.outDegree(id)
  }));

  // 4. Undirected Components
  const components = graph.connectedComponents();
  const connectedComponents = components.length;
  const largestComponentSize = components.length > 0
    ? Math.max(...components.map(c => c.length))
    : 0;

  // 5. Max Dependency Depth (DAG longest path, safe from cycles)
  const maxDepth = graph.maxDependencyDepth();

  // 6. Rule Fan-out and Concept Fan-in
  const rules = nodes.filter(n => n.type === 'rule');
  const concepts = nodes.filter(n => n.type === 'concept');

  const ruleFanOutSum = rules.reduce((sum, r) => sum + graph.outDegree(r.id), 0);
  const conceptFanInSum = concepts.reduce((sum, c) => sum + graph.inDegree(c.id), 0);

  const avgRuleFanOut = rules.length > 0 ? ruleFanOutSum / rules.length : 0;
  const avgConceptFanIn = concepts.length > 0 ? conceptFanInSum / concepts.length : 0;

  return {
    totalNodes: numNodes,
    totalEdges: numEdges,
    density,
    connectedComponents,
    largestComponentSize,
    avgDegree,
    maxDepth,
    avgRuleFanOut,
    avgConceptFanIn,
    topHubs
  };
}
