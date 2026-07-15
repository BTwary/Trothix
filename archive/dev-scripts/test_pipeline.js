import { LegalIRBuilder } from './assets/js/engine/core/ir/legalIRBuilder.js';
import { EngineRegistry } from './assets/js/engine/core/ir/engineRegistry.js';
import { KnowledgeProvider } from './assets/js/engine/knowledge/KnowledgeProvider.js';

// Phase 1 Engines
import partyResolver from './assets/js/engine/plugins/partyResolver.js';
import definitionEngine from './assets/js/engine/plugins/definitionEngine.js';
import clauseClassifier from './assets/js/engine/plugins/clauseClassifier.js';

// Phase 2 Engines
import legalGrammarEngine from './assets/js/engine/plugins/legalGrammarEngine.js';
import actionBuilder from './assets/js/engine/plugins/actionBuilder.js';
import entityEngine from './assets/js/engine/plugins/entityEngine.js';
import constraintEngine from './assets/js/engine/plugins/constraintEngine.js';
import actionNormalizer from './assets/js/engine/plugins/actionNormalizer.js';
import referenceResolver from './assets/js/engine/plugins/referenceResolver.js';
import deadlineNormalizer from './assets/js/engine/plugins/deadlineNormalizer.js';
import findingEngine from './assets/js/engine/plugins/findingEngine.js';

import { DeveloperInspector } from './assets/js/engine/core/inspector.js';

async function testPipeline() {
  console.log("Initializing Pipeline...");

  const knowledgeProvider = new KnowledgeProvider();
  await knowledgeProvider.initialize();

  const irBuilder = new LegalIRBuilder();
  const registry = new EngineRegistry(irBuilder, knowledgeProvider);
  
  // Attach Developer Inspector
  const inspector = new DeveloperInspector(registry);

  // Register Phase 1
  registry.register(partyResolver);
  registry.register(definitionEngine);
  registry.register(clauseClassifier);
  
  // Register Phase 2
  registry.register(legalGrammarEngine);
  registry.register(actionBuilder);
  registry.register(entityEngine);
  registry.register(constraintEngine);
  registry.register(actionNormalizer);
  registry.register(referenceResolver);
  registry.register(deadlineNormalizer);
  
  // Register Phase 3 (Reasoning)
  registry.register(findingEngine);

  // The Complex Challenge Sentence
  const complexText = `
    The Company shall make payment of USD 50,000 within 30 days, provided that the Client has accepted delivery, except where Clause 7 applies.
  `;

  irBuilder.buildFromText(complexText);
  
  const finalIR = await registry.run();

  inspector.printReport();

  // Print final IR node and findings
  console.log("\n====== FINAL IR NODE 2 (The Challenge Node) ======");
  const doc = irBuilder.document;
  console.log(JSON.stringify(doc.nodes[1], null, 2));
  
  console.log("\n====== EMITTED FINDINGS ======");
  const allFindings = [];
  inspector.timeline.forEach(h => {
     if (h.type === 'END' && h.result && h.result.findings) {
        allFindings.push(...h.result.findings);
     }
  });
  console.log(JSON.stringify(allFindings, null, 2));
}

testPipeline().catch(console.error);
