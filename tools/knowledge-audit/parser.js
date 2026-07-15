// parser.js
// ---------------------------------------------------------------------
// Turns raw knowledge-base entries (from loader.js — pure I/O, see its
// header) into the audit tool's IR: typed nodes with a `.references`
// array (schema-registry.js) and separate explicit relation entries
// (REL_* files), ready for graph-builder.js.
//
// Audit R2: this file used to also do filesystem walking and file
// reading itself. That's now loader.js's job exclusively — parser.js
// only interprets already-read `{ entries, relativeFile, domain }`
// data: (c) node-type detection + schema validation, (d) IR
// node/relation assembly. This split is what makes it possible to
// unit-test type detection with in-memory fixtures (tests/unit/
// parser.test.js) independent of loader.js's directory-walking tests
// (tests/unit/loader.test.js).
//
// Audit C1: this is a deliberately independent structural parser, not
// a second copy of the production KnowledgeProvider (see
// schema-registry.js's header for the full rationale). The one thing
// that *must* stay in sync between the two — which node ids exist in
// the knowledge base — is checked automatically by
// tests/parser-production-parity.test.js, so drift is caught rather
// than relying on memory (C1's recommendation #1).
// ---------------------------------------------------------------------

import path from 'path';
import { readManifest, listKnowledgeFiles, readEntries } from './loader.js';
import { getSchemaOrDefault, classifyId } from './schema-registry.js';

// Filename-based fallback when an entry has no `id` field shaped like
// a known prefix (e.g. legacy files, or a node type not yet in
// PREFIX_TYPE_MAP). Keyed by basename so it works for any domain.
const FILENAME_TYPE_HINTS = {
  'concept.json': 'concept',
  'rules.json': 'rule',
  'decision_tables.json': 'decision_table',
  'templates.json': 'template',
  'sources.json': 'source',
  'examples.json': 'example',
  'exceptions.json': 'exception',
  'phrases.json': 'phrase',
  'actors.json': 'party',
  'objects.json': 'entity',
  'actions.json': 'action',
  'events.json': 'event',
  'intents.json': 'intent',
  'enums.json': 'other',
  'jurisdiction-notes.json': 'jurisdiction_note',
  'relations.json': 'relation'
};

// Files that carry domain bookkeeping rather than ontology nodes at
// all (a per-domain index-of-files manifest, or plain domain
// metadata). Entries here are skipped silently — not an error, just
// not a graph node.
const NON_NODE_FILENAMES = new Set(['knowledge.json', 'metadata.json']);

// Some file types key their entries on a field other than `id`.
// templates.json is the one observed case: entries are
// { family: "...", templates: [...] } with no `id` at all — decision
// tables reference the family name directly in their `inputs` list, so
// `family` IS this entry's identifier in every practical sense. Using
// it as the node id (prefixed so it still reads as a template id in
// reports, and so a family name can never collide with a real
// TEMPLATE_-prefixed id elsewhere) is what lets coverage.js's
// template->decision-table trace actually connect, instead of every
// template silently vanishing for lacking an `id` field.
const ID_FIELD_FALLBACK = {
  'templates.json': (raw) => (typeof raw.family === 'string' ? `TEMPLATE_${raw.family}` : null)
};

function detectType(entry, basename) {
  if (typeof entry.id === 'string') {
    const byPrefix = classifyId(entry.id);
    if (byPrefix !== 'other') return byPrefix;
  }
  if (FILENAME_TYPE_HINTS[basename]) return FILENAME_TYPE_HINTS[basename];
  if (basename.startsWith('relation')) return 'relation';
  if (basename.startsWith('entity_')) return 'entity';
  if (basename.startsWith('relation_')) return 'relation';
  return 'other';
}

/**
 * @param {string} kbPath absolute path to the knowledge base root
 *   (e.g. .../assets/js/engine/knowledge/v1).
 * @returns {{nodes: Object[], relations: Object[], errors: Object[],
 *   manifestVersion: string|null, ontologyVersion: string|null,
 *   domains: string[]}}
 */
export function parseKnowledgeBase(kbPath) {
  const manifest = readManifest(kbPath);
  const files = listKnowledgeFiles(kbPath, manifest.domains);

  const nodes = [];
  const relations = [];
  const errors = [];
  const seenIds = new Map(); // id -> first-seen relativeFile, for duplicate detection

  for (const { filePath, relativeFile, domain } of files) {
    const basename = path.basename(filePath);
    if (NON_NODE_FILENAMES.has(basename)) continue;

    const { entries, error } = readEntries(filePath, relativeFile);
    if (error) {
      errors.push(error);
      continue;
    }

    for (const raw of entries) {
      if (!raw || typeof raw !== 'object') continue;

      if (typeof raw.id !== 'string' || !raw.id) {
        const fallback = ID_FIELD_FALLBACK[basename];
        const derivedId = fallback ? fallback(raw) : null;
        if (derivedId) {
          raw.id = derivedId;
        } else {
          // Not everything in a domain file is itself an id-bearing node
          // (e.g. a bare enums.json lookup table) — skip without error.
          continue;
        }
      }

      const type = detectType(raw, basename);

      if (type === 'relation') {
        if (typeof raw.source === 'string' && typeof raw.target === 'string') {
          relations.push({
            id: raw.id,
            source: raw.source,
            target: raw.target,
            relation: raw.relation || raw.type || 'related_to',
            domain,
            file: relativeFile
          });
        } else {
          errors.push({ file: relativeFile, id: raw.id, error: `Relation entry missing source/target`, severity: 'error' });
        }
        continue;
      }

      if (seenIds.has(raw.id)) {
        errors.push({
          file: relativeFile,
          id: raw.id,
          error: `Duplicate ID '${raw.id}' (first defined in ${seenIds.get(raw.id)})`,
          severity: 'warning'
        });
        continue; // first-seen definition wins, matching KnowledgeProvider's own precedent
      }
      seenIds.set(raw.id, relativeFile);

      const schema = getSchemaOrDefault(type);
      for (const field of schema.requiredFields) {
        if (raw[field] === undefined || raw[field] === null) {
          errors.push({
            file: relativeFile,
            id: raw.id,
            error: `Missing required field '${field}' for type '${type}'`,
            severity: 'error'
          });
        }
      }

      let references = [];
      try {
        references = schema.referenceExtractor(raw);
      } catch (e) {
        errors.push({ file: relativeFile, id: raw.id, error: `Reference extraction failed: ${e.message}`, severity: 'error' });
      }

      nodes.push({
        id: raw.id,
        type,
        domain,
        references,
        metadata: {
          status: raw.status || 'production',
          label: raw.name || raw.term || raw.label || raw.concept || raw.id,
          summary: raw.description || raw.definition || raw.rationale || null,
          file: relativeFile,
          raw
        },
        sourceFile: relativeFile
      });
    }
  }

  return {
    nodes,
    relations,
    errors,
    manifestVersion: manifest.version,
    ontologyVersion: manifest.ontology,
    domains: manifest.domains
  };
}
