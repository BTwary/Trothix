/**
 * @fileoverview EvidenceResolver.js
 * Inspects the Legal IR to extract dynamic variables (like duration days,
 * governing law, parties) for populating template placeholders.
 */

export class EvidenceResolver {
  /**
   * Resolves evidence variables from the Legal IR.
   * @param {Object} ir The Legal IR document
   * @param {Object} finding The specific finding being narrated
   * @returns {Object} A key-value dictionary of resolved variables
   */
  resolveVariables(ir, finding) {
    const variables = {
      days: "30", // default fallback
      governingLaw: "the specified jurisdiction",
      venue: "the chosen forum",
      parties: "the parties",
      message: finding.message || ""
    };

    if (!ir) return variables;

    // 1. Resolve parties
    if (ir.metadata && ir.metadata.parties && ir.metadata.parties.length > 0) {
      variables.parties = ir.metadata.parties.join(" and ");
    }

    // 2. Resolve governing law
    if (ir.metadata && ir.metadata.governingLaw) {
      variables.governingLaw = ir.metadata.governingLaw;
    } else {
      // Search nodes for governing law
      const govNode = ir.nodes?.find(n => n.type === 'GoverningLaw' || n.category === 'GoverningLaw');
      if (govNode && govNode.text) {
        variables.governingLaw = govNode.text.trim();
      }
    }

    // 3. Resolve venue
    if (ir.metadata && ir.metadata.jurisdiction) {
      variables.venue = ir.metadata.jurisdiction;
    } else {
      const venueNode = ir.nodes?.find(n => n.type === 'Venue' || n.category === 'Venue');
      if (venueNode && venueNode.text) {
        variables.venue = venueNode.text.trim();
      }
    }

    // 4. Resolve payment days / limits from constraints or deadlines
    const actions = ir.nodes?.flatMap(n => n.actions || []) || [];
    const payAction = actions.find(a => a.verb === 'ACTION_PAY' || a.verb?.includes('PAY'));
    
    if (payAction) {
      // Check constraints
      const durationConstraint = payAction.constraints?.find(c => c.type === 'duration');
      if (durationConstraint) {
        variables.days = String(durationConstraint.value);
      } else if (payAction.deadlines && payAction.deadlines.length > 0) {
        variables.days = String(payAction.deadlines[0].value);
      }
    } else {
      // Broad scan for any duration constraint in the IR
      const anyDuration = actions.flatMap(a => a.constraints || []).find(c => c.type === 'duration');
      if (anyDuration) {
        variables.days = String(anyDuration.value);
      }
    }

    return variables;
  }
}
