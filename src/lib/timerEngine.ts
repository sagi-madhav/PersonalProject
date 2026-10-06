export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';
export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  mode: TimerMode;
  phase: PomodoroPhase;
  status: TimerStatus;
  plannedMs: number | null; // null for stopwatch
  startedAt: number | null; // epoch ms when this run/segment began
  endAt: number | null; // epoch ms; null for stopwatch
  elapsedBeforePauseMs: number;
  label: string | null;
  topicId: string | null;
  round: number; // 1-based pomodoro round counter
  notificationId: string | null;
}

export function createInitialTimerState(
  mode: TimerMode = 'pomodoro',
  plannedMs: number | null = 25 * 60 * 1000,
  label: string | null = null,
  topicId: string | null = null
): TimerState {
  return {
    mode,
    phase: 'focus',
    status: 'idle',
    plannedMs: mode === 'stopwatch' ? null : plannedMs,
    startedAt: null,
    endAt: null,
    elapsedBeforePauseMs: 0,
    label,
    topicId,
    round: 1,
    notificationId: null,
  };
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'running') return state;

  const planned = state.plannedMs;
  const remaining = planned != null ? Math.max(0, planned - state.elapsedBeforePauseMs) : null;
  const endAt = remaining != null ? now + remaining : null;

  return {
    ...state,
    status: 'running',
    startedAt: now,
    endAt,
  };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.startedAt == null) return state;

  const currentSegment = Math.max(0, now - state.startedAt);
  const totalElapsed = state.elapsedBeforePauseMs + currentSegment;

  return {
    ...state,
    status: 'paused',
    startedAt: null,
    endAt: null,
    elapsedBeforePauseMs: totalElapsed,
    notificationId: null,
  };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'paused') return state;
  return startTimer(state, now);
}

export function stopTimer(state: TimerState): TimerState {
  return {
    ...state,
    status: 'idle',
    startedAt: null,
    endAt: null,
    elapsedBeforePauseMs: 0,
    notificationId: null,
  };
}

export function getRemainingMs(state: TimerState, now: number): number {
  if (state.mode === 'stopwatch') return 0;
  if (state.plannedMs == null) return 0;

  if (state.status === 'idle') {
    return state.plannedMs;
  }
  if (state.status === 'paused') {
    return Math.max(0, state.plannedMs - state.elapsedBeforePauseMs);
  }
  if (state.status === 'running' && state.endAt != null) {
    return Math.max(0, state.endAt - now);
  }
  if (state.status === 'finished') {
    return 0;
  }
  return 0;
}

export function getElapsedMs(state: TimerState, now: number): number {
  if (state.status === 'idle') return 0;
  if (state.status === 'paused') return state.elapsedBeforePauseMs;
  if (state.status === 'finished') return state.plannedMs ?? state.elapsedBeforePauseMs;

  const currentSegment = state.startedAt != null ? Math.max(0, now - state.startedAt) : 0;
  return state.elapsedBeforePauseMs + currentSegment;
}

export function reconcileTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;

  if (state.mode !== 'stopwatch' && state.endAt != null && now >= state.endAt) {
    return {
      ...state,
      status: 'finished',
      startedAt: null,
      endAt: null,
      elapsedBeforePauseMs: state.plannedMs ?? 0,
      notificationId: null,
    };
  }

  return state;
}

export function advancePomodoro(
  state: TimerState,
  focusMin: number = 25,
  shortBreakMin: number = 5,
  longBreakMin: number = 15,
  roundsBeforeLongBreak: number = 4
): TimerState {
  let nextPhase: PomodoroPhase = 'focus';
  let nextRound = state.round;
  let nextPlannedMs = focusMin * 60 * 1000;

  if (state.phase === 'focus') {
    if (state.round >= roundsBeforeLongBreak) {
      nextPhase = 'long_break';
      nextPlannedMs = longBreakMin * 60 * 1000;
    } else {
      nextPhase = 'short_break';
      nextPlannedMs = shortBreakMin * 60 * 1000;
    }
  } else {
    // Coming from break
    nextPhase = 'focus';
    nextRound = state.phase === 'long_break' ? 1 : state.round + 1;
    nextPlannedMs = focusMin * 60 * 1000;
  }

  return {
    ...state,
    phase: nextPhase,
    round: nextRound,
    status: 'idle',
    plannedMs: nextPlannedMs,
    startedAt: null,
    endAt: null,
    elapsedBeforePauseMs: 0,
    notificationId: null,
  };
}
