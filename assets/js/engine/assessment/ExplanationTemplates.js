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
  "UnfairLiability": {
    title: "Unbalanced Liability Allocation",
    summary: "Liability limitations are heavily one-sided.",
    businessImpact: "One-sided liability terms could result in substantial uninsured losses and harm your company's financial stability.",
    legalImpact: "These provisions may eliminate or severely cap the counterparty's liability while leaving your business fully exposed, potentially violating principles of fairness and possibly being challenged as unconscionable.",
    recommendation: "Request mutual liability caps to balance exposure between both parties.",
    negotiationTip: "Include standard exclusions for wilful misconduct, fraud, and breach of confidentiality to maintain protection for key risks."
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