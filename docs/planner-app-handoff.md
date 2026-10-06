# Minimalist Planner App — Handoff Spec

**Target:** iPhone 13 Pro Max (iOS), run through Expo Go, developed on a Windows PC
**Stack:** Expo (React Native) + TypeScript + Expo Router
**Researched:** 2026-10-06 (Expo SDK 57 / React Native 0.86 were current; re-check versions before starting)
**Audience:** you, or a coding agent (Claude Code, Cursor, etc.) building this app. Hand this whole file over as the first message.

---

## 0. How to use this file

1. Read sections 1–4 (principles, stack, navigation, data rules) fully before writing code.
2. Build in the order of section 14 (milestones). Do not start a later milestone until the earlier one's acceptance checks pass. **To build faster with several agents in parallel, use section 16 instead** — it maps the same milestones onto agents with file ownership, worktrees, quality gates, and ready-to-paste prompts.
3. Every screen spec (sections 5–10) lists: purpose, layout, elements, interactions, data, empty state, edge cases. Treat these as requirements.
4. Section 12 lists what is **out of scope** for v1. Do not add it.
5. Ask before adding any dependency not listed in section 2.

### Rules for the coding agent
- TypeScript `strict: true`. No `any`. Small files (< 250 lines); one component per file.
- No UI kit (no NativeBase, Paper, Tamagui, etc.). All UI is hand-built from the tokens in section 11 — the app is small and minimalism is the point.
- No network calls. The app is 100% offline and local-first in v1.
- All dates/times follow the rules in section 4. Never store a formatted date string for logic.
- Every interactive element ≥ 44×44 pt hit area, has an `accessibilityLabel`, and works with Dynamic Type.

---

## 1. Product summary and principles

A single-user, offline, personal operating system for the day: **plan the day on a timeline, focus with a timer, study three tracks (Python, DSA, System Design), and log gym workouts with machine photos and notes.**

Design principles:
1. **One screen, one job.** Each tab does one thing; secondary actions live in sheets.
2. **Capture fast, organize later.** An Inbox accepts a thought in under 3 seconds (pattern used by Structured and Mono Task).
3. **Time is visible.** The day is a vertical timeline with a "now" line and visible free gaps.
4. **Quiet UI.** Off-white/near-black, hairlines instead of shadows, one accent color, type does the hierarchy.
5. **Nothing is lost.** Active timer and in-progress workout survive app kill (persist state continuously).
6. **Zero setup friction.** No accounts, no onboarding carousel. First launch lands on Today with an empty timeline.

Assumptions I made (flag if wrong — see section 15):
- **"Hour view"** = full 24-hour scrolling timeline, one hour per row (comfortable, scroll).
- **"12-hour view"** = a compact window of 12 waking hours (default 7 AM–7 PM, configurable) scaled to fit one screen with no scrolling. Separate from the **12h/24h clock-format** setting, which also exists.
- **Python 101 / DSA 101 / System Design** = bundled study material (markdown lessons) **plus** progress tracking, notes, and spaced review. Not just empty trackers.

---

## 2. Tech stack and environment

### 2.1 Versions (verify at project creation)
- Expo SDK 57 (React Native 0.86, React 19.2). Expo Go on the iOS App Store now supports SDK 57.
- **Expo Go only runs the SDK version it ships with.** If `expo start` reports a version mismatch, update Expo Go from the App Store or create the project on the matching SDK. Don't fight it.
- As of the Sept 2026 Expo Go update, **you must be logged in to the same Expo account in both the CLI (`npx expo login`) and the Expo Go app** (Home → avatar icon, top right) to load a dev project.
- Node: use a current LTS (SDK 57 templates have been reported to need Node 22.13+; run `npx expo-doctor` to confirm).

### 2.2 Windows dev setup
```
npx create-expo-app@latest planner
cd planner
npx expo login
npx expo start
```
- Scan the QR code with the iPhone Camera → opens in Expo Go. PC and phone must be on the same Wi-Fi.
- If the phone can't connect: allow Node.js through Windows Firewall (private networks), or run `npx expo start --tunnel`.
- You cannot build iOS binaries locally on Windows. Staying inside Expo Go avoids that entirely. Anything needing a custom native build (widgets, Live Activities, Apple Watch) is out of scope for v1.

### 2.3 Dependencies (install with `npx expo install` so versions match the SDK)
| Purpose | Package |
|---|---|
| Navigation | `expo-router` (file-based; included in the default template) |
| Database | `expo-sqlite` |
| Small settings | `@react-native-async-storage/async-storage` |
| Ephemeral/UI state | `zustand` |
| Dates | `date-fns` |
| IDs | `expo-crypto` (`randomUUID`) |
| Notifications (local only) | `expo-notifications` |
| Haptics | `expo-haptics` |
| Keep screen awake | `expo-keep-awake` |
| Camera / photos | `expo-image-picker`, `expo-image-manipulator` |
| Files | `expo-file-system`, `expo-sharing` (for export) |
| Icons | `expo-symbols` (SF Symbols, iOS-only — fits an iPhone-only app) |
| Gestures/animation | `react-native-gesture-handler`, `react-native-reanimated` (usually already in template) |
| Charts / drawing | `react-native-svg` (hand-rolled sparkline/line charts) |
| Markdown (lessons) | a lightweight RN markdown renderer, e.g. `react-native-markdown-display` (confirm it works on the current RN before committing) |
| Image display | `expo-image` |

**Avoid in Expo Go:** `react-native-mmkv` and any library requiring custom native code. SQLite + AsyncStorage cover everything.

