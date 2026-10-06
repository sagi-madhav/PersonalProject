import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Crypto from 'expo-crypto';
import {
  TimerState,
  TimerMode,
  createInitialTimerState,
  startTimer,
  pauseTimer,
  stopTimer,
  getRemainingMs,
  getElapsedMs,
  reconcileTimer,
  advancePomodoro,
} from './timerEngine';
import { useSettingsStore } from './settingsStore';
import { scheduleTimerEndNotification, cancelNotification } from './notifications';
import { focusRepo } from '../db/repos/focusRepo';
import { learnRepo } from '../db/repos/learnRepo';
import { blocksRepo } from '../db/repos/blocksRepo';
import { format } from 'date-fns';
import { notificationSuccess, lightHaptic } from './haptics';

const TIMER_STORAGE_KEY = 'planner-active-timer-v1';

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

  // Restore draft from AsyncStorage on mount
  useEffect(() => {
    async function restore() {
      try {
        const raw = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as TimerState;
          const reconciled = reconcileTimer(parsed, Date.now());
          setState(reconciled);
        }
      } catch (err) {
        console.warn('Failed to restore timer draft', err);
      }
    }
    restore();
  }, []);

  // Persist state to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // Keep screen awake while running
  useEffect(() => {
    if (state.status === 'running' && settings.keepScreenAwake) {
      activateKeepAwakeAsync('focus-timer').catch(() => {});
    } else {
      deactivateKeepAwake('focus-timer').catch(() => {});
    }
  }, [state.status, settings.keepScreenAwake]);

  // AppState listener for reconciliation
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextStatus: AppStateStatus) => {
      if (nextStatus === 'active') {
        const current = Date.now();
        setNow(current);
        setState((prev) => reconcileTimer(prev, current));
      }
    });
    return () => subscription.remove();
  }, []);

  // Foreground tick
  useEffect(() => {
    if (state.status !== 'running') return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      setState((prev) => {
        const reconciled = reconcileTimer(prev, current);
        if (reconciled.status === 'finished' && prev.status === 'running') {
          // Finished just now!
          notificationSuccess();
          // Record session
          focusRepo.insert({
            id: Crypto.randomUUID(),
            mode: prev.mode,
            label: prev.label,
            topic_id: prev.topicId,
            planned_ms: prev.plannedMs,
            actual_ms: prev.plannedMs ?? 0,
            started_at: prev.startedAt ?? current,
            ended_at: current,
            completed: 1,
          }).catch(console.error);

          if (prev.topicId && prev.plannedMs) {
            learnRepo.addTimeSpent(prev.topicId, prev.plannedMs).catch(console.error);
          }

          // Create Today timeline overlay block
          const sessionStart = new Date(prev.startedAt ?? current);
          const dateKey = format(sessionStart, 'yyyy-MM-dd');
          const startMin = sessionStart.getHours() * 60 + sessionStart.getMinutes();
          const durationMin = Math.max(1, Math.round((prev.plannedMs ?? 0) / 60000));

          blocksRepo.insert({
            id: Crypto.randomUUID(),
            title: prev.label || (prev.mode === 'pomodoro' ? 'Pomodoro Focus' : 'Focus Session'),
            kind: 'focus',
            category: prev.topicId ? 'study' : 'work',
            date: dateKey,
            start_min: startMin,
            duration_min: durationMin,
            done_at: current,
            notes: null,
            link_type: prev.topicId ? 'topic' : null,
            link_id: prev.topicId ?? null,
            created_at: current,
            updated_at: current,
          }).catch(console.error);
        }
        return reconciled;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [state.status]);

  const start = useCallback(() => {
    const current = Date.now();
    setState((prev) => {
      const started = startTimer(prev, current);
      if (started.endAt) {
        const title = started.label || (started.phase === 'focus' ? 'Focus Session Finished' : 'Break Finished');
        scheduleTimerEndNotification(started.endAt, title, 'Good job! Tap to check in.')
          .then((notifId) => {
            if (notifId) {
              setState((s) => ({ ...s, notificationId: notifId }));
            }
          })
          .catch(() => {});
      }
      return started;
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      cancelNotification(prev.notificationId).catch(() => {});
      return pauseTimer(prev, Date.now());
    });
  }, []);

  const resume = useCallback(() => {
    start();
  }, [start]);

  const stop = useCallback(() => {
    const current = Date.now();
    setState((prev) => {
      cancelNotification(prev.notificationId).catch(() => {});
      const elapsed = getElapsedMs(prev, current);
      if (elapsed > 60000) {
        // Record early stop session if > 1 minute
        focusRepo.insert({
          id: Crypto.randomUUID(),
          mode: prev.mode,
          label: prev.label,
          topic_id: prev.topicId,
          planned_ms: prev.plannedMs,
          actual_ms: elapsed,
          started_at: prev.startedAt ?? current - elapsed,
          ended_at: current,
          completed: 0,
        }).catch(console.error);

        if (prev.topicId) {
          learnRepo.addTimeSpent(prev.topicId, elapsed).catch(console.error);
        }
      }
      return stopTimer(prev);
    });
  }, []);

  const setMode = useCallback((mode: TimerMode, plannedMs?: number) => {
    setState((prev) => {
      cancelNotification(prev.notificationId).catch(() => {});
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

    const endAt = Date.now() + durationSec * 1000;
    scheduleTimerEndNotification(endAt, 'Rest Over', 'Time for your next set!')
      .catch(() => {});

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
          notificationSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [defaultDurationSec]);

  const adjustRest = useCallback((deltaSec: number) => {
    lightHaptic();
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
