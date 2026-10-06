import { getDatabase } from '../db';
import { ExerciseRecord, ExercisePhotoRecord } from '../types';

export const exercisesRepo = {
  async getById(id: string): Promise<ExerciseRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<ExerciseRecord>('SELECT * FROM exercises WHERE id = ?;', [id]);
  },

  async getAll(includeArchived = false): Promise<ExerciseRecord[]> {
    const db = await getDatabase();
    if (includeArchived) {
      return db.getAllAsync<ExerciseRecord>('SELECT * FROM exercises ORDER BY name ASC;');
    }
    return db.getAllAsync<ExerciseRecord>(
      'SELECT * FROM exercises WHERE archived = 0 ORDER BY name ASC;'
    );
  },

  async insert(exercise: ExerciseRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO exercises (
        id, name, muscle_group, equipment, setup,
        notes, default_rest_sec, archived, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        exercise.id,
        exercise.name,
        exercise.muscle_group,
        exercise.equipment,
        exercise.setup,
        exercise.notes,
        exercise.default_rest_sec,
        exercise.archived,
        exercise.created_at,
      ]
    );
  },

  async update(exercise: Partial<ExerciseRecord> & { id: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(exercise.id);
    if (!existing) throw new Error(`Exercise not found: ${exercise.id}`);

    const updated = { ...existing, ...exercise };
    await db.runAsync(
      `UPDATE exercises SET
        name = ?, muscle_group = ?, equipment = ?, setup = ?,
        notes = ?, default_rest_sec = ?, archived = ?
      WHERE id = ?;`,
      [
        updated.name,
        updated.muscle_group,
        updated.equipment,
        updated.setup,
        updated.notes,
        updated.default_rest_sec,
        updated.archived,
        updated.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM exercises WHERE id = ?;', [id]);
  },

  // Photos
  async getPhotos(exerciseId: string): Promise<ExercisePhotoRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<ExercisePhotoRecord>(
      'SELECT * FROM exercise_photos WHERE exercise_id = ? ORDER BY taken_at ASC;',
      [exerciseId]
    );
  },

  async addPhoto(photo: ExercisePhotoRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO exercise_photos (id, exercise_id, filename, caption, taken_at) VALUES (?, ?, ?, ?, ?);',
      [photo.id, photo.exercise_id, photo.filename, photo.caption, photo.taken_at]
    );
  },

  async deletePhoto(photoId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM exercise_photos WHERE id = ?;', [photoId]);
  },

  async getAllPhotos(): Promise<ExercisePhotoRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<ExercisePhotoRecord>('SELECT * FROM exercise_photos;');
  },
};
