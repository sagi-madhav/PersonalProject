import { getDatabase } from '../db';
import { WorkoutRecord, WorkoutSetRecord } from '../types';

export const workoutsRepo = {
  async getById(id: string): Promise<WorkoutRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<WorkoutRecord>('SELECT * FROM workouts WHERE id = ?;', [id]);
  },

  async insert(workout: WorkoutRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO workouts (id, title, started_at, ended_at, notes) VALUES (?, ?, ?, ?, ?);',
      [workout.id, workout.title, workout.started_at, workout.ended_at, workout.notes]
    );
  },

  async update(workout: Partial<WorkoutRecord> & { id: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(workout.id);
    if (!existing) throw new Error(`Workout not found: ${workout.id}`);

    const updated = { ...existing, ...workout };
    await db.runAsync(
      'UPDATE workouts SET title = ?, started_at = ?, ended_at = ?, notes = ? WHERE id = ?;',
      [updated.title, updated.started_at, updated.ended_at, updated.notes, updated.id]
    );
  },

  async getRecent(limit: number = 20): Promise<WorkoutRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutRecord>(
      'SELECT * FROM workouts ORDER BY started_at DESC LIMIT ?;',
      [limit]
    );
  },

  async getAll(): Promise<WorkoutRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutRecord>('SELECT * FROM workouts ORDER BY started_at DESC;');
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workouts WHERE id = ?;', [id]);
  },

  // Sets
  async getSetsForWorkout(workoutId: string): Promise<WorkoutSetRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutSetRecord>(
      'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY position ASC, set_number ASC;',
      [workoutId]
    );
  },

  async insertSet(set: WorkoutSetRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO workout_sets (
        id, workout_id, exercise_id, position, set_number,
        weight_kg, reps, rpe, is_warmup, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        set.id,
        set.workout_id,
        set.exercise_id,
        set.position,
        set.set_number,
        set.weight_kg,
        set.reps,
        set.rpe,
        set.is_warmup,
        set.completed_at,
      ]
    );
  },

  async updateSet(set: Partial<WorkoutSetRecord> & { id: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<WorkoutSetRecord>(
      'SELECT * FROM workout_sets WHERE id = ?;',
      [set.id]
    );
    if (!existing) throw new Error(`Set not found: ${set.id}`);

    const updated = { ...existing, ...set };
    await db.runAsync(
      `UPDATE workout_sets SET
        workout_id = ?, exercise_id = ?, position = ?, set_number = ?,
        weight_kg = ?, reps = ?, rpe = ?, is_warmup = ?, completed_at = ?
      WHERE id = ?;`,
      [
        updated.workout_id,
        updated.exercise_id,
        updated.position,
        updated.set_number,
        updated.weight_kg,
        updated.reps,
        updated.rpe,
        updated.is_warmup,
        updated.completed_at,
        updated.id,
      ]
    );
  },

  async deleteSet(setId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workout_sets WHERE id = ?;', [setId]);
  },

  async getAllSets(): Promise<WorkoutSetRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutSetRecord>('SELECT * FROM workout_sets;');
  },
};
