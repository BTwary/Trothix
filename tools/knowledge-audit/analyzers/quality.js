// Consumes a KnowledgeGraph (see knowledge-graph.js).
export function run(graph, context = {}) {
  const nodes = graph.getAllNodes();
  
  const concepts = nodes.filter(n => n.type === 'concept');
  const rules = nodes.filter(n => n.type === 'rule');
  const templates = nodes.filter(n => n.type === 'template');
  const sources = nodes.filter(n => n.type === 'source');
  
  const numConcepts = concepts.length;
  
  if (numConcepts === 0) {
    return {
      phrasesPerConcept: 0,
      rulesPerConcept: 0,
      examplesPerConcept: 0,
      sourcesPerConcept: 0,
      jurisdictionsPerConcept: 0,
      conceptsWithoutExamples: [],
      rulesWithoutSources: [],
      templatesWithoutRules: [],
      sourcesWithoutConcepts: [],
      score: { coverage: 0, connectivity: 0, evidence: 0, consistency: 0, completeness: 0, overall: 0 }
    };
  }
  
  // Maps for counts
  const phrasesByConcept = {};
  const rulesByConcept = {};
  const examplesByConcept = {};
  const sourcesByConcept = {};
  const jurisdictionsByConcept = {};
  
  for (const c of concepts) {
    phrasesByConcept[c.id] = 0;
    rulesByConcept[c.id] = 0;
    examplesByConcept[c.id] = 0;
    sourcesByConcept[c.id] = 0;
    jurisdictionsByConcept[c.id] = new Set();
  }
  
  // Count phrases, examples, sources, jurisdictions
  for (const n of nodes) {
    const conceptId = n.metadata.raw.concept;
    if (conceptId && phrasesByConcept[conceptId] !== undefined) {
      if (n.type === 'phrase' || n.id.startsWith('PHRASE_')) {
        phrasesByConcept[conceptId]++;
      }
      if (n.type === 'example') {
        examplesByConcept[conceptId]++;
      }
      if (n.type === 'source') {
        sourcesByConcept[conceptId]++;
      }
      if (n.metadata.raw.jurisdiction) {
        jurisdictionsByConcept[conceptId].add(n.metadata.raw.jurisdiction);
      }
    }
    
    // Check JNOTE (jurisdiction note) nodes
    if (n.id.startsWith('JNOTE_') && conceptId && jurisdictionsByConcept[conceptId]) {
      if (n.metadata.raw.jurisdiction) {
        jurisdictionsByConcept[conceptId].add(n.metadata.raw.jurisdiction);
      }
    }
  }
  
  // Count rules per concept
  for (const r of rules) {
    const conceptId = r.metadata.raw.concept;
    if (conceptId && rulesByConcept[conceptId] !== undefined) {
      rulesByConcept[conceptId]++;
      if (r.metadata.raw.jurisdiction) {
        jurisdictionsByConcept[conceptId].add(r.metadata.raw.jurisdiction);
      }
    }
  }
  
  // Sums for averages
  let phraseSum = 0;
  let ruleSum = 0;
  let exampleSum = 0;
  let sourceSum = 0;
  let jurSum = 0;
  
  const conceptsWithoutExamples = [];
  const rulesWithoutSources = [];
  
  for (const c of concepts) {
    phraseSum += phrasesByConcept[c.id];
    ruleSum += rulesByConcept[c.id];
    exampleSum += examplesByConcept[c.id];
    sourceSum += sourcesByConcept[c.id];
    jurSum += jurisdictionsByConcept[c.id].size;
    
    if (examplesByConcept[c.id] === 0) {
      conceptsWithoutExamples.push(c.id);
    }
    if (sourcesByConcept[c.id] === 0) {
      // Find rules belonging to this concept
      const linkedRules = graph.findRules(c.id);
      linkedRules.forEach(r => rulesWithoutSources.push(r.id));
    }
  }
  
  // Templates without rules
  const templatesWithoutRules = [];
  for (const t of templates) {
    const dependents = graph.findDependents(t.id);
    // Checking if template is linked to a Decision Table
    const linkedToDt = dependents.some(d => d.node.type === 'decision_table');
    if (!linkedToDt) {
      templatesWithoutRules.push(t.id);
    }
  }
  
  // Sources without concepts (dangling sources)
  const sourcesWithoutConcepts = [];
  for (const s of sources) {
    const conceptId = s.metadata.raw.concept;
    if (!conceptId || !graph.hasNode(conceptId)) {
      sourcesWithoutConcepts.push(s.id);
    }
  }
  
  // ---------------------------------------------------------------------
  // Knowledge Score Calculation
  // ---------------------------------------------------------------------
  const coverageScore = context.coverageScore || 0;
  
  // Connectivity: % of nodes that are not orphans
  const orphansCount = context.orphansCount || 0;
  const connectivityScore = nodes.length > 0 ? Math.round(((nodes.length - orphansCount) / nodes.length) * 100) : 0;
  
  // Evidence: % of concepts that have at least 1 Example AND at least 1 Source
  let conceptsWithFullEvidence = 0;
  for (const c of concepts) {
    if (examplesByConcept[c.id] > 0 && sourcesByConcept[c.id] > 0) {
      conceptsWithFullEvidence++;
    }
  }
  const evidenceScore = numConcepts > 0 ? Math.round((conceptsWithFullEvidence / numConcepts) * 100) : 0;
  
  // Consistency: % of rules without linter/schema warnings
  const parserErrors = context.parserErrors || [];
  const ruleErrors = new Set(parserErrors.filter(e => e.id && e.id.startsWith('RULE_')).map(e => e.id));
  const consistencyScore = rules.length > 0 ? Math.round(((rules.length - ruleErrors.size) / rules.length) * 100) : 0;
  
  // Completeness: % of nodes that have descriptions/summaries
  let nodesWithDescription = 0;
  for (const n of nodes) {
    if (n.metadata.summary && n.metadata.summary.trim().length > 0) {
      nodesWithDescription++;
    }
  }
  const completenessScore = nodes.length > 0 ? Math.round((nodesWithDescription / nodes.length) * 100) : 0;
  
  // Overall Weighted Score
  const overallScore = Math.round(
    coverageScore * 0.35 +
    connectivityScore * 0.15 +
    evidenceScore * 0.20 +
    consistencyScore * 0.15 +
    completenessScore * 0.15
  );
  
  return {
    phrasesPerConcept: phraseSum / numConcepts,
    rulesPerConcept: ruleSum / numConcepts,
    examplesPerConcept: exampleSum / numConcepts,
    sourcesPerConcept: sourceSum / numConcepts,
    jurisdictionsPerConcept: jurSum / numConcepts,
    conceptsWithoutExamples,
    rulesWithoutSources,
    templatesWithoutRules,
    sourcesWithoutConcepts,
    score: {
      coverage: coverageScore,
      connectivity: connectivityScore,
      evidence: evidenceScore,
      consistency: consistencyScore,
      completeness: completenessScore,
      overall: overallScore
    }
  };
}