### 2.4 Expo Go limits that shape the design
- **Local scheduled notifications work in Expo Go.** Remote push does not (and isn't needed).
- **iOS keeps only about 64 pending local notifications per app.** Never schedule more than ~50; reschedule on app open.
- **JavaScript stops when the app is backgrounded/locked.** A `setInterval` timer cannot be trusted. The timer must be timestamp-based (section 6) and use a local notification to alert at the end.
- **Data lives inside Expo Go's sandbox.** Deleting/reinstalling Expo Go deletes the database and photos. Therefore **Export/Backup (Settings) is a v1 requirement, built early**, not a nice-to-have.
- Camera/photo-library permission prompts will name Expo Go. That's expected during development.

### 2.5 Device facts (iPhone 13 Pro Max)
- 6.7" display, logical size 428 × 926 pt, ProMotion 120 Hz, notch (no Dynamic Island). Typical safe-area insets: top ≈ 47 pt, bottom ≈ 34 pt. **Never hardcode these** — use `react-native-safe-area-context` (`useSafeAreaInsets`).
- Plan for one-handed use: primary actions in the lower half of the screen; the tab bar and bottom sheets carry the important controls.

---

## 3. Information architecture

Five bottom tabs. Eight requested features fit by grouping — tab bars beyond five get cramped.

| # | Tab | Contains | Icon (SF Symbol) |
|---|---|---|---|
| 1 | **Today** | Hour view + 12-hour view (segmented), Inbox sheet | `calendar.day.timeline.left` or `clock` |
| 2 | **Calendar** | Month grid + selected-day agenda | `calendar` |
| 3 | **Focus** | Timer (Pomodoro / Countdown / Stopwatch) | `timer` |
| 4 | **Learn** | Segmented: Python 101 · DSA 101 · System Design | `book` |
| 5 | **Train** | Workout logger, exercise library (photos + notes), history | `dumbbell` |

Global (not tabs):
- **Settings** — gear icon in Today's header, pushes a screen.
- **Inbox** — bottom sheet opened from Today header (badge count).
- **Quick-add** — "+" in Today's header opens the same sheet used when tapping an empty timeline slot.

Tab bar: icons with tiny labels, active = primary text color, inactive = secondary text color. No colored pill, no badges except the Inbox count on Today (and a dot on Learn when reviews are due).

### Suggested folder structure (Expo Router)
```
app/
  _layout.tsx                 # root: theme, db init, notification handler
  (tabs)/
    _layout.tsx               # tab bar
    index.tsx                 # Today
    calendar.tsx
    focus.tsx
    learn/
      index.tsx               # segmented tracks + review-due
      [track]/index.tsx       # module/topic list
      [track]/[topicId].tsx   # lesson
    train/
      index.tsx               # start workout, this week, recent
      history.tsx
      exercises/index.tsx
      exercises/[id].tsx
  workout/active.tsx          # full-screen modal
  block/[id].tsx              # edit block (sheet)
  inbox.tsx                   # sheet
  settings.tsx
src/
  db/            # schema.ts, migrations.ts, repositories (blocks.ts, focus.ts, workouts.ts, learn.ts)
  features/      # today/, calendar/, focus/, learn/, train/, settings/
  components/    # Screen, Text, Button, Sheet, Chip, Segmented, Row, EmptyState
  theme/         # tokens.ts, useTheme.ts
  lib/           # time.ts, notifications.ts, haptics.ts, units.ts, backup.ts
content/
  python-101/*.md  dsa-101/*.md  system-design/*.md
```

---

## 4. Data rules (apply everywhere)

- **Storage:** `expo-sqlite` for all domain data. AsyncStorage (or a `settings` table) for small preferences. Run versioned migrations at launch (`PRAGMA user_version`).
- **IDs:** UUID strings from `expo-crypto`.
- **Planned time ("floating"):** store as `date` (`'YYYY-MM-DD'`, local) + `start_min` (minutes from midnight, 0–1439). Planned blocks must **not** shift if the time zone changes.
- **Logged time (actual events):** store epoch milliseconds (UTC) — focus sessions, workouts, set completions.
- **Never store absolute photo URIs.** The app's document directory path can change. Store a **filename** and resolve to the full path at read time.
- **Soft rules:** deleting something moves nothing to a trash in v1 — but destructive actions need a confirm (or an Undo toast for single-item deletes).
- **Persist drafts:** the active timer and the in-progress workout are written to storage on every change and restored at launch.

### Schema (v1)
```sql
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,              -- 'task' | 'event' | 'focus' | 'workout' | 'study'
  category TEXT NOT NULL DEFAULT 'other',  -- 'work'|'study'|'health'|'life'|'other'
  date TEXT,                       -- local 'YYYY-MM-DD'; NULL = Inbox
  start_min INTEGER,               -- NULL = unscheduled / all-day
  duration_min INTEGER,            -- NULL = untimed
  done_at INTEGER,                 -- epoch ms or NULL
  notes TEXT,
  link_type TEXT,                  -- 'topic' | 'workout' | NULL
  link_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_blocks_date ON blocks(date);

CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,              -- 'pomodoro' | 'countdown' | 'stopwatch'
  label TEXT,                      -- free text or topic title
  topic_id TEXT,                   -- optional Learn link
  planned_ms INTEGER,
  actual_ms INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  completed INTEGER NOT NULL       -- 1 = ran to the end, 0 = stopped early
);

CREATE TABLE learn_progress (
  topic_id TEXT PRIMARY KEY,       -- matches content frontmatter id
  status TEXT NOT NULL DEFAULT 'todo',    -- 'todo' | 'learning' | 'done'
  notes TEXT,
  review_stage INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at INTEGER,
  next_review_at INTEGER,          -- epoch ms; NULL = not scheduled
  time_spent_ms INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE dsa_problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  pattern TEXT,                    -- 'two-pointers' | 'sliding-window' | ...
  difficulty TEXT,                 -- 'easy' | 'medium' | 'hard'
  status TEXT NOT NULL DEFAULT 'todo',    -- 'todo' | 'attempted' | 'solved' | 'review'
  attempts INTEGER NOT NULL DEFAULT 0,
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  solved_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT,               -- 'chest'|'back'|'legs'|'shoulders'|'arms'|'core'|'other'
  equipment TEXT,                  -- 'machine'|'barbell'|'dumbbell'|'cable'|'bodyweight'|'other'
  setup TEXT,                      -- short line: "Seat 4, pad 3, pin 7"
  notes TEXT,                      -- cues, form reminders
  default_rest_sec INTEGER,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE exercise_photos (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,          -- NOT a full path
  caption TEXT,
  taken_at INTEGER NOT NULL
);

CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  title TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  notes TEXT
);

CREATE TABLE workout_sets (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  position INTEGER NOT NULL,       -- order in workout
  set_number INTEGER NOT NULL,
  weight_kg REAL,                  -- ALWAYS store kg; convert for display
  reps INTEGER,
  rpe REAL,
  is_warmup INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER             -- NULL = planned but not done
);
CREATE INDEX idx_sets_exercise ON workout_sets(exercise_id, completed_at);
```

---

## 5. TODAY tab — Hour view and 12-hour view

**Purpose:** see and shape the day. The most-used screen; it must be excellent.

### Layout
```
┌────────────────────────────────┐
│ Tue, Oct 6          ⚙   ＋  ⌥3 │  header: date (tap = date picker), settings, add, inbox (count)
│ ‹ Mon        Wed ›   [Hour|12h]│  day pager + segmented control
├────────────────────────────────┤
│ 7 AM ─────────────────────────  │
│                                │
│ 8 AM ┌────────────────────┐    │
│      │ Deep work           │    │  block (category-tinted fill, 4pt left bar)
│ 9 AM └────────────────────┘    │
│      · 1h 15m free ·           │  faint gap label (gaps ≥ 45 min)
│ ●━━━━━━━━━━━━━━ 10:42 ━━━━━━━  │  "now" line (accent), dot at left
│ 11 AM ┌──────────┐             │
│       │ Gym       │             │
└────────────────────────────────┘
```

### Modes
| | **Hour** | **12h** |
|---|---|---|
| Range | 00:00–24:00, vertical scroll | Configurable window, default 07:00–19:00 |
| Row height | Fixed 64 pt per hour | Computed so the window exactly fills the available height (≈ 55 pt/hr on a 13 Pro Max) — no scroll |
| Initial scroll | Current time minus ~1 hour (today) / 7 AM (other days) | none |
| Use | Planning, long days, night owl | Glanceable day, screenshot-style overview |
Mode choice persists across launches. Blocks outside the 12h window show as small edge markers ("↑ 2 earlier" / "↓ 1 later") that switch to Hour mode on tap.

### Elements
- **Header:** large date (e.g. "Tue, Oct 6"); "Today" pill appears when viewing another day. Right side: Inbox icon with count, "+" icon, settings gear.
- **Day pager:** swipe the timeline horizontally to change day; chevrons for accessibility.
- **Progress line (optional, subtle):** "3 of 7 done" in secondary text under the date.
- **Hour gutter:** left column with hour labels (12h or 24h per setting), tabular numerals, secondary color. Hairline across each hour; lighter hairline at half-hours in Hour mode only.
- **Now line:** accent color, 1.5 pt, dot at left, time label at right. Updates every minute (only while screen focused).
- **Blocks:** rounded rectangle (radius 8), soft category tint fill, 3–4 pt solid left bar in the category color, title (1–2 lines), time range as caption if height ≥ 44 pt. Tasks show a circle checkbox at left; done tasks get strikethrough + reduced opacity. Minimum visual height 24 pt (title only, single line).
- **Overlaps:** pack into side-by-side columns (simple interval column-packing); max 3 columns, then show "+N".
- **Free-time gaps:** faint centered caption in gaps ≥ 45 min ("1h 15m free"). Only in Hour mode.
- **Logged activity overlays:** completed focus sessions and workouts appear as thin outlined (not filled) blocks at their *actual* times, so planned vs. actual is visible.

### Interactions
- **Tap empty slot** → quick-add sheet pre-filled with that time (snapped to 15 min), duration 30 min.
- **Long-press a block** → haptic pick-up, drag to move (snap 15 min); drag bottom handle to resize. Auto-scroll when dragging near edges (Hour mode).
- **Tap block** → edit sheet (title, category, date, start, duration, notes, link, delete).
- **Tap checkbox** → toggle done (light haptic).
- **Swipe left on a block** → Move to Inbox. (Swipe actions are optional in v1; the edit sheet must offer the same.)
- **Pinch to change zoom:** *not* in v1.

### Quick-add sheet (shared component)
Fields in this order: **Title** (autofocus) → **When** (chip row: Inbox · Today · Tomorrow · pick date; time + duration steppers appear only when not Inbox) → **Category** (5 chips) → **Notes** (collapsed). Save button anchored above the keyboard. Natural-language parsing ("gym 6pm 1h") is a v1.1 idea — don't build now.

### Inbox sheet
- List of blocks where `date IS NULL`, newest first. Row: title + category dot. Actions: tap → edit; swipe right → "Schedule" (opens the time picker with today pre-selected); swipe left → delete.
- Top of sheet: single-line input to capture instantly (Enter = add and keep focus).
- "Shuffle" button (inspired by Mono Task's random-task feature) is optional; skip in v1.

### Rollover (inspired by Structured's "Replan")
At launch each day, if yesterday has undone tasks, show a one-line banner on Today: "3 unfinished from yesterday — Move to today / Inbox / Dismiss". No automatic rescheduling.

### Data and cross-links
- Source: `blocks` for the selected date; `focus_sessions` and `workouts` overlaid by `started_at`.
- A Learn topic can be scheduled as a `study` block (link_type `topic`); tapping it opens the lesson.
- Starting a Focus session from a block pre-fills the label and links `block_id` context (just pass the block title as the label; no FK needed in v1).

### Empty / edge states
- Empty day: timeline still shown (that's the point). A faint centered line, "Nothing planned. Tap a time to add.", disappears after the first block.
- Midnight crossing: blocks cannot cross midnight in v1 (clamp duration to 24:00).
- Daylight-saving days: rows follow clock hours (floating model); no special handling beyond not crashing.

---

## 6. FOCUS tab — Timer

**Purpose:** start a timer in one tap and trust it to be accurate and to alert you even with the phone locked.

### Modes (segmented at top)
1. **Pomodoro** — default 25 focus / 5 short break / 15 long break after 4 rounds (all configurable in Settings). Auto-advances to the next phase but waits for a tap to start it (no surprise starts).
2. **Countdown** — pick any duration (presets: 10 · 25 · 45 · 60 · 90 min, plus custom with a wheel picker).
3. **Stopwatch** — counts up; lap not needed.

### Layout
```
┌────────────────────────────────┐
│ Pomodoro · Countdown · Stopwatch│
│                                │
│          FOCUS 2/4             │  phase label, small caps, secondary
│                                │
│          24:31                 │  huge light numerals, tabular
│       ──────────────           │  thin progress bar (no heavy ring)
│                                │
│   Label: DSA – Two pointers ▾  │  label chip (opens picker)
│                                │
│      [  Pause  ]  [ Stop ]     │  one primary, one quiet secondary
│                                │
│  Today  1h 40m · 4 sessions    │  footer stat
└────────────────────────────────┘
```
- Time numerals ~72–88 pt, light weight, `fontVariant: ['tabular-nums']`; cap Dynamic Type scaling with `maxFontSizeMultiplier={1.2}` on this element only.
- Primary button is large, pill-shaped, text-only. Idle state: single **Start**.
- **Label picker:** free text, recent labels, the five categories, and Learn topics (recent). Selecting a topic accumulates `time_spent_ms` on its `learn_progress`.
- Keep screen awake while running (toggle in Settings; default on while this screen is foregrounded).
- Haptics: light tap on start/pause; success notification haptic on completion.

### Timer engine (critical — do not use a decrementing counter)
State persisted to storage on every change:
```ts
type TimerState = {
  mode: 'pomodoro' | 'countdown' | 'stopwatch';
  phase: 'focus' | 'short_break' | 'long_break';
  status: 'idle' | 'running' | 'paused' | 'finished';
  plannedMs: number | null;      // null for stopwatch
  startedAt: number | null;      // epoch ms when this run (or resume) began
  endAt: number | null;          // epoch ms; null for stopwatch
  elapsedBeforePauseMs: number;  // accumulated time from earlier segments
  label: string | null;
  topicId: string | null;
  round: number;                 // pomodoro round counter
  notificationId: string | null;
};
```
Rules:
- `remainingMs = max(0, endAt - Date.now())`; `elapsedMs = elapsedBeforePauseMs + (Date.now() - startedAt)`. The UI re-renders from a ~250 ms interval **only while foregrounded**; the interval never holds state.
- On **Start/Resume**: compute `endAt`, schedule a local notification for `endAt`, store its id.
- On **Pause**: cancel the notification, fold elapsed time into `elapsedBeforePauseMs`, clear `startedAt`.
- On **AppState → 'active'**: recompute from timestamps. If `endAt <= now` and status was running → finish.
- On **finish (foreground or detected on launch):** record a `focus_sessions` row (`completed = 1`, `actual_ms = plannedMs`), haptic if foregrounded, advance pomodoro phase to idle-next.
- On **Stop early:** confirm only if > 1 min elapsed; record `completed = 0` with actual elapsed.
- Notification content: title = label or "Timer done"; body = next phase hint. Request permission the first time the user starts a timer (explain in one line in-app before the system prompt).

### Reuse: Rest timer
The workout logger's rest timer uses the same engine (countdown, silent label "Rest"). Build the engine as a standalone module (`src/lib/timerEngine.ts`) plus a `useTimer` hook so both features share it.

### Stats (footer + tap to expand into a sheet)
Today total, this week total, current streak (days with ≥ 1 completed session), 7-day bar sparkline. Minimal — no leaderboards.

---

## 7. CALENDAR tab

**Purpose:** navigate by month and jump to any day.

### Layout
- Header: month + year (tap = jump-to-month picker), "Today" pill, prev/next chevrons. Horizontal swipe changes month.
- **Month grid:** 7 columns, 6 rows max; weekday initials in secondary caption; week start configurable (Sun/Mon). Build it **custom with `date-fns`** — a month grid is ~80 lines and avoids fighting a library's styling. (`react-native-calendars` is an acceptable fallback if time-pressed.)
- **Day cell:** number centered; selected = filled circle in primary color (inverted text); today = accent-colored number or ring when not selected. Below the number up to 3 tiny dots (category colors) for blocks; a small tick-style mark if a workout was logged; days outside the month at 30% opacity.
- **Agenda list** under the grid for the selected day: chronological blocks (time column + title), then "No plans." Tapping a row opens the edit sheet. A quiet **"Open day"** text button switches to Today at that date.
- Optional toggle (Settings, off by default): include logged focus/workout summaries in the agenda.

### Data
`blocks` grouped by `date` for the visible month (query once per month, memoize by month key). Workout days from `workouts.started_at` converted to local dates.

### Later (not v1)
Read-only import of the iPhone's calendar via `expo-calendar` (needs a permission and a "which calendars" picker). Structured Pro offers this; it's the most valuable v1.1 addition because it makes the planner show real commitments.

---

## 8. LEARN tab — Python 101 · DSA 101 · System Design

**Purpose:** a tiny personal curriculum with notes, progress, and spaced review.

### Learn home
- Segmented control: **Python · DSA · System Design**.
- **"Review due"** card at top (count + "Start review") when any `next_review_at <= now`. Hidden when zero.
- Under it, a module list: each module row shows title, `done/total`, and a thin progress bar.
- Header right: overall % complete for the selected track.

### Content model (bundled, read-only)
Lessons are markdown files in `content/<track>/NN-slug.md` with frontmatter:
```yaml
---
id: py-007-dicts
track: python            # python | dsa | system-design
module: Core data structures
order: 7
title: Dictionaries
estMinutes: 15
tags: [dict, hashing]
---
```
Body: short summary → key points → code samples (fenced blocks) → "Try it" prompts → "Common mistakes". Keep each lesson to ~1 screen-and-a-half. Progress and notes live in `learn_progress`, keyed by `id`. Because content is bundled, new lessons ship as app updates; fine for a personal app. (Start with 5–8 lessons per track and add more as you go; the app must not require all content to exist.)

Import strategy: a build-time script (or a `content/index.ts` using `require` of raw markdown via Metro config) produces a typed array of lesson metadata. The coding agent picks the simplest approach that works in Expo Go without ejecting.

### Lesson screen
Top → bottom: title, meta row (module · est. minutes), status chip (Todo / Learning / Done — tap cycles), body (rendered markdown; code blocks in monospace `Menlo`, horizontally scrollable, copy button), **My notes** (multiline field, autosaves), footer actions: **Start focus session** (opens Focus with the topic as label), **Schedule** (creates a `study` block), **Mark done** (sets `done` and schedules first review at +1 day).
Reading comfort: body 17 pt, line-height ~1.5, max content width ~ 680 pt (matters little on iPhone, but keep it as a token).

### Spaced review (simple ladder, not full SM-2)
`review_stage` 0→5 maps to intervals **1, 3, 7, 14, 30, 60 days**. In review mode, show the lesson's title + key-points collapsed; user taps to reveal, then **"Got it"** (stage +1, schedule next) or **"Forgot"** (stage → 0, due tomorrow). One card at a time, big buttons at the bottom.

### Track-specific extras
**Python 101** — lessons plus a **Cheat sheet** page (a single markdown file with syntax snippets: string formatting, slicing, comprehensions, `with`, dataclasses, typing, common stdlib). No code execution on-device in v1.

**DSA 101** — lessons plus a **Problems tracker** (table `dsa_problems`):
- List with filter chips (status, pattern, difficulty) and a search field.
- Add sheet: title, URL (optional), pattern, difficulty. Row shows title, difficulty dot, pattern chip, status.
- Problem detail: status stepper (Todo → Attempted → Solved → Review), attempts counter (+1 button), time spent (can be fed from Focus), notes field ("approach + complexity + mistake"), "Mark for review" (adds to the spaced-review queue using the same ladder).
- Patterns list (editable constant): arrays/hashing, two pointers, sliding window, stack, binary search, linked list, trees, tries, heap/priority queue, graphs (BFS/DFS), backtracking, DP, greedy, intervals, bit manipulation.

**System Design** — lessons plus:
- **Building blocks** deck: load balancer, cache, CDN, queue, DB (SQL/NoSQL), sharding, replication, consistent hashing, rate limiter, API gateway, blob store, search index.
- **Case studies** list (URL shortener, rate limiter, news feed, chat, notifications, file storage, ride sharing, web crawler…). Each case study opens a **template notes page** with fixed sections the user fills in: *Requirements (functional / non-functional) → Estimation → API → Data model → High-level design → Deep dives → Trade-offs & failure modes.* Stored as sections in `learn_progress.notes` (JSON) or a small `design_notes` table.

### Seed curriculum (topic list for content creation)
- **Python:** setup & venv/pip · types & variables · strings · lists/tuples · dicts/sets · control flow · functions & scope · comprehensions · classes & dataclasses · modules & packages · files & exceptions · iterators & generators · decorators · typing hints · testing with pytest · virtual envs & packaging basics.
- **DSA:** Big-O · arrays & strings · hash maps · two pointers · sliding window · stacks & queues · linked lists · binary search · recursion & backtracking · trees & BST · heaps · graphs (BFS/DFS) · dynamic programming · greedy · tries · union-find · sorting algorithms.
- **System design:** scalability basics · load balancing · caching strategies · SQL vs NoSQL · indexing · replication & sharding · CAP & consistency models · message queues · CDN · API design (REST/gRPC) · rate limiting · consistent hashing · observability · back-of-envelope estimation.

---

## 9. TRAIN tab — Workout logger

**Purpose:** log sets fast in the gym, see what you did last time, and keep photos + notes for each machine.

### Train home
- Large primary button: **Start workout** (or **Resume workout** if a draft exists).
- Secondary row: **Exercises** · **History**.
- "This week": sessions count, total volume, mini 7-day dot row.
- "Recent": last 3 workouts as rows (date, title or muscle summary, duration, volume).

### Active workout (full-screen modal)
```
┌────────────────────────────────┐
│ ✕   Workout · 00:42:10  [Finish]│
├────────────────────────────────┤
│ [photo] Chest Press (machine)  │  exercise header; tap photo → machine sheet
│  Seat 4 · pad 3                │  setup line (from exercise.setup)
│  Set  Previous   kg   Reps  ✓  │
│  1    60×10      60   10    ●  │
│  2    60×9       60   __    ○  │
│  ＋ Add set                    │
│ ──────────────────────────────  │
│ [photo] Lat Pulldown …         │
│                                │
│ ＋ Add exercise                │
├────────────────────────────────┤
│ Rest 01:12  ━━━━━━━━○───  ✕    │  floating rest bar (only while running)
└────────────────────────────────┘
```
- **Set row:** set number, **Previous** (value from the last completed workout containing that exercise at the same set number; tap to copy into the fields — Hevy-style), weight field, reps field, check button. Weight/reps use a numeric keypad with big "+/−" quick-steppers (±2.5 kg / ±1 rep, configurable). Optional columns: RPE (toggle in Settings), warm-up flag (long-press the set number).
- **Completing a set:** light haptic, row fills subtly, **rest timer starts automatically** (default 90 s or the exercise's `default_rest_sec`; the rest bar offers −15 / +15 s and skip). Rest end = local notification + haptic (shares the timer engine).
- **Live PR flash:** if the completed set beats any prior record for that exercise (heaviest weight, best estimated 1RM, best set volume), show a small inline "PR" tag on the row.
- **Machine sheet** (tap the photo/exercise name): swipeable photos, **setup** line, **notes**, quick buttons to add a photo or edit notes mid-workout.
- **Add exercise:** searchable list (see library) + "Create new" at the top.
- **Reorder / remove exercise:** long-press header → move up/down, remove.
- **Finish:** confirm → summary screen (duration, total volume, sets, PRs list, workout notes field, **Save**). Discard option with confirm.
- **Persistence:** the draft workout is stored on every edit; app kill must not lose it. Keep screen awake during an active workout.
- Finishing a workout creates an outlined "workout" overlay on Today at its actual time.

### Exercise library
- Searchable list; row = thumbnail (first photo or SF Symbol placeholder), name, muscle-group chip, equipment chip, "last done 5d ago".
- Filter chips: muscle group, equipment. "Archived" toggle at bottom (archive instead of delete when history exists).
- **Seed data:** ship ~30 common exercises as plain rows on first launch (bench press, squat, deadlift, overhead press, row, pulldown, leg press, curls, triceps pushdown, lateral raise, plank, etc.) — user can edit/archive them. Don't import a giant library in v1.

### Exercise detail (this is where machine photos live)
- **Photo carousel** at top (swipe), with an "Add photo" tile at the end: action sheet → **Take photo** / **Choose from library**.
- **Name, muscle group, equipment** (editable).
- **Setup** (single line: seat/pad/pin settings) and **Notes** (multiline: cues, form reminders, "left shoulder clicks past 80 kg").
- **Default rest** stepper.
- **Progress:** best set, estimated 1RM trend (simple SVG sparkline over last 10 sessions), recent sessions list (date, sets as `60×10, 60×9, 55×8`).
- Delete photo = long-press with confirm.

### Photo pipeline (important details)
1. `expo-image-picker` (camera or library) with `quality` ≤ 0.8.
2. `expo-image-manipulator`: resize longest side to ~1600 px, save JPEG 0.7 (keeps storage small; gym photos don't need 12 MP).
3. Copy into a dedicated folder under the app's document directory (e.g. `machine-photos/`) with a UUID filename. Use the current `expo-file-system` API for SDK 57 (the newer object-style API is the default; the older functions live under `expo-file-system/legacy` — check the SDK docs before writing code).
4. Insert `exercise_photos` row with the **filename only**. Resolve to a full URI when rendering.
5. Show with `expo-image` (caching, transitions). Provide a placeholder if the file is missing.
6. Handle permission denial with a one-line explanation and a "Open Settings" button (`Linking.openSettings()`).

### History
- Reverse-chronological list grouped by month. Row: date, title/summary, duration, volume. Detail: all exercises and sets, notes, **Delete workout** (confirm) and **Repeat workout** (creates a new draft with the same exercises and empty sets).

### Formulas
- Volume = Σ(weight × reps) over completed, non-warm-up sets.
- Estimated 1RM (Epley) = `weight × (1 + reps / 30)`; ignore sets with reps > 12 for 1RM PRs.
- Units: **store kg**, display kg or lb per Settings (`lb = kg × 2.20462`, round to nearest 0.5 lb when displaying lb input back to kg; keep stored value unrounded).

### Not in v1 (but design the schema so they fit)
Routines/templates, supersets, plate calculator, body measurements, cardio logging, Apple Health sync, Apple Watch.

---

## 10. SETTINGS screen

Single scrolling list, grouped, no icons needed.

**Appearance:** Theme (System / Light / Dark) · Clock format (12h / 24h) · Week starts on (Sun / Mon) · 12h-view window start (picker, default 7 AM) · Reduce animations (follows system by default).
**Focus:** Pomodoro focus / short break / long break lengths · Rounds before long break · Keep screen awake · Haptics on/off.
**Train:** Units (kg / lb) · Default rest (seconds) · Show RPE column · Weight step.
**Notifications:** permission status row + "Open iOS Settings".
**Data:** **Export backup (JSON)** → share sheet · **Import backup** · Delete all data (double confirm). The export includes all tables; photos are referenced by filename. (Photo export is a v1.1 task; until then show a note: "Photos are not included in the JSON backup.")
**About:** version, "Built with Expo".

---

## 11. UI system (minimalist theme)

### Principles
- Whitespace over dividers; **hairlines (0.5–1 pt) over shadows**; **no gradients, no drop shadows, no illustrations**.
- **One accent color** used only for: the "now" line, the primary action when it needs emphasis, and selected states of small controls. Primary buttons are ink-colored (black in light mode / near-white in dark), not accent-colored.
- Category colors are muted and used at low saturation tints for fills, solid only on the 3–4 pt left bar and small dots.
- Hierarchy through **size and weight**, not color.
- Motion: 150–220 ms ease-out, no springs/bounce except the sheet. Respect Reduce Motion.
- Empty states: one sentence + one action. Never illustrations.

### Color tokens
| Token | Light | Dark |
|---|---|---|
| `bg` | `#FAFAF8` | `#0E0E0F` |
| `surface` | `#FFFFFF` | `#161617` |
| `surfaceAlt` | `#F2F2EF` | `#1E1E20` |
| `text` | `#111111` | `#F2F2F0` |
| `textSecondary` | `#6B6B68` | `#9A9A97` |
| `textTertiary` | `#A3A3A0` | `#5F5F5C` |
| `hairline` | `#E6E6E2` | `#2A2A2C` |
| `accent` | `#E5484D` (warm red; "now" line, small highlights) | `#FF6369` |
| `ink` (primary button bg) | `#111111` | `#F2F2F0` |
| `inkText` | `#FFFFFF` | `#0E0E0F` |
| `danger` | `#D13438` | `#FF6369` |

**Category palette (tint fill ≈ 12–16% opacity, solid for bar/dot):**
work `#4C6E91` slate-blue · study `#6B8F71` sage · health `#C27C5A` clay · life `#B59A57` sand · other `#8A8A87` grey.
(Adjust freely; keep them desaturated. Verify contrast of text over tints ≥ 4.5:1.)

### Typography (system font — San Francisco; no font loading)
| Style | Size / weight | Use |
|---|---|---|
| `display` | 72–88, light (300) tabular | Timer numerals |
| `title` | 28, semibold | Screen titles, date header |
| `heading` | 20, semibold | Section titles |
| `body` | 16–17, regular | Default |
| `bodyStrong` | 16–17, medium | Row titles |
| `caption` | 13, regular, secondary | Meta, time labels |
| `micro` | 11–12, medium, uppercase, +0.5 tracking | Phase labels, weekday initials |
| `mono` | 14, `Menlo` | Code in lessons |
Use tabular numerals for all times and set numbers. Support Dynamic Type everywhere except the timer numerals and the timeline row height.

### Spacing, shape, sizing
- 4-pt grid: 4 · 8 · 12 · 16 · 24 · 32 · 48. Screen horizontal padding: 20.
- Radii: 8 (blocks, chips), 12 (cards, sheets inner), 999 (pills, buttons).
- Hit targets ≥ 44. Row height 52–56. Tab bar: native default height.
- Icons: SF Symbols via `expo-symbols`, weight "regular", size 22 in tab bar, 20 inline.

### Components to build once (src/components)
`Screen` (safe-area + background) · `Text` (variant prop) · `Button` (primary / secondary / quiet) · `Segmented` · `Chip` · `Row` (title, subtitle, accessory) · `Sheet` (bottom sheet; native `presentation: 'formSheet'` via Expo Router modal is an option) · `EmptyState` · `Stepper` · `Toast` (Undo) · `ProgressBar` · `Sparkline` (SVG).

### Tab bar and navigation chrome
Start with Expo Router's standard JS `Tabs` styled to the tokens (hairline top border, `bg` background, no indicator). **Optional upgrade:** Expo Router's `NativeTabs` (`expo-router/unstable-native-tabs`) gives system-native tabs and the iOS 26 Liquid Glass look, but it is marked experimental and its API can change — only adopt it after the app works.

### Haptics map
Light impact: toggle checkbox, set complete, timer start/pause, drag pick-up. Success notification: timer finished, workout saved, PR. Warning: destructive confirm. Never haptic on scroll or text entry.

### Accessibility
VoiceOver labels on every icon-only control; timeline blocks read "Deep work, 8:00 to 9:00 AM, work, not done"; color is never the only signal (done = strikethrough + checkbox; PR = text tag); contrast AA minimum; Dynamic Type tested at the largest accessibility size on lists (timeline row height stays fixed, text truncates).

---

## 12. Feature inventory — what to build, when

Gathered from the feature sets of Structured (timeline planner), Mono Task, Sunsama, Hevy, and Strong (see sources). Scope tiers:

### v1 (MVP — build all of this)
- Today: Hour + 12h views, blocks (create/move/resize/complete), now line, gaps, Inbox, rollover banner
- Calendar: month grid, agenda, jump to day
- Focus: Pomodoro / Countdown / Stopwatch, background-safe, notifications, session log, daily total
- Learn: 3 tracks with lessons, notes, status, spaced review; DSA problem tracker; System design case-study templates
- Train: exercise library with photos + setup + notes, active workout logger with Previous values, rest timer, PR detection, history
- Settings incl. **JSON export/import**
- Light/dark theme

### v1.1 (high value, small effort)
- Recurring blocks (daily/weekdays/weekly) and a small **daily habits checklist** (water, stretch, etc.) shown above the timeline
- `expo-calendar` read-only import of iPhone calendar events
- Photo export / full backup bundle
- Weekly review screen (focus hours, tasks done, workouts, topics completed) — Sunsama-style reflection, no charts beyond sparklines
- Search across blocks, lessons, notes, exercises
- Routines/templates for workouts; supersets; plate calculator; RPE on by default
- Natural-language quick-add ("gym tomorrow 6pm 1h")
- Block templates ("Deep work 90m")

### Later / needs a custom native build (outside Expo Go)
Home-screen widgets · Live Activities (timer on lock screen) · Apple Watch · Apple Health sync · iCloud/Cloud sync · Siri shortcuts · AI day-planning. These are the paid/native features in the reference apps; none are required for a great personal planner.

### Explicitly rejected (keeps it minimal)
Social feeds, gamification/streak shaming, team collaboration, ads, onboarding tours, project management (boards, subtasks beyond notes).

---

## 13. Cross-feature behavior (the glue)

| Event | Result |
|---|---|
| Focus session completes with a Learn topic label | `learn_progress.time_spent_ms += actual_ms` |
| Focus session completes | Outlined "focus" overlay on Today at actual time; counts toward daily total |
| Workout finished | Outlined "workout" overlay on Today; Calendar day gets a workout mark |
| Lesson → "Schedule" | Creates `study` block with `link_type='topic'`; tapping block opens lesson |
| Lesson → "Start focus" | Opens Focus with label = lesson title, timer idle (user taps Start) |
| Review due | Dot on Learn tab; "Review due" card on Learn; optional one-line chip on Today |
| Task block → "Start focus" | Focus opens with the block title as label |
| Day changes while app open | Today re-anchors the now line; rollover banner re-evaluated on foreground |

Notification inventory (all local): timer finished · rest timer finished · optional daily review reminder (user-set time, default off) · optional "plan your day" reminder (default off). Always cancel/replace by stored id; never exceed ~50 pending.

---

## 14. Build order and acceptance checks

*This is the serial order for a single agent. Section 16 shows which milestones can run in parallel (M3–M7 after the foundation).*

**M0 — Project + tooling.** Create app, log in to Expo, run on iPhone via Expo Go, run `npx expo-doctor`, strict TS, folder structure. *Check:* "Hello" renders on the phone; hot reload works.

**M1 — Theme + shell.** Tokens, light/dark, `Screen`/`Text`/`Button`/`Segmented`, five tabs with placeholder screens, safe areas correct on the 13 Pro Max. *Check:* toggling system dark mode flips the app; nothing is clipped by the notch or home indicator.

**M2 — Database + settings store + export.** Schema/migrations, repositories, settings, **JSON export/import**. *Check:* export → wipe → import restores identical data.

**M3 — Today.** Timeline (Hour + 12h), blocks CRUD, drag/resize with 15-min snap, overlap columns, now line, Inbox sheet, quick-add, rollover banner. *Check:* create/move/resize/complete blocks; kill app; state intact; 12h mode fits one screen without scrolling.

**M4 — Focus.** Timer engine + hook, three modes, persistence, notifications, session log, footer stats. *Check:* start 1-minute countdown, lock the phone → notification fires on time; kill the app mid-run and reopen → correct remaining time; pause/resume accurate over several minutes.

**M5 — Calendar.** Month grid, dots, agenda, open-day, week-start setting. *Check:* blocks created in Today appear on the right day; month swipe is smooth.

**M6 — Train.** Exercise CRUD + photos pipeline, active workout (sets, Previous, rest timer, PR), summary, history, draft persistence. *Check:* add a machine photo via camera and library; kill app mid-workout and resume; Previous values correct; PR tag appears on a heavier set.

**M7 — Learn.** Content loader, lesson screen with markdown, notes, status, review queue; DSA tracker; system-design templates; 3–5 sample lessons per track. *Check:* mark done → appears in review after 1 day (test by adjusting `next_review_at` in dev); notes persist.

**M8 — Polish.** Haptics, empty states, accessibility pass (VoiceOver + largest Dynamic Type), performance pass (memoized timeline rows, no dropped frames while dragging), icon + splash (monochrome). *Check:* every screen reviewed in light + dark; no console warnings.

**M9 — Hardening.** Edge cases: DST day, 00:00 boundary, permission denied flows, missing photo file, empty database, huge notes. Write a short README documenting setup + backup.

---

## 15. Open questions for the owner (answer before M3 and M7)

1. Is my reading of **"hour view" vs "12-hour view"** right (24h scrolling timeline vs. a one-screen 12h window)? If you meant the clock format only, drop the 12h window and keep the setting.
2. Should **Python / DSA / System Design** ship with bundled lessons (as specced), or be blank trackers where you paste your own notes/links? Bundled content means someone has to write it (Claude can draft all lessons in the markdown format above).
3. **kg or lb** as the default unit?
4. Will you eventually want this outside Expo Go (TestFlight/App Store, widgets)? If yes, plan an Apple Developer account and Expo's cloud iOS builds later; the JSON export is the migration path.
5. Which **workout split** do you follow (PPL, upper/lower, etc.)? It affects whether routines move up to v1.

---

## 16. Multi-agent workflow (build faster in parallel)

This section maps the milestones in section 14 onto several AI coding agents working at the same time. It is optional: a single agent can still build the app by following section 14 in order.

### 16.1 What to expect (honest limits)
- **Parallelism only helps after the shared foundation exists.** The first phase is serial by design.
- **Your review and phone testing are the real bottleneck.** Realistic useful parallelism is **3–4 agents**, not 8. More agents mostly add merge work and token cost.
- **One iPhone, one dev server at a time.** Feature agents verify with typecheck, lint, and unit tests; only the integration checkout (`main`) is tested on the phone.
- Running several sessions or subagents at once multiplies token usage. Start with the Standard preset (16.12).

### 16.2 Five ground rules
1. **Contracts first.** Types, schema, theme tokens, shared components, route names, and hook signatures are written and merged *before* feature work starts (Phase 0).
2. **One owner per path.** Every file belongs to exactly one agent (`docs/OWNERS.json`). An agent never edits another agent's files.
3. **One worktree and one branch per agent.** Agents never share a working directory.
4. **Stub-and-fill at boundaries.** Anything one agent consumes from another (a hook, a component, a function) is created by Foundation as a **stub with its final signature**. The owning agent fills in the body without changing the signature.
5. **Talk through files, not memory.** Status, blocked items, and contract change requests go in `docs/` so any agent (or you) can read them.

### 16.3 Test without a phone: pure-logic modules
Put the tricky logic in plain TypeScript functions with unit tests (add `jest-expo`). Agents can prove these work on the PC, so they need the device far less.

| Module | Path | Owner | Must test |
|---|---|---|---|
| Timeline layout (time↔y, 15-min snap, clamp, 12h fit height, now-line y) | `src/features/today/timeline/layout.ts` | timeline | Snap rounding, 12h window fills given height, clamp at 24:00 |
| Overlap column packing | `src/features/today/timeline/packing.ts` | timeline | Overlaps → columns, cap at 3, touching blocks don't overlap |
| Free-gap finder | `src/features/today/timeline/gaps.ts` | timeline | Gaps ≥ 45 min only, ignores untimed blocks |
| Month grid builder | `src/features/calendar/grid.ts` | blocks-calendar | 6×7 grid, Sun/Mon start, leap-year Feb, outside-month days |
| Rollover finder | `src/features/blocks/rollover.ts` | blocks-calendar | Yesterday's undone tasks only |
| Timer reducer (start/pause/resume/finish/reconcile-on-launch, pomodoro phases) | `src/lib/timerEngine.ts` | foundation | Pause/resume drift, finish detected after app was killed, round counting |
| Workout math (volume, Epley 1RM, PR detection, kg↔lb) | `src/features/train/math.ts` | train | Warm-ups excluded, reps > 12 ignored for 1RM PR, rounding |
| Previous-values lookup | `src/features/train/previous.ts` | train | Same set number, last completed workout, none-yet case |
| Spaced-review scheduler (1, 3, 7, 14, 30, 60 days) | `src/features/learn/review.ts` | learn | "Got it" advances, "Forgot" → stage 0 due tomorrow, stage cap |
| Lesson parser (frontmatter + body) | `src/features/learn/content.ts` | learn | Missing fields, duplicate ids, ordering |
| Backup serialize/validate | `src/lib/backup.ts` | settings | Export → import round trip, rejects wrong version |

### 16.4 Phases and dependency graph
```
PHASE 0  FOUNDATION  (1 agent, serial)         M0 + M1 + M2a  →  tag foundation-v1
             │
PHASE 1  ────┼──────────┬──────────┬──────────┬──────────┬──────────┬───────────
          TIMELINE   BLOCKS+CAL   FOCUS     TRAIN      LEARN     CONTENT   SETTINGS
          (M3a)      (M3b, M5)    (M4)      (M6)       (M7 code) (lessons) (M2b)
             │
PHASE 2  INTEGRATOR  (glue from section 13, mounts stubs, fixes seams)
             │
         QA / POLISH  (M8 + M9, can run one agent per tab)
```
**Critical path:** Foundation → Timeline → Integrator → QA. Everything else runs beside it, so keep Foundation lean and start Timeline the moment it merges.

### 16.5 Phase 0 — Foundation agent (do this first, serially)
Deliverables (all merged to `main` and tagged `foundation-v1`):
1. M0 project setup, strict TS, ESLint (`npx expo lint`), `jest-expo`, `npx expo-doctor` clean.
2. **All dependencies from section 2.3 installed up front** so nobody edits `package.json` or the lockfile later (prevents the worst merge conflicts).
3. M1: `src/theme/*` tokens and light/dark, `src/components/*` (Screen, Text, Button, Segmented, Chip, Row, Sheet, EmptyState, Stepper, Toast, ProgressBar, Sparkline).
4. M2a: `src/db/schema.ts`, numbered migrations, `src/db/types.ts` (a TS type per table), and **basic CRUD repositories for every table** (`src/db/repos/*.ts`). Feature agents put feature-specific queries in their own `src/features/<x>/queries.ts`, never in shared repo files.
5. `src/lib/`: `time.ts` (date/minute helpers), `units.ts`, `haptics.ts`, `settingsStore.ts` (all settings keys from section 10, with defaults), `timerEngine.ts` (pure reducer + tests).
6. **Route skeleton:** every route file from section 3 exists as a placeholder screen, the tab layout is final, and modal/sheet routes are declared. Document route params in `docs/ROUTES.md`, for example:
   - `/block/new?date=YYYY-MM-DD&startMin=540` · `/block/[id]`
   - `/(tabs)/focus?label=...&topicId=...`
   - `/learn/[track]/[topicId]` · `/workout/active`
7. **Stubs with final signatures** for cross-agent pieces: `useTimer()` and `useRestTimer()` in `src/lib/useTimer.ts` (foreground-only for now), `<RolloverBanner />` in `src/features/blocks/RolloverBanner.tsx`, `getLearnTopicTitle(id)` in `src/features/learn/api.ts`.
8. `docs/OWNERS.json`, `docs/STATUS.md`, `docs/CONTRACT_CHANGES.md`, and `scripts/check-ownership.mjs` (16.8).

### 16.6 Phase 1 — Feature agents
| Agent id | Milestones | Reads sections | Owns (path prefixes) | Depends on | Delivers |
|---|---|---|---|---|---|
| `timeline` | M3a | 1, 3, 4, 5, 11 | `app/(tabs)/index.tsx`, `src/features/today/` | Foundation | Hour + 12h timeline, now line, gaps, drag/resize, overlap columns, logged-activity overlays. Navigates to `/block/new` and `/block/[id]` for create/edit |
| `blocks-calendar` | M3b, M5 | 4, 5 (quick-add, inbox, rollover), 7, 11 | `app/block/`, `app/inbox.tsx`, `app/(tabs)/calendar.tsx`, `src/features/blocks/`, `src/features/calendar/` | Foundation | Quick-add/edit sheet, Inbox sheet, rollover banner (fills the stub), month grid + agenda |
| `focus` | M4 | 6, 11, 13 | `app/(tabs)/focus.tsx`, `src/features/focus/`, `src/lib/notifications.ts`, `src/lib/useTimer.ts` | Foundation (`timerEngine`) | Timer UI, three modes, persistence, notifications, session log, stats. Fills `useTimer`/`useRestTimer` without changing their signatures |
| `train` | M6 | 4, 9, 11 | `app/(tabs)/train/`, `app/workout/`, `src/features/train/` | Foundation; uses `useRestTimer` stub, real one arrives when `focus` merges | Exercise library, photo pipeline, active workout, history, PRs |
| `learn` | M7 | 4, 8, 11 | `app/(tabs)/learn/`, `src/features/learn/` | Foundation | Content loader, lesson screen, review queue, DSA tracker, system-design templates |
| `content` | lessons only | 8 (content model + seed list) | `content/` | none (needs only the frontmatter format) | 5–8 lessons per track at first, then more; follows the frontmatter schema exactly |
| `settings` | M2b | 4, 10 | `app/settings.tsx`, `src/features/settings/`, `src/lib/backup.ts` | Foundation (schema frozen) | Settings UI wired to `settingsStore`, JSON export/import, notification status row |

### 16.7 Phase 2 — Integrator and QA
- **`integrator`** (owns only glue files you list in `OWNERS.json` as `src/features/integration/` plus any file flagged in `CONTRACT_CHANGES.md`): implements the cross-feature table in section 13 (focus → learn time, overlays on Today, lesson → study block, review dot on the tab), mounts any remaining stubs, resolves signature drift, and runs the full app in Expo Go.
- **`qa-<tab>`** (one per tab, parallel): M8/M9 checks for that tab — accessibility (VoiceOver labels, largest Dynamic Type), empty states, light/dark, edge cases from the milestone list, performance (memoized timeline rows). QA agents may edit only their tab's files plus a `docs/QA_<tab>.md` report.

### 16.8 Enforcing ownership and quality
`docs/OWNERS.json` (path prefixes; adjust to your final tree):
```json
{
  "_allowedEverywhere": ["docs/STATUS.md", "docs/CONTRACT_CHANGES.md"],
  "timeline": ["app/(tabs)/index.tsx", "src/features/today/"],
  "blocks-calendar": ["app/block/", "app/inbox.tsx", "app/(tabs)/calendar.tsx", "src/features/blocks/", "src/features/calendar/"],
  "focus": ["app/(tabs)/focus.tsx", "src/features/focus/", "src/lib/notifications.ts", "src/lib/useTimer.ts"],
  "train": ["app/(tabs)/train/", "app/workout/", "src/features/train/"],
  "learn": ["app/(tabs)/learn/", "src/features/learn/"],
  "content": ["content/"],
  "settings": ["app/settings.tsx", "src/features/settings/", "src/lib/backup.ts"],
  "integrator": ["src/features/integration/"]
}
```
`scripts/check-ownership.mjs` (no dependencies):
```js
// usage: node scripts/check-ownership.mjs <agent-id>
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const agent = process.argv[2];
const owners = JSON.parse(readFileSync('docs/OWNERS.json', 'utf8'));
const mine = owners[agent];
if (!mine) { console.error(`Unknown agent: ${agent}`); process.exit(2); }
const shared = owners._allowedEverywhere ?? [];

const changed = execSync('git diff --name-only main...HEAD', { encoding: 'utf8' })
  .split('\n').filter(Boolean);
const bad = changed.filter(f => ![...mine, ...shared].some(p => f.startsWith(p)));

if (bad.length) { console.error('Edited files outside owned paths:\n' + bad.join('\n')); process.exit(1); }
console.log('Ownership OK');
```
**Definition of done for every agent branch** (all must pass before you merge):
1. `npx tsc --noEmit` — zero errors
2. `npx expo lint` — zero errors
3. `npx jest` — all pure-logic tests for the agent's modules pass
4. `node scripts/check-ownership.mjs <agent-id>` — passes
5. Branch is rebased on the latest `main`
6. The milestone's acceptance checks (section 14) are ticked in the PR description, marking which were verified by tests and which still need the phone
7. `docs/STATUS.md` has a final entry: what's done, what's stubbed, anything for the integrator

### 16.9 Contract-change protocol
If an agent needs a change to a frozen file (schema, types, tokens, shared components, route params, stub signatures):
1. **Do not edit it.**
2. Add an entry to `docs/CONTRACT_CHANGES.md`: what, why, proposed diff, which agents are affected.
3. Continue with a local adapter inside your own folder.
4. The Foundation/Integrator agent applies it on `main` (schema changes are **additive migrations only**, new numbered file, never editing an old migration). Other agents rebase.

### 16.10 Git and worktree setup (Windows / PowerShell)
Keep paths **short**. Deeply nested folders plus `node_modules` can hit Windows path-length limits and break Metro, so create worktrees next to the repo, not inside it.
```powershell
cd C:\dev\planner
git config core.longpaths true
# after Foundation is merged and tagged:
git tag foundation-v1
git worktree add C:\dev\wt\timeline  -b agent/timeline  foundation-v1
git worktree add C:\dev\wt\blocks    -b agent/blocks-calendar foundation-v1
git worktree add C:\dev\wt\focus     -b agent/focus     foundation-v1
git worktree add C:\dev\wt\train     -b agent/train     foundation-v1
git worktree add C:\dev\wt\learn     -b agent/learn     foundation-v1
git worktree add C:\dev\wt\content   -b agent/content   foundation-v1
git worktree add C:\dev\wt\settings  -b agent/settings  foundation-v1
# each worktree needs its own dependencies:
cd C:\dev\wt\timeline; npm install
```
Clean up after merging: `git worktree remove C:\dev\wt\timeline` and `git branch -d agent/timeline`. `git worktree list` shows what exists.

**Merge order** (low-conflict first): `settings` → `focus` → `timeline` → `blocks-calendar` → `train` → `learn` → `content` → `integrator` → `qa-*`. Merge each branch into `main` as soon as its gates pass instead of batching — small frequent merges keep seams visible.

### 16.11 Phone testing routine (one device)
- `main` is the only checkout you run on the iPhone. After each merge: `cd C:\dev\planner; git pull; npx expo start`, then open it in Expo Go and test that milestone's phone checks.
- To preview an unmerged branch, run `npx expo start --port 8082` in that worktree. Expo Go opens one project at a time.
- If Expo Go reports a version mismatch after dependency changes, run `npx expo install --fix` and `npx expo-doctor` on `main` (Foundation/Integrator only).
- Reminder: you must be signed in to the same Expo account in the CLI and the Expo Go app.

### 16.12 Presets (pick one)
| Preset | Parallel streams after Foundation | Use when |
|---|---|---|
| **Lite (2)** | A: `timeline` → `blocks-calendar` → `focus` → `settings`. B: `train` → `learn` → `content` | You want less coordination and lower token cost |
| **Standard (4) — recommended** | A: `timeline`. B: `blocks-calendar` + `settings`. C: `focus` + `train`. D: `learn` + `content` | Best balance of speed and review effort |
| **Max (7)** | One agent per row of 16.6 | Only if you can review several PRs a day |
Merge `focus` early in Standard so `train` can swap the rest-timer stub for the real one.

### 16.13 Two ways to run the agents
**A. Manual (simplest, most control).** Open one session per worktree (a terminal or editor window each) and paste the shared preamble plus that agent's brief (16.14). You merge branches yourself.

**B. Lead-orchestrated.** One lead session reads this whole file, then delegates each row of 16.6 to a subagent that runs in its own worktree and reports back; the lead runs the gates and tells you what to merge. This centralizes coordination but concentrates context and cost in the lead session.

**If you use Claude Code:** it supports parallel sessions in isolated git worktrees (`claude --worktree`, which creates checkouts under `.claude/worktrees/`), custom subagents (defined as files under `.claude/agents/`, which can also be given their own worktree), and an "agent teams" mode. Details and current syntax change between releases, so read the docs listed in section 17 before wiring it up. Because of the Windows path-length concern in 16.10, creating worktrees manually at a short path is the safer default; Claude Code can be started inside any of them. Other tools (Cursor, Codex CLI, etc.) work the same way: one session per worktree.

### 16.14 Prompt templates

**Foundation agent**
> You are the Foundation agent for the minimalist planner app. Read this entire handoff file. Implement exactly section 16.5, in order, and nothing else. Do not build any feature screens beyond placeholders. Work on branch `agent/foundation`. When all gates in 16.8 pass, update `docs/STATUS.md` and stop. Do not start feature work.

**Shared preamble (paste before every feature-agent brief)**
> You are one of several agents building this app in parallel. Read the entire handoff file first, then sections listed in your brief. Rules: (1) You may edit ONLY the paths you own in `docs/OWNERS.json`. (2) Never edit schema, types, tokens, shared components, route params, or stub signatures. If you need a change, add an entry to `docs/CONTRACT_CHANGES.md` and use a local adapter. (3) Do not add dependencies or touch `package.json`. (4) Put tricky logic in the pure modules listed in 16.3 with unit tests. (5) Use tokens and components from `src/theme` and `src/components` only; no new UI libraries. (6) Before finishing, run every gate in 16.8 and fix failures. (7) Append progress and blockers to `docs/STATUS.md`. (8) Finish with a summary: files created, tests added, acceptance checks verified by tests, checks that still need the phone, and anything the integrator must wire.

**Brief template (fill from the roster table in 16.6)**
> Agent id: `<id>`. Branch: `agent/<id>`. Milestones: `<M…>`. Read sections: `<…>`. You own: `<paths>`. You depend on: `<…>`. Deliver: `<…>`. Do not touch: everything else. Done when: gates in 16.8 pass and section 14's acceptance checks for your milestones are satisfied or explicitly listed as "needs phone".

**Worked example — `focus` brief**
> Agent id: `focus`. Branch: `agent/focus`. Milestone: M4. Read sections 6, 11, 13. You own `app/(tabs)/focus.tsx`, `src/features/focus/`, `src/lib/notifications.ts`, `src/lib/useTimer.ts`. Build the Focus tab per section 6 on top of the existing `src/lib/timerEngine.ts` reducer (do not rewrite it; request changes via `CONTRACT_CHANGES.md`). Replace the foreground-only bodies of `useTimer` and `useRestTimer` with persisted, notification-backed versions, keeping their signatures. Never schedule more than ~50 local notifications. Add tests for any new pure logic (stats, streak calculation). Done when gates pass and these are verified: pause/resume accuracy (tests), finish detected after app kill (tests), and "needs phone": lock-screen notification fires on time.

### 16.15 Failure modes and fixes
| Problem | Fix |
|---|---|
| Two agents edited the same file | `check-ownership` gate; reassign the path in `OWNERS.json`; resolve in the integrator |
| Lockfile conflicts | Dependencies frozen in Foundation; only Foundation/Integrator run `expo install` |
| Stub signature drifted | Contract-change protocol; integrator reconciles; add a type-level test or `tsc` check that imports the stub |
| Metro errors in a worktree | Run `npm install` in that worktree; check the path length; clear cache with `npx expo start -c` |
| Branch works alone, breaks after merge | Merge small and often; run the gates on `main` after every merge; the integrator owns seams |
| Token spend climbing | Drop to Lite or Standard; give agents narrow briefs and the section list instead of "read everything" after the first pass |
| Agent "improves" things outside its scope | The shared preamble forbids it; the ownership gate catches it; reject the PR |

---

## 17. Reference apps and sources

- Structured (timeline planner, inbox, Pomodoro, sub-tasks, recurring tasks, Replan): https://apps.apple.com/app/id1499198946
- Structured review of the timeline/inbox/free-time design: https://screensdesign.com/showcase/structured-daily-planner
- Mono Task (timeline + inbox, drag between them, week pager, widgets): https://apps.apple.com/app/id6474521448
- Hevy features (previous performance, rest timers, RPE, plate calculator, PRs, routines): https://help.hevyapp.com/hc/en-us/articles/33106320824727
- Hevy workout settings (default rest timer, previous values, keep awake, live PR notification): https://www.hevyapp.com/features/workout-settings/
- Roundups of minimalist planners (Sunsama, Things, TickTick, Todoist, Structured): https://clickup.com/blog/minimalist-digital-planners/ · https://toolfinder.com/lists/aesthetic-planner-apps
- Expo SDK 57 release notes (React Native 0.86): https://expo.dev/changelog/sdk-57
- Expo Go update requiring login for SDK 57 projects: https://releasebot.io/updates/expo
- Expo notifications (local notifications work in Expo Go; remote push does not): https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- Expo native tabs (experimental): https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/
- Expo upgrade notes (Expo Go only supports the latest SDK on physical iOS devices): https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough
- iOS local-notification cap of 64 (community report): https://forums.expo.io/t/not-receiving-local-scheduled-notifications-on-ios/1192
- Claude Code: running agents in parallel (sessions, subagents, agent teams; token cost note): https://code.claude.com/docs/en/agents
- Claude Code: parallel sessions and subagents in git worktrees (`--worktree`, cleanup, `.worktreeinclude`): https://code.claude.com/docs/en/worktrees
- Git worktree reference: https://git-scm.com/docs/git-worktree
