/**
 * @fileoverview DependencyPass
 *
 * Builds the dependency graph between knowledge objects.
 *
 * Uses:
 *  - context.idRegistry
 *  - context.referenceRegistry
 *
 * Produces:
 *  - context.dependencyGraph
 */

import { CompilerPass } from "../CompilerPass.js";

export class DependencyPass extends CompilerPass {

    async run(context) {

        const graph = new Map();

        // ---------------------------------
        // Create graph nodes
        // ---------------------------------

        for (const [id] of context.idRegistry.entries()) {
            graph.set(id, new Set());
        }

        // ---------------------------------
        // Resolve references
        // ---------------------------------

        for (const [targetId, references] of context.referenceRegistry.entries()) {

            // Missing target
            if (!context.idRegistry.has(targetId)) {

                for (const ref of references) {

                    context.addIssue({
                        severity: "error",
                        file: ref.source,
                        message: `Unresolved reference '${targetId}'`
                    });

                }

                continue;
            }

            // Existing target

            for (const ref of references) {

                const sourceId = ref.sourceId;

                if (!sourceId) {
                    continue;
                }

                if (!graph.has(sourceId)) {
                    graph.set(sourceId, new Set());
                }

                graph.get(sourceId).add(targetId);

            }

        }

        context.dependencyGraph = graph;

    }

}