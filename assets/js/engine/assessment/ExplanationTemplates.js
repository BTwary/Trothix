/**
 * @fileoverview ExplanationTemplates.js
 * Stores raw, unformatted explanation templates for all rules and concepts.
 * This is data-only (no logic, no formatting) to support easy extension.
 */

export const templates = {
  // Risks (Category: Risk)
  "RULE_PAYMENT_DEADLINE_LONG": {
    title: "Extended Payment Terms",
    summary: "Payment terms of {days} days are longer than the industry standard of 15 days.",
    businessImpact: "Prolonged payment cycles strain working capital, reduce liquidity, and may hinder the business's ability to reinvest or meet operational expenses.",
    legalImpact: "While not a direct legal violation, extended terms may increase the risk of payment disputes or defaults if the counterparty fails to pay within the agreed timeframe, potentially triggering late payment penalties or termination rights.",
    recommendation: "Negotiate payment terms down to 15 or 30 days to align with cash flow policies and industry norms.",
    negotiationTip: "Propose a tiered discount for early payment to incentivize shorter terms."
  },
  "RULE_CONSENT_REQUIRED": {
    title: "Consent Required for Assignment",
    summary: "Assignment of the agreement requires prior written consent from the non-assigning party.",
    businessImpact: "Restricts operational flexibility, potentially delaying or preventing mergers, acquisitions, or corporate reorganizations that require transfer of contracts.",
    legalImpact: "Creates a contractual impediment to assignment; failure to obtain consent may result in a breach of contract and render the assignment void or give the counterparty termination rights.",
    recommendation: "Negotiate a carve-out permitting assignment to affiliates or successors without consent.",
    negotiationTip: "Seek a clause that deems consent not to be unreasonably withheld, and specify a reasonable timeframe for response."
  },
  "RULE_OWNERSHIP_UNDEFINED": {
    title: "Undefined IP Ownership",
    summary: "The agreement does not explicitly define ownership of newly created intellectual property.",
    businessImpact: "Unclear IP ownership can result in costly litigation, loss of competitive advantage, and diminished asset value, affecting business valuation and investment.",
    legalImpact: "Ambiguity in IP ownership may lead to joint ownership, which under many laws grants each co-owner rights to exploit the IP without accounting to the other, potentially diluting exclusive rights and creating complex licensing disputes.",
    recommendation: "Ensure a clear intellectual property clause states that newly created IP is owned exclusively by the creator or transferring party.",
    negotiationTip: "Define 'work product' broadly and include assignment of all rights, including moral rights where permitted."
  },
  "RULE_MISSING_NOTICE_ADDRESS": {
    title: "Missing Notice Address",
    summary: "The contract fails to specify physical or electronic addresses for sending legal notices.",
    businessImpact: "Inadequate notice provisions may cause miscommunication, delay critical actions, and increase administrative burden, potentially disrupting business operations.",
    legalImpact: "Failure to provide proper notice addresses can render notices ineffective, potentially invalidating termination, default, or amendment notices, and may lead to disputes over whether notice was properly given.",
    recommendation: "Insert clear contact details (names, mailing addresses, and email addresses) for both parties in the notice clause.",
    negotiationTip: "Include a provision for updating addresses with a reasonable notice period to ensure ongoing accuracy."
  },
  "RULE_ILLEGAL_STATE_TRANSITION": {
    title: "Invalid Lifecycle State Transition",
    summary: "An invalid state transition was detected in the document lifecycle rules.",
    businessImpact: "Unexpected state changes can disrupt workflow, cause processing delays, and lead to operational inefficiencies or incorrect contract status.",
    legalImpact: "Invalid state transitions may trigger unintended contractual consequences, such as premature termination or default declarations, which could expose the business to breach of contract claims.",
    recommendation: "Align the termination triggers with standard transition procedures to ensure consistency with the agreed terms.",
    negotiationTip: null
  },
  "RULE_PAYMENT_DEADLINE_SHORT": {
    title: "Short Payment Terms",
    summary: "The document requires payment in {days} days, which is shorter than typical terms.",
    businessImpact: "Short payment deadlines strain cash flow, increase administrative costs for timely processing, and may require expedited financing or overdraft facilities.",
    legalImpact: "While legally enforceable, short payment periods may lead to late payment defaults if the business cannot comply, triggering interest charges or termination rights.",
    recommendation: "Extend the payment period to 30 days to align with accounting windows.",
    negotiationTip: "Request a grace period or a tiered payment schedule to ease the burden."
  },
  "CONCEPT_LIABILITY_RISK": {
    title: "Risky Liability Terms",
    summary: "The liability cap or exclusion clauses contain unfavorable parameters.",
    businessImpact: "Unfavorable liability terms expose the business to significant financial losses, potentially exceeding the contract value and affecting profitability.",
    legalImpact: "Such terms may waive important statutory protections, allow recovery of consequential damages without limitation, and shift disproportionate risk to the business, creating an unbalanced legal obligation.",
    recommendation: "Add reciprocal liability limits and exclude indirect/consequential damages.",
    negotiationTip: "Propose a mutual cap of a multiple of the contract value (e.g., 1x or 2x) and carve out only wilful misconduct or IP infringement."
  },
  "RiskyLiability": {
    title: "Risky Liability Terms",
    summary: "The liability cap or exclusion clauses contain unfavorable parameters.",
    businessImpact: "Unfavorable liability terms expose the business to significant financial losses, potentially exceeding the contract value and affecting profitability.",
    legalImpact: "Such terms may waive important statutory protections, allow recovery of consequential damages without limitation, and shift disproportionate risk to the business, creating an unbalanced legal obligation.",
    recommendation: "Add reciprocal liability limits and exclude indirect/consequential damages.",
    negotiationTip: "Propose a mutual cap of a multiple of the contract value (e.g., 1x or 2x) and carve out only wilful misconduct or IP infringement."
  },
  "CONCEPT_LIABILITY_FAIRNESS": {
    title: "Standard Damages Exclusion",
    summary: "The agreement waives liability for indirect, consequential, or punitive damages — a standard commercial protection found in most well-drafted contracts.",
    businessImpact: "This exclusion limits exposure to hard-to-predict, potentially disproportionate damages (e.g., lost profits, reputational harm), which is generally favorable to both parties rather than one-sided.",
    legalImpact: "Consequential/indirect damages waivers are enforceable in most commercial contexts and are considered market-standard; their presence alone does not indicate an unbalanced allocation of risk.",
    recommendation: "Confirm the exclusion applies mutually to both parties, not just one, and that it doesn't inadvertently exclude damages types you'd want to preserve (e.g., breach of confidentiality).",
    negotiationTip: "If the exclusion currently applies to only one party, negotiate for it to apply mutually."
  },
  "LiabilityExclusionPresent": {
    title: "Standard Damages Exclusion",
    summary: "The agreement waives liability for indirect, consequential, or punitive damages — a standard commercial protection found in most well-drafted contracts.",
    businessImpact: "This exclusion limits exposure to hard-to-predict, potentially disproportionate damages (e.g., lost profits, reputational harm), which is generally favorable to both parties rather than one-sided.",
    legalImpact: "Consequential/indirect damages waivers are enforceable in most commercial contexts and are considered market-standard; their presence alone does not indicate an unbalanced allocation of risk.",
    recommendation: "Confirm the exclusion applies mutually to both parties, not just one, and that it doesn't inadvertently exclude damages types you'd want to preserve (e.g., breach of confidentiality).",
    negotiationTip: "If the exclusion currently applies to only one party, negotiate for it to apply mutually."
  },

  // Positive (Category: Positive)
  "RULE_ASSIGNMENT_ALLOWED": {
    title: "Permitted Assignment",
    summary: "Assignment is permitted under certain conditions.",
    businessImpact: "Permitted assignment facilitates mergers, acquisitions, and restructuring without the need for counterparty consent, reducing transaction costs and delays.",
    legalImpact: "Provides clear contractual authority to transfer rights and obligations, reducing the risk of breach or invalid assignment, and allowing the business to manage its portfolio effectively.",
    recommendation: "Ensure that assignee qualifications are monitored prior to transferring obligations.",
    negotiationTip: "If consent is required, negotiate that it shall not be unreasonably withheld."
  },
  "RULE_EXPLICIT_GOVERNING_LAW": {
    title: "Explicit Governing Law",
    summary: "Governing law is explicitly defined as {governingLaw}.",
    businessImpact: "Certainty in governing law reduces uncertainty and costs associated with cross-border disputes, enhancing predictability for business planning.",
    legalImpact: "Explicit choice of law ensures that the contract will be interpreted under a known legal regime, avoiding conflicts of law and potentially limiting the applicability of mandatory local laws.",
    recommendation: "Ensure this jurisdiction aligns with your home state or is a neutral, commercial-friendly venue like Delaware or New York.",
    negotiationTip: "If you are a smaller party, consider negotiating for your home state law to reduce legal costs."
  },
  "RULE_EXCLUSIVE_VENUE": {
    title: "Exclusive Dispute Venue",
    summary: "Exclusive venue for dispute resolution is established as {venue}.",
    businessImpact: "Exclusive venue reduces litigation costs and travel expenses, and provides predictability for dispute resolution logistics.",
    legalImpact: "It prevents forum shopping and ensures that any litigation will be heard in a court familiar with the applicable law, potentially streamlining proceedings.",
    recommendation: "Confirm that the selected venue is geographically and financially feasible for your operations.",
    negotiationTip: "If you are concerned about cost, negotiate for a venue that is convenient for both parties or include alternative dispute resolution methods."
  },
  "RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED": {
    title: "Clearly Defined IP Ownership",
    summary: "Ownership of newly created intellectual property is explicitly assigned.",
    businessImpact: "Clear IP ownership enhances the business's asset value, supports monetization strategies, and provides a competitive edge by securing exclusive rights.",
    legalImpact: "Explicit assignment avoids disputes over ownership, prevents joint ownership complications, and ensures the business has standing to enforce IP rights against third parties.",
    recommendation: "Regularly audit deliverables to confirm proper transfer documentation is executed.",
    negotiationTip: "Include a provision for the counterparty to execute any further documentation necessary to perfect the assignment."
  },
  "RULE_EMAIL_NOTICE_ALLOWED": {
    title: "Email Notice Permitted",
    summary: "The notice clause explicitly allows the use of email for delivery of legal notices.",
    businessImpact: "Email notice reduces administrative burden, speeds up communication, and enables efficient tracking of important notifications.",
    legalImpact: "Explicit email notice provisions provide a legally recognized method for delivery, potentially shortening notice periods and creating clear records of receipt.",
    recommendation: "Ensure designated notification email addresses are monitored regularly.",
    negotiationTip: "Specify that notice is effective upon sending (or upon receipt) and include a backup method like postal mail for critical notices."
  },
  "FavorableLiability": {
    title: "Favorable Liability Protection",
    summary: "The contract contains favorable limits on liability, protecting your business.",
    businessImpact: "Favorable liability caps protect the company's bottom line by limiting potential financial exposure in litigation, reducing insurance costs, and preserving capital.",
    legalImpact: "Such limits provide a legal ceiling on damages, reducing the risk of catastrophic judgments and encouraging settlement, while also clarifying the scope of liability.",
    recommendation: "Preserve these limits during negotiations.",
    negotiationTip: "Be prepared to defend these limits with reference to industry standards and the relative bargaining power of the parties."
  },

  // Completeness (Category: Completeness / Missing)
  "RULE_DEFINITIONS_PRESENT": {
    title: "Definitions List Present",
    summary: "Key terms are defined, providing clarity to core contract provisions.",
    businessImpact: "Clear definitions reduce ambiguity, facilitate smooth contract administration, and minimize the risk of operational misunderstandings.",
    legalImpact: "Defined terms provide legal certainty, aiding in judicial interpretation and reducing the likelihood of disputes over meaning, which can lead to costly litigation.",
    recommendation: "Cross-reference defined terms with their occurrences to ensure consistency.",
    negotiationTip: "Review definitions to ensure they align with the actual business intent and are not overly broad or narrow."
  },
  "RULE_PROPER_NOTICE_TIMELINE": {
    title: "Proper Notice Timeline",
    summary: "The notice delivery timeline meets standard business windows.",
    businessImpact: "Adequate notice periods allow for proper planning and response, reducing operational disruption and enabling smooth transitions.",
    legalImpact: "Compliance with notice timelines is often a condition precedent to exercising rights (e.g., termination), so proper timelines ensure that actions are legally effective.",
    recommendation: "Ensure notice workflows are monitored within the specified timelines.",
    negotiationTip: "If the timeline is too short, negotiate for a longer period to allow sufficient time for internal review and decision-making."
  },
  "CONCEPT_LIABILITY_MISSING": {
    title: "Missing Liability Clause",
    summary: "The document lacks a limitation of liability clause.",
    businessImpact: "Without a liability cap, the business could face unlimited financial exposure in the event of a claim, potentially threatening solvency.",
    legalImpact: "Under default rules, a party may be liable for all direct, indirect, and consequential damages without any upper limit, creating significant legal risk.",
    recommendation: "Insert a standard limitation of liability clause with a reciprocal cap.",
    negotiationTip: "Propose a cap tied to a multiple of the contract value, and exclude only damages arising from wilful misconduct or IP infringement."
  },
  "MissingLiability": {
    title: "Missing Liability Clause",
    summary: "The document lacks a limitation of liability clause.",
    businessImpact: "Without a liability cap, the business could face unlimited financial exposure in the event of a claim, potentially threatening solvency.",
    legalImpact: "Under default rules, a party may be liable for all direct, indirect, and consequential damages without any upper limit, creating significant legal risk.",
    recommendation: "Insert a standard limitation of liability clause with a reciprocal cap.",
    negotiationTip: "Propose a cap tied to a multiple of the contract value, and exclude only damages arising from wilful misconduct or IP infringement."
  },

  "CONCEPT_LIABILITY_NEGOTIATION": {
    title: "Aggregate Liability Cap Defined",
    summary: "An aggregate liability cap is defined, setting a ceiling on each party's total financial exposure under this Agreement.",
    businessImpact: "A defined cap creates predictable, bounded financial exposure, which is useful for budgeting, insurance, and risk assessment purposes.",
    legalImpact: "Liability caps are generally enforceable in commercial agreements and are a standard risk-allocation mechanism; the specific amount, not the presence of a cap itself, is typically the point of negotiation.",
    recommendation: "Review the cap amount against the contract value, your potential exposure, and industry norms to confirm it's commercially suitable.",
    negotiationTip: "Common benchmarks are 1x–2x the fees paid in the prior 12 months; a much lower cap may be worth pushing back on depending on the risk profile of the engagement."
  },
  "NegotiateLiability": {
    title: "Aggregate Liability Cap Defined",
    summary: "An aggregate liability cap is defined, setting a ceiling on each party's total financial exposure under this Agreement.",
    businessImpact: "A defined cap creates predictable, bounded financial exposure, which is useful for budgeting, insurance, and risk assessment purposes.",
    legalImpact: "Liability caps are generally enforceable in commercial agreements and are a standard risk-allocation mechanism; the specific amount, not the presence of a cap itself, is typically the point of negotiation.",
    recommendation: "Review the cap amount against the contract value, your potential exposure, and industry norms to confirm it's commercially suitable.",
    negotiationTip: "Common benchmarks are 1x–2x the fees paid in the prior 12 months; a much lower cap may be worth pushing back on depending on the risk profile of the engagement."
  },

  // Indemnification (Category: varies — Completeness/Risk/Fairness/Positive/Negotiation)
  // Previously had zero templates of any kind; every Indemnification finding
  // fell back to generic filler (e.g. "This finding may increase
  // contractual or operational risk.") regardless of whether the finding
  // was actually a risk, a neutral completeness note, or a favorable term.
  "CONCEPT_INDEMNIFICATION_PRESENT": {
    title: "Indemnification Clause Present",
    summary: "The agreement contains provisions addressing indemnification obligations between the parties.",
    businessImpact: "Confirms the parties have allocated responsibility for third-party claims, which is standard practice in commercial agreements.",
    legalImpact: "Establishes a contractual basis for one party to compensate the other for specified losses, rather than relying solely on default statutory or common-law remedies.",
    recommendation: "Review the scope, caps, and procedural requirements (notice, control of defense) of the indemnification clause to confirm they meet your risk tolerance.",
    negotiationTip: null
  },
  "IndemnificationPresent": {
    title: "Indemnification Clause Present",
    summary: "The agreement contains provisions addressing indemnification obligations between the parties.",
    businessImpact: "Confirms the parties have allocated responsibility for third-party claims, which is standard practice in commercial agreements.",
    legalImpact: "Establishes a contractual basis for one party to compensate the other for specified losses, rather than relying solely on default statutory or common-law remedies.",
    recommendation: "Review the scope, caps, and procedural requirements (notice, control of defense) of the indemnification clause to confirm they meet your risk tolerance.",
    negotiationTip: null
  },
  "CONCEPT_INDEMNIFICATION_MISSING": {
    title: "Missing Indemnification Clause",
    summary: "The agreement does not appear to contain an indemnification clause, despite being a document type that typically includes one.",
    businessImpact: "Without an indemnification clause, the business may have to rely on costlier and less predictable common-law or statutory remedies to recover losses caused by the counterparty, including third-party claims.",
    legalImpact: "Absent an express indemnification obligation, recovery for losses caused by a counterparty's acts (e.g., IP infringement, negligence, breach) may depend on proving common-law claims such as breach of contract or negligence, which can be harder to establish and may not cover consequential losses.",
    recommendation: "Add an indemnification clause allocating responsibility for third-party claims arising from each party's acts, breaches, or products/services.",
    negotiationTip: "Start from a mutual indemnification structure and negotiate scope, caps, and procedural requirements from there."
  },
  "MissingIndemnification": {
    title: "Missing Indemnification Clause",
    summary: "The agreement does not appear to contain an indemnification clause, despite being a document type that typically includes one.",
    businessImpact: "Without an indemnification clause, the business may have to rely on costlier and less predictable common-law or statutory remedies to recover losses caused by the counterparty, including third-party claims.",
    legalImpact: "Absent an express indemnification obligation, recovery for losses caused by a counterparty's acts (e.g., IP infringement, negligence, breach) may depend on proving common-law claims such as breach of contract or negligence, which can be harder to establish and may not cover consequential losses.",
    recommendation: "Add an indemnification clause allocating responsibility for third-party claims arising from each party's acts, breaches, or products/services.",
    negotiationTip: "Start from a mutual indemnification structure and negotiate scope, caps, and procedural requirements from there."
  },
  "CONCEPT_INDEMNIFICATION_RISK": {
    title: "Broad Indemnification Obligation",
    summary: "The indemnification clause uses broad, essentially unlimited language (e.g., 'any and all claims'), which can extend liability well beyond typical commercial risk allocation.",
    businessImpact: "Broad indemnification obligations can expose the business to open-ended financial liability for claims that go beyond the counterparty's own fault, including claims only tangentially related to the agreement.",
    legalImpact: "Language such as 'any and all claims arising out of or relating to' this Agreement is frequently interpreted broadly, potentially requiring indemnification even for claims not primarily caused by the indemnifying party.",
    recommendation: "Narrow the scope to claims 'arising from' (not merely 'relating to') the indemnifying party's negligence, breach, or willful misconduct, and consider adding a cap.",
    negotiationTip: "Propose limiting indemnification to third-party claims directly caused by the indemnifying party's acts or omissions, and tie it to the liability cap where one exists."
  },
  "RiskyIndemnification": {
    title: "Broad Indemnification Obligation",
    summary: "The indemnification clause uses broad, essentially unlimited language (e.g., 'any and all claims'), which can extend liability well beyond typical commercial risk allocation.",
    businessImpact: "Broad indemnification obligations can expose the business to open-ended financial liability for claims that go beyond the counterparty's own fault, including claims only tangentially related to the agreement.",
    legalImpact: "Language such as 'any and all claims arising out of or relating to' this Agreement is frequently interpreted broadly, potentially requiring indemnification even for claims not primarily caused by the indemnifying party.",
    recommendation: "Narrow the scope to claims 'arising from' (not merely 'relating to') the indemnifying party's negligence, breach, or willful misconduct, and consider adding a cap.",
    negotiationTip: "Propose limiting indemnification to third-party claims directly caused by the indemnifying party's acts or omissions, and tie it to the liability cap where one exists."
  },
  "CONCEPT_INDEMNIFICATION_FAIRNESS": {
    title: "Reciprocal Indemnification",
    summary: "The indemnification obligation is mutual — both parties indemnify each other rather than only one party bearing the obligation.",
    businessImpact: "Mutual indemnification distributes third-party claim risk more evenly between the parties, which is generally considered a balanced, market-standard allocation of risk.",
    legalImpact: "Reciprocal obligations reduce the likelihood that the clause will later be challenged as one-sided, and generally align with common negotiating norms for commercial agreements.",
    recommendation: "Confirm both parties' obligations are genuinely symmetric in scope, caps, and procedural requirements (notice, control of defense) — reciprocal wording alone doesn't guarantee reciprocal substance.",
    negotiationTip: null
  },
  "ReciprocalIndemnification": {
    title: "Reciprocal Indemnification",
    summary: "The indemnification obligation is mutual — both parties indemnify each other rather than only one party bearing the obligation.",
    businessImpact: "Mutual indemnification distributes third-party claim risk more evenly between the parties, which is generally considered a balanced, market-standard allocation of risk.",
    legalImpact: "Reciprocal obligations reduce the likelihood that the clause will later be challenged as one-sided, and generally align with common negotiating norms for commercial agreements.",
    recommendation: "Confirm both parties' obligations are genuinely symmetric in scope, caps, and procedural requirements (notice, control of defense) — reciprocal wording alone doesn't guarantee reciprocal substance.",
    negotiationTip: null
  },
  "CONCEPT_INDEMNIFICATION_POSITIVE": {
    title: "Duty to Defend Established",
    summary: "The clause includes an explicit duty to defend, not just to indemnify, meaning the indemnifying party must cover legal defense costs as claims arise.",
    businessImpact: "An explicit duty to defend can meaningfully reduce upfront litigation costs, since the indemnifying party is responsible for defense from the outset rather than only reimbursing damages after the fact.",
    legalImpact: "Many jurisdictions distinguish a duty to defend (an immediate, ongoing obligation) from a duty to indemnify (a reimbursement obligation that may only crystallize after liability is determined); having both provides broader protection.",
    recommendation: "Preserve this provision; confirm it specifies who controls the defense and whether defense costs are subject to the liability cap.",
    negotiationTip: "If defense costs are currently subject to the liability cap, consider negotiating for them to be excluded so the cap is reserved for damages."
  },
  "FavorableIndemnification": {
    title: "Duty to Defend Established",
    summary: "The clause includes an explicit duty to defend, not just to indemnify, meaning the indemnifying party must cover legal defense costs as claims arise.",
    businessImpact: "An explicit duty to defend can meaningfully reduce upfront litigation costs, since the indemnifying party is responsible for defense from the outset rather than only reimbursing damages after the fact.",
    legalImpact: "Many jurisdictions distinguish a duty to defend (an immediate, ongoing obligation) from a duty to indemnify (a reimbursement obligation that may only crystallize after liability is determined); having both provides broader protection.",
    recommendation: "Preserve this provision; confirm it specifies who controls the defense and whether defense costs are subject to the liability cap.",
    negotiationTip: "If defense costs are currently subject to the liability cap, consider negotiating for them to be excluded so the cap is reserved for damages."
  },
  "CONCEPT_INDEMNIFICATION_NEGOTIATION": {
    title: "Indemnification Exclusions Defined",
    summary: "The clause defines specific exclusions or limitations to the indemnification obligation (e.g., 'except to the extent caused by the other party').",
    businessImpact: "Clearly defined exclusions create predictable boundaries for when indemnification applies, reducing the chance of disputes over the clause's scope.",
    legalImpact: "Exclusion language allocates fault-based responsibility between the parties, which can affect how a court apportions liability between co-defendants in a third-party claim.",
    recommendation: "Review the specific exclusions to confirm they reflect an acceptable allocation of risk for your role in the transaction.",
    negotiationTip: "Use the existing exclusion language as a reference point for negotiating comparable exclusions elsewhere in the agreement (e.g., in the liability cap's carve-outs)."
  },
  "NegotiateIndemnification": {
    title: "Indemnification Exclusions Defined",
    summary: "The clause defines specific exclusions or limitations to the indemnification obligation (e.g., 'except to the extent caused by the other party').",
    businessImpact: "Clearly defined exclusions create predictable boundaries for when indemnification applies, reducing the chance of disputes over the clause's scope.",
    legalImpact: "Exclusion language allocates fault-based responsibility between the parties, which can affect how a court apportions liability between co-defendants in a third-party claim.",
    recommendation: "Review the specific exclusions to confirm they reflect an acceptable allocation of risk for your role in the transaction.",
    negotiationTip: "Use the existing exclusion language as a reference point for negotiating comparable exclusions elsewhere in the agreement (e.g., in the liability cap's carve-outs)."
  },

  // Fallbacks
  "default": {
    title: "Contractual Finding",
    summary: "Deterministic rule triggered: {message}.",
    businessImpact: "Unidentified contractual issue may introduce operational uncertainty and potential financial costs.",
    legalImpact: "May create unanticipated legal obligations or restrict rights, affecting the contract's enforceability.",
    recommendation: "Review the clause details for compliance and risk exposure.",
    negotiationTip: null
  }
};