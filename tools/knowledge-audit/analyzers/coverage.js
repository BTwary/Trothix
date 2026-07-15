// Consumes a KnowledgeGraph (see knowledge-graph.js).
export function run(graph) {
  const nodes = graph.getAllNodes();
  
  const concepts = nodes.filter(n => n.type === 'concept');
  const coverageDetails = [];
  let passedConcepts = 0;
  
  // Maps for faster traversal lookup
  const phrasesByConcept = {};
  const templatesByReferencedNode = {};
  const dtsByInputTemplate = {};
  const rulesByDt = {};
  
  // Group phrases by concept
  for (const n of nodes) {
    if (n.type === 'phrase' || n.id.startsWith('PHRASE_')) {
      const conceptId = n.metadata.raw.concept;
      if (conceptId) {
        phrasesByConcept[conceptId] = phrasesByConcept[conceptId] || [];
        phrasesByConcept[conceptId].push(n);
      }
    }
  }
  
  // Group template families by their referenced nodes
  for (const n of nodes) {
    if (n.type === 'template') {
      for (const ref of n.references) {
        templatesByReferencedNode[ref.id] = templatesByReferencedNode[ref.id] || [];
        if (!templatesByReferencedNode[ref.id].includes(n.id)) {
          templatesByReferencedNode[ref.id].push(n.id);
        }
      }
    }
  }
  
  // Build DT inputs and outputs maps
  for (const n of nodes) {
    if (n.type === 'decision_table') {
      const inputs = n.metadata.raw.inputs || [];
      for (const input of inputs) {
        dtsByInputTemplate[input] = dtsByInputTemplate[input] || [];
        if (!dtsByInputTemplate[input].includes(n.id)) {
          dtsByInputTemplate[input].push(n.id);
        }
      }
      
      const outputs = n.metadata.raw.outputs || [];
      for (const out of outputs) {
        if (out.finding) {
          rulesByDt[n.id] = rulesByDt[n.id] || [];
          if (!rulesByDt[n.id].includes(out.finding)) {
            rulesByDt[n.id].push(out.finding);
          }
        }
      }
    }
  }
  
  // Trace reachability for each Concept
  for (const concept of concepts) {
    const conceptId = concept.id;
    const phrases = phrasesByConcept[conceptId] || [];
    const tracePaths = [];
    
    // Find all directly linked template families
    // A template family is linked if it references the concept ID directly, 
    // or references any entity/action defined by this concept.
    const linkedTemplates = new Set(templatesByReferencedNode[conceptId] || []);
    
    const definedEntities = (concept.metadata.raw.entities || []);
    const definedActions = (concept.metadata.raw.actions || []);
    
    for (const ent of definedEntities) {
      if (templatesByReferencedNode[ent]) {
        templatesByReferencedNode[ent].forEach(t => linkedTemplates.add(t));
      }
    }
    for (const act of definedActions) {
      if (templatesByReferencedNode[act]) {
        templatesByReferencedNode[act].forEach(t => linkedTemplates.add(t));
      }
    }
    
    // Traverse Template -> DT -> Rule -> Finding -> Recommendation -> Section
    for (const templateId of linkedTemplates) {
      const dts = dtsByInputTemplate[templateId] || [];
      for (const dtId of dts) {
        const ruleIds = rulesByDt[dtId] || [];
        for (const ruleId of ruleIds) {
          const ruleNode = graph.getNode(ruleId);
          if (!ruleNode) continue;
          
          const rawThen = ruleNode.metadata.raw.then || {};
          const finding = rawThen.trigger || rawThen.findingType || ruleNode.id;
          const recommendation = rawThen.recommendation || ruleNode.metadata.raw.recommendation || 'No recommendation specified';
          const section = ruleNode.metadata.raw.category || 'General';
          const ruleActive = ruleNode.metadata.status && !['draft', 'experimental', 'deprecated'].includes(ruleNode.metadata.status.toLowerCase());
          
          tracePaths.push({
            template: templateId,
            decisionTable: dtId,
            rule: ruleId,
            finding,
            recommendation,
            section,
            active: ruleActive,
            path: `${conceptId} ──▶ Template: ${templateId} ──▶ DT: ${dtId} ──▶ Rule: ${ruleId} ──▶ Finding: ${finding} ──▶ Rec: "${recommendation.substring(0, 40)}..." ──▶ Section: ${section}`
          });
        }
      }
    }
    
    // Standalone rules check (Rules that directly depend on this concept without DT)
    const incomingEdges = graph.findRules(conceptId);
    for (const ruleNode of incomingEdges) {
      // If this rule wasn't already covered in a DT trace
      if (!tracePaths.some(p => p.rule === ruleNode.id)) {
        const rawThen = ruleNode.metadata.raw.then || {};
        const finding = rawThen.trigger || rawThen.findingType || ruleNode.id;
        const recommendation = rawThen.recommendation || ruleNode.metadata.raw.recommendation || 'No recommendation specified';
        const section = ruleNode.metadata.raw.category || 'General';
        const ruleActive = ruleNode.metadata.status && !['draft', 'experimental', 'deprecated'].includes(ruleNode.metadata.status.toLowerCase());
        
        tracePaths.push({
          template: 'None (Standalone)',
          decisionTable: 'None (Standalone)',
          rule: ruleNode.id,
          finding,
          recommendation,
          section,
          active: ruleActive,
          path: `${conceptId} ──▶ Rule: ${ruleNode.id} ──▶ Finding: ${finding} ──▶ Rec: "${recommendation.substring(0, 40)}..." ──▶ Section: ${section}`
        });
      }
    }
    
    const isReachable = tracePaths.some(p => p.active);
    if (isReachable) passedConcepts++;
    
    coverageDetails.push({
      conceptId,
      label: concept.metadata.label,
      domain: concept.domain,
      status: isReachable ? 'PASS' : (tracePaths.length > 0 ? 'PARTIAL' : 'INACTIVE'),
      phrases: phrases.map(p => p.metadata.raw.text),
      paths: tracePaths
    });
  }
  
  const score = concepts.length > 0 ? Math.round((passedConcepts / concepts.length) * 100) : 0;
  
  return {
    score,
    totalConcepts: concepts.length,
    passedConcepts,
    details: coverageDetails
  };
}
