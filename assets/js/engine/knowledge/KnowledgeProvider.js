/**
 * @fileoverview KnowledgeProvider
 * 
 * Loads versioned ontologies, rules, and schemas for the engine.
 * Builds an internal in-memory Graph of the ontology for fast O(1) lookups.
 */

import { RuleRegistry } from '../rules/RuleRegistry.js';
import { isExecutableRule } from '../rules/RuleCapability.js';
import path from 'path';
import fs from 'fs';

/**
 * Duplicate handling policy.
 */
export const DuplicatePolicy = {
  CORE_WINS: 'core',          // core definitions always win
  DOMAIN_WINS: 'domain',      // domain definitions override core (default)
  ERROR: 'error'              // throw or log error on any duplicate
};

export class KnowledgeProvider {
  /**
   * @param {string|Object} arg1 Path or options
   * @param {Object} options Additional options
   */
  constructor(arg1, options = {}) {
    if (typeof arg1 === 'string') {
        this.basePath = arg1;
        this.version = path.basename(arg1);
    } else {
        this.version = arg1?.version || 'v1';
        const projectRoot = process.cwd();
        this.basePath = arg1?.basePath || path.join(projectRoot, 'assets', 'js', 'engine', 'knowledge', this.version);
    }
    
    // Duplicate policy (default: domains override core)
    Object.defineProperty(this, "duplicatePolicy", {
    value: options.duplicatePolicy || DuplicatePolicy.DOMAIN_WINS,
    writable: false,
    enumerable: true
});
    // Optional compiled bundle (future compiler integration)
this.bundle = options.bundle || null;
    
    this.ruleRegistry = new RuleRegistry(this.basePath);
    
    // The internal graph storage
    this.graph = {
        nodes: new Map(),          // id -> ontology node (pure knowledge)
        edges: [],                 // array of relation objects
        metadata: new Map()        // id -> { source, group, domain, file }
    };

    // Rule metadata: store source info for compiled rules (separate from existence)
    this._ruleMetadata = new Map(); // id -> { source, group, domain, file }

    // Diagnostics extension: Track raw loaded entries internally.
    this._rawEntries = [];
  }

  /**
   * Initializes the provider by loading the manifest, ontology graph, and compiling rules.
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
        console.log(
            `[KnowledgeProvider] Initializing knowledge base version ${this.version} at ${this.basePath}...`
        );

        // Load all knowledge (core + domains)
        // Prefer a compiled bundle when available
        if (this.bundle) {
            this._loadBundle();
        } else {
            this._loadKnowledge();
        }

        // Validate Graph Integrity
        this._validateAndResolveGraph();

        console.log(
            `[KnowledgeProvider] Loaded ${this.graph.nodes.size} ontology nodes.`
        );
        console.log(
            `[KnowledgeProvider] Loaded ${this.ruleRegistry.getRules().length} executable rules.`
        );

    } catch (err) {
        console.warn(
            '[KnowledgeProvider] Failed to initialize remote rules or ontology.',
            err.message
        );
        throw err;
    }
}

  /**
 * Loads a precompiled knowledge bundle.
 * Placeholder for future compiler integration.
 */
_loadBundle() {
    throw new Error(
        "Knowledge bundle loading has not been implemented yet."
    );
}
  /**
   * Recursively loads all JSON files from all knowledge roots (core, domains, etc.).
   */
  _loadKnowledge() {
    const knowledgeRoots = [
      'core',
      'domains'
    ];

    for (const root of knowledgeRoots) {
      const dir = path.join(this.basePath, root);
      if (fs.existsSync(dir)) {
        this._loadDirectory(dir, root);
      }
    }
  }

  /**
   * Load all JSON files from a given directory and its subdirectories.
   * @param {string} dir - The directory to walk.
   * @param {string} source - The source category ('core' or 'domains').
   */
  _loadDirectory(dir, source) {
    const files = this._walkDirectory(dir);
    for (const file of files) {
      this._loadFile(file, source);
    }
  }

