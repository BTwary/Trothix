import { lookupField, extractFieldPaths } from './RuleFieldRegistry.js';

export class RuleSchemaValidator {
  /**
   * Validates syntax, registry references, and determinism.
   * @param {Object} rule - The rule object to check
   * @returns {{errors: string[], warnings: string[]}}
   */
  static validateRule(rule) {
    const errors = [];
    const warnings = [];

    if (!rule || typeof rule !== 'object') {
      errors.push("Rule is not an object");
      return { errors, warnings };
    }

    const id = rule.id || "UNKNOWN";

    // 1. Determinism Check
    const serialized = JSON.stringify(rule);
    if (serialized.includes('Math.random') || serialized.includes('Date.now') || serialized.includes('new Date')) {
      errors.push(`Rule "${id}" violates determinism guidelines by referencing volatile methods.`);
    }

    // 2. Field Registry Reference Validation
    if (rule.when) {
      const fields = extractFieldPaths(rule.when);
      for (const field of fields) {
        const meta = lookupField(field);
        if (meta.status === 'unverified') {
          warnings.push(`Rule "${id}" references unverified field: "${field}"`);
        } else if (meta.status === 'inert') {
          errors.push(`Rule "${id}" references inert/dead field: "${field}" (${meta.reason})`);
        }
      }
    }

    return { errors, warnings };
  }
}
