// ontology.js
// ---------------------------------------------------------------------
// Ontology-health view over the concept layer of the graph: duplicate
// or ambiguous concept labels, how deep and how balanced the concept
// hierarchy is (via concept<->concept `related` edges, already
// extracted as graph edges by schema-registry.js's concept
// referenceExtractor), and how much each concept is actually reused by
// rules/templates/decision tables/etc.
//
// Note on overlap with analyzers/validator.js: validator.js already
// flags *exact* label duplicates as one input to its CI quality gate
// (a pass/fail signal). This file is a deeper, human-facing pass over
// the same concept layer for the ontology_health.md report: it also
// catches *near*-duplicate ("ambiguous") labels that aren't exact
// matches, and adds depth/balance/reuse analysis that isn't part of
// validator's CI-gating concerns. It intentionally does not import
// validator.js's internals (the two are read independently by
// design — see schema-registry.js's C1 header for why this tool
// favors small, independently-testable passes over a shared mutable
// abstraction it doesn't need).
// ---------------------------------------------------------------------

import { computeImpact } from './dependency.js';

function normalizeLabel(label) {
  return (label || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function tokenize(label) {
  return new Set(normalizeLabel(label).split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Similarity threshold for flagging two distinct concepts as
// "ambiguous" (label-similar but not identical). Chosen so that
// single-word-difference labels (e.g. "Force Majeure" vs "Force
// Majeure Notice") are caught without flooding the report with
// loosely-related concepts that merely share one common word.
const AMBIGUITY_THRESHOLD = 0.5;

// Consumes a KnowledgeGraph (see knowledge-graph.js).
export function run(graph) {
  const concepts = graph.getAllNodes().filter(n => n.type === 'concept');

  if (concepts.length === 0) {
    return {
      totalConcepts: 0,
      duplicateConcepts: [],
      ambiguousConcepts: [],
      depth: { maxDepth: 0, avgDepth: 0, distribution: {} },
      balance: { byDomain: [], balanceIndex: 100, imbalancedDomains: [] },
      reuse: { avgReuse: 0, topReused: [], underused: [] }
    };
  }

  // --- Duplicate / ambiguous labels ---
  const byLabel = new Map(); // normalized label -> [ids]
  for (const c of concepts) {
    const key = normalizeLabel(c.metadata.label);
    if (!byLabel.has(key)) byLabel.set(key, []);
    byLabel.get(key).push(c.id);
  }
  const duplicateConcepts = [...byLabel.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([label, ids]) => ({ label, ids }));

  const duplicatedIdPairs = new Set();
  for (const dup of duplicateConcepts) {
    for (let i = 0; i < dup.ids.length; i++) {
      for (let j = i + 1; j < dup.ids.length; j++) {
        duplicatedIdPairs.add(`${dup.ids[i]}|${dup.ids[j]}`);
      }
    }
  }

  const ambiguousConcepts = [];
  const tokensById = new Map(concepts.map(c => [c.id, tokenize(c.metadata.label)]));
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const a = concepts[i];
      const b = concepts[j];
      const pairKey = `${a.id}|${b.id}`;
      if (duplicatedIdPairs.has(pairKey)) continue; // already an exact duplicate
      const similarity = jaccard(tokensById.get(a.id), tokensById.get(b.id));
      if (similarity >= AMBIGUITY_THRESHOLD && similarity < 1) {
        ambiguousConcepts.push({
          firstId: a.id,
          firstLabel: a.metadata.label,
          secondId: b.id,
          secondLabel: b.metadata.label,
          similarity: Math.round(similarity * 100) / 100
        });
      }
    }
  }
  ambiguousConcepts.sort((x, y) => y.similarity - x.similarity);

  // --- Ontology depth (via concept<->concept structural edges only) ---
  // "related" (and any other edge whose source AND target are both
  // concepts) forms the concept hierarchy/network this depth measure
  // walks. Depth of a concept = longest chain of concept-to-concept
  // edges reachable from it (cycle-safe, mirrors
  // KnowledgeGraph.maxDependencyDepth's recursion-stack guard).
  const conceptIds = new Set(concepts.map(c => c.id));
  const conceptAdj = new Map(concepts.map(c => [c.id, []]));
  for (const c of concepts) {
    for (const edge of graph.outgoing.get(c.id) || []) {
      if (conceptIds.has(edge.target)) {
        conceptAdj.get(c.id).push(edge.target);
      }
    }
  }

  const depthCache = new Map();
  function conceptDepth(id, visiting = new Set()) {
    if (depthCache.has(id)) return depthCache.get(id);
    if (visiting.has(id)) return 0;
    visiting.add(id);
    let max = 0;
    for (const next of conceptAdj.get(id) || []) {
      max = Math.max(max, 1 + conceptDepth(next, visiting));
    }
    visiting.delete(id);
    depthCache.set(id, max);
    return max;
  }

  const depths = concepts.map(c => conceptDepth(c.id));
  const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
  const avgDepth = depths.length > 0 ? depths.reduce((s, d) => s + d, 0) / depths.length : 0;
  const distribution = {};
  for (const d of depths) distribution[d] = (distribution[d] || 0) + 1;

  // --- Balance across domains ---
  const byDomainCount = new Map();
  for (const c of concepts) {
    const domain = c.domain || 'core';
    byDomainCount.set(domain, (byDomainCount.get(domain) || 0) + 1);
  }
  const byDomain = [...byDomainCount.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  // Balance index: 100 = perfectly even distribution across domains,
  // trending toward 0 as one domain dominates the concept count.
  // Computed as 100 * (1 - coefficient of variation / sqrt(n-1)),
  // clamped to [0, 100] — a simple, dependency-free evenness measure
  // (no need for a full statistics library at this scale).
  let balanceIndex = 100;
  if (byDomain.length > 1) {
    const counts = byDomain.map(d => d.count);
    const mean = counts.reduce((s, c) => s + c, 0) / counts.length;
    const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    const maxCv = Math.sqrt(counts.length - 1); // CV when one domain has everything
    balanceIndex = Math.round(Math.max(0, Math.min(100, 100 * (1 - cv / maxCv))));
  }

  const avgDomainCount = byDomain.length > 0
    ? byDomain.reduce((s, d) => s + d.count, 0) / byDomain.length
    : 0;
  const imbalancedDomains = byDomain
    .filter(d => d.count > avgDomainCount * 2 || d.count < avgDomainCount * 0.5)
    .map(d => d.domain);

  // --- Concept reuse ---
  // Reuse = how many distinct other nodes (of any type — rules,
  // templates, examples, sources, ...) transitively/directly reference
  // this concept. Direct dependents only (not the full transitive
  // closure) is the right measure of "reuse" — a concept referenced by
  // 5 different rules is reused 5 times, regardless of how deep any of
  // those rules' own dependents go.
  const reuseCounts = concepts.map(c => {
    const dependents = graph.findDependents(c.id);
    const distinctDomains = new Set(dependents.map(d => d.node.domain).filter(Boolean));
    return {
      id: c.id,
      label: c.metadata.label,
      domain: c.domain,
      reuseCount: dependents.length,
      reusedAcrossDomains: distinctDomains.size
    };
  });

  const avgReuse = reuseCounts.length > 0
    ? reuseCounts.reduce((s, r) => s + r.reuseCount, 0) / reuseCounts.length
    : 0;

  const topReused = [...reuseCounts].sort((a, b) => b.reuseCount - a.reuseCount).slice(0, 10);

  // Underused: concepts with exactly one dependent — connected (so not
  // flagged as an orphan by validator.js) but not meaningfully reused
  // either. A separate, softer signal than validator's "orphan"/
  // "weaklyConnected" gates; this report exists to prompt a human look,
  // not to fail CI.
  const underused = reuseCounts
    .filter(r => r.reuseCount === 1)
    .map(r => ({ id: r.id, label: r.label, domain: r.domain }));

  return {
    totalConcepts: concepts.length,
    duplicateConcepts,
    ambiguousConcepts,
    depth: { maxDepth, avgDepth, distribution },
    balance: { byDomain, balanceIndex, imbalancedDomains },
    reuse: { avgReuse, topReused, underused }
  };
}

// Exposed so callers (e.g. a future combined "modify this concept"
// view) can get the same generic downstream-impact numbers ontology.js
// itself doesn't need to recompute per concept for this report.
export { computeImpact };

export function toMarkdown(result) {
  const lines = [];
  lines.push('# Ontology Health Report');
  lines.push('');
  lines.push(`${result.totalConcepts} concept(s) analyzed.`);
  lines.push('');

  lines.push('## Duplicate Concepts (identical label)');
  lines.push('');
  if (result.duplicateConcepts.length === 0) {
    lines.push('_None found._');
  } else {
    for (const d of result.duplicateConcepts) {
      lines.push(`- "${d.label}": ${d.ids.join(', ')}`);
    }
  }
  lines.push('');

  lines.push('## Ambiguous Concepts (similar, non-identical label)');
  lines.push('');
  if (result.ambiguousConcepts.length === 0) {
    lines.push('_None found._');
  } else {
    lines.push('| Concept A | Concept B | Similarity |');
    lines.push('|---|---|---|');
    for (const a of result.ambiguousConcepts) {
      lines.push(`| ${a.firstId} ("${a.firstLabel}") | ${a.secondId} ("${a.secondLabel}") | ${a.similarity} |`);
    }
  }
  lines.push('');

  lines.push('## Ontology Depth');
  lines.push('');
  lines.push(`- Max depth: ${result.depth.maxDepth}`);
  lines.push(`- Avg depth: ${result.depth.avgDepth.toFixed(2)}`);
  const distEntries = Object.entries(result.depth.distribution).sort((a, b) => Number(a[0]) - Number(b[0]));
  lines.push(`- Distribution: ${distEntries.map(([d, count]) => `depth ${d}: ${count}`).join(', ') || '-'}`);
  lines.push('');

  lines.push('## Domain Balance');
  lines.push('');
  lines.push(`Balance index: ${result.balance.balanceIndex}/100 (100 = perfectly even distribution across domains)`);
  lines.push('');
  lines.push('| Domain | Concept Count |');
  lines.push('|---|---|');
  for (const d of result.balance.byDomain) {
    lines.push(`| ${d.domain} | ${d.count} |`);
  }
  if (result.balance.imbalancedDomains.length > 0) {
    lines.push('');
    lines.push(`Imbalanced domains (far from average): ${result.balance.imbalancedDomains.join(', ')}`);
  }
  lines.push('');

  lines.push('## Concept Reuse');
  lines.push('');
  lines.push(`Average reuse count: ${result.reuse.avgReuse.toFixed(2)}`);
  lines.push('');
  lines.push('### Top Reused Concepts');
  lines.push('');
  if (result.reuse.topReused.length === 0) {
    lines.push('_No concept is currently referenced._');
  } else {
    lines.push('| Concept | Domain | Reuse Count | Domains Reused Across |');
    lines.push('|---|---|---|---|');
    for (const r of result.reuse.topReused) {
      lines.push(`| ${r.id} | ${r.domain || '-'} | ${r.reuseCount} | ${r.reusedAcrossDomains} |`);
    }
  }
  lines.push('');

  lines.push('### Underused Concepts (exactly one dependent)');
  lines.push('');
  if (result.reuse.underused.length === 0) {
    lines.push('_None found._');
  } else {
    for (const u of result.reuse.underused) {
      lines.push(`- ${u.id} ("${u.label}", ${u.domain || '-'})`);
    }
  }
  lines.push('');

  return lines.join('\n');
}
