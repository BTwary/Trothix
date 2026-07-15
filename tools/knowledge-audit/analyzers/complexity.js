function getRuleComplexityScore(when) {
  if (!when || typeof when !== 'object') return 0;
  let count = 1;
  if (Array.isArray(when.all)) {
    count += when.all.reduce((acc, cond) => acc + getRuleComplexityScore(cond), 0);
  }
  if (Array.isArray(when.any)) {
    count += when.any.reduce((acc, cond) => acc + getRuleComplexityScore(cond), 0);
  }
  return count;
}

// Consumes a KnowledgeGraph (see knowledge-graph.js).
export function run(graph) {
  const nodes = graph.getAllNodes();
  const edges = graph.getAllEdges();
  
  // 1. Rule Complexity Analysis
  const rules = nodes.filter(n => n.type === 'rule');
  const ruleComplexity = rules.map(r => {
    const rawWhen = r.metadata.raw.when;
    const score = getRuleComplexityScore(rawWhen);
    
    return {
      id: r.id,
      domain: r.domain,
      score,
      status: r.metadata.status
    };
  }).sort((a, b) => b.score - a.score);
  
  const avgRuleComplexity = rules.length > 0
    ? rules.reduce((sum, r) => sum + getRuleComplexityScore(r.metadata.raw.when), 0) / rules.length
    : 0;
  
  // 2. Domain Complexity Analysis
  const domains = {};
  for (const node of nodes) {
    const domain = node.domain || 'core';
    domains[domain] = domains[domain] || {
      name: domain,
      nodes: 0,
      edges: 0,
      concepts: 0,
      rules: 0,
      decisionTables: 0,
      templates: 0,
      entities: 0,
      actions: 0,
      sources: 0,
      examples: 0,
      exceptions: 0
    };
    
    domains[domain].nodes++;
    if (node.type === 'concept') domains[domain].concepts++;
    else if (node.type === 'rule') domains[domain].rules++;
    else if (node.type === 'decision_table') domains[domain].decisionTables++;
    else if (node.type === 'template') domains[domain].templates++;
    else if (node.type === 'entity') domains[domain].entities++;
    else if (node.type === 'action') domains[domain].actions++;
    else if (node.type === 'source') domains[domain].sources++;
    else if (node.type === 'example') domains[domain].examples++;
    else if (node.type === 'exception') domains[domain].exceptions++;
  }
  
  for (const edge of edges) {
    const sourceNode = graph.getNode(edge.source);
    const targetNode = graph.getNode(edge.target);
    const domain = (sourceNode && sourceNode.domain) || (targetNode && targetNode.domain) || 'core';
    
    if (domains[domain]) {
      domains[domain].edges++;
    }
  }
  
  const domainComplexity = Object.values(domains).map(dom => {
    // Formula: Complexity index = nodes * 1.2 + edges * 0.8
    const index = Math.round(dom.nodes * 1.2 + dom.edges * 0.8);
    return {
      ...dom,
      index
    };
  }).sort((a, b) => b.index - a.index);
  
  return {
    avgRuleComplexity,
    topComplexRules: ruleComplexity.slice(0, 10),
    domainComplexity
  };
}
