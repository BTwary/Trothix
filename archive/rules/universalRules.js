// See note in ndaRules.js -- severity taxonomy normalized to LOW/MEDIUM/HIGH
// across all rule modules. Expanded to cover the new fields universalParser.js
// now extracts (Payment, Termination, Warranty, Signatures, Schedules) per
// the Phase 2.2 roadmap clause taxonomy.
export function evaluateUniversalRisk(data, userContext, rules) {
  const flags = [];

  // --- Dispute resolution ---
  if (data.hasBindingArbitration) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Binding Arbitration',
      message: 'You are giving up your right to sue in court if a dispute arises.',
    });
  }

  if (data.hasJuryWaiver || data.hasClassActionWaiver) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Jury / Class Action Waiver',
      message: 'You are waiving your right to a trial by jury or to join a class action lawsuit.',
    });
  }

  // --- Liability / risk ---
  if (data.hasUnilateralIndemnification) {
    flags.push({
      severity: 'HIGH',
      clause: 'One-Sided Indemnification',
      message: 'You may be forced to pay for the other party\u2019s legal costs and damages if they are sued because of you.',
    });
  }

  if (data.hasLiquidatedDamages) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Liquidated Damages',
      message: 'A predetermined damages amount applies if you breach this agreement, regardless of actual harm caused.',
    });
  }

  if (data.hasLiabilityCap) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Liability Cap',
      message: 'The other party has strictly limited how much money you can recover if they breach the contract.',
    });
  }

  // --- IP ---
  if (data.hasPerpetualLicense) {
    flags.push({
      severity: 'HIGH',
      clause: 'Perpetual License',
      message: 'You are giving away permanent, irrevocable rights to your content or intellectual property.',
    });
  }

  // --- Payment ---
  if (data.hasPaymentTerms && data.paymentTermsDays) {
    if (data.paymentTermsDays > 60) {
      flags.push({
        severity: 'MEDIUM',
        clause: 'Payment Terms',
        message: `Payment isn't due for ${data.paymentTermsDays} days, which is longer than typical (Net 30 is standard).`,
      });
    } else {
      flags.push({
        severity: 'LOW',
        clause: 'Payment Terms',
        message: `Payment is due within ${data.paymentTermsDays} days.`,
      });
    }
  }

  // --- Termination ---
  if (!data.hasTerminationClause) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Termination',
      message: 'No clear termination clause was found. It may be unclear how either party can exit this agreement.',
    });
  } else if (data.terminationNoticeDays !== null) {
    if (data.terminationNoticeDays < 15) {
      flags.push({
        severity: 'MEDIUM',
        clause: 'Termination Notice',
        message: `Only ${data.terminationNoticeDays} days' notice is required to terminate, which is short. Confirm this gives you enough time to adjust.`,
      });
    } else {
      flags.push({
        severity: 'LOW',
        clause: 'Termination Notice',
        message: `Termination requires ${data.terminationNoticeDays} days' notice.`,
      });
    }
  }

  if (data.hasAutoRenewal) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Auto-Renewal',
      message: 'This agreement renews automatically unless action is taken. Note the deadline to opt out if you don\u2019t want it to continue.',
    });
  }

  // --- Warranty ---
  if (data.hasWarrantyDisclaimer) {
    flags.push({
      severity: 'MEDIUM',
      clause: 'Warranty Disclaimer',
      message: 'The other party disclaims warranties and provides this on an "as is" basis \u2014 you may have limited recourse if something doesn\u2019t work as expected.',
    });
  }

  // --- Signatures ---
  if (!data.hasSignatureBlock) {
    flags.push({
      severity: 'LOW',
      clause: 'Signatures',
      message: 'No signature block was detected. This may be a draft rather than an executed agreement \u2014 confirm before relying on it.',
    });
  }

  // --- Schedules / Exhibits ---
  if (data.referencesSchedules) {
    flags.push({
      severity: 'LOW',
      clause: 'Schedules / Exhibits',
      message: 'This document references external schedules or exhibits. Make sure you have copies of those \u2014 they may contain material terms.',
    });
  }

  // --- Jurisdiction ---
  if (data.jurisdiction && userContext?.homeState) {
    if (data.jurisdiction.toLowerCase() !== userContext.homeState.toLowerCase()) {
      flags.push({
        severity: 'MEDIUM',
        clause: `Governing Law: ${data.jurisdiction}`,
        message: `Disputes must be resolved under the laws of ${data.jurisdiction}, which is outside your home state.`,
      });
    }
  }

  return flags;
}
