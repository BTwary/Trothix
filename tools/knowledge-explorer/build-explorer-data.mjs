/**
 * @fileoverview build-explorer-data.mjs
 *
 * Generates the static JSON data files consumed by the read-only
 * Knowledge Explorer (knowledge-explorer.html): Rule Explorer, Ontology
 * Explorer, Definition Usage Map, Cross-reference Graph, Rule Coverage
 * Dashboard, and Knowledge Coverage Dashboard.
 *
 * This script does not modify the engine, the compiler, or the knowledge
 * schema. It only *reads* the knowledge base through the same production
 * entry points other tooling already uses:
 *   - KnowledgeProvider._loadKnowledge() / _validateAndResolveGraph()
 *     (the same two methods RuleDiagnostics.js calls) for the ontology
 *     graph (nodes, edges, metadata, dependencyMap).
 *   - runRuleDiagnostics() (rules/RuleDiagnostics.js) for per-rule
 *     compiled-active / compiled-inert / failed status and reasons.
 *   - The domains' own defined_terms.json files for the term -> canonical
 *     id mapping already used by the definition engine.
 *
 * Output is plain data (JSON), so it can be regenerated at any time and
 * never drifts into being a second source of truth for engine behavior.
 *
 * Usage: node tools/knowledge-explorer/build-explorer-data.mjs
 * (run from the project root, matching KnowledgeProvider's own default
 * path resolution).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KnowledgeProvider } from '../../assets/js/engine/knowledge/KnowledgeProvider.js';
import { runRuleDiagnostics } from '../../assets/js/engine/rules/RuleDiagnostics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();
const KB_PATH = path.join(PROJECT_ROOT, 'assets', 'js', 'engine', 'knowledge', 'v1');
const OUT_DIR = path.join(__dirname, 'data');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(KB_PATH, 'manifest.json'), 'utf8'));

function typeOf(id) {
  const m = /^([A-Z]+)_/.exec(id || '');
  return m ? m[1] : 'OTHER';
}

function write(name, data) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`[knowledge-explorer] wrote ${path.relative(PROJECT_ROOT, file)} (${JSON.stringify(data).length} bytes)`);
}

// ---------------------------------------------------------------------
// 1. Load the ontology graph via the production loader (read-only).
// ---------------------------------------------------------------------
const provider = new KnowledgeProvider(KB_PATH);
provider._loadKnowledge();
provider._validateAndResolveGraph();

const nodes = [...provider.graph.nodes.entries()].map(([id, node]) => {
  const meta = provider.graph.metadata.get(id) || {};
  return { id, type: typeOf(id), domain: meta.domain, source: meta.source, file: meta.file, node };
});
const edges = provider.graph.edges.map(e => ({
  id: e.id, source: e.source, target: e.target, relation: e.relation, strength: e.strength ?? null,
}));

// Reference-derived edges (built by _validateAndResolveGraph's dependencyMap):
// targetId -> Set(sourceId) for actions/phrases/entities/documents/related/
// rules/expectedRules/expectedConcepts/minimumSections/recommendedSections.
const referenceEdges = [];
for (const [targetId, sources] of provider.graph.dependencyMap.entries()) {
  for (const sourceId of sources) {
    referenceEdges.push({ source: sourceId, target: targetId, relation: 'references' });
  }
}

// ---------------------------------------------------------------------
// 2. Ontology Explorer data.
// ---------------------------------------------------------------------
const ontologyByDomain = {};
for (const n of nodes) {
  const domainKey = n.domain || n.source;
  ontologyByDomain[domainKey] ??= {};
  ontologyByDomain[domainKey][n.type] ??= [];
  ontologyByDomain[domainKey][n.type].push({
    id: n.id,
    file: n.file,
    label: n.node.name || n.node.term || n.node.concept || n.node.label || n.id,
    summary: n.node.description || n.node.definition || n.node.rationale || null,
  });
}
write('ontology.json', {
  generatedAt: new Date().toISOString(),
  manifest: MANIFEST,
  totalNodes: nodes.length,
  totalEdges: edges.length,
  byDomain: ontologyByDomain,
  nodesById: Object.fromEntries(nodes.map(n => [n.id, n])),
});

// ---------------------------------------------------------------------
// 3. Cross-reference Graph data (relationship edges + reference edges).
// ---------------------------------------------------------------------
write('crossref.json', {
  generatedAt: new Date().toISOString(),
  nodes: nodes.map(n => ({ id: n.id, type: n.type, domain: n.domain || n.source })),
  relationEdges: edges,
  referenceEdges,
});

// ---------------------------------------------------------------------
// 4. Definition Usage Map: term -> canonical id -> who references it.
// ---------------------------------------------------------------------
const definedTermFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry === 'defined_terms.json') definedTermFiles.push(full);
  }
})(path.join(KB_PATH, 'domains'));

const definitions = [];
for (const file of definedTermFiles) {
  const domain = path.basename(path.dirname(file));
  const terms = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [term, canonicalId] of Object.entries(terms)) {
    const referencedBy = [...(provider.graph.dependencyMap.get(canonicalId) || [])];
    const relatedEdges = edges.filter(e => e.source === canonicalId || e.target === canonicalId);
    definitions.push({
      term,
      canonicalId,
      domain,
      resolvesToKnownNode: provider.graph.nodes.has(canonicalId),
      referencedByCount: referencedBy.length,
      referencedBy,
      relatedEdges,
    });
  }
}
write('definitions.json', {
  generatedAt: new Date().toISOString(),
  totalTerms: definitions.length,
  definitions: definitions.sort((a, b) => b.referencedByCount - a.referencedByCount),
});

// ---------------------------------------------------------------------
// 5. Rule Explorer + Rule Coverage Dashboard (via RuleDiagnostics).
// ---------------------------------------------------------------------
const diagnostics = runRuleDiagnostics(KB_PATH);

const rulesExplorer = diagnostics.rules.map(r => {
  const src = r.normalization?.sourceRule || {};
  return {
    id: r.id,
    domain: r.domain,
    status: r.status,
    reason: r.reason,
    category: src.category ?? null,
    severity: src.severity ?? null,
    jurisdiction: src.jurisdiction ?? null,
    rationale: src.rationale ?? null,
    recommendation: src.recommendation ?? null,
    legalEffect: src.legal_effect ?? null,
    targetPrecision: src.targetPrecision ?? null,
    targetRecall: src.targetRecall ?? null,
    linkedTests: src.linkedTests ?? [],
    originalSchema: r.normalization?.originalSchema ?? null,
    when: r.normalization?.canonical?.when ?? null,
    then: r.normalization?.canonical?.then ?? null,
    provenanceWarnings: r.provenanceWarnings ?? [],
  };
});

write('rules.json', {
  generatedAt: new Date().toISOString(),
  total: rulesExplorer.length,
  rules: rulesExplorer,
});

write('rule-coverage.json', {
  generatedAt: new Date().toISOString(),
  summary: diagnostics.summary,
  byDomain: diagnostics.byDomain,
});

// ---------------------------------------------------------------------
// 6. Knowledge Coverage Dashboard: per-domain rollup across everything
//    gathered above (ontology node counts, rule status counts, edges,
//    defined terms) so gaps are visible domain-by-domain.
// ---------------------------------------------------------------------
const domainNames = new Set([
  ...MANIFEST.domains,
  ...nodes.map(n => n.domain).filter(Boolean),
  ...Object.keys(diagnostics.byDomain),
]);

const knowledgeCoverage = [...domainNames].sort().map(domain => {
  const domainNodes = nodes.filter(n => n.domain === domain);
  const nodeTypeCounts = {};
  for (const n of domainNodes) nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1;
  const ruleCounts = diagnostics.byDomain[domain] || { compiledActive: 0, compiledInert: 0, failed: 0 };
  const domainEdges = edges.filter(e => domainNodes.some(n => n.id === e.source || n.id === e.target));
  const domainTerms = definitions.filter(d => d.domain === domain);
  return {
    domain,
    inManifest: MANIFEST.domains.includes(domain),
    ontologyNodeCount: domainNodes.length,
    nodeTypeCounts,
    relationEdgeCount: domainEdges.length,
    definedTermCount: domainTerms.length,
    rules: ruleCounts,
    totalRules: ruleCounts.compiledActive + ruleCounts.compiledInert + ruleCounts.failed,
  };
});

write('knowledge-coverage.json', {
  generatedAt: new Date().toISOString(),
  manifestDomains: MANIFEST.domains,
  totalDomainsObserved: knowledgeCoverage.length,
  domains: knowledgeCoverage,
  totals: {
    ontologyNodes: nodes.length,
    relationEdges: edges.length,
    referenceEdges: referenceEdges.length,
    definedTerms: definitions.length,
    rules: diagnostics.summary,
  },
});

console.log('[knowledge-explorer] done.');
