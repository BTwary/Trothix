import { LegalIRBuilder } from './assets/js/engine/core/ir/legalIRBuilder.js';
import { EngineRegistry } from './assets/js/engine/core/ir/engineRegistry.js';
import { KnowledgeProvider } from './assets/js/engine/knowledge/KnowledgeProvider.js';

import partyResolver from './assets/js/engine/plugins/partyResolver.js';
import definitionEngine from './assets/js/engine/plugins/definitionEngine.js';
import clauseClassifier from './assets/js/engine/plugins/clauseClassifier.js';

async function testPhase1() {
  console.log("Initializing Phase 1 Engine...");

  const knowledgeProvider = new KnowledgeProvider();
  await knowledgeProvider.initialize();

  const irBuilder = new LegalIRBuilder();
  const registry = new EngineRegistry(irBuilder, knowledgeProvider);

  // Register engines
  registry.register(partyResolver);
  registry.register(definitionEngine);
  registry.register(clauseClassifier);

  // Listen to events
  registry.on('engine:start', (e) => console.log(`[START] Engine: ${e.engine} (Iter: ${e.iteration})`));
  registry.on('patch:applied', (e) => console.log(`[PATCH] ${e.engine} applied ${e.patches} patches`));
  registry.on('completed', (e) => console.log(`[DONE] Engine run completed in ${e.iterations} iterations`));

  // Dummy Legal Document Text
  const dummyText = `
THIS NON-DISCLOSURE AGREEMENT is made between Acme Corp ("Disclosing Party") and John Doe ("Receiving Party").

"Confidential Information" means all non-public information disclosed by the Disclosing Party.

The Receiving Party shall not disclose the Confidential Information to any third party.

This Agreement shall terminate exactly 2 years from the date of execution.
  `;

  console.log("\nBuilding Initial IR...");
  irBuilder.buildFromText(dummyText);
  
  console.log(`IR initialized with ${irBuilder.document.nodes.length} nodes.\n`);

  console.log("Running Engine Registry...\n");
  const finalIR = await registry.run();

  console.log("\n====== FINAL IR ======");
  console.log(JSON.stringify(finalIR, null, 2));
}

testPhase1().catch(console.error);
