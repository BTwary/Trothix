/**
 * @fileoverview RuleCompiler.js
 * Validates the JSON DSL and compiles it into a highly optimized executable predicate tree.
 */

/**
 * Phase 1 (Rule Coverage Restoration) — concept-detection table.
 *
 * Background: `conceptExists` / `conceptMissing` / `documentRequiresConcept`
 * condition types (used by Liability and Indemnification's rules.json) have
 * no backing detection stage anywhere in the live pipeline — RuleContext
 * only resolves IR paths, it does not know what a "concept" is. The proper
 * fix (a real ConceptResolver wired through RuleContext/RuleEvaluator, fed
 * by KnowledgeProvider's concept graph) touches RuleContext.js and
 * RuleEvaluator.js, both frozen. This table is the deliberately narrow
 * workaround that stays entirely inside this unfrozen file.
 *
 * Detection strategy per concept, in order:
 *   1. actionIds  — real grammar path. Matches `actions[*].verb` (already
 *      resolvable via RuleContext.resolveField, unmodified) against the
 *      canonical ACTION_* id the verb normalizes to. This only works if
 *      the lexer tokenizes the underlying verb as ACTION_VERB *and* the
 *      domain's actions.json synonyms list is populated. True today for
 *      Indemnification ("indemnify" / "hold harmless" are already in
 *      lexer.js's ACTION_VERB regex).
 *   2. phrases    — fallback. Direct substring match against
 *      `nodes[*].text` (also unmodified RuleContext capability) using real
 *      legal boilerplate, not the placeholder "sample X phrase" strings
 *      currently sitting in phrases.json. Used for Liability, whose verb
 *      ("liable"/"liability") is not in lexer.js's ACTION_VERB regex and
 *      whose typical phrasing ("shall not be liable for...") doesn't fit
 *      the modal-immediately-followed-by-verb grammar anyway. Fixing that
 *      properly requires editing lexer.js, which is frozen — flagging
 *      here rather than silently working around it in a way that hides
 *      the gap.
 *
 * requiredForDocumentTypes backs `documentRequiresConcept`. Both concepts'
 * concept.json `documents` field is currently an empty array (nothing has
 * been authored about which document types require Liability/
 * Indemnification language), so this stays empty here too rather than
 * inventing a requirement that wasn't authored. That means the two
 * *_MISSING rules will correctly stay silent (documentRequiresConcept
 * always false) until someone deliberately authors that requirement in
 * concept.json AND this table is updated to match — the two are meant to
 * mirror each other; if you touch one, touch the other.
 */
const CONCEPT_DETECTION_TABLE = {
  CONCEPT_INDEMNIFICATION: {
    actionIds: ['ACTION_INDEMNIFICATION'],
    phrases: ['indemnify', 'indemnification', 'hold harmless', 'defend and hold harmless'],
    requiredForDocumentTypes: []
  },
  CONCEPT_LIABILITY: {
    actionIds: ['ACTION_LIABILITY'],
    phrases: [
      'limitation of liability',
      'shall not be liable',
      'in no event shall',
      'liable for any',
      'exclude all liability',
      'limit of liability'
    ],
    requiredForDocumentTypes: []
  }
};

export class RuleCompiler {
  
  /**
   * Compiles an entire Rule Pack into executable rules.
   * @param {Object[]} rules - Array of JSON rules
   * @returns {Object[]} Compiled rules
   */
  compilePack(rules) {
    return rules.map(rule => this.compileRule(rule));
  }

  /**
   * Compiles a single JSON rule.
   * @param {Object} rule 
   */
  compileRule(rule) {
    // Schema Validation could happen here.
    if (!rule.id || !rule.when || !rule.then) {
      throw new Error(`Rule ${rule.id || 'UNKNOWN'} is missing required fields.`);
    }

    const predicate = this._compileCondition(rule.when);

    return {
      id: rule.id,
      category: rule.category || "General",
      severity: rule.severity || "Medium",
      requires: rule.requires || [],
      metadata: rule,
      evaluate: (context) => {
         return predicate(context);
      }
    };
  }

