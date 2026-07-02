// Lightweight, privacy-respecting usage analytics.
//
// We deliberately store nothing that identifies a visitor or a document:
// no document text, no IP addresses, no session/user IDs -- just aggregate
// counters (how many analyses ran, which document types, how long they
// were, how often we errored or rate-limited). That's enough to answer
// "is this working, and for what" without answering "who used it."
//
// CAVEAT, same as the rate limiters in analyze.js: this lives in a single
// serverless instance's memory. It resets on cold start, and in production
// on Vercel each function/route can run as its own isolated process, so
// counts from /api/analyze may not always be visible to /api/stats if they
// land on different instances. Treat these numbers as a rough, recent-
// traffic signal during early usage -- not an exact all-time total. If you
// outgrow that, swap the object below for a small persistent store (Vercel
// KV, a Postgres row, etc.) behind the same recordEvent()/getStats() calls
// and nothing else in the app needs to change.

const stats = {
  totalRequests: 0,
  completedAnalyses: 0,
  notDocumentCount: 0,
  errors: 0,
  rateLimitHits: 0,
  totalDocumentLength: 0,
  documentTypeCounts: Object.create(null),
  feedbackYes: 0,
  feedbackNo: 0,
  windowStartedAt: Date.now(),
};

export function recordEvent(event, payload = {}) {
  switch (event) {
    case "request":
      stats.totalRequests++;
      break;
    case "rate_limited":
      stats.rateLimitHits++;
      break;
    case "error":
      stats.errors++;
      break;
    case "not_document":
      stats.notDocumentCount++;
      break;
    case "feedback":
      if (payload.value === "yes") stats.feedbackYes++;
      else if (payload.value === "no") stats.feedbackNo++;
      break;
    case "completed": {
      stats.completedAnalyses++;
      if (typeof payload.documentLength === "number") {
        stats.totalDocumentLength += payload.documentLength;
      }
      // Cap the label so a weird/huge model output can't grow this object
      // unbounded, and normalize casing/whitespace loosely for grouping.
      const type = String(payload.documentType || "Unlabeled").trim().slice(0, 60) || "Unlabeled";
      stats.documentTypeCounts[type] = (stats.documentTypeCounts[type] || 0) + 1;
      break;
    }
    default:
      break;
  }
}

export function getStats() {
  const {
    totalRequests,
    completedAnalyses,
    notDocumentCount,
    errors,
    rateLimitHits,
    totalDocumentLength,
    documentTypeCounts,
    feedbackYes,
    feedbackNo,
    windowStartedAt,
  } = stats;

  const topDocumentTypes = Object.entries(documentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }));

  const rate = (n) => (totalRequests ? +(n / totalRequests).toFixed(3) : null);
  const totalFeedback = feedbackYes + feedbackNo;

  return {
    windowStartedAt: new Date(windowStartedAt).toISOString(),
    totalRequests,
    completedAnalyses,
    notDocumentCount,
    errors,
    rateLimitHits,
    completionRate: rate(completedAnalyses),
    errorRate: rate(errors),
    rateLimitHitRate: rate(rateLimitHits),
    averageDocumentLength: completedAnalyses
      ? Math.round(totalDocumentLength / completedAnalyses)
      : null,
    topDocumentTypes,
    feedbackYes,
    feedbackNo,
    totalFeedback,
    satisfactionRate: totalFeedback ? +(feedbackYes / totalFeedback).toFixed(3) : null,
    note: "In-memory, per-instance counters — resets on cold start, not a durable all-time total. See api/_stats.js for details.",
  };
}
