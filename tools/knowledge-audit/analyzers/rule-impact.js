// rule-impact.js
// ---------------------------------------------------------------------
// Rule-focused view on top of dependency.js's generic impact-analysis
// primitives: for every rule, what does it depend on (its concept /
// entity / action chain), what depends on it (decision tables,
// templates that implement it), and how large is the downstream
// blast radius if the rule is edited or removed.
//
// Deliberately built on dependency.js's computeImpact()/longestChainFrom()
// rather than re-walking graph.outgoing/incoming itself, so a
// correctness fix to the BFS/cycle-guard logic only needs to happen in
// one place (the same lesson audit finding C2 already established for
// adjacency/degree primitives).
// ---------------------------------------------------------------------

import { computeImpact, longestChainFrom } from './dependency.js';

// Consumes a KnowledgeGraph (see knowledge-graph.js).
export function run(graph) {
  const rules = graph.getAllNodes().filter(n => n.type === 'rule');

  if (rules.length === 0) {
    return {
      totalRules: 0,
      rules: [],
      highImpactRules: [],
      isolatedRules: [],
      exampleChains: []
    };
  }

  const ruleReports = rules.map(rule => {
    const impact = computeImpact(graph, rule.id);

    const directDependencies = graph.findDependencies(rule.id)
      .map(d => ({ id: d.node.id, type: d.node.type, relation: d.relation }));

    const directDependents = graph.findDependents(rule.id)
      .map(d => ({ id: d.node.id, type: d.node.type, relation: d.relation }));

    return {
      id: rule.id,
      domain: rule.domain,
      status: rule.metadata.status,
      directDependencies,
      directDependents,
      transitiveImpactCount: impact.transitiveDependentCount,
      transitiveDependencyCount: impact.transitiveDependencyCount,
      impactedDomains: impact.impactedDomains
    };
  }).sort((a, b) => b.transitiveImpactCount - a.transitiveImpactCount);

  const highImpactRules = ruleReports.filter(r => r.transitiveImpactCount > 0).slice(0, 10);

  // Isolated rules: nothing downstream references them (implements/
  // depends_on), so editing them carries no known ripple effect today
  // — the mirror image of highImpactRules, useful for triaging which
  // rule changes are "safe" to make quickly vs. which need review.
  const isolatedRules = ruleReports
    .filter(r => r.transitiveImpactCount === 0)
    .map(r => ({ id: r.id, domain: r.domain, status: r.status }));

  // A handful of example dependency chains (rule -> concept -> related
  // concepts -> ...) for the most complex rules, so the report shows
  // concrete paths rather than only counts.
  const exampleChains = ruleReports
    .slice()
    .sort((a, b) => b.transitiveDependencyCount - a.transitiveDependencyCount)
    .slice(0, 5)
    .map(r => longestChainFrom(graph, r.id))
    .filter(c => c.length > 1);

  return {
    totalRules: rules.length,
    rules: ruleReports,
    highImpactRules,
    isolatedRules,
    exampleChains
  };
}

export function toMarkdown(result) {
  const lines = [];
  lines.push('# Rule Impact Report');
  lines.push('');
  lines.push(`${result.totalRules} rule(s) analyzed.`);
  lines.push('');

  lines.push('## High-Impact Rules (largest downstream blast radius)');
  lines.push('');
  if (result.highImpactRules.length === 0) {
    lines.push('_No rule currently has downstream dependents — see Isolated Rules below._');
  } else {
    lines.push('| Rule | Domain | Status | Transitive Impact | Domains Touched |');
    lines.push('|---|---|---|---|---|');
    for (const r of result.highImpactRules) {
      lines.push(`| ${r.id} | ${r.domain || '-'} | ${r.status} | ${r.transitiveImpactCount} | ${r.impactedDomains.join(', ') || '-'} |`);
    }
  }
  lines.push('');

  lines.push('## Isolated Rules (no known downstream dependents)');
  lines.push('');
  if (result.isolatedRules.length === 0) {
    lines.push('_None — every rule has at least one downstream dependent._');
  } else {
    for (const r of result.isolatedRules) {
      lines.push(`- ${r.id} (${r.domain || '-'}, ${r.status})`);
    }
  }
  lines.push('');

  lines.push('## Example Dependency Chains');
  lines.push('');
  if (result.exampleChains.length === 0) {
    lines.push('_No multi-hop rule dependency chain found._');
  } else {
    for (const chain of result.exampleChains) {
      lines.push(`- (${chain.length} nodes) ${chain.path.join(' → ')}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}
