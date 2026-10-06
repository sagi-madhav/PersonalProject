import { getDatabase } from '../db/db';
import {
  BlockRecord,
  FocusSessionRecord,
  LearnProgressRecord,
  DsaProblemRecord,
  ExerciseRecord,
  ExercisePhotoRecord,
  WorkoutRecord,
  WorkoutSetRecord,
} from '../db/types';

export interface BackupData {
  version: number;
  exportedAt: number;
  data: {
    blocks: BlockRecord[];
    focus_sessions: FocusSessionRecord[];
    learn_progress: LearnProgressRecord[];
    dsa_problems: DsaProblemRecord[];
    exercises: ExerciseRecord[];
    exercise_photos: ExercisePhotoRecord[];
    workouts: WorkoutRecord[];
    workout_sets: WorkoutSetRecord[];
  };
}

export function validateBackup(json: unknown): BackupData {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid backup format: root must be an object');
  }

  const payload = json as Record<string, unknown>;
  if (typeof payload.version !== 'number' || payload.version < 1) {
    throw new Error('Unsupported or missing backup version');
  }

  if (typeof payload.data !== 'object' || payload.data === null) {
    throw new Error('Missing backup data payload');
  }

  const d = payload.data as Record<string, unknown>;
  const requiredKeys = [
    'blocks',
    'focus_sessions',
    'learn_progress',
    'dsa_problems',
    'exercises',
    'exercise_photos',
    'workouts',
    'workout_sets',
  ];

  for (const key of requiredKeys) {
    if (!Array.isArray(d[key])) {
      throw new Error(`Backup missing table array: ${key}`);
    }
  }

  return json as BackupData;
}

export async function createBackupPayload(): Promise<BackupData> {
  const db = await getDatabase();

  const blocks = await db.getAllAsync<BlockRecord>('SELECT * FROM blocks;');
  const focus_sessions = await db.getAllAsync<FocusSessionRecord>('SELECT * FROM focus_sessions;');
  const learn_progress = await db.getAllAsync<LearnProgressRecord>('SELECT * FROM learn_progress;');
  const dsa_problems = await db.getAllAsync<DsaProblemRecord>('SELECT * FROM dsa_problems;');
  const exercises = await db.getAllAsync<ExerciseRecord>('SELECT * FROM exercises;');
  const exercise_photos = await db.getAllAsync<ExercisePhotoRecord>('SELECT * FROM exercise_photos;');
  const workouts = await db.getAllAsync<WorkoutRecord>('SELECT * FROM workouts;');
  const workout_sets = await db.getAllAsync<WorkoutSetRecord>('SELECT * FROM workout_sets;');

  return {
    version: 1,
    exportedAt: Date.now(),
    data: {
      blocks,
      focus_sessions,
      learn_progress,
      dsa_problems,
      exercises,
      exercise_photos,
      workouts,
      workout_sets,
    },
  };
}

export async function restoreFromBackup(backup: BackupData): Promise<void> {
  const valid = validateBackup(backup);
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    // Delete existing
    await db.runAsync('DELETE FROM workout_sets;');
    await db.runAsync('DELETE FROM workouts;');
    await db.runAsync('DELETE FROM exercise_photos;');
    await db.runAsync('DELETE FROM exercises;');
    await db.runAsync('DELETE FROM dsa_problems;');
    await db.runAsync('DELETE FROM learn_progress;');
    await db.runAsync('DELETE FROM focus_sessions;');
    await db.runAsync('DELETE FROM blocks;');

    // Insert blocks
    for (const b of valid.data.blocks) {
      await db.runAsync(
        `INSERT INTO blocks (
          id, title, kind, category, date, start_min, duration_min,
          done_at, notes, link_type, link_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          b.id, b.title, b.kind, b.category, b.date, b.start_min, b.duration_min,
          b.done_at, b.notes, b.link_type, b.link_id, b.created_at, b.updated_at,
        ]
      );
    }

    // Insert focus
    for (const f of valid.data.focus_sessions) {
      await db.runAsync(
        `INSERT INTO focus_sessions (
          id, mode, label, topic_id, planned_ms, actual_ms,
          started_at, ended_at, completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [f.id, f.mode, f.label, f.topic_id, f.planned_ms, f.actual_ms, f.started_at, f.ended_at, f.completed]
      );
    }

    // Insert learn
    for (const l of valid.data.learn_progress) {
      await db.runAsync(
        `INSERT INTO learn_progress (
          topic_id, status, notes, review_stage,
          last_reviewed_at, next_review_at, time_spent_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [l.topic_id, l.status, l.notes, l.review_stage, l.last_reviewed_at, l.next_review_at, l.time_spent_ms]
      );
    }

    // Insert dsa
    for (const d of valid.data.dsa_problems) {
      await db.runAsync(
        `INSERT INTO dsa_problems (
          id, title, url, pattern, difficulty, status,
          attempts, time_spent_ms, notes, solved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [d.id, d.title, d.url, d.pattern, d.difficulty, d.status, d.attempts, d.time_spent_ms, d.notes, d.solved_at, d.created_at]
      );
    }

    // Insert exercises
    for (const e of valid.data.exercises) {
      await db.runAsync(
        `INSERT INTO exercises (
          id, name, muscle_group, equipment, setup,
          notes, default_rest_sec, archived, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [e.id, e.name, e.muscle_group, e.equipment, e.setup, e.notes, e.default_rest_sec, e.archived, e.created_at]
      );
    }

    // Insert exercise photos
    for (const p of valid.data.exercise_photos) {
      await db.runAsync(
        'INSERT INTO exercise_photos (id, exercise_id, filename, caption, taken_at) VALUES (?, ?, ?, ?, ?);',
        [p.id, p.exercise_id, p.filename, p.caption, p.taken_at]
      );
    }

    // Insert workouts
    for (const w of valid.data.workouts) {
      await db.runAsync(
        'INSERT INTO workouts (id, title, started_at, ended_at, notes) VALUES (?, ?, ?, ?, ?);',
        [w.id, w.title, w.started_at, w.ended_at, w.notes]
      );
    }

    // Insert sets
    for (const s of valid.data.workout_sets) {
      await db.runAsync(
        `INSERT INTO workout_sets (
          id, workout_id, exercise_id, position, set_number,
          weight_kg, reps, rpe, is_warmup, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [s.id, s.workout_id, s.exercise_id, s.position, s.set_number, s.weight_kg, s.reps, s.rpe, s.is_warmup, s.completed_at]
      );
    }
  });
}

export async function wipeAllData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workout_sets;');
    await db.runAsync('DELETE FROM workouts;');
    await db.runAsync('DELETE FROM exercise_photos;');
    await db.runAsync('DELETE FROM exercises;');
    await db.runAsync('DELETE FROM dsa_problems;');
    await db.runAsync('DELETE FROM learn_progress;');
    await db.runAsync('DELETE FROM focus_sessions;');
    await db.runAsync('DELETE FROM blocks;');
  });
}
