import { getDatabase } from '../db';
import { DsaProblemRecord } from '../types';

export const dsaRepo = {
  async getById(id: string): Promise<DsaProblemRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<DsaProblemRecord>('SELECT * FROM dsa_problems WHERE id = ?;', [id]);
  },

  async insert(problem: DsaProblemRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO dsa_problems (
        id, title, url, pattern, difficulty, status,
        attempts, time_spent_ms, notes, solved_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        problem.id,
        problem.title,
        problem.url,
        problem.pattern,
        problem.difficulty,
        problem.status,
        problem.attempts,
        problem.time_spent_ms,
        problem.notes,
        problem.solved_at,
        problem.created_at,
      ]
    );
  },

  async update(problem: Partial<DsaProblemRecord> & { id: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(problem.id);
    if (!existing) throw new Error(`Problem not found: ${problem.id}`);

    const updated = { ...existing, ...problem };

    await db.runAsync(
      `UPDATE dsa_problems SET
        title = ?, url = ?, pattern = ?, difficulty = ?, status = ?,
        attempts = ?, time_spent_ms = ?, notes = ?, solved_at = ?
      WHERE id = ?;`,
      [
        updated.title,
        updated.url,
        updated.pattern,
        updated.difficulty,
        updated.status,
        updated.attempts,
        updated.time_spent_ms,
        updated.notes,
        updated.solved_at,
        updated.id,
      ]
    );
  },

  async getAll(): Promise<DsaProblemRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<DsaProblemRecord>(
      'SELECT * FROM dsa_problems ORDER BY created_at DESC;'
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM dsa_problems WHERE id = ?;', [id]);
  },
};
