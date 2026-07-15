/**
 * @fileoverview IndexPass
 *
 * Builds runtime indexes from validated knowledge entries.
 *
 * This pass performs NO validation.
 * It simply organizes knowledge into fast lookup structures.
 */

import { CompilerPass } from "../CompilerPass.js";

export class IndexPass extends CompilerPass {

    async run(context) {

        const indexes = {
            byId: new Map(),
            bySchema: new Map(),
            byCategory: new Map(),
            byStatus: new Map()
        };

        for (const item of context.entries) {

            const entry = item.entry;

            if (!entry || !entry.id) {
                continue;
            }

            // ---------------------------------
            // Index by ID
            // ---------------------------------

            indexes.byId.set(entry.id, entry);

            // ---------------------------------
            // Index by Schema
            // ---------------------------------

            const schemaName = item.schema?.name ?? "unknown";

            if (!indexes.bySchema.has(schemaName)) {
                indexes.bySchema.set(schemaName, []);
            }

            indexes.bySchema.get(schemaName).push(entry);

            // ---------------------------------
            // Index by Category
            // ---------------------------------

            if (entry.category) {

                if (!indexes.byCategory.has(entry.category)) {
                    indexes.byCategory.set(entry.category, []);
                }

                indexes.byCategory.get(entry.category).push(entry);

            }

            // ---------------------------------
            // Index by Status
            // ---------------------------------

            if (entry.status) {

                if (!indexes.byStatus.has(entry.status)) {
                    indexes.byStatus.set(entry.status, []);
                }

                indexes.byStatus.get(entry.status).push(entry);

            }

        }

        // Merge indexes into the compiler context

        context.indexes.byId = indexes.byId;
        context.indexes.bySchema = indexes.bySchema;
        context.indexes.byCategory = indexes.byCategory;
        context.indexes.byStatus = indexes.byStatus;

    }

}