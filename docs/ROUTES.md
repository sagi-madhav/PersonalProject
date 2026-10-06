# Routes Contract

## Tabs
- `/(tabs)`: Tab container
- `/(tabs)/index`: Today tab (Hour / 12h timeline view)
- `/(tabs)/calendar`: Calendar tab (Month grid + agenda)
- `/(tabs)/focus`: Focus tab (Pomodoro / Countdown / Stopwatch)
  - Params: `?label=string&topicId=string`
- `/(tabs)/learn`: Learn root (Tracks + review)
- `/(tabs)/learn/[track]`: Track module list
  - Params: `track` ('python' | 'dsa' | 'system-design')
- `/(tabs)/learn/[track]/[topicId]`: Lesson view
  - Params: `track`, `topicId`
- `/(tabs)/train`: Train root (Workout overview, start workout)
- `/(tabs)/train/history`: Workout history list
- `/(tabs)/train/exercises`: Exercise library list
- `/(tabs)/train/exercises/[id]`: Exercise detail with photos and machine setup

## Modals & Sheets
- `/workout/active`: Active workout logger (full-screen modal)
- `/block/[id]`: Block detail/editor sheet (`id` can be 'new' or UUID)
  - Params: `date=YYYY-MM-DD`, `startMin=number`
- `/inbox`: Inbox capture and triage sheet
- `/settings`: Global settings screen
