import { LegalIRBuilder } from './assets/js/engine/core/ir/legalIRBuilder.js';
import definitionEngine from './assets/js/engine/plugins/definitionEngine.js';

// Each case: text that should NOT produce a definition, and why.
const negativeCases = [
  {
    text: 'The judge said reasonable efforts means using all commercially available options in the circumstances presented today.',
    why: 'ordinary quoted-in-speech "means" mid-paragraph, unquoted, not at clause start',
  },
  {
    text: 'The total price includes VAT and all applicable duties owed to the relevant authority.',
    why: '"includes" used in its ordinary sense, not preceded by a defined-term marker',
  },
  {
    text: '"Person" as defined in Section 1.1 of the Code shall have the rights described herein.',
    why: '"as defined in" is not in the verb list on purpose (statutory cross-reference, not a definition)',
  },
];

const builder = new LegalIRBuilder();
builder.buildFromText(negativeCases.map(c => c.text).join('\n\n'));

const context = { ir: builder.document, knowledgeProvider: null, config: {}, statistics: {}, logger: console, cache: { get: () => null, set: () => {} } };
const result = await definitionEngine.execute(context);

const defAnnotations = result.patches.filter(p => p.op === 'Annotate' && p.path.startsWith('/metadata/definitions/'));

console.log(`${defAnnotations.length} false-positive definitions found (want 0)\n`);
if (defAnnotations.length === 0) {
  console.log('✅ no false positives across all 3 adversarial cases');
} else {
  console.log('❌ false positives detected:');
  defAnnotations.forEach(p => console.log('  -', JSON.stringify(p.value)));
}

negativeCases.forEach(c => console.log(`  case: "${c.text.slice(0, 50)}..." (${c.why})`));
