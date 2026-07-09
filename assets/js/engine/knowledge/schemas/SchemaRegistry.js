/**
 * @fileoverview SchemaRegistry.js
 *
 * Static registration point for schema modules. Schemas are registered
 * explicitly (see schemas/index.js) — there is no filesystem scanning,
 * no dynamic import, no reflection. This mirrors the "Do NOT redesign"
 * constraint from the migration design document.
 */

import { assertSchemaShape } from './SchemaContract.js';

class SchemaRegistry {
  constructor() {
    /** @type {import('./SchemaContract.js').SchemaModule[]} */
    this._schemas = [];
    this._byName = new Map();
  }

  /**
   * Registers a single schema module. Validates the schema's shape
   * immediately (fail-fast) and rejects duplicate names.
   * @param {import('./SchemaContract.js').SchemaModule} schema
   */
  register(schema) {
    assertSchemaShape(schema);
    if (this._byName.has(schema.name)) {
      throw new Error(`SchemaRegistry: duplicate schema name "${schema.name}".`);
    }
    this._schemas.push(schema);
    this._byName.set(schema.name, schema);
  }

  /**
   * Registers multiple schema modules in one explicit call.
   * @param {import('./SchemaContract.js').SchemaModule[]} schemas
   */
  registerAll(schemas) {
    for (const schema of schemas) {
      this.register(schema);
    }
  }

  /** @returns {import('./SchemaContract.js').SchemaModule[]} */
  getAll() {
    return this._schemas.slice();
  }

  /**
   * @param {string} name
   * @returns {import('./SchemaContract.js').SchemaModule | undefined}
   */
  getByName(name) {
    return this._byName.get(name);
  }

  /** Clears all registrations. Exposed for test isolation only. */
  clear() {
    this._schemas = [];
    this._byName = new Map();
  }
}

// Singleton instance — static registration, one registry for the process.
export const schemaRegistry = new SchemaRegistry();
export { SchemaRegistry };