  /**
   * Walk a directory recursively and return all .json file paths.
   * @param {string} dir - The directory to walk.
   * @param {string[]} filelist - Accumulator for recursion.
   * @returns {string[]} List of absolute file paths.
   */
  _walkDirectory(dir, filelist = []) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && entry !== 'tests') {
        this._walkDirectory(fullPath, filelist);
      } else if (stat.isFile() && entry.endsWith('.json')) {
        filelist.push(fullPath);
      }
    }
    return filelist;
  }

  /**
   * Load a single JSON file and integrate its contents into the graph.
   * @param {string} filepath - Absolute path to the JSON file.
   * @param {string} source - 'core' or 'domains'.
   */
  _loadFile(filepath, source) {
    try {
      const raw = fs.readFileSync(filepath, 'utf8');
      const data = JSON.parse(raw);

      // Determine metadata from the relative path
      const relative = path.relative(this.basePath, filepath);
      const segments = relative.split(path.sep);
      const group = segments.length > 1 ? segments[1] : null;
      const filename = path.basename(filepath);
      const domain = (source === 'domains') ? group : null;

      const entries = Array.isArray(data) ? data : [data];

      for (const entry of entries) {
        if (!entry.id) continue;

        // Record raw entry for diagnostics
        this._rawEntries.push({
          entry,
          file: filepath,
          source,
          group,
          domain,
          filename
        });

        // Route by structure: executable rules vs relations vs ontology nodes
        if (isExecutableRule(entry)) {
          this._processExecutableRule(entry, source, group, domain, filename);
        } else if (entry.id.startsWith('REL_')) {
          this.graph.edges.push(entry);
        } else {
          this._processOntologyNode(entry, source, group, domain, filename);
        }
      }
    } catch (e) {
      console.warn(`[KnowledgeProvider] Error loading file ${filepath}:`, e.message);
    }
  }

  /**
   * Process an executable rule with duplicate detection based on the configured policy.
   */
  _processExecutableRule(entry, source, group, domain, filename) {
    const exists = this.ruleRegistry.hasRule(entry.id);
    if (exists) {
      // Get existing source info (if stored)
      const existingMeta = this._ruleMetadata.get(entry.id);
      const existingSource = existingMeta ? existingMeta.source : null;

      let shouldOverride = false;
      if (this.duplicatePolicy === DuplicatePolicy.DOMAIN_WINS && source === 'domains' && existingSource === 'core') {
        shouldOverride = true;
        console.warn(
          `[KnowledgeProvider] Overriding core rule '${entry.id}' with domain version from ${filename} (${group})`
        );
      } else if (this.duplicatePolicy === DuplicatePolicy.ERROR) {
        throw new Error(
          `[KnowledgeProvider] Duplicate rule id '${entry.id}' from ${filename} (source: ${source}, group: ${group})`
        );
      } else {
        // CORE_WINS or any other: keep existing
        console.warn(
          `[KnowledgeProvider] Duplicate rule id '${entry.id}' from ${filename} (source: ${source}, group: ${group}) - keeping existing`
        );
        return; // skip this duplicate
      }

      // If overriding, we need to remove the old rule from the registry
      // Since RuleRegistry may not support removal, we rely on it to handle override internally.
      // However, we trust that compileRule will overwrite if the same ID is compiled again.
      // For safety, we'll log and proceed.
    }

    // Compile the rule (RuleRegistry handles its internal state)
    this.ruleRegistry.compileRule(entry);

    // Store metadata separately
    this._ruleMetadata.set(entry.id, { source, group, domain, file: filename });
  }

  /**
   * Process an ontology node with duplicate detection based on the configured policy.
   */
  _processOntologyNode(entry, source, group, domain, filename) {
    const existing = this.graph.nodes.get(entry.id);
    if (existing) {
      const existingMeta = this.graph.metadata.get(entry.id);
      const existingSource = existingMeta ? existingMeta.source : null;

      if (this.duplicatePolicy === DuplicatePolicy.DOMAIN_WINS && source === 'domains' && existingSource === 'core') {
        console.warn(
          `[KnowledgeProvider] Overriding core node '${entry.id}' with domain version from ${filename} (${group})`
        );
        // Fall through to set the new one.
      } else if (this.duplicatePolicy === DuplicatePolicy.ERROR) {
        throw new Error(
          `[KnowledgeProvider] Duplicate node id '${entry.id}' from ${filename} (source: ${source}, group: ${group})`
        );
      } else {
        // CORE_WINS or any other: keep existing
        console.warn(
          `[KnowledgeProvider] Duplicate node id '${entry.id}' from ${filename} (source: ${source}, group: ${group}) - keeping existing`
        );
        return; // skip this duplicate
      }
    }

    // Store pure node (no metadata)
    this.graph.nodes.set(entry.id, entry);

    // Store metadata separately
    this.graph.metadata.set(entry.id, {
      source,
      group,
      domain,
      file: filename
    });
  }

  /**
   * Validates graph integrity, resolves references, and builds dependency maps.
   */
  _validateAndResolveGraph() {
    this.graph.dependencyMap = new Map();

    const checkReference = (sourceId, targetId, field) => {
      const targetExists = this.graph.nodes.has(targetId) || this.ruleRegistry.hasRule(targetId);
      if (!targetExists) {
        throw new Error(`[KnowledgeProvider] Broken Reference: Node '${sourceId}' references non-existent node/rule '${targetId}' in field '${field}'.`);
      }
      
      // Build dependency
      if (!this.graph.dependencyMap.has(targetId)) {
        this.graph.dependencyMap.set(targetId, new Set());
      }
      this.graph.dependencyMap.get(targetId).add(sourceId);
    };

    for (const [id, node] of this.graph.nodes.entries()) {
      if (node.actions) node.actions.forEach(ref => checkReference(id, ref, 'actions'));
      if (node.phrases) node.phrases.forEach(ref => checkReference(id, ref, 'phrases'));
      if (node.entities) node.entities.forEach(ref => checkReference(id, ref, 'entities'));
      if (node.documents) node.documents.forEach(ref => checkReference(id, ref, 'documents'));
      if (node.related) node.related.forEach(ref => checkReference(id, ref, 'related'));
      if (node.rules) node.rules.forEach(ref => checkReference(id, ref, 'rules'));
      
      if (node.expectedRules) node.expectedRules.forEach(ref => checkReference(id, ref, 'expectedRules'));
      if (node.expectedConcepts) node.expectedConcepts.forEach(ref => checkReference(id, ref, 'expectedConcepts'));
      if (node.minimumSections) node.minimumSections.forEach(ref => checkReference(id, ref, 'minimumSections'));
      if (node.recommendedSections) node.recommendedSections.forEach(ref => checkReference(id, ref, 'recommendedSections'));
    }
  }

  getCompiledRules() {
    return this.ruleRegistry.getRules();
  }

  /**
 * Runtime statistics.
 */
