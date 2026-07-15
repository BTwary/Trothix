/**
 * @fileoverview BundlePass
 *
 * Produces the final in-memory knowledge bundle.
 *
 * This pass performs NO validation and NO filesystem writes.
 * It simply assembles the compiler output into a deterministic bundle.
 */

import { CompilerPass } from "../CompilerPass.js";

export class BundlePass extends CompilerPass {

    async run(context) {

        const bundle = {

            metadata: {
                ...context.metadata
            },

            statistics: {
                ...context.statistics
            },

            nodes: {},

            indexes: {},

            dependencyGraph: {},

            issues: [
                ...context.issues
            ]

        };

        // ---------------------------------
        // Nodes
        // ---------------------------------

        for (const [id, node] of context.indexes.byId.entries()) {
            bundle.nodes[id] = node;
        }

        // ---------------------------------
        // Indexes
        // ---------------------------------

        for (const [name, index] of Object.entries(context.indexes)) {

            if (!(index instanceof Map)) {
                continue;
            }

            bundle.indexes[name] = {};

            for (const [key, value] of index.entries()) {

                if (Array.isArray(value)) {

                    bundle.indexes[name][key] =
                        value.map(v => v.id ?? v);

                } else if (value instanceof Set) {

                    bundle.indexes[name][key] =
                        [...value];

                } else if (value && typeof value === "object") {

                    bundle.indexes[name][key] =
                        value.id ?? value;

                } else {

                    bundle.indexes[name][key] =
                        value;

                }

            }

        }

        // ---------------------------------
        // Dependency Graph
        // ---------------------------------

        for (const [id, deps] of context.dependencyGraph.entries()) {

            bundle.dependencyGraph[id] = [...deps];

        }

        // ---------------------------------
        // Store bundle
        // ---------------------------------

        context.bundle = bundle;

    }

}