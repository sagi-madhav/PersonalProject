# Project Status

## Milestone: Phase 0 — Foundation (Completed)
- **Tag:** `foundation-v1`
- **Quality Gates:**
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npx expo lint`: PASS (0 errors, 0 warnings)
  - `npx jest`: PASS (5/5 tests passed)
  - `npx expo-doctor`: PASS (21/21 checks passed)
  - Ownership: Baselines defined in `docs/OWNERS.json`

### Deliverables Completed
1. **Dependencies & Environment:**
   - Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6 (strict: true).
   - Core libraries: `expo-sqlite`, `async-storage`, `zustand`, `date-fns`, `expo-crypto`, `expo-notifications`, `expo-haptics`, `expo-keep-awake`, `expo-image-picker`, `expo-image-manipulator`, `expo-file-system`, `expo-sharing`, `react-native-svg`, `react-native-markdown-display`, `jest-expo`.
2. **Theme System (`src/theme/`):**
   - Color tokens (`bg`, `surface`, `surfaceAlt`, `text`, `textSecondary`, `textTertiary`, `hairline`, `accent`, `ink`, `danger`).
   - Category palette (`work`, `study`, `health`, `life`, `other`).
   - Typography, spacing, radii tokens.
   - `useTheme()` hook with system/store switching.
3. **Shared Components (`src/components/`):**
   - `Screen`, `Text`, `Button`, `Segmented`, `Chip`, `Row`, `Sheet`, `EmptyState`, `Stepper`, `Toast`, `ProgressBar`, `Sparkline`.
4. **Database & Persistence (`src/db/`):**
   - SQLite schema (`blocks`, `focus_sessions`, `learn_progress`, `dsa_problems`, `exercises`, `exercise_photos`, `workouts`, `workout_sets`).
   - Migration runner with `PRAGMA user_version`.
   - TypeScript types for all tables (`src/db/types.ts`).
   - Repositories: `blocksRepo`, `focusRepo`, `learnRepo`, `dsaRepo`, `exercisesRepo`, `workoutsRepo`.
5. **Core Logic & Libraries (`src/lib/`):**
   - `time.ts`: Date keys, minutes conversions, 15-minute snap, formatting.
   - `units.ts`: kg/lb conversions, Epley 1RM, volume calculations.
   - `haptics.ts`: Haptic feedback with settings toggle check.
   - `settingsStore.ts`: Zustand store with AsyncStorage persistence for all settings.
   - `timerEngine.ts`: Pure reducer for Pomodoro/Countdown/Stopwatch + 5 unit tests (`timerEngine.test.ts`).
   - `notifications.ts`: Local scheduled notification helpers.
   - `useTimer.ts`: Hooks for `useTimer()` and `useRestTimer()`.
6. **Cross-Agent Stubs:**
   - `<RolloverBanner />` in `src/features/blocks/RolloverBanner.tsx`.
   - `getLearnTopicTitle(id)` in `src/features/learn/api.ts`.
7. **Route Skeleton (`app/`):**
   - Tab layout with SF Symbols (`Today`, `Calendar`, `Focus`, `Learn`, `Train`).
   - Modals and sheets: `/workout/active`, `/block/[id]`, `/inbox`, `/settings`.
   - Sub-routes for learn and train.
   - Route documentation in `docs/ROUTES.md`.

## Next Phase: Phase 1 — Feature Agents
Roster per Section 16.6:
- `timeline` (M3a): Timeline Hour + 12h, now line, gaps, block layout
- `blocks-calendar` (M3b, M5): Quick-add sheet, Inbox sheet, rollover, month grid + agenda
- `focus` (M4): Timer UI, modes, notifications, session log, stats
- `train` (M6): Exercise library, photos, workout logger, history
- `learn` (M7): Content loader, lesson view, review ladder, DSA tracker, system design
- `content`: Bundled lessons
- `settings` (M2b): Settings screen & JSON backup/restore