getStatistics() {
    return {
        nodes: this.graph.nodes.size,
        edges: this.graph.edges.length,
        rules: this.ruleRegistry.getRules().length,
        metadata: this.graph.metadata.size
    };
}

  /**
   * Returns a read-only list of raw domain entries.
   * Diagnostics consume this state but never extend or modify runtime state.
   * @returns {Object[]}
   */
  getRawEntries() {
    return [...this._rawEntries];
  }
  
  // --- Graph API Methods --- //

  getNode(id) {
    return this.graph.nodes.get(id) || null;
  }

  getNodeMetadata(id) {
    return this.graph.metadata.get(id) || null;
  }

  /**
   * Bulk variant of getNode()/getNodeMetadata(): every ontology node
   * currently loaded, paired with its loader metadata (source/domain/
   * file). No new data is computed here — this only exposes, per-node,
   * exactly what _loadKnowledge() already built into this.graph. Added
   * for the Ontology Explorer / Cross-reference Graph / Knowledge
   * Coverage explainability surfaces, which need to enumerate the graph
   * rather than look up one id at a time.
   * @returns {{id: string, node: Object, metadata: Object|null}[]}
   */
  getAllNodes() {
    return [...this.graph.nodes.entries()].map(([id, node]) => ({
      id,
      node,
      metadata: this.graph.metadata.get(id) || null
    }));
  }

  /**
   * Every ontology relationship edge (REL_* entries) currently loaded.
   * Thin bulk accessor over the same this.graph.edges array _loadFile()
   * already populates — no new relation data is derived or inferred.
   * @returns {Object[]}
   */
  getAllEdges() {
    return [...this.graph.edges];
  }

  // assets/js/engine/knowledge/KnowledgeProvider.js

