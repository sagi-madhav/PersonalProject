import {
  createInitialTimerState,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getRemainingMs,
  getElapsedMs,
  reconcileTimer,
  advancePomodoro,
} from './timerEngine';

describe('timerEngine', () => {
  const ONE_MIN_MS = 60 * 1000;
  const TWENTY_FIVE_MIN_MS = 25 * ONE_MIN_MS;

  it('initializes timer state with defaults', () => {
    const state = createInitialTimerState('pomodoro', TWENTY_FIVE_MIN_MS);
    expect(state.status).toBe('idle');
    expect(state.phase).toBe('focus');
    expect(state.plannedMs).toBe(TWENTY_FIVE_MIN_MS);
    expect(state.round).toBe(1);
    expect(getRemainingMs(state, 0)).toBe(TWENTY_FIVE_MIN_MS);
    expect(getElapsedMs(state, 0)).toBe(0);
  });

  it('starts and calculates remaining time accurately', () => {
    const t0 = 1000000;
    let state = createInitialTimerState('countdown', 10 * ONE_MIN_MS);
    state = startTimer(state, t0);

    expect(state.status).toBe('running');
    expect(state.startedAt).toBe(t0);
    expect(state.endAt).toBe(t0 + 10 * ONE_MIN_MS);

    // 2 minutes later
    const t1 = t0 + 2 * ONE_MIN_MS;
    expect(getRemainingMs(state, t1)).toBe(8 * ONE_MIN_MS);
    expect(getElapsedMs(state, t1)).toBe(2 * ONE_MIN_MS);

    state = stopTimer(state);
    expect(state.status).toBe('idle');
    expect(state.startedAt).toBeNull();
  });

  it('pauses and resumes without drift', () => {
    const t0 = 1000000;
    let state = createInitialTimerState('pomodoro', TWENTY_FIVE_MIN_MS);
    state = startTimer(state, t0);

    // Run for 5 minutes then pause
    const t1 = t0 + 5 * ONE_MIN_MS;
    state = pauseTimer(state, t1);

    expect(state.status).toBe('paused');
    expect(state.elapsedBeforePauseMs).toBe(5 * ONE_MIN_MS);
    expect(state.endAt).toBeNull();
    expect(getRemainingMs(state, t1)).toBe(20 * ONE_MIN_MS);

    // Wait 10 minutes while paused
    const t2 = t1 + 10 * ONE_MIN_MS;
    expect(getRemainingMs(state, t2)).toBe(20 * ONE_MIN_MS);

    // Resume at t2
    state = resumeTimer(state, t2);
    expect(state.status).toBe('running');
    expect(state.endAt).toBe(t2 + 20 * ONE_MIN_MS);

    // Run for 3 minutes
    const t3 = t2 + 3 * ONE_MIN_MS;
    expect(getRemainingMs(state, t3)).toBe(17 * ONE_MIN_MS);
    expect(getElapsedMs(state, t3)).toBe(8 * ONE_MIN_MS);
  });

  it('detects completion upon reconcile after app backgrounding/kill', () => {
    const t0 = 1000000;
    let state = createInitialTimerState('countdown', 5 * ONE_MIN_MS);
    state = startTimer(state, t0);

    // Simulate reopening app after planned time has elapsed
    const tFuture = t0 + 6 * ONE_MIN_MS;
    const reconciled = reconcileTimer(state, tFuture);

    expect(reconciled.status).toBe('finished');
    expect(getRemainingMs(reconciled, tFuture)).toBe(0);
    expect(getElapsedMs(reconciled, tFuture)).toBe(5 * ONE_MIN_MS);
  });

  it('advances pomodoro phases correctly across 4 rounds', () => {
    let state = createInitialTimerState('pomodoro', 25 * ONE_MIN_MS);
    expect(state.phase).toBe('focus');
    expect(state.round).toBe(1);

    // Finish round 1 focus -> short break
    state = advancePomodoro(state, 25, 5, 15, 4);
    expect(state.phase).toBe('short_break');
    expect(state.round).toBe(1);
    expect(state.plannedMs).toBe(5 * ONE_MIN_MS);

    // Finish short break -> round 2 focus
    state = advancePomodoro(state, 25, 5, 15, 4);
    expect(state.phase).toBe('focus');
    expect(state.round).toBe(2);

    // Fast forward to round 4 focus
    state.round = 4;
    state.phase = 'focus';
    state = advancePomodoro(state, 25, 5, 15, 4);
    expect(state.phase).toBe('long_break');
    expect(state.plannedMs).toBe(15 * ONE_MIN_MS);

    // After long break -> reset to round 1 focus
    state = advancePomodoro(state, 25, 5, 15, 4);
    expect(state.phase).toBe('focus');
    expect(state.round).toBe(1);
  });
});
