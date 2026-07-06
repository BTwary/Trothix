import fs from 'fs';
import path from 'path';

const domainDir = 'C:\\Users\\bhask\\Desktop\\Antigravity\\Trothix_GitHub\\assets\\js\\engine\\knowledge\\v1\\domains\\Termination';
const knowledgeDir = path.join(domainDir, 'knowledge');

if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
}

// Atomic Dictionaries
const actors = [
    { id: "PARTY_RECEIVER", terms: ["Recipient", "Receiving Party", "Consultant", "Vendor", "Supplier", "Contractor", "Employee"] },
    { id: "PARTY_SENDER", terms: ["Discloser", "Disclosing Party", "Client", "Customer", "Company", "Employer"] },
    { id: "PARTY_ANY", terms: ["Either party", "Any party", "A party", "The parties"] }
];

const objects = [
    { id: "AGREEMENT", terms: ["Agreement", "Contract", "Services", "SOW", "Term Sheet"] },
    { id: "NOTICE", terms: ["Notice", "Written Notice", "Notification"] },
    { id: "BREACH", terms: ["Material Breach", "Minor Breach", "Violation", "Default"] }
];

const modals = [
    { id: "OBLIGATION", terms: ["shall", "must", "will", "agrees to", "undertakes to"] },
    { id: "PERMISSION", terms: ["may", "has the right to", "is permitted to"] }
];

const negations = [
    { id: "NEG_NOT", terms: ["not", "never", "without"] },
    { id: "NEG_EXCEPT", terms: ["unless", "except", "excluding"] },
    { id: "NEG_PROHIBITED", terms: ["prohibited", "forbidden", "restricted"] }
];

const modifiers = [
    { id: "MOD_IMMEDIATE", terms: ["immediately", "promptly", "forthwith", "without delay"] },
    { id: "MOD_MATERIAL", terms: ["material", "substantial", "significant"] },
    { id: "MOD_REASONABLE", terms: ["reasonable", "commercially reasonable"] }
];

const exceptions = [
    { id: "EXC_LAW", terms: ["unless prohibited", "except by law", "required by law"] },
    { id: "EXC_CONSENT", terms: ["except with consent", "without prior written consent"] },
    { id: "EXC_FRAUD", terms: ["except fraud", "except willful misconduct", "gross negligence"] }
];

const conditions = [
    { id: "COND_BREACH", terms: ["upon breach", "in the event of breach", "if a breach exists"] },
    { id: "COND_NOTICE", terms: ["upon written notice", "after notice", "following notice"] },
    { id: "COND_CURE", terms: ["after cure period", "fails to cure"] }
];

const intents = [
    { id: "INTENT_END_CONTRACT", terms: ["terminate", "cancel", "expire", "cease", "rescind", "withdraw", "revoke", "bring to an end", "come to an end"] },
    { id: "INTENT_CURE", terms: ["cure", "remedy", "fix", "correct"] },
    { id: "INTENT_RENEW", terms: ["renew", "extend", "automatically renew"] }
];

const states = [
    { id: "STATE_ACTIVE", name: "Active" },
    { id: "STATE_NOTICE_PENDING", name: "Notice Pending" },
    { id: "STATE_CURE_PENDING", name: "Cure Pending" },
    { id: "STATE_TERMINATED", name: "Terminated" },
    { id: "STATE_EXPIRED", name: "Expired" }
];

const events = [
    { id: "EVENT_NOTICE", trigger: "Notice Served" },
    { id: "EVENT_BREACH", trigger: "Material Breach Occurs" },
    { id: "EVENT_TIME_ELAPSED", trigger: "Time Elapsed" }
];

const constraints = [
    { id: "TIME", terms: ["30 days", "60 days", "immediate"] },
    { id: "MONEY", terms: ["$10,000", "5%"] }
];

const templates = [
    { id: "TPL_TERMINATION_FOR_CONVENIENCE", structure: ["ACTOR", "MODAL", "INTENT_END_CONTRACT", "OBJECT", "COND_NOTICE"] },
    { id: "TPL_TERMINATION_FOR_CAUSE", structure: ["ACTOR", "MODAL", "INTENT_END_CONTRACT", "COND_BREACH"] },
    { id: "TPL_AUTOMATIC_EXPIRATION", structure: ["OBJECT", "INTENT_END_CONTRACT", "COND_NOTICE"] }
];

// Write atomic files
const writeAtomic = (filename, data) => fs.writeFileSync(path.join(knowledgeDir, filename), JSON.stringify(data, null, 2));

writeAtomic('actors.json', actors);
writeAtomic('objects.json', objects);
writeAtomic('modals.json', modals);
writeAtomic('negations.json', negations);
writeAtomic('modifiers.json', modifiers);
writeAtomic('exceptions.json', exceptions);
writeAtomic('conditions.json', conditions);
writeAtomic('intents.json', intents);
writeAtomic('states.json', states);
writeAtomic('events.json', events);
writeAtomic('constraints.json', constraints);
writeAtomic('templates.json', templates);

// Write Manifest
const manifest = {
    version: "1.0",
    actors: "actors.json",
    objects: "objects.json",
    modals: "modals.json",
    negations: "negations.json",
    modifiers: "modifiers.json",
    exceptions: "exceptions.json",
    conditions: "conditions.json",
    intents: "intents.json",
    states: "states.json",
    events: "events.json",
    constraints: "constraints.json",
    templates: "templates.json"
};
writeAtomic('knowledge.json', manifest);

console.log("Atomic Knowledge Files Generated Successfully in " + knowledgeDir);
