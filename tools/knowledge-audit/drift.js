// drift.js
// ---------------------------------------------------------------------
// Compares the graph.json this run just produced against the graph.json
// from a previous run, to surface what changed in the knowledge base's
// shape (nodes/edges added or removed) between audits.
//
// Audit R1: every audit output is now stamped with `irSchemaVersion`
// (graph-builder.js's IR_SCHEMA_VERSION). If a previous snapshot was
// written under a different IR schema version, its node/edge object
// shape may not mean the same thing anymore — so drift() refuses to
// structurally diff across an IR version bump and instead reports
// `hasPrevious: false` with an explanatory note, rather than silently
// comparing incompatible shapes and reporting bogus drift.
// ---------------------------------------------------------------------

import fs from 'fs';
import { IR_SCHEMA_VERSION } from './graph-builder.js';

/**
 * @param {Object} currentGraph this run's graph.json contents (already
 *   includes irSchemaVersion/manifestVersion/generatedAt per R1).
 * @param {Object|null} previousGraph last run's graph.json contents,
 *   or null if there is none on disk yet.
 * @returns {Object} drift result
 */
export function computeDrift(currentGraph, previousGraph) {
  if (!previousGraph) {
    return { hasPrevious: false, note: 'No previous snapshot found.' };
  }
  if (previousGraph.irSchemaVersion !== IR_SCHEMA_VERSION) {
    return {
      hasPrevious: false,
      note: `Previous snapshot used IR schema v${previousGraph.irSchemaVersion || 'unknown'}, ` +
        `current is v${IR_SCHEMA_VERSION} — skipping structural diff (incompatible shape), not reporting drift.`
    };
  }

  const prevIds = new Set((previousGraph.nodes || []).map(n => n.id));
  const currIds = new Set((currentGraph.nodes || []).map(n => n.id));
  const addedNodes = [...currIds].filter(id => !prevIds.has(id));
  const removedNodes = [...prevIds].filter(id => !currIds.has(id));

  const edgeKey = e => `${e.source}->${e.target}->${e.relation}`;
  const prevEdgeKeys = new Set((previousGraph.edges || []).map(edgeKey));
  const currEdgeKeys = new Set((currentGraph.edges || []).map(edgeKey));
  const addedEdges = [...currEdgeKeys].filter(k => !prevEdgeKeys.has(k));
  const removedEdges = [...prevEdgeKeys].filter(k => !currEdgeKeys.has(k));

  return {
    hasPrevious: true,
    previousGeneratedAt: previousGraph.generatedAt || null,
    currentGeneratedAt: currentGraph.generatedAt || null,
    nodeDelta: currIds.size - prevIds.size,
    edgeDelta: currEdgeKeys.size - prevEdgeKeys.size,
    addedNodes,
    removedNodes,
    addedEdgeCount: addedEdges.length,
    removedEdgeCount: removedEdges.length
  };
}

/**
 * Reads two graph.json files from disk and computes drift between them.
 * @param {string} currentPath
 * @param {string} previousPath
 */
export function computeDriftFromFiles(currentPath, previousPath) {
  const currentGraph = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
  let previousGraph = null;
  if (fs.existsSync(previousPath)) {
    try {
      previousGraph = JSON.parse(fs.readFileSync(previousPath, 'utf8'));
    } catch {
      previousGraph = null;
    }
  }
  return computeDrift(currentGraph, previousGraph);
}
