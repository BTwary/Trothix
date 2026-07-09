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

export class KnowledgeProvider {
  /**
   * @param {string|Object} arg1 Path or options
   */
  constructor(arg1) {
    if (typeof arg1 === 'string') {
        this.basePath = arg1;
        this.version = path.basename(arg1);
    } else {
        this.version = arg1?.version || 'v1';
        const projectRoot = process.cwd();
        this.basePath = arg1?.basePath || path.join(projectRoot, 'assets', 'js', 'engine', 'knowledge', this.version);
    }
    
    this.ruleRegistry = new RuleRegistry(this.basePath);
    
    // The internal graph storage
    this.graph = {
        nodes: new Map(), // id -> object
        edges: []         // array of relation objects
    };

    // Diagnostics extension: Track raw loaded entries internally.
    // KnowledgeProvider owns runtime/production state; diagnostics tools
    // consume this state via read-only accessors rather than modifying internals.
    this._rawEntries = [];
  }

  /**
   * Initializes the provider by loading the manifest, ontology graph, and compiling rules.
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log(`[KnowledgeProvider] Initializing knowledge base version ${this.version} at ${this.basePath}...`);
      
      // Load Ontology and Rules from Domains
      this._loadDomains();
      
      // Validate Graph Integrity
      this._validateAndResolveGraph();
      
      console.log(`[KnowledgeProvider] Loaded ${this.graph.nodes.size} ontology nodes.`);
    } catch (err) {
      console.warn('[KnowledgeProvider] Failed to initialize remote rules or ontology.', err.message);
      throw err;
    }
  }

  /**
   * Recursively loads all JSON files in the domains directory.
   */
  _loadDomains() {
    const domainsPath = path.join(this.basePath, 'domains');
    if (!fs.existsSync(domainsPath)) return;

    const walkSync = (dir, filelist = []) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filepath = path.join(dir, file);
            if (fs.statSync(filepath).isDirectory() && file !== 'tests') {
                filelist = walkSync(filepath, filelist);
            } else if (file.endsWith('.json')) {
                filelist.push(filepath);
            }
        }
        return filelist;
    };

    const files = walkSync(domainsPath);
    
    for (const file of files) {
        try {
            const raw = fs.readFileSync(file, 'utf8');
            const data = JSON.parse(raw);
            const domain = path.basename(path.dirname(file));
            
            // Handle arrays of rules or single objects
            const entries = Array.isArray(data) ? data : [data];
            
            for (const entry of entries) {
                if (!entry.id) continue;

                // Track all raw entries internally for read-only diagnostics auditing
                this._rawEntries.push({ entry, file, domain });

                // Verified issue #4 fix: route by structure, not id naming
                // convention. A rule is executable because it HAS a
                // complete when/then, not because its id happens to start
                // with "RULE_" — several fully-executable entries used a
                // "CONCEPT_" id and were silently excluded from
                // compilation under the old prefix check.
                if (isExecutableRule(entry)) {
                    this.ruleRegistry.compileRule(entry);
                } else if (entry.id.startsWith('REL_')) {
                    this.graph.edges.push(entry);
                } else {
                    this.graph.nodes.set(entry.id, entry);
                }
            }
        } catch (e) {
            console.warn(`[KnowledgeProvider] Error parsing domain file ${file}:`, e.message);
        }
    }
  }

  /**
   * Validates graph integrity, resolves references, and builds dependency maps.
   */
  _validateAndResolveGraph() {
    this.graph.dependencyMap = new Map();

    const checkReference = (sourceId, targetId, field) => {
      if (!this.graph.nodes.has(targetId) && !this.ruleRegistry.getRules().find(r => r.id === targetId)) {
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
