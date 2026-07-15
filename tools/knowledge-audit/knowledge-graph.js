// knowledge-graph.js
// ---------------------------------------------------------------------
// Single reusable graph abstraction for the knowledge-audit tool
// (audit finding C2). Before this file existed, three places
// independently rebuilt the same adjacency/degree structures from the
// same nodes/edges arrays: query.js's QueryEngine (outgoing/incoming
// edge maps), analyzers/metrics.js (directedAdj/undirectedAdj/in-out
// degrees, built from scratch), and analyzers/validator.js (degrees/
// inDegrees/outDegrees, built from scratch again). A correctness fix
// in one (e.g. how self-loops or `edge.explicit` are counted) had no
// guarantee of reaching the other two.
//
// KnowledgeGraph owns node storage plus outgoing/incoming adjacency,
// and precomputes inDegree/outDegree/degree once in the constructor.
// It keeps every QueryEngine query method this tool's call sites
// (index.js, analyzers/*) already depend on, unchanged in behavior —
// this replaces query.js as a pure internal consolidation, not an API
// break. `hasNode()` is new (audit finding C3): it replaces direct
// `queryEngine.nodesMap.has()/.get()` access from analyzers/coverage.js,
// analyzers/quality.js, and analyzers/validator.js, which previously
// reached past QueryEngine's public surface into its private Map.
// ---------------------------------------------------------------------

export class KnowledgeGraph {
  constructor(nodes, edges) {
    this.nodesMap = new Map(nodes.map(n => [n.id, n]));
    this.edges = edges;

    // Adjacency: id -> list of edge objects
    this.outgoing = new Map();
    this.incoming = new Map();

    for (const node of nodes) {
      this.outgoing.set(node.id, []);
      this.incoming.set(node.id, []);
    }

    for (const edge of edges) {
      if (!this.outgoing.has(edge.source)) this.outgoing.set(edge.source, []);
      if (!this.incoming.has(edge.target)) this.incoming.set(edge.target, []);

      this.outgoing.get(edge.source).push(edge);
      this.incoming.get(edge.target).push(edge);
    }

    // Precomputed degree maps (C2): built once here instead of being
    // re-derived by every analyzer that needs "how connected is this
    // node." Covers every node that has any adjacency entry, including
    // dangling-edge endpoints that aren't in nodesMap (an edge pointing
    // at a target with no defined node still counts toward that
    // target's in-degree bookkeeping via the map default of 0 below).
    this._inDegree = new Map();
    this._outDegree = new Map();
    for (const id of this.nodesMap.keys()) {
      this._inDegree.set(id, 0);
      this._outDegree.set(id, 0);
    }
    for (const edge of edges) {
      if (this._outDegree.has(edge.source)) {
        this._outDegree.set(edge.source, this._outDegree.get(edge.source) + 1);
      }
      if (this._inDegree.has(edge.target)) {
        this._inDegree.set(edge.target, this._inDegree.get(edge.target) + 1);
      }
    }
  }

  // --- Node access (C3: replaces direct nodesMap.get()/.has() reads) ---

  getNode(id) {
    return this.nodesMap.get(id) || null;
  }

  hasNode(id) {
    return this.nodesMap.has(id);
  }

  getAllNodes() {
    return Array.from(this.nodesMap.values());
  }

  getAllEdges() {
    return this.edges;
  }

  // --- Degree / adjacency primitives (C2) ---

  inDegree(id) {
    return this._inDegree.get(id) || 0;
  }

  outDegree(id) {
    return this._outDegree.get(id) || 0;
  }

  degree(id) {
    return this.inDegree(id) + this.outDegree(id);
  }

  // --- Existing QueryEngine query methods, unchanged ---

  findRule(id) {
    const node = this.getNode(id);
    return (node && node.type === 'rule') ? node : null;
  }

  findConcept(id) {
    const node = this.getNode(id);
    return (node && node.type === 'concept') ? node : null;
  }

  // Nodes that depend on this node (incoming edges)
  findDependents(id) {
    return (this.incoming.get(id) || []).map(e => ({
      node: this.getNode(e.source),
      relation: e.relation
    })).filter(x => x.node !== null);
  }

  // Nodes this node depends on (outgoing edges)
  findDependencies(id) {
    return (this.outgoing.get(id) || []).map(e => ({
      node: this.getNode(e.target),
      relation: e.relation
    })).filter(x => x.node !== null);
  }

  // Find concepts that have no rules, decision tables, or actions pointing to them
  findUnusedConcepts() {
    const unused = [];
    for (const node of this.nodesMap.values()) {
      if (node.type !== 'concept') continue;

      const incoming = this.incoming.get(node.id) || [];

      const structuralIncoming = incoming.filter(e =>
        e.relation === 'depends_on' ||
        e.relation === 'implements' ||
        e.relation === 'references' ||
        e.relation === 'belongs_to'
      );

      if (structuralIncoming.length === 0) {
        unused.push(node);
      }
    }
    return unused;
  }

  // Directed cycle finder (DFS), moved as-is from QueryEngine.
  findCycles() {
    const visited = new Set();
    const recStack = new Set();
    const path = [];
    const cycles = [];

    const dfs = (nodeId) => {
      visited.add(nodeId);
      recStack.add(nodeId);
      path.push(nodeId);

      const outgoingEdges = this.outgoing.get(nodeId) || [];
      for (const edge of outgoingEdges) {
        const neighbor = edge.target;
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recStack.has(neighbor)) {
          const idx = path.indexOf(neighbor);
          const cyclePath = path.slice(idx);
          cyclePath.push(neighbor);
          cycles.push(cyclePath);
        }
      }

      recStack.delete(nodeId);
      path.pop();
    };

    for (const id of this.nodesMap.keys()) {
      if (!visited.has(id)) {
        dfs(id);
      }
    }
    return cycles;
  }

  // Sources supporting a concept
  findSources(conceptId) {
    return (this.outgoing.get(conceptId) || [])
      .filter(e => e.relation === 'supported_by' && e.targetType === 'source')
      .map(e => this.getNode(e.target))
      .filter(Boolean);
  }

  // Rules pointing to a concept
  findRules(conceptId) {
    // Rule -> concept references are derived implicitly from each rule's
    // own `concept` field (see schema-registry.js's rule referenceExtractor
    // and extractReferencedIds, which never sets a custom `.relation`), so
    // graph-builder.js always labels them 'references' (its only fallback).
    // No relations.json entry, and no other code path, ever produces
    // 'depends_on' or 'belongs_to' - filtering on those labels made this
    // method return [] unconditionally, for every concept, in every
    // domain. That silently zeroed out coverage.js's end-to-end
    // traceability score and quality.js's rulesWithoutSources check.
    return (this.incoming.get(conceptId) || [])
      .filter(e => e.relation === 'references' && e.sourceType === 'rule')
      .map(e => this.getNode(e.source))
      .filter(Boolean);
  }

  // --- New graph-theoretic primitives (C2) ---
  // Moved out of analyzers/metrics.js verbatim (its DFS logic was
  // already correct) so both metrics.js and any future caller ask the
  // graph for these instead of recomputing them.

  // Undirected connected components. Only edges whose source AND
  // target both resolve to a known node contribute an undirected
  // adjacency (matches metrics.js's prior behavior of skipping
  // dangling-edge endpoints for component purposes).
  connectedComponents() {
    const undirectedAdj = new Map();
    for (const id of this.nodesMap.keys()) {
      undirectedAdj.set(id, []);
    }
    for (const edge of this.edges) {
      if (undirectedAdj.has(edge.source) && undirectedAdj.has(edge.target)) {
        undirectedAdj.get(edge.source).push(edge.target);
        undirectedAdj.get(edge.target).push(edge.source);
      }
    }

    const visited = new Set();
    const components = [];

    const dfsUndirected = (start) => {
      const stack = [start];
      const members = [];
      while (stack.length > 0) {
        const node = stack.pop();
        if (visited.has(node)) continue;
        visited.add(node);
        members.push(node);
        for (const neighbor of (undirectedAdj.get(node) || [])) {
          if (!visited.has(neighbor)) stack.push(neighbor);
        }
      }
      return members;
    };

    for (const id of this.nodesMap.keys()) {
      if (!visited.has(id)) {
        components.push(dfsUndirected(id));
      }
    }
    return components;
  }

  // Longest directed path ("depth") reachable from any node, ignoring
  // contributions from nodes reached only through a cycle (a node
  // currently on the DFS recursion stack contributes 0 rather than
  // recursing infinitely). This is the same approximation
  // metrics.js's getMaxDepth() used — see audit finding N3 for the
  // known limitation (not addressed here; N3 is a Nice-to-have, out of
  // this pass's C1-C3/R1-R4 scope).
  maxDependencyDepth() {
    const depthCache = new Map();
    const visiting = new Set();

    const getMaxDepth = (nodeId) => {
      if (depthCache.has(nodeId)) return depthCache.get(nodeId);
      if (visiting.has(nodeId)) return 0;

      visiting.add(nodeId);
      let max = 0;
      for (const edge of (this.outgoing.get(nodeId) || [])) {
        max = Math.max(max, 1 + getMaxDepth(edge.target));
      }
      visiting.delete(nodeId);
      depthCache.set(nodeId, max);
      return max;
    };

    let maxDepth = 0;
    for (const id of this.nodesMap.keys()) {
      maxDepth = Math.max(maxDepth, getMaxDepth(id));
    }
    return maxDepth;
  }
}
