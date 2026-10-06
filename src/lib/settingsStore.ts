import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
  // Appearance
  theme: 'system' | 'light' | 'dark';
  clockFormat: '12h' | '24h';
  weekStart: 'sun' | 'mon';
  dayViewMode: 'hour' | '12h';
  windowStartHour: number;
  reduceMotion: boolean;

  // Focus
  pomodoroFocusMin: number;
  pomodoroShortBreakMin: number;
  pomodoroLongBreakMin: number;
  pomodoroRounds: number;
  keepScreenAwake: boolean;
  hapticsEnabled: boolean;

  // Train
  unit: 'kg' | 'lb';
  defaultRestSec: number;
  showRpe: boolean;
  weightStep: number;

  // Reminders
  dailyReviewReminder: boolean;
  dailyPlanReminder: boolean;

  // Actions
  updateSettings: (partial: Partial<SettingsState>) => void;
  resetDefaults: () => void;
}

const defaultSettings = {
  theme: 'system' as const,
  clockFormat: '12h' as const,
  weekStart: 'sun' as const,
  dayViewMode: 'hour' as const,
  windowStartHour: 7,
  reduceMotion: false,

  pomodoroFocusMin: 25,
  pomodoroShortBreakMin: 5,
  pomodoroLongBreakMin: 15,
  pomodoroRounds: 4,
  keepScreenAwake: true,
  hapticsEnabled: true,

  unit: 'lb' as const,
  defaultRestSec: 90,
  showRpe: false,
  weightStep: 2.5,

  dailyReviewReminder: false,
  dailyPlanReminder: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
      resetDefaults: () => set(defaultSettings),
    }),
    {
      name: 'planner-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
