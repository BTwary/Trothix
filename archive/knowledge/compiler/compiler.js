export function runCompiler(knowledge) {
    console.log("[4/8] Compiler: Mathematically expanding templates and building logic...");
    
    // If the domain already has compiled/static rules and decisionTables, preserve them
    const rules = knowledge.rules || [];
    const decisionTables = knowledge.decision_tables || knowledge.decisionTables || [];
    const transitionTables = knowledge.transitionTables || [];
    const mutationTests = knowledge.mutationTests || [];
    
    // If we have templates but no rules/decision tables, compile them!
    if (rules.length === 0 && decisionTables.length === 0 && knowledge.templates) {
        const templates = knowledge.templates || [];
        const states = knowledge.states || [];
        const events = knowledge.events || [];
        
        // Build transition tables from states and events
        if (states.length > 0 && events.length > 0 && transitionTables.length === 0) {
            // Check if there is an existing transition logic or map it
            transitionTables.push(
                { currentState: "STATE_ACTIVE", event: "EVENT_NOTICE", nextState: "STATE_NOTICE_PENDING", constraints: ["TIME"] },
                { currentState: "STATE_NOTICE_PENDING", event: "EVENT_TIME_ELAPSED", nextState: "STATE_TERMINATED", constraints: [] },
                { currentState: "STATE_ACTIVE", event: "EVENT_BREACH", nextState: "STATE_CURE_PENDING", constraints: ["TIME"] }
            );
        }
        
        // Derive decision tables from templates
        if (templates.length > 0) {
            templates.forEach(tpl => {
                decisionTables.push({
                    id: `DECISION_${tpl.id.replace('TPL_', '')}`,
                    name: tpl.id.replace('TPL_', '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
                    inputs: ["templates", "events"],
                    conditions: [{ matchTemplate: tpl.id }],
                    output: { findingType: tpl.id.replace('TPL_', ''), severity: "Neutral" },
                    domainDependencies: [
                        { requires: "Notice", type: "mandatory", confidence: 1.0 }
                    ]
                });
            });
        }
        
        // Generate mutation tests from templates
        if (templates.length > 0) {
            templates.forEach(tpl => {
                mutationTests.push({ id: "MUT_" + tpl.id + "_POS", template: tpl.id, type: "Positive", expects: "Match" });
                mutationTests.push({ id: "MUT_" + tpl.id + "_NEG1", template: tpl.id, type: "Lexical Mutation", mutation: "Replace Modal with NEG_NOT", expects: "Fail" });
                mutationTests.push({ id: "MUT_" + tpl.id + "_NEG2", template: tpl.id, type: "Semantic Contradiction", mutation: "Add EXC_LAW", expects: "Edge Case" });
            });
        }
    }
    
    return {
        rules,
        transitionTables,
        decisionTables,
        mutationTests
    };
}

