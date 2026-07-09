# Trothix Knowledge Pipeline Architecture

This document maps the implementation details of the current Trothix knowledge build pipeline, resolving how declarative knowledge is loaded, validated, compiled, and resolved in memory.

---

## 1. Directory Scanning & Manifest Loading

*   `[Repository Evidence]` The pipeline begins with the execution of the offline build manager `knowledge/build/build.js` or the runtime instantiation of `KnowledgeProvider.js`.
*   `[Repository Evidence]` Manifest loading is performed by reading `manifest.json` inside the specified knowledge version directory (e.g., `assets/js/engine/knowledge/v1/manifest.json`).
*   `[Repository Evidence]` The compiler target resolver selects either all directories under `knowledge/source/domains` (via `fs.readdirSync`) or a single targeted domain specified by command-line argument `process.argv[2]`.
*   `[Repository Evidence]` The `KnowledgeProvider` retrieves the manifest to construct the `domains` list and standardizes the base path lookup dynamically using the project root (`process.cwd()`).

---

## 2. WalkSync & File Loading

*   `[Repository Evidence]` In `KnowledgeProvider.js`, the directory traversal is handled by `walkSync()`, which recursively scans domain folders.
*   `[Repository Evidence]` `walkSync` filters directories named `tests` and skips any file that does not end with the `.json` extension.
*   `[Repository Evidence]` Files are parsed using standard synchronous read operations (`fs.readFileSync(file, 'utf8')`) followed by `JSON.parse(raw)`.
*   `[Repository Evidence]` JSON content is flattened: if parsed data is an array, it is processed iteratively; if a single object, it is wrapped in a single-element array.

---

## 3. In-Memory Graph Construction

*   `[Repository Evidence]` `KnowledgeProvider.js` maintains an in-memory representation of the ontology graph using two main structures:
    *   `this.graph.nodes`: A `Map` associating term/concept IDs to their structural definitions.
    *   `this.graph.edges`: An array containing relation dictionaries.
*   `[Repository Evidence]` Element insertion is routed by ID prefix:
    *   If an entry ID starts with `RULE_`, it is compiled and registered in `RuleRegistry.js`.
    *   If an entry ID starts with `REL_`, it is pushed to the `edges` array.
    *   All other entry IDs (e.g. `CONCEPT_`, `ACTION_`, `ENTITY_`) are stored as nodes in the `nodes` Map.

---

## 4. Compilation & Linking Flows

*   `[Repository Evidence]` The compiled bundle build script `knowledge/build/build.js` routes each domain through sequential steps:
    1.  **Validator** (`runValidator` in `validator.js`): Verifies structure.
    2.  **Linter** (`runLinter` in `linter.js`): Performs static analysis checks.
    3.  **Normalizer** (`runNormalizer` in `normalizer.js`): Normalizes raw templates.
    4.  **Compiler** (`runCompiler` in `compiler.js`): Emits optimized predicate objects.
    5.  **Optimizer** (`runOptimizer` in `optimizer.js`): Compacts bundle parameters.
    6.  **Linker** (`runLinker` in `linker.js`): Resolves dependency parameters between domains.
*   `[Repository Evidence]` The build system outputs three main artifacts into `knowledge/compiled/`:
    *   `knowledge.bundle.json`: Containing compiled and optimized domain graphs.
    *   `manifest.json`: Emitting compiling timestamps and domain totals.
    *   `fingerprints.json`: Capturing SHA-256 hash checks of source folders.
*   `[Repository Evidence]` In the current version, `linker.js` writes a static dependency list mapping the `Termination` domain to the `Notice` domain.

---

## 5. Cross-Reference Validation

*   `[Repository Evidence]` In `KnowledgeProvider.js`, graph integrity verification is executed by `_validateAndResolveGraph()`.
*   `[Repository Evidence]` The resolver loops over all graph nodes, checking lists for `actions`, `phrases`, `entities`, `documents`, `related`, `rules`, `expectedRules`, `expectedConcepts`, `minimumSections`, and `recommendedSections`.
*   `[Repository Evidence]` If a target ID is not defined in `this.graph.nodes` and not found in the `RuleRegistry` list, the engine immediately throws: `[KnowledgeProvider] Broken Reference: Node 'source' references non-existent node/rule 'target'`.
*   `[Repository Evidence]` A dependency map (`this.graph.dependencyMap`) is built using a `Map` of `Sets` to track relationships.

---

## 6. Action Resolution

*   `[Repository Evidence]` Lexical synonym routing is performed by `resolveActionSynonym(term)` in `KnowledgeProvider.js`.
*   `[Repository Evidence]` The resolver searches nodes starting with `ACTION_` to find matches in their `synonyms` arrays (case-insensitive and trimmed). If no synonym matches, it checks if `node.name` matches.

---

## 7. Quality & Verification Checks

*   `[Repository Evidence]` Runtime tests (e.g., `tests/integration/real_clause.test.js`) compile a mocked instance of `KnowledgeProvider` and assert that inputs trace successfully to findings like `RULE_NON_DISCLOSURE`.
*   `[Knowledge Recommendation]` Implement the validation metrics described in the roadmap as post-build compilation hooks to block compilation of invalid graphs.
*   `[Future Tooling]` Create a static dependency checker checking that domains only access concepts declared in their `metadata.json` dependencies.
*   `[Architecture Change Request]` None. The pipeline architecture functions entirely offline, generating compiled JSONs compatible with the frozen engine.
