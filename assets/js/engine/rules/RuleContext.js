/**
 * @fileoverview RuleContext.js
 * Provides a uniform API for the Rule Evaluator to access actions, constraints, entities, and definitions from the Legal IR.
 */

export class RuleContext {
  /**
   * @param {Object} ir - The Legal IR Document
   */
  constructor(ir) {
    this.ir = ir;
    this.cache = new Map();
    this.scope = null; // Add dynamic scope property for local evaluation
  }

  /**
   * Retrieves all actions across the IR.
   * @returns {Object[]}
   */
  getAllActions() {
    if (this.cache.has('all_actions')) return this.cache.get('all_actions');
    const actions = [];
    this.ir.nodes.forEach(node => {
      if (node.actions) actions.push(...node.actions);
    });
    this.cache.set('all_actions', actions);
    return actions;
  }

  /**
   * Evaluates a JSONPath-like field expression (e.g., "actions[*].verb") against the IR.
   * For Phase 3, we implement a lightweight path resolver.
   * @param {string} field - The path to evaluate
   * @param {Object} scope - Optional localized scope (e.g., a specific clause or action)
   * @returns {any[]} Array of resolved values
   */
  resolveField(field, scope = null) {
    const activeScope = scope || this.scope;
    const data = activeScope || this.ir;

    if (field.startsWith('category')) {
       // Mock category access
       return [this.ir.metadata?.category || "Unknown"];
    }

    // Direct object traversal fallback
    const parts = field.split('.');
    
    let current = [data];
    if (parts[0] === 'actions[*]') {
       current = activeScope ? (activeScope.actions || []) : this.getAllActions();
       parts.shift(); // Remove the first part
    } else if (parts[0] === 'nodes[*]') {
       current = data.nodes || [];
       parts.shift();
    }
    
    for (const part of parts) {
      const next = [];
      for (const obj of current) {
        if (obj && typeof obj === 'object') {
          if (part.includes('[*]')) {
             const key = part.replace('[*]', '');
             if (Array.isArray(obj[key])) {
                next.push(...obj[key]);
             }
          } else if (obj[part] !== undefined) {
             next.push(obj[part]);
          }
        }
      }
      current = next;
    }
    
    return current;
  }
}
