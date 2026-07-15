/**
 * @fileoverview RuleRegistry.js
 * Loads all JSON rule packs according to the Knowledge Base manifest.
 * Supports versioning and dependency validation.
 */

import fs from 'fs/promises';
import path from 'path';
import { RuleCompiler } from './RuleCompiler.js';

export class RuleRegistry {
  /**
   * @param {string} knowledgeBasePath 
   */
  constructor(knowledgeBasePath) {
    this.knowledgeBasePath = knowledgeBasePath;
    this.compiler = new RuleCompiler();
    this.compiledRules = [];
  }

  /**
   * Compiles a rule object and adds it to the registry.
   */
  compileRule(ruleJson) {
    if (ruleJson.status === 'deprecated') return null;
    
    try {
      const compiled = this.compiler.compileRule(ruleJson);
      this.compiledRules.push(compiled);
      return compiled;
    } catch (e) {
      console.warn(`[RuleRegistry] Failed to compile rule ${ruleJson.id}:`, e.message);
      return null;
    }
  }

  getRules() {
    return this.compiledRules;
  }

  /**
   * Checks whether a rule with the given id has already been compiled
   * and registered. Used by KnowledgeProvider for duplicate-id detection
   * before compiling a new rule.
   * @param {string} id
   * @returns {boolean}
   */
  hasRule(id) {
    return this.compiledRules.some(rule => rule.id === id);
  }
}