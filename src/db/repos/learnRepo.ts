import { getDatabase } from '../db';
import { LearnProgressRecord } from '../types';

export const learnRepo = {
  async getByTopicId(topicId: string): Promise<LearnProgressRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<LearnProgressRecord>(
      'SELECT * FROM learn_progress WHERE topic_id = ?;',
      [topicId]
    );
  },

  async upsert(record: LearnProgressRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO learn_progress (
        topic_id, status, notes, review_stage,
        last_reviewed_at, next_review_at, time_spent_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(topic_id) DO UPDATE SET
        status = excluded.status,
        notes = excluded.notes,
        review_stage = excluded.review_stage,
        last_reviewed_at = excluded.last_reviewed_at,
        next_review_at = excluded.next_review_at,
        time_spent_ms = excluded.time_spent_ms;`,
      [
        record.topic_id,
        record.status,
        record.notes,
        record.review_stage,
        record.last_reviewed_at,
        record.next_review_at,
        record.time_spent_ms,
      ]
    );
  },

  async addTimeSpent(topicId: string, addMs: number): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getByTopicId(topicId);
    if (existing) {
      await db.runAsync(
        'UPDATE learn_progress SET time_spent_ms = time_spent_ms + ? WHERE topic_id = ?;',
        [addMs, topicId]
      );
    } else {
      await this.upsert({
        topic_id: topicId,
        status: 'learning',
        notes: null,
        review_stage: 0,
        last_reviewed_at: null,
        next_review_at: null,
        time_spent_ms: addMs,
      });
    }
  },

  async getDueReviews(nowMs: number = Date.now()): Promise<LearnProgressRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<LearnProgressRecord>(
      'SELECT * FROM learn_progress WHERE next_review_at IS NOT NULL AND next_review_at <= ? ORDER BY next_review_at ASC;',
      [nowMs]
    );
  },

  async getAll(): Promise<LearnProgressRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<LearnProgressRecord>('SELECT * FROM learn_progress;');
  },
};
