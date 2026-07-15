/**
 * @fileoverview CompilerContext
 *
 * Shared mutable state for the Knowledge Compiler pipeline.
 *
 * Every compiler pass receives the same CompilerContext instance.
 * Passes communicate only through this object.
 *
 * CompilerContext contains no filesystem logic, validation logic,
 * or compilation logic. It is purely the shared state container.
 * KnowledgeLoader
        │
        ▼
CompilerContext
        │
        ├──────── ValidatePass
        │
        ├──────── DependencyPass
        │
        ├──────── NormalizePass
        │
        ├──────── StatisticsPass
        │
        └──────── EmitBundlePass
 */

export class CompilerContext {
  constructor(options = {}) {
    this.version = options.version ?? "v1";
    this.basePath = options.basePath ?? "";

    // -----------------------------
    // Raw knowledge loaded from disk
    // -----------------------------
    this.entries = [];

    // -----------------------------
    // Registries
    // -----------------------------
    this.idRegistry = new Map();
    this.referenceRegistry = new Map();

    // -----------------------------
    // Validation
    // -----------------------------
    this.issues = [];

    // -----------------------------
    // Statistics
    // -----------------------------
    this.statistics = {
      filesScanned: 0,
      entriesLoaded: 0,
      executableRules: 0,
      concepts: 0,
      entities: 0,
      actions: 0,
      relations: 0,
      documents: 0
    };

    // -----------------------------
    // Metadata
    // -----------------------------
    this.metadata = {
      compilerVersion: "0.1.0",
      knowledgeVersion: this.version,
      startedAt: new Date().toISOString(),
      finishedAt: null
    };

    // -----------------------------
    // Future compiler products
    // -----------------------------
    this.bundle = null;

    this.indexes = {};

    this.dependencyGraph = new Map();
  }

  /**
   * Add a loaded knowledge entry.
   */
  addEntry(entry) {
    this.entries.push(entry);
    this.statistics.entriesLoaded++;
  }

  /**
   * Register an ID.
   */
  registerId(id, metadata) {

    if (!this.idRegistry.has(id)) {

        this.idRegistry.set(id, []);

    }

    this.idRegistry.get(id).push(metadata);

}

  /**
   * Register a reference.
   */
  registerReference(id, reference) {
    if (!this.referenceRegistry.has(id)) {
      this.referenceRegistry.set(id, []);
    }

    this.referenceRegistry.get(id).push(reference);
  }

  /**
   * Record an issue.
   */
  addIssue(issue) {
    this.issues.push(issue);
  }

  /**
   * Increment a statistic.
   */
  increment(statName, amount = 1) {
    if (!(statName in this.statistics)) {
      this.statistics[statName] = 0;
    }

    this.statistics[statName] += amount;
  }

  /**
   * Mark compilation complete.
   */
  finish() {
    this.metadata.finishedAt = new Date().toISOString();
  }

  /**
   * Produce the compiler report.
   */
  getReport() {
    return {
      metadata: this.metadata,
      statistics: this.statistics,
      issues: this.issues,
      idRegistrySize: this.idRegistry.size,
      referenceRegistrySize: this.referenceRegistry.size
    };
  }
}
