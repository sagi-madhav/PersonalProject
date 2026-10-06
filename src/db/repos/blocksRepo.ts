import { getDatabase } from '../db';
import { BlockRecord } from '../types';

export const blocksRepo = {
  async getById(id: string): Promise<BlockRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<BlockRecord>('SELECT * FROM blocks WHERE id = ?;', [id]);
  },

  async getByDate(date: string): Promise<BlockRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<BlockRecord>(
      'SELECT * FROM blocks WHERE date = ? ORDER BY start_min ASC, created_at ASC;',
      [date]
    );
  },

  async getInbox(): Promise<BlockRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<BlockRecord>(
      'SELECT * FROM blocks WHERE date IS NULL ORDER BY created_at DESC;'
    );
  },

  async insert(block: BlockRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO blocks (
        id, title, kind, category, date, start_min, duration_min,
        done_at, notes, link_type, link_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        block.id,
        block.title,
        block.kind,
        block.category,
        block.date,
        block.start_min,
        block.duration_min,
        block.done_at,
        block.notes,
        block.link_type,
        block.link_id,
        block.created_at,
        block.updated_at,
      ]
    );
  },

  async update(block: Partial<BlockRecord> & { id: string }): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(block.id);
    if (!existing) throw new Error(`Block not found: ${block.id}`);

    const updated: BlockRecord = {
      ...existing,
      ...block,
      updated_at: Date.now(),
    };

    await db.runAsync(
      `UPDATE blocks SET
        title = ?, kind = ?, category = ?, date = ?, start_min = ?,
        duration_min = ?, done_at = ?, notes = ?, link_type = ?, link_id = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        updated.title,
        updated.kind,
        updated.category,
        updated.date,
        updated.start_min,
        updated.duration_min,
        updated.done_at,
        updated.notes,
        updated.link_type,
        updated.link_id,
        updated.updated_at,
        updated.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM blocks WHERE id = ?;', [id]);
  },

  async getAll(): Promise<BlockRecord[]> {
    const db = await getDatabase();
    return db.getAllAsync<BlockRecord>('SELECT * FROM blocks ORDER BY created_at DESC;');
  },
};