  _compileCondition(condition) {
    // Logical Operators
    if (condition.and) {
      const preds = condition.and.map(c => this._compileCondition(c));
      return (ctx) => preds.every(p => p(ctx));
    }
    if (condition.or) {
      const preds = condition.or.map(c => this._compileCondition(c));
      return (ctx) => preds.some(p => p(ctx));
    }
    if (condition.not) {
      const pred = this._compileCondition(condition.not);
      return (ctx) => !pred(ctx);
    }
    if (condition.all) {
      const preds = condition.all.map(c => this._compileCondition(c));
      return (ctx) => preds.every(p => p(ctx));
    }
    if (condition.any) {
      const preds = condition.any.map(c => this._compileCondition(c));
      return (ctx) => preds.some(p => p(ctx));
    }

    // Concept-based Operators (Phase 1 restoration — see CONCEPT_DETECTION_TABLE above)
    if (condition.type === 'conceptExists') {
      return this._compileConceptCheck(condition.value);
    }
    if (condition.type === 'conceptMissing') {
      const exists = this._compileConceptCheck(condition.value);
      return (ctx) => !exists(ctx);
    }
    if (condition.type === 'documentRequiresConcept') {
      return this._compileDocumentRequiresConcept(condition.value);
    }

    // Field-based Operators
    if (condition.field) {
      const field = condition.field;

      // Existence
      if (condition.exists === true) return (ctx) => ctx.resolveField(field).length > 0;
      if (condition.missing === true) return (ctx) => ctx.resolveField(field).length === 0;
      
      // Values
      if (condition.equals !== undefined) {
         return (ctx) => ctx.resolveField(field).includes(condition.equals);
      }
      if (condition.not_equals !== undefined) {
         return (ctx) => !ctx.resolveField(field).includes(condition.not_equals);
      }
      if (condition.contains !== undefined) {
         return (ctx) => ctx.resolveField(field).some(val => typeof val === 'string' && val.includes(condition.contains));
      }
      if (condition.starts_with !== undefined) {
         return (ctx) => ctx.resolveField(field).some(val => typeof val === 'string' && val.startsWith(condition.starts_with));
      }
      if (condition.ends_with !== undefined) {
         return (ctx) => ctx.resolveField(field).some(val => typeof val === 'string' && val.endsWith(condition.ends_with));
      }
      if (condition.in !== undefined) {
         return (ctx) => ctx.resolveField(field).some(val => condition.in.includes(val));
      }
      if (condition.greater_than !== undefined) {
         return (ctx) => ctx.resolveField(field).some(val => val > condition.greater_than);
      }
      if (condition.less_than !== undefined) {
         return (ctx) => ctx.resolveField(field).some(val => val < condition.less_than);
      }
    }

    // Missing field fallback
    if (condition.missing !== undefined && typeof condition.missing === 'string') {
       return (ctx) => ctx.resolveField(condition.missing).length === 0;
    }

    // Default falback to false if not recognized to prevent false positives
    return () => false;
  }

  /**
   * Compiles a conceptExists/conceptMissing leaf into a predicate.
   * Unknown concept ids honestly resolve to false.
   * Supports dynamic KnowledgeProvider resolution falling back to static table.
   * @param {string} conceptId
   */
  _compileConceptCheck(conceptId) {
    return (ctx) => {
      const kp = ctx.ir ? ctx.ir.knowledgeProvider : null;
      let actionIds = [];
      let phrases = [];
      
      if (kp && kp.hasConcept(conceptId)) {
        actionIds = kp.getActionsForConcept(conceptId);
        phrases = kp.getPhrasesForConcept(conceptId);
      }

      // If we got nothing from the graph, fall back to the static table
      if (actionIds.length === 0 && phrases.length === 0) {
        const entry = CONCEPT_DETECTION_TABLE[conceptId];
        if (entry) {
          actionIds = entry.actionIds || [];
          phrases = entry.phrases || [];
        }
      }

      const verbs = ctx.resolveField('actions[*].verb') || [];
      if (actionIds.some(id => verbs.includes(id))) return true;

      if (phrases.length > 0) {
        const texts = ctx.resolveField('nodes[*].text') || [];
        return texts.some(t =>
          typeof t === 'string' &&
          phrases.some(phrase => t.toLowerCase().includes(phrase.toLowerCase()))
        );
      }

      return false;
    };
  }

  /**
   * Compiles a documentRequiresConcept leaf. Returns false if no requirements.
   * @param {string} conceptId
   */
  _compileDocumentRequiresConcept(conceptId) {
    return (ctx) => {
      const kp = ctx.ir ? ctx.ir.knowledgeProvider : null;
      let requiredDocs = [];

      if (kp && kp.hasConcept(conceptId)) {
        requiredDocs = kp.getRequiredDocumentsForConcept(conceptId);
      } else {
        const entry = CONCEPT_DETECTION_TABLE[conceptId];
        requiredDocs = entry ? entry.requiredForDocumentTypes : [];
      }

      if (!requiredDocs || requiredDocs.length === 0) return false;
      const docTypes = ctx.resolveField('metadata.documentType') || [];
      return docTypes.some(dt => requiredDocs.includes(dt));
    };
  }
}
