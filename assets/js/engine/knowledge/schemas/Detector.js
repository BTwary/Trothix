/**
 * @fileoverview Detector.js
 *
 * Entry point KnowledgeLinter calls to resolve a file to its schema.
 * Wires SchemaMatcher against whatever schemas are currently registered
 * in SchemaRegistry. KnowledgeLinter never touches SchemaMatcher or
 * SchemaRegistry directly — this is the only door in.
 */

import { schemaRegistry } from './SchemaRegistry.js';
import { SchemaMatcher } from './SchemaMatcher.js';

/**
 * Detects which schema owns a given file.
 * @param {string} filename - basename or path of the file being detected
 * @returns {import('./SchemaContract.js').SchemaModule | null}
 */
function detect(filename) {
  const result = SchemaMatcher.match(filename, schemaRegistry.getAll());
  return result ? result.schema : null;
}

export const Detector = { detect };
