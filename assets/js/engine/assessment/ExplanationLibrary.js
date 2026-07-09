/**
 * @fileoverview ExplanationLibrary.js
 * Manages access to explanation templates. Encapsulates template retrieval
 * and customization for future personas without exposing template storage.
 */

import { templates } from './ExplanationTemplates.js';

export class ExplanationLibrary {
  constructor() {
    this.templates = { ...templates };
  }

  /**
   * Retrieves the explanation template associated with a rule ID or finding type.
   * Falls back to the default template if no match is found.
   * @param {string} ruleId
   * @param {string} findingType
   * @returns {Object} Template object containing title, summary, impact, and recommendation.
   */
  getTemplate(ruleId, findingType) {
    if (ruleId && this.templates[ruleId]) {
      return this.templates[ruleId];
    }
    if (findingType && this.templates[findingType]) {
      return this.templates[findingType];
    }
    return this.templates['default'];
  }

  /**
   * Registers a new or override template.
   * @param {string} key
   * @param {Object} template
   */
  registerTemplate(key, template) {
    this.templates[key] = template;
  }
}
