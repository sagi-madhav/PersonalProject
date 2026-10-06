import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TimerState,
  TimerMode,
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
import { useSettingsStore } from './settingsStore';

export interface UseTimerReturn {
  state: TimerState;
  remainingMs: number;
  elapsedMs: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setMode: (mode: TimerMode, plannedMs?: number) => void;
  setLabel: (label: string | null, topicId?: string | null) => void;
  advance: () => void;
}

export function useTimer(
  initialMode: TimerMode = 'pomodoro',
  initialPlannedMs: number = 25 * 60 * 1000
): UseTimerReturn {
  const settings = useSettingsStore();
  const [state, setState] = useState<TimerState>(() =>
    createInitialTimerState(initialMode, initialPlannedMs)
  );
  const [now, setNow] = useState<number>(() => Date.now());

  // Foreground tick
  useEffect(() => {
    if (state.status !== 'running') return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      setState((prev) => reconcileTimer(prev, current));
    }, 250);
    return () => clearInterval(interval);
  }, [state.status]);

  const start = useCallback(() => {
    setState((prev) => startTimer(prev, Date.now()));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => pauseTimer(prev, Date.now()));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => resumeTimer(prev, Date.now()));
  }, []);

  const stop = useCallback(() => {
    setState((prev) => stopTimer(prev));
  }, []);

  const setMode = useCallback((mode: TimerMode, plannedMs?: number) => {
    setState((prev) => {
      const ms =
        mode === 'stopwatch'
          ? null
          : plannedMs ??
            (mode === 'pomodoro'
              ? settings.pomodoroFocusMin * 60 * 1000
              : 25 * 60 * 1000);
      return createInitialTimerState(mode, ms, prev.label, prev.topicId);
    });
  }, [settings.pomodoroFocusMin]);

  const setLabel = useCallback((label: string | null, topicId: string | null = null) => {
    setState((prev) => ({ ...prev, label, topicId }));
  }, []);

  const advance = useCallback(() => {
    setState((prev) =>
      advancePomodoro(
        prev,
        settings.pomodoroFocusMin,
        settings.pomodoroShortBreakMin,
        settings.pomodoroLongBreakMin,
        settings.pomodoroRounds
      )
    );
  }, [
    settings.pomodoroFocusMin,
    settings.pomodoroShortBreakMin,
    settings.pomodoroLongBreakMin,
    settings.pomodoroRounds,
  ]);

  return {
    state,
    remainingMs: getRemainingMs(state, now),
    elapsedMs: getElapsedMs(state, now),
    start,
    pause,
    resume,
    stop,
    setMode,
    setLabel,
    advance,
  };
}

export interface UseRestTimerReturn {
  isRunning: boolean;
  remainingSeconds: number;
  startRest: (durationSec?: number) => void;
  adjustRest: (deltaSec: number) => void;
  stopRest: () => void;
}

export function useRestTimer(defaultDurationSec: number = 90): UseRestTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setRemainingSeconds(0);
  }, []);

  const startRest = useCallback((durationSec: number = defaultDurationSec) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingSeconds(durationSec);
    setIsRunning(true);

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [defaultDurationSec]);

  const adjustRest = useCallback((deltaSec: number) => {
    setRemainingSeconds((prev) => Math.max(0, prev + deltaSec));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRunning,
    remainingSeconds,
    startRest,
    adjustRest,
    stopRest,
  };
}
