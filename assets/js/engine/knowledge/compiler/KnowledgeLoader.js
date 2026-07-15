/**
 * @fileoverview KnowledgeLoader
 *
 * Discovers and loads all knowledge JSON files for the compiler.
 *
 * Responsibilities:
 *  - Walk knowledge roots (core/, domains/, ...)
 *  - Read JSON
 *  - Produce normalized entries
 *  - Populate CompilerContext
 *
 * Does NOT:
 *  - validate
 *  - compile rules
 *  - build runtime graph
 *  - resolve references
 */

import fs from "fs";
import path from "path";

export class KnowledgeLoader {
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Load every knowledge entry into the compiler context.
   *
   * @param {CompilerContext} context
   */
  load(context) {
    const roots = [
      "core",
      "domains"
    ];

    for (const root of roots) {
      const dir = path.join(this.basePath, root);

      if (!fs.existsSync(dir)) {
        continue;
      }

      this._loadDirectory(dir, root, context);
    }
  }

  /**
   * Recursively load a directory.
   */
  _loadDirectory(dir, source, context) {
    const files = this._walkDirectory(dir);

    for (const file of files) {
      this._loadFile(file, source, context);
    }
  }

  /**
   * Walk recursively.
   */
  _walkDirectory(dir, fileList = []) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {

      const fullPath = path.join(dir, entry);

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {

        if (entry === "tests") {
          continue;
        }

        this._walkDirectory(fullPath, fileList);

      } else if (entry.endsWith(".json")) {

        fileList.push(fullPath);

      }
    }

    return fileList;
  }

  /**
   * Load a single JSON file.
   */
  _loadFile(filePath, source, context) {

    try {

      const raw = fs.readFileSync(filePath, "utf8");

      const data = JSON.parse(raw);

      const relative = path.relative(this.basePath, filePath);

      const segments = relative.split(path.sep);

      const group = segments[1] ?? null;

      const domain =
        source === "domains"
          ? group
          : null;

      const entries = Array.isArray(data)
        ? data
        : [data];

      context.increment("filesScanned");

      for (const entry of entries) {

        context.addEntry({

          entry,

          file: filePath,

          source,

          group,

          domain,

          filename: path.basename(filePath)

        });

      }

    } catch (err) {

      context.addIssue({

        severity: "ERROR",

        file: filePath,

        message: err.message

      });

    }

  }

}