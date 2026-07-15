import { CompilerPass } from "../CompilerPass.js";
import { Detector } from "../../schemas/Detector.js";
import "../../schemas/index.js"; // static registration side effect — same as KnowledgeLinter.js

export class ValidatePass extends CompilerPass {

    async run(context) {

        for (const item of context.entries) {

            const schema = Detector.detect(item.filename);

            if (!schema) {
                context.addIssue({
                    severity: "warning",
                    file: item.file,
                    message: `Unknown schema: ${item.filename}`
                });
                continue;
            }

            // Save detected schema for later compiler passes
            item.schema = schema;

            // --------------------------
            // Schema validation
            // --------------------------

            const issues = schema.validate(item.entry, item.file);

            for (const issue of issues) {
                context.addIssue(issue);
            }

            // --------------------------
            // Register IDs
            // --------------------------

            const ids = schema.idExtractor(item.entry);

            for (const id of ids) {
                context.registerId(id, {
                    file: item.file,
                    filename: item.filename,
                    schema: schema.name,
                    entry: item.entry
                });
            }

            // --------------------------
            // Register References
            // --------------------------

            const refs = schema.getReferences(item.entry);

            for (const ref of refs) {
                context.registerReference(ref.id, {
                    sourceId: item.entry.id,
                    source: item.file,
                    filename: item.filename,
                    schema: schema.name,
                    path: ref.path,
                    targetType: ref.targetType
                });
            }

        }

    }

}