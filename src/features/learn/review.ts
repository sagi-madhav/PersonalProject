export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30, 60] as const;

export interface ReviewResult {
  nextStage: number;
  nextReviewAt: number; // epoch ms
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates the next review date and stage using the 6-stage spaced review ladder:
 * Intervals: [1, 3, 7, 14, 30, 60] days.
 */
export function calculateNextReview(
  currentStage: number,
  outcome: 'got_it' | 'forgot',
  nowMs: number = Date.now()
): ReviewResult {
  if (outcome === 'forgot') {
    return {
      nextStage: 0,
      nextReviewAt: nowMs + ONE_DAY_MS,
    };
  }

  const nextStage = Math.min(5, Math.max(0, currentStage + 1));
  const intervalDays = REVIEW_INTERVAL_DAYS[nextStage] ?? 60;
  return {
    nextStage,
    nextReviewAt: nowMs + intervalDays * ONE_DAY_MS,
  };
}

/**
 * Initial scheduling when a topic or problem is first marked Done or queued for review.
 */
export function scheduleInitialReview(nowMs: number = Date.now()): ReviewResult {
  return {
    nextStage: 0,
    nextReviewAt: nowMs + ONE_DAY_MS,
  };
}

/**
 * Returns true if a review is due right now.
 */
export function isReviewDue(
  nextReviewAt: number | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (nextReviewAt == null) return false;
  return nextReviewAt <= nowMs;
}
