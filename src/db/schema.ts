export const MIGRATION_V1_SQL = `
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  date TEXT,
  start_min INTEGER,
  duration_min INTEGER,
  done_at INTEGER,
  notes TEXT,
  link_type TEXT,
  link_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocks_date ON blocks(date);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  label TEXT,
  topic_id TEXT,
  planned_ms INTEGER,
  actual_ms INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  completed INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS learn_progress (
  topic_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'todo',
  notes TEXT,
  review_stage INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at INTEGER,
  next_review_at INTEGER,
  time_spent_ms INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dsa_problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  pattern TEXT,
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  attempts INTEGER NOT NULL DEFAULT 0,
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  solved_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  setup TEXT,
  notes TEXT,
  default_rest_sec INTEGER,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_photos (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  caption TEXT,
  taken_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  title TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  position INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg REAL,
  reps INTEGER,
  rpe REAL,
  is_warmup INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id, completed_at);
`;