getRuleMetadata(id) {
  const provenance = this._ruleMetadata.get(id) || null;
  if (!provenance) return null;

  // provenance only ever held loader bookkeeping ({source, group, domain, file}).
  // The actual rule content (id, category, severity, when, then, concept,
  // rationale, recommendation, ...) lives on the compiled rule's own
  // `.metadata` field, produced by RuleCompiler.compileRule() and held by
  // RuleRegistry. Callers such as RuleMetadataResolver need that real
  // content, not just provenance, so merge both here rather than changing
  // what _ruleMetadata stores (which duplicate-detection above still
  // relies on staying as-is).
  const compiledRule = this.ruleRegistry.getRules().find(r => r.id === id);
  const ruleContent = compiledRule ? compiledRule.metadata : null;

  return ruleContent ? { ...ruleContent, ...provenance } : provenance;
}

  getConcept(id) {
    const node = this.getNode(id);
    return (node && node.id.startsWith('CONCEPT_')) ? node : null;
  }

  getAction(id) {
    const node = this.getNode(id);
    return (node && node.id.startsWith('ACTION_')) ? node : null;
  }

  getEntity(id) {
    const node = this.getNode(id);
    return (node && node.id.startsWith('ENTITY_')) ? node : null;
  }

  getRelatedConcepts(id) {
    const concept = this.getConcept(id);
    if (!concept || !concept.related) return [];
    return concept.related.map(rid => this.getConcept(rid)).filter(Boolean);
  }

  getExpectedRules(documentId) {
    const doc = this.getNode(documentId);
    if (!doc || !doc.expectedRules) return [];
    return doc.expectedRules;
  }

  getPhrases(nodeId) {
    const node = this.getNode(nodeId);
    if (!node || !node.phrases) return [];
    return node.phrases.map(pid => this.getNode(pid)).filter(Boolean);
  }

  /**
   * Checks if a specific concept ID is defined in the loaded knowledge base.
   * @param {string} conceptId
   * @returns {boolean}
   */
  hasConcept(conceptId) {
    if (typeof conceptId !== 'string') return false;
    return this.graph.nodes.has(conceptId);
  }

  /**
   * Resolves all phrase texts associated with a concept ID.
   * Returns a defensive array copy of the phrase strings.
   * @param {string} conceptId
   * @returns {string[]}
   */
  getPhrasesForConcept(conceptId) {
    if (typeof conceptId !== 'string') return [];
    const phrases = new Set();
    const node = this.graph.nodes.get(conceptId);
    if (node) {
      if (Array.isArray(node.phrases)) {
        node.phrases.forEach(p => {
          if (typeof p === 'string') phrases.add(p);
        });
      }
      for (const [_, n] of this.graph.nodes.entries()) {
        if (n && n.concept === conceptId && typeof n.text === 'string') {
          phrases.add(n.text);
        }
      }
    }
    return Array.from(phrases);
  }

  /**
   * Resolves all canonical action IDs associated with the target concept ID.
   * Returns a defensive array copy.
   * @param {string} conceptId
   * @returns {string[]}
   */
  getActionsForConcept(conceptId) {
    if (typeof conceptId !== 'string') return [];
    const node = this.graph.nodes.get(conceptId);
    return node && Array.isArray(node.actions) ? [...node.actions] : [];
  }

  /**
   * Resolves document types that require this concept.
   * Returns a defensive array copy.
   * @param {string} conceptId
   * @returns {string[]}
   */
  getRequiredDocumentsForConcept(conceptId) {
    if (typeof conceptId !== 'string') return [];
    const node = this.graph.nodes.get(conceptId);
    return node && Array.isArray(node.documents) ? [...node.documents] : [];
  }

  // --- Enterprise KB Accessors --- //
  // Additive, defensive (never throw, empty-safe) accessors over node types
  // that live alongside CONCEPT_/ACTION_/ENTITY_ nodes in each domain:
  //   PHRASE_*      (phrases.json)            — text variants of a concept
  //   SOURCE_*      (sources.json)             — authoritative legal citations
  //   JNOTE_*       (jurisdiction-notes.json)  — jurisdiction-specific guidance
  //     (deliberately NOT the `JURISDICTION_*` prefix already used by
  //     GoverningLaw/jurisdictions.json for an unrelated venue-name lexicon —
  //     reusing that prefix for a different node shape would defeat the
  //     prefix-based routing the loader relies on.)
  //   EXAMPLE_*     (examples.json)            — positive/negative clause examples
  //   EXCEPTION_*   (exceptions.json)          — carve-outs (existing node type,
  //     backfilled with an optional `concept` field where authored)
  // All resolve via the same reverse-scan-by-`concept`-field pattern already
  // used by getPhrasesForConcept, so no changes to the loader or the
  // (deliberately non-strict) graph validator were needed.

  /**
   * Returns the full phrase nodes for a concept, grouped under that concept.
   * Unlike getPhrasesForConcept (which returns bare strings), this returns
   * the whole node so weight/metadata on the phrase, if authored, survives.
   * @param {string} conceptId
   * @returns {{conceptId: string, phrases: Object[]}}
   */
  getPhraseGroup(conceptId) {
    if (typeof conceptId !== 'string') return { conceptId, phrases: [] };
    const phrases = [];
    for (const [, n] of this.graph.nodes.entries()) {
      if (n && n.concept === conceptId && (n.id.startsWith('PHRASE_') || typeof n.text === 'string')) {
        phrases.push(n);
      }
    }
    return { conceptId, phrases };
  }

  /**
   * Returns the recommendation/rationale authored on a rule's `then` block.
   * Reads through getRuleMetadata so it works whether the rule came from
   * core or a domain override.
   * @param {string} ruleId
   * @returns {{ruleId: string, recommendation: string|null, rationale: string|null, message: string|null}|null}
   */
  getRecommendation(ruleId) {
    const meta = this.getRuleMetadata(ruleId);
    const then = (meta && meta.then) || {};
    // Non-executable "knowledge-concept" entries (the 10 rules deliberately
    // left uncompiled — see RuleCompiler.js/test_ruleDiagnostics.mjs) have no
    // `when`/`then` and were never sent to RuleRegistry, so they load as
    // plain ontology nodes instead. Their recommendation/rationale live at
    // the top level of that node. Fall back to it rather than fabricating
    // a compiled shape that was never authored.
    const node = this.getNode(ruleId);
    return {
      ruleId,
      recommendation: then.recommendation || (node && node.recommendation) || null,
      rationale: then.rationale || (node && node.rationale) || null,
      message: then.message || (node && node.message) || null
    };
  }

  /**
   * Generic reverse-scan helper: all nodes of a given id-prefix whose
   * `concept` field matches conceptId.
   */
  _nodesByPrefixForConcept(prefix, conceptId) {
    if (typeof conceptId !== 'string') return [];
    const out = [];
    for (const [, n] of this.graph.nodes.entries()) {
      if (n && n.id.startsWith(prefix) && n.concept === conceptId) out.push(n);
    }
    return out;
  }

  /**
   * Authoritative legal citations backing a concept (sources.json, SOURCE_* nodes).
   * @param {string} conceptId
   * @returns {Object[]}
   */
  getSources(conceptId) {
    return this._nodesByPrefixForConcept('SOURCE_', conceptId);
  }

  /**
   * Jurisdiction-specific guidance for a concept (jurisdiction-notes.json, JNOTE_* nodes).
   * Distinct from GoverningLaw's JURISDICTION_* venue-name lexicon.
   * @param {string} conceptId
   * @returns {Object[]}
   */
  getJurisdictionNotes(conceptId) {
    return this._nodesByPrefixForConcept('JNOTE_', conceptId);
  }

  /**
   * Positive/negative example clauses for a concept (examples.json, EXAMPLE_* nodes).
   * @param {string} conceptId
   * @param {string} [polarity] optional filter: 'positive' | 'negative'
   * @returns {Object[]}
   */
  getExamples(conceptId, polarity) {
    const all = this._nodesByPrefixForConcept('EXAMPLE_', conceptId);
    return polarity ? all.filter(e => e.polarity === polarity) : all;
  }

  /**
   * Exceptions/carve-outs linked to a concept (exceptions.json).
   * Falls back to domain-wide exceptions (no `concept` authored yet) so
   * pre-existing, un-backfilled exceptions.json entries are still visible
   * rather than silently disappearing.
   * @param {string} conceptId
   * @param {string} [domain] optional domain fallback filter
   * @returns {Object[]}
   */
  getExceptions(conceptId, domain) {
    const linked = [
      ...this._nodesByPrefixForConcept('EXCEPTION_', conceptId),
      ...this._nodesByPrefixForConcept('EXC_', conceptId)
    ];
    if (linked.length > 0 || !domain) return linked;
    const out = [];
    for (const [id, n] of this.graph.nodes.entries()) {
      if (id.startsWith('EXCEPTION_') || id.startsWith('EXC_')) {
        const meta = this.graph.metadata.get(id);
        if (meta && meta.domain === domain) out.push(n);
      }
    }
    return out;
  }

  /**
   * Alias/synonym surface forms for a concept: authored aliases on the
   * concept node itself, plus phrase text, deduplicated.
   * @param {string} conceptId
   * @returns {string[]}
   */
  getAliases(conceptId) {
    const concept = this.getConcept(conceptId);
    const aliases = new Set();
    if (concept && Array.isArray(concept.aliases)) {
      concept.aliases.forEach(a => aliases.add(a));
    }
    return Array.from(aliases);
  }

  /**
   * Given a concept and a raw text span, returns which of the concept's
   * known aliases/phrases actually appear in that text (case-insensitive).
   * Used to populate a finding's "aliases used" / "matched phrase" trail.
   * @param {string} conceptId
   * @param {string} text
   * @returns {{matchedAliases: string[], matchedPhrases: string[]}}
   */
  getMatchedSurfaceForms(conceptId, text) {
    const result = { matchedAliases: [], matchedPhrases: [] };
    if (typeof text !== 'string' || !text) return result;
    const lower = text.toLowerCase();

    this.getAliases(conceptId).forEach(a => {
      if (typeof a === 'string' && lower.includes(a.toLowerCase())) result.matchedAliases.push(a);
    });
    this.getPhrasesForConcept(conceptId).forEach(p => {
      if (typeof p === 'string' && lower.includes(p.toLowerCase())) result.matchedPhrases.push(p);
    });
    return result;
  }

  /**
   * Replaces resolveTerm, mapping a synonym or raw term to its Canonical Action/Concept ID.
   */
  resolveActionSynonym(term) {
    const normalized = term.toLowerCase().trim();
    for (const [id, node] of this.graph.nodes.entries()) {
        if (id.startsWith('ACTION_')) {
            if (node.synonyms && node.synonyms.includes(normalized)) return id;
            if (node.name && node.name.toLowerCase() === normalized) return id;
        }
    }
    return null;
  }
}