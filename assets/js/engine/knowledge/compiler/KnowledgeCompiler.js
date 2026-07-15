/**
 * @fileoverview KnowledgeCompiler
 *
 * Orchestrates the deterministic compiler pipeline.
 *
 * Responsibilities:
 *  - Create CompilerContext
 *  - Load knowledge
 *  - Execute compiler passes
 *  - Return compiler report
 *
 * It intentionally contains NO validation logic.
 */

import { CompilerContext } from "./CompilerContext.js";
import { KnowledgeLoader } from "./KnowledgeLoader.js";

import { ValidatePass } from "./passes/ValidatePass.js";
import { IndexPass } from "./passes/IndexPass.js";
import { DependencyPass } from "./passes/DependencyPass.js";
import { BundlePass } from "./passes/BundlePass.js";

export class KnowledgeCompiler {

    /**
     * @param {Object} options
     */
    constructor(options = {}) {

        this.basePath = options.basePath ?? "";
        this.version = options.version ?? "v1";

        this.loader = new KnowledgeLoader(this.basePath);

        // Default compiler pipeline
        this.passes = [
            new ValidatePass(),
            new IndexPass(),
            new DependencyPass(),
            new BundlePass()
        ];

    }

    /**
     * Execute the compiler.
     *
     * @returns {Object} Compiler Report
     */
        /**
     * Execute the compiler.
     *
     * @returns {Object} Compiler Report and Bundle
     */
    async compile() {

        const context = new CompilerContext({
            basePath: this.basePath,
            version: this.version
        });

        // Load knowledge from disk
        this.loader.load(context);

        // Execute compiler passes
                // Execute compiler passes
        for (const pass of this.passes) {
            await pass.run(context);
        }

        // Finish compiler metadata
        context.finish();

        // Return structured output
        return {
            report: context.getReport(),
            bundle: context.bundle
        };

    } // <-- closes compile()

} // <-- closes KnowledgeCompiler