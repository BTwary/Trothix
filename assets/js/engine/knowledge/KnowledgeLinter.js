/**
 * @fileoverview KnowledgeLinter.js
 * Validates the knowledge base by detecting each JSON file's type from its
 * filename (via Detector) and dispatching to the matching schema module for
 * type-specific validation. Supports domains from manifest.json.
 *
 * ARCHITECTURE (post-migration):
 *
 *   KnowledgeLinter (this file — thin orchestrator)
 *         │
 *         ▼
 *   Detector            — resolves a filename to a schema
 *         │
 *         ▼
 *   SchemaMatcher        — exact-filename / fallback-basename matching
 *         │
 *         ▼
 *   SchemaRegistry       — static registration of schema modules
 *         │
 *         ▼
 *   Schemas (schemas/*Schema.js) — own validate/idExtractor/getReferences
 *
 * KnowledgeLinter itself now only:
 *   - loads the manifest
 *   - walks domains
 *   - invokes Detector per file
 *   - dispatches to schema.validate() / schema.idExtractor() / schema.getReferences()
 *   - collects IDs, detects duplicates
 *   - performs generic reference resolution
 *   - reports issues
 *
 * It contains zero per-schema validation logic — see schemas/ for that.
 *
 * VERSION: 2.0.0 (post schema-migration)
 */

import fs from 'fs/promises';
import path from 'path';
import { Detector } from './schemas/Detector.js';
import './schemas/index.js'; // static registration side effect — see schemas/index.js

const Severity = {
  FATAL: "FATAL",
  ERROR: "ERROR",
  WARNING: "WARNING"
};

export class KnowledgeLinter {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async lint() {
    const issues = [];
    const manifestPath = path.join(this.basePath, 'manifest.json');

    let manifest;
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(raw);
    } catch (e) {
      issues.push(`[${Severity.FATAL}] Missing or invalid manifest.json at ${manifestPath}: ${e.message}`);
      return issues;
    }

    if (!manifest.domains || !Array.isArray(manifest.domains) || manifest.domains.length === 0) {
      issues.push(`[${Severity.FATAL}] manifest.json missing "domains" array.`);
      return issues;
    }

    if (!manifest.domains.every(d => typeof d === "string")) {
      issues.push(`[${Severity.FATAL}] manifest.json contains invalid domain names.`);
      return issues;
    }

    // ------------------------------------------------------------------
    // 1. Walk all core/domains and collect all JSON files with their data
    // ------------------------------------------------------------------
    const fileEntries = [];
    const idOccurrences = {};

    // 1a. Load Core Ontology files first
    const coreRoot = path.join(this.basePath, "core");
    let hasCore = false;
    try {
      await fs.access(coreRoot);
      hasCore = true;
    } catch (e) {}

    if (hasCore) {
      let coreFiles = [];
      try {
        coreFiles = await this._walkDir(coreRoot, "");
      } catch (e) {
        issues.push(`[${Severity.WARNING}] Core directory failed to walk: ${e.message}`);
      }
      for (const file of coreFiles) {
        if (!file.endsWith('.json')) continue;
        const fullPath = path.join(coreRoot, file);
        const relPath = path.join("core", file);
        let raw;
        try {
          raw = await fs.readFile(fullPath, 'utf-8');
        } catch (e) {
          issues.push(`[${Severity.ERROR}] Cannot read file ${relPath}: ${e.message}`);
          continue;
        }
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          issues.push(`[${Severity.ERROR}] Invalid JSON in ${relPath}: ${e.message}`);
          continue;
        }
        const schema = Detector.detect(file);
        if (!schema) continue;
        fileEntries.push({ domain: "core", relPath, data, schema, type: schema.name });
      }
    }

    // 1b. Load Domain files
    const domainsRoot = path.join(this.basePath, "domains");

    for (const domain of manifest.domains) {
      const domainDir = path.join(domainsRoot, domain);

      let files;
      try {
        console.log("Checking:", domainDir);
        files = await this._walkDir(domainDir, "");
      } catch (e) {
        console.error("FAILED:", domainDir);
        console.error(e);
        issues.push(
          `[${Severity.WARNING}] Domain directory '${domain}' declared in manifest but not found. (${e.message})`
        );
        continue;
      }

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const fullPath = path.join(domainDir, file);
        const relPath = path.join(domain, file);
        let raw;
        try {
          raw = await fs.readFile(fullPath, 'utf-8');
        } catch (e) {
          issues.push(`[${Severity.ERROR}] Cannot read file ${relPath}: ${e.message}`);
          continue;
        }
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          issues.push(`[${Severity.ERROR}] Invalid JSON in ${relPath}: ${e.message}`);
          continue;
        }

        const schema = Detector.detect(file);
        if (!schema) {
          issues.push(`[${Severity.WARNING}] ${relPath}: Unknown file type (not handled).`);
          continue;
        }

        fileEntries.push({ domain, relPath, data, schema, type: schema.name });
      }
    }

    if (fileEntries.length === 0) {
      issues.push(`[${Severity.WARNING}] No JSON files found in any domain.`);
      return issues;
    }

    // ------------------------------------------------------------------
    // 2. First pass: validate each file (via its schema) and collect IDs
    // ------------------------------------------------------------------
    for (const entry of fileEntries) {
      const { relPath, data, schema } = entry;

      const validationErrors = schema.validate(data, relPath);
      for (const err of validationErrors) {
        issues.push(err);
      }

      const ids = schema.idExtractor(data);
      for (const id of ids) {
        if (typeof id !== 'string') {
          issues.push(`[${Severity.ERROR}] ${relPath}: extracted ID is not a string: ${id}`);
          continue;
        }
        if (!idOccurrences[id]) {
          idOccurrences[id] = { files: [], types: [] };
        }
        idOccurrences[id].files.push(relPath);
        idOccurrences[id].types.push(schema.name);
      }
    }

    for (const [id, occ] of Object.entries(idOccurrences)) {
      if (occ.files.length > 1) {
        const fileList = occ.files.join(', ');
        issues.push(`[${Severity.WARNING}] Duplicate ID "${id}" found in multiple files: ${fileList}`);
      }
    }

    const idRegistry = {};
    for (const [id, occ] of Object.entries(idOccurrences)) {
      idRegistry[id] = { file: occ.files[0], type: occ.types[0] };
    }

    // ------------------------------------------------------------------
    // 3. Second pass: generic cross-reference resolution.
    //    KnowledgeLinter has no per-type knowledge here — it simply asks
    //    each entry's schema for its references and resolves them against
    //    the ID registry built above.
    // ------------------------------------------------------------------
    for (const entry of fileEntries) {
      const { relPath, data, schema } = entry;
      const refs = schema.getReferences(data);
      for (const { id, path: refPath, targetType } of refs) {
        if (!idRegistry[id]) {
          issues.push(`[${Severity.ERROR}] ${relPath}: reference '${id}' (from ${refPath}) not found in any file.`);
        } else if (targetType !== 'any' && idRegistry[id].type !== targetType) {
          issues.push(`[${Severity.ERROR}] ${relPath}: reference '${id}' (from ${refPath}) exists but is of type '${idRegistry[id].type}', expected '${targetType}'.`);
        }
      }
    }

    return issues;
  }

  // -------------------- Helpers --------------------

  async _walkDir(dir, relative) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relative ? path.join(relative, entry.name) : entry.name;
        if (entry.isDirectory()) {
          const subFiles = await this._walkDir(fullPath, relPath);
          files.push(...subFiles);
        } else {
          files.push(relPath);
        }
      }
    } catch (e) {
      throw e;
    }
    return files;
  }
}
