// index.js
// ---------------------------------------------------------------------
// Entry point for the knowledge-audit tool. Orchestrates:
//   parseKnowledgeBase() -> buildGraph() -> new KnowledgeGraph()
//   -> analyzers/* (each takes the graph, not raw nodes/edges — C2)
//   -> writes versioned JSON reports (R1) + the HTML dashboard (R3)
//   -> exits 1 if validator.js's CI quality gates fail.
//
// Run via `npm run knowledge-audit` (see package.json). This is the
// first step of `npm run verify`.
// ---------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseKnowledgeBase } from './parser.js';
import { buildGraph, IR_SCHEMA_VERSION } from './graph-builder.js';
import { KnowledgeGraph } from './knowledge-graph.js';

import * as validator from './analyzers/validator.js';
import * as quality from './analyzers/quality.js';
import * as coverage from './analyzers/coverage.js';
import * as metrics from './analyzers/metrics.js';
import * as complexity from './analyzers/complexity.js';
import { exportDashboard } from './exporters/export-dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();
const KB_PATH = path.join(PROJECT_ROOT, 'assets', 'js', 'engine', 'knowledge', 'v1');
const REPORTS_DIR = path.join(__dirname, 'reports');

function writeJson(name, data, versionInfo) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const payload = {
    irSchemaVersion: versionInfo.irSchemaVersion,
    manifestVersion: versionInfo.manifestVersion,
    ontologyVersion: versionInfo.ontologyVersion,
    generatedAt: versionInfo.generatedAt,
    ...data
  };
  fs.writeFileSync(path.join(REPORTS_DIR, name), JSON.stringify(payload, null, 2));
  return payload;
}

export function runAudit() {
  const parsed = parseKnowledgeBase(KB_PATH);
  const edges = buildGraph(parsed.nodes, parsed.relations);
  const graph = new KnowledgeGraph(parsed.nodes, edges);

  const versionInfo = {
    irSchemaVersion: IR_SCHEMA_VERSION,
    manifestVersion: parsed.manifestVersion,
    ontologyVersion: parsed.ontologyVersion,
    generatedAt: new Date().toISOString()
  };

  const validation = validator.run(graph, { parserErrors: parsed.errors });
  const coverageResult = coverage.run(graph);
  const complexityResult = complexity.run(graph);
  const metricsResult = {
    ...metrics.run(graph),
    avgRuleComplexity: complexityResult.avgRuleComplexity,
    topComplexRules: complexityResult.topComplexRules,
    domainComplexity: complexityResult.domainComplexity
  };
  const qualityResult = quality.run(graph, {
    parserErrors: parsed.errors,
    coverageScore: coverageResult.score,
    orphansCount: validation.orphans.length
  });

  const graphData = {
    nodes: parsed.nodes.map(n => ({
      id: n.id,
      type: n.type,
      domain: n.domain,
      label: n.metadata.label,
      status: n.metadata.status,
      file: n.sourceFile
    })),
    edges: edges.map(e => ({ source: e.source, target: e.target, relation: e.relation, domain: e.domain, explicit: e.explicit }))
  };

  writeJson('graph.json', graphData, versionInfo);
  writeJson('metrics.json', metricsResult, versionInfo);
  writeJson('quality.json', qualityResult, versionInfo);
  writeJson('coverage.json', coverageResult, versionInfo);
  writeJson('validation.json', validation, versionInfo);
  writeJson('parser-errors.json', { errors: parsed.errors }, versionInfo);

  const dashboardHtml = exportDashboard(parsed.nodes, edges, metricsResult, coverageResult, validation, qualityResult);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, 'dashboard.html'), dashboardHtml);

  console.log(`[knowledge-audit] IR schema v${versionInfo.irSchemaVersion} · manifest v${versionInfo.manifestVersion || 'n/a'} · ontology v${versionInfo.ontologyVersion || 'n/a'}`);
  console.log(`[knowledge-audit] ${parsed.nodes.length} nodes, ${edges.length} edges, ${parsed.errors.length} parser diagnostics`);
  console.log(`[knowledge-audit] Knowledge Score: ${qualityResult.score.overall}/100`);
  console.log(`[knowledge-audit] Quality gates: ${validation.gates.passed ? 'PASSED' : 'FAILED'}`);
  if (!validation.gates.passed) {
    for (const [name, gate] of Object.entries(validation.gates)) {
      if (name === 'passed') continue;
      if (!gate.passed) console.log(`  ✗ ${name}: ${gate.count} (limit ${gate.limit})`);
    }
  }
  console.log(`[knowledge-audit] Reports written to ${path.relative(PROJECT_ROOT, REPORTS_DIR)}/`);

  return { parsed, graph, validation, coverage: coverageResult, metrics: metricsResult, quality: qualityResult, versionInfo };
}

// Only run + exit when invoked directly (`node index.js`), not when
// imported by tests or drift.js.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { validation } = runAudit();
  process.exit(validation.gates.passed ? 0 : 1);
}
