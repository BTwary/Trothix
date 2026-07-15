// loader.js
// ---------------------------------------------------------------------
// Filesystem I/O layer for the knowledge-audit tool (audit finding R2).
// Owns every disk access this tool performs: reading manifest.json,
// walking the `core/` and `domains/<domain>/` directory trees, and
// reading + JSON-parsing each knowledge file. It does not interpret
// what a node "is" (no type detection, no schema validation, no IR
// assembly) — that is parser.js's job. This split means loader.js's
// walk/skip logic (e.g. "don't descend into a `tests/` directory") can
// be exercised with a throwaway directory fixture, and parser.js's
// type-detection/validation logic can be exercised with in-memory
// entries, without either test needing the other's concern (see
// tests/unit/loader.test.js and tests/unit/parser.test.js).
//
// Domain scope: like the sibling `KnowledgeLinter.js`
// (assets/js/engine/knowledge/KnowledgeLinter.js), this walks only the
// domains declared in manifest.json's `domains` array, not every
// directory physically present under `domains/`. Note this is *not*
// identical to `KnowledgeProvider._loadKnowledge()`, which loads every
// directory under `domains/` regardless of manifest declaration — a
// pre-existing divergence between the manifest-driven tooling
// (KnowledgeLinter, knowledge-audit, knowledge-explorer's manifest
// scoping) and KnowledgeProvider's disk-driven loading that predates
// this audit and is out of scope for it (KnowledgeProvider is a frozen
// production file). tests/parser-production-parity.test.js accounts
// for this by comparing only within the manifest-declared domains
// rather than asserting full unscoped parity.
// ---------------------------------------------------------------------

import fs from 'fs';
import path from 'path';

// Read and parse manifest.json. Never throws — a missing/invalid
// manifest degrades to an empty domain list (matching how a fresh/
// misconfigured knowledge base would behave rather than crashing the
// whole audit run on a metadata file).
export function readManifest(kbPath) {
  const manifestPath = path.join(kbPath, 'manifest.json');
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || null,
      ontology: parsed.ontology || null,
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      supportedDocuments: Array.isArray(parsed.supportedDocuments) ? parsed.supportedDocuments : []
    };
  } catch (e) {
    return { version: null, ontology: null, domains: [], supportedDocuments: [] };
  }
}

// Recursively collect every .json file under `dir`, skipping any
// directory literally named `tests` (mirrors
// KnowledgeProvider._walkDirectory's own skip rule, so a `tests/`
// fixture directory living next to real knowledge files is never
// treated as knowledge by either loader).
function walkDir(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === 'tests') continue;
      walkDir(fullPath, filelist);
    } else if (stat.isFile() && entry.endsWith('.json')) {
      filelist.push(fullPath);
    }
  }
  return filelist;
}

// Enumerate every core + domain knowledge file as
// { filePath, relativeFile, domain }. `domains` is the manifest's
// declared domain list (see module header for scoping rationale).
// Pure I/O + path bookkeeping — no interpretation of file contents.
export function listKnowledgeFiles(kbPath, domains = []) {
  const files = [];

  const coreDir = path.join(kbPath, 'core');
  for (const filePath of walkDir(coreDir)) {
    files.push({ filePath, relativeFile: path.relative(kbPath, filePath), domain: 'core' });
  }

  for (const domain of domains) {
    const domainDir = path.join(kbPath, 'domains', domain);
    for (const filePath of walkDir(domainDir)) {
      files.push({ filePath, relativeFile: path.relative(kbPath, filePath), domain });
    }
  }

  return files;
}

// Read + JSON.parse a single knowledge file, normalizing to an array
// of entries (a file may contain either a single object or an array).
// Never throws — read/parse failures are returned as a structured
// error for the caller to collect, matching parser.js's existing
// error-accumulation convention.
export function readEntries(filePath, relativeFile) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const entries = Array.isArray(data) ? data : [data];
    return { entries, error: null };
  } catch (e) {
    return {
      entries: [],
      error: { file: relativeFile, error: `Failed to read/parse file: ${e.message}`, severity: 'fatal' }
    };
  }
}

// Exposed for unit testing the walk/skip logic directly (R4) without
// reaching through readManifest/listKnowledgeFiles.
export { walkDir };
