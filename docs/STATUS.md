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

## Milestone: Phase 1 — Settings & Backup (Completed)
- **Tag:** `settings-v1`
- **Quality Gates:** All passing (Unit tests for JSON schema validate/export/import).

## Milestone: Phase 1 — Focus & Timers (Completed)
- **Tag:** `focus-v1`
- **Quality Gates:** All passing (Timer engine, background timestamps, notifications, 7-day sparkline).

## Milestone: Phase 1 — Today Timeline (Completed)
- **Tag:** `timeline-v1`
- **Quality Gates:** All passing (Packing algorithm, hour markers, 12h formatting, now-line, gaps).

## Milestone: Phase 1 — Blocks & Calendar (Completed)
- **Tag:** `blocks-calendar-v1`
- **Quality Gates:** All passing (Month grid calculation, quick-add sheet, inbox triage, rollover banner).

## Milestone: Phase 1 — Train (Completed)
- **Tag:** `train-v1`
- **Quality Gates:**
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npx expo lint`: PASS (0 errors, 0 warnings)
  - `npm test`: PASS (24/24 tests passed across 6 suites)
  - Ownership: Checked via `node scripts/check-ownership.mjs train` (PASS)
- **Deliverables:**
  - `src/features/train/previous.ts` & unit tests (`previous.test.ts`): Fast previous set lookups (Hevy-style).
  - `src/features/train/seedExercises.ts`: 17 curated exercises for Upper / Lower + Biceps split with auto-seeding.
  - `src/features/train/RestBar.tsx`: Floating rest countdown bar with -15s/+15s and skip.
  - `app/(tabs)/train/exercises/index.tsx` & `[id].tsx`: Exercise library, search, muscle filter, machine setup & swipeable photo carousel with camera/picker support.
  - `app/workout/active.tsx`: Full-screen workout logger with draft persistence in AsyncStorage, dual weight live conversion (primary `lb` + secondary `kg`), auto rest trigger, PR detection, keep-awake.
  - `app/(tabs)/train/history.tsx`: Workout history list with sets count, duration, and volume.
  - `app/(tabs)/train/index.tsx`: Train home dashboard with dynamic Start/Resume CTA, 7-day workout activity dots, this-week volume & session stats, and recent workout cards.

## Milestone: Phase 1 — Learn & Content (Completed)
- **Tag:** `learn-v1`
- **Quality Gates:**
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npx expo lint`: PASS (0 errors, 0 warnings)
  - `npm test`: PASS (29/29 tests passed across 7 suites)
  - Ownership: Checked via `node scripts/check-ownership.mjs learn` & `node scripts/check-ownership.mjs content` (PASS)
- **Deliverables:**
  - `src/features/learn/review.ts` & unit tests (`review.test.ts`): Spaced review ladder intervals [1, 3, 7, 14, 30, 60] days with Got it / Forgot state transitions.
  - `content/`: Typed starter curriculum with 18 high-quality lessons across Python 101, DSA 101, and System Design:
    - Python 101: 6 bundled lessons + Python Cheat Sheet markdown reference.
    - DSA 101: 6 bundled lessons + 15 algorithm pattern categories.
    - System Design: 6 bundled lessons + 12 architectural building blocks deck + 8 case studies.
  - `app/(tabs)/learn/index.tsx`: Learn home dashboard with track segmented switcher (Python, DSA, System Design), track % progress, "Review due" card, module cards with progress bars, and track extras tiles.
  - `app/(tabs)/learn/review.tsx`: Dedicated spaced review card session with tap-to-reveal key points and Got it / Forgot actions.
  - `app/(tabs)/learn/[track]/[topicId].tsx`: Rich lesson reader with markdown formatting, status cycler, personal notes autosave, Start Focus action, and Schedule Study action.
  - `app/(tabs)/learn/python-cheatsheet.tsx`: Fast syntax reference for slicing, comprehensions, and stdlib.
  - `app/(tabs)/learn/dsa-problems.tsx`: LeetCode & DSA problems tracker with status stepper, attempts counter, difficulty filters, and "+ Add to Spaced Review" queue.
  - `app/(tabs)/learn/system-design-deck.tsx`: Interactive cards for 12 building blocks and 8 case studies.
  - `app/(tabs)/learn/case-study/[id].tsx`: Case study template notes page with the 7 fixed engineering sections and JSON persistence in `learn_progress.notes`.

## Milestone: Phase 2 — Integrator & Polish (Completed)
- **Tag:** `app-v1`
- **Quality Gates:**
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npx expo lint`: PASS (0 errors, 0 warnings)
  - `npm test`: PASS (29/29 tests passed across 7 suites)
  - `npx expo-doctor`: PASS (21/21 checks passed)
- **Deliverables & Cross-Feature Integration:**
  - **Focus → Learn:** Completed focus sessions with a topic ID automatically increment `learn_progress.time_spent_ms`.
  - **Focus → Today:** Completed focus sessions create an outlined `focus` block on Today's timeline at the actual session time.
  - **Train → Today & Calendar:** Finished workouts automatically create an outlined `workout` block on Today's timeline and mark the Calendar day with a health activity dot.
  - **Learn → Schedule:** Tapping "Schedule Study" inside any lesson opens the Block Editor pre-filled with `kind: 'study'`, title, and `link_type: 'topic'`.
  - **Block → Lesson/Workout:** Blocks with topic or workout links display direct navigation buttons to jump straight into the linked lesson or workout history.
  - **Block → Focus:** Editing any existing task block provides a one-tap "Start Focus Session" action with the block title pre-populated as the timer label.
  - **Learn Tab Review Badge:** The tab bar displays a live accent dot badge on the "Learn" tab whenever cards are due for spaced review.
  - **100% Offline, Zero Network Calls:** Verified fully functional with local SQLite storage and AsyncStorage persistence.
