import assert from 'assert';
import path from 'path';
import { parseKnowledgeBase } from '../parser.js';
import { readManifest } from '../loader.js';
import { KnowledgeProvider } from '../../../assets/js/engine/knowledge/KnowledgeProvider.js';

// ---------------------------------------------------------------------
// Audit finding C1, recommendation #1: an automated parity check
// between knowledge-audit's independent parser (parser.js/
// schema-registry.js) and the production KnowledgeProvider, so a
// divergence in "what node ids exist" is caught by CI instead of
// relying on someone remembering to keep the two in sync.
//
// This deliberately does NOT assert the two tools produce identical
// node counts/types overall — they answer different questions by
// design (see schema-registry.js's header). What must never silently
// drift is which *ids* exist, scoped to the domains knowledge-audit
// actually reads (see loader.js's header: it walks only manifest-
// declared domains, while KnowledgeProvider walks every directory
// physically present under domains/ regardless of manifest — a
// pre-existing, documented divergence that is out of scope to fix
// here). So this test filters KnowledgeProvider's node set down to
// the same domain scope before comparing.
// ---------------------------------------------------------------------

console.log('Running parser-production-parity.test.js...');

const KB_PATH = path.join(process.cwd(), 'assets', 'js', 'engine', 'knowledge', 'v1');

const manifest = readManifest(KB_PATH);
const manifestDomains = new Set(['core', ...manifest.domains]);

const parsed = parseKnowledgeBase(KB_PATH);
const auditIds = new Set(parsed.nodes.map(n => n.id));

const provider = new KnowledgeProvider(KB_PATH);
provider._loadKnowledge();
provider._validateAndResolveGraph();

const providerIdsInScope = new Set();
for (const { id, metadata } of provider.getAllNodes()) {
  const domain = (metadata && (metadata.domain || metadata.source)) || null;
  if (domain && manifestDomains.has(domain)) providerIdsInScope.add(id);
}

// Every id KnowledgeProvider resolved within the manifest-declared
// domains must also be visible to knowledge-audit's parser — a
// production id going missing from the audit's view is exactly the
// "silently blind to real nodes" failure mode C1 describes.
const missingFromAudit = [...providerIdsInScope].filter(id => !auditIds.has(id));

// A relation-only id (REL_*) legitimately has no corresponding IR node
// in knowledge-audit (it becomes an edge, not a node — see parser.js's
// `relation` type handling) so exclude those from the "audit is blind"
// check; everything else must be visible.
const missingNonRelation = missingFromAudit.filter(id => !id.startsWith('REL_'));

assert.deepStrictEqual(
  missingNonRelation,
  [],
  `knowledge-audit's parser is missing ${missingNonRelation.length} id(s) that KnowledgeProvider ` +
  `resolved within manifest-scoped domains: ${missingNonRelation.slice(0, 10).join(', ')}` +
  `${missingNonRelation.length > 10 ? ', ...' : ''} — either parser.js/schema-registry.js needs a new ` +
  `type-detection rule, or KnowledgeProvider changed in a way this audit tool hasn't caught up with.`
);

// Sanity floor: the overlap should be substantial (not just a handful
// of accidental id matches), so this test can't pass vacuously if
// either tool starts loading (almost) nothing.
assert.ok(providerIdsInScope.size > 50, 'expected KnowledgeProvider to resolve a substantial number of in-scope nodes');
assert.ok(auditIds.size > 50, 'expected knowledge-audit to parse a substantial number of nodes');

console.log(`  KnowledgeProvider (in-scope): ${providerIdsInScope.size} ids · knowledge-audit: ${auditIds.size} ids · 0 missing`);
console.log('✅ parser-production-parity.test.js passed!');
