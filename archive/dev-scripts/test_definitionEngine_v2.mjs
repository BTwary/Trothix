// Integration test for definitionEngine.js v2, run through the REAL
// LegalIRBuilder (Tokenizer.tokenize + applyPatchSet), not a mock -
// so this exercises the actual patch-application path definitionEngine's
// output will go through in production via Trothix.js/EngineRegistry.

import { LegalIRBuilder } from './assets/js/engine/core/ir/legalIRBuilder.js';
import definitionEngine from './assets/js/engine/plugins/definitionEngine.js';

const sample = `THIS AGREEMENT is entered into by the parties.

"Confidential Information" means any non-public information disclosed by either party, for purposes of this Agreement.

The term "Effective Date" shall mean the date of last signature.

"Affiliate" and "Subsidiary" mean any entity that controls, is controlled by, or is under common control with a party.

"Person" includes any individual, corporation, or other entity.

The receiving party shall protect all Confidential Information and shall not disclose the Effective Date to any Affiliate.

AMENDMENT: For purposes of this amendment only, "Confidential Information" means any information marked as confidential in writing.

"Unused Term" refers to something that is never mentioned again in this document.
`;

function runCase(label, assertFn) {
  try {
    assertFn();
    console.log(`✅ ${label}`);
  } catch (e) {
    console.log(`❌ ${label}`);
    console.log('   ' + e.message);
  }
}

const builder = new LegalIRBuilder();
builder.buildFromText(sample);

const context = { ir: builder.document, knowledgeProvider: null, config: {}, statistics: {}, logger: console, cache: { get: () => null, set: () => {} } };

const result = await definitionEngine.execute(context);

console.log(`\n${result.patches.length} patches, ${result.findings.length} findings\n`);

const patchSet = { engine: 'definitionEngine', version: '2.0.0', timestamp: Date.now(), patches: result.patches };
const applied = builder.applyPatchSet(patchSet);

runCase('patch set applies cleanly', () => { if (!applied) throw new Error('applyPatchSet returned false'); });

const defs = builder.document.metadata.definitions || {};
const defKeys = Object.keys(defs);
console.log('Definitions found:', defKeys);

runCase('finds "Confidential Information"', () => {
  if (!defs['DEF_CONFIDENTIALINFORMATION']) throw new Error('missing DEF_CONFIDENTIALINFORMATION');
  if (defs['DEF_CONFIDENTIALINFORMATION'].scope?.scopeTarget !== 'this Agreement') {
    throw new Error('scope not captured: ' + JSON.stringify(defs['DEF_CONFIDENTIALINFORMATION'].scope));
  }
});

runCase('redefinition tracked, not dropped (v1 bug)', () => {
  if (!defs['DEF_CONFIDENTIALINFORMATION_2']) throw new Error('redefinition was dropped - v1 regression!');
});

runCase('"the term X shall mean" prefix handled', () => {
  if (!defs['DEF_EFFECTIVEDATE']) throw new Error('missing DEF_EFFECTIVEDATE');
});

runCase('multi-term definition split correctly', () => {
  if (!defs['DEF_AFFILIATE']) throw new Error('missing DEF_AFFILIATE');
  if (!defs['DEF_SUBSIDIARY']) throw new Error('missing DEF_SUBSIDIARY');
  if (defs['DEF_AFFILIATE'].body !== defs['DEF_SUBSIDIARY'].body) throw new Error('multi-term entries should share the same body');
});

runCase('"includes" verb captured', () => {
  if (!defs['DEF_PERSON']) throw new Error('missing DEF_PERSON');
});

const links = builder.document.edges.filter(e => e.relation === 'references');
console.log('\nUsage links:', links.length);
runCase('usage of "Confidential Information" is linked', () => {
  const hit = links.some(e => e.to === defs['DEF_CONFIDENTIALINFORMATION'].sourceNode);
  if (!hit) throw new Error('no reference edge found back to the Confidential Information definition node');
});

const dupFinding = result.findings.find(f => f.ruleId === 'DUPLICATE_DEFINITION');
runCase('DUPLICATE_DEFINITION finding emitted for redefined term', () => {
  if (!dupFinding) throw new Error('no duplicate-definition finding emitted');
});

const unusedFinding = result.findings.find(f => f.ruleId === 'DEFINITION_WITHOUT_USE' && f.reason.includes('Unused Term'));
runCase('DEFINITION_WITHOUT_USE finding emitted for "Unused Term"', () => {
  if (!unusedFinding) throw new Error('no unused-definition finding emitted for Unused Term');
});

console.log('\nAll findings:');
result.findings.forEach(f => console.log(` - [${f.severity}] ${f.ruleId}: ${f.reason}`));
