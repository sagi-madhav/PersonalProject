import {
  calculateNextReview,
  scheduleInitialReview,
  isReviewDue,
  REVIEW_INTERVAL_DAYS,
} from './review';

describe('Spaced Review Ladder', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const BASE_TIME = 1700000000000;

  test('initial review is scheduled for 1 day ahead at stage 0', () => {
    const res = scheduleInitialReview(BASE_TIME);
    expect(res.nextStage).toBe(0);
    expect(res.nextReviewAt).toBe(BASE_TIME + 1 * ONE_DAY_MS);
  });

  test('advances through stages on "got_it"', () => {
    // Stage 0 -> Stage 1 (3 days)
    let res = calculateNextReview(0, 'got_it', BASE_TIME);
    expect(res.nextStage).toBe(1);
    expect(res.nextReviewAt).toBe(BASE_TIME + 3 * ONE_DAY_MS);

    // Stage 1 -> Stage 2 (7 days)
    res = calculateNextReview(1, 'got_it', BASE_TIME);
    expect(res.nextStage).toBe(2);
    expect(res.nextReviewAt).toBe(BASE_TIME + 7 * ONE_DAY_MS);

    // Stage 2 -> Stage 3 (14 days)
    res = calculateNextReview(2, 'got_it', BASE_TIME);
    expect(res.nextStage).toBe(3);
    expect(res.nextReviewAt).toBe(BASE_TIME + 14 * ONE_DAY_MS);

    // Stage 3 -> Stage 4 (30 days)
    res = calculateNextReview(3, 'got_it', BASE_TIME);
    expect(res.nextStage).toBe(4);
    expect(res.nextReviewAt).toBe(BASE_TIME + 30 * ONE_DAY_MS);

    // Stage 4 -> Stage 5 (60 days)
    res = calculateNextReview(4, 'got_it', BASE_TIME);
    expect(res.nextStage).toBe(5);
    expect(res.nextReviewAt).toBe(BASE_TIME + 60 * ONE_DAY_MS);

    // Stage 5 -> Stage 5 (caps at 60 days)
    res = calculateNextReview(5, 'got_it', BASE_TIME);
    expect(res.nextStage).toBe(5);
    expect(res.nextReviewAt).toBe(BASE_TIME + 60 * ONE_DAY_MS);
  });

  test('resets to stage 0 and 1 day on "forgot"', () => {
    const res = calculateNextReview(4, 'forgot', BASE_TIME);
    expect(res.nextStage).toBe(0);
    expect(res.nextReviewAt).toBe(BASE_TIME + 1 * ONE_DAY_MS);
  });

  test('isReviewDue correctly checks timestamps', () => {
    expect(isReviewDue(null, BASE_TIME)).toBe(false);
    expect(isReviewDue(undefined, BASE_TIME)).toBe(false);
    expect(isReviewDue(BASE_TIME - 1000, BASE_TIME)).toBe(true);
    expect(isReviewDue(BASE_TIME, BASE_TIME)).toBe(true);
    expect(isReviewDue(BASE_TIME + 1000, BASE_TIME)).toBe(false);
  });

  test('ladder intervals match 1, 3, 7, 14, 30, 60 days', () => {
    expect(REVIEW_INTERVAL_DAYS).toEqual([1, 3, 7, 14, 30, 60]);
  });
});
