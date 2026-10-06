import { getDatabase } from '../db';
import { FocusSessionRecord } from '../types';

export const focusRepo = {
  async getById(id: string): Promise<FocusSessionRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<FocusSessionRecord>(
      'SELECT * FROM focus_sessions WHERE id = ?;',
      [id]
    );
  },

  async insert(session: FocusSessionRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO focus_sessions (
        id, mode, label, topic_id, planned_ms, actual_ms,
        started_at, ended_at, completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        session.id,
        session.mode,
        session.label,
        session.topic_id,
        session.planned_ms,
        session.actual_ms,
        session.started_at,
        session.ended_at,
        session.completed,
      ]
    );
  },

  async getRecent(limit: number = 20): Promise<FocusSessionRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<FocusSessionRecord>(
      'SELECT * FROM focus_sessions ORDER BY ended_at DESC LIMIT ?;',
      [limit]
    );
  },

  async getByDateRange(startMs: number, endMs: number): Promise<FocusSessionRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<FocusSessionRecord>(
      'SELECT * FROM focus_sessions WHERE started_at >= ? AND ended_at <= ? ORDER BY started_at ASC;',
      [startMs, endMs]
    );
  },

  async getAll(): Promise<FocusSessionRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<FocusSessionRecord>(
      'SELECT * FROM focus_sessions ORDER BY started_at DESC;'
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM focus_sessions WHERE id = ?;', [id]);
  },
};
