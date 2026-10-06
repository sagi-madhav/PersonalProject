// Web fallback database implementation for browser preview
// Avoids experimental expo-sqlite WebAssembly / Web Worker chunk errors on Web/Windows,
// while native iOS continues to use real native expo-sqlite via db.ts.

import { runMigrations } from './migrations';

export interface WebDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(source: string, params?: any[]): Promise<T | null>;
  getAllAsync<T>(source: string, params?: any[]): Promise<T[]>;
}

class InMemoryWebDatabase implements WebDatabase {
  private tables: Map<string, Map<string, any>> = new Map();
  private userVersion: number = 0;

  constructor() {
    this.tables.set('blocks', new Map());
    this.tables.set('focus_sessions', new Map());
    this.tables.set('learn_progress', new Map());
    this.tables.set('dsa_problems', new Map());
    this.tables.set('exercises', new Map());
    this.tables.set('exercise_photos', new Map());
    this.tables.set('workouts', new Map());
    this.tables.set('workout_sets', new Map());

    // Try loading persisted state from localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('planner_web_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          for (const [tbl, rows] of Object.entries(parsed)) {
            const rowMap = new Map();
            for (const [id, val] of Object.entries(rows as Record<string, any>)) {
              rowMap.set(id, val);
            }
            this.tables.set(tbl, rowMap);
          }
        }
      } catch {
        // Fallback to fresh in-memory state
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const out: Record<string, Record<string, any>> = {};
        for (const [tbl, rowMap] of this.tables.entries()) {
          out[tbl] = Object.fromEntries(rowMap.entries());
        }
        window.localStorage.setItem('planner_web_db', JSON.stringify(out));
      } catch {
        // Ignore quota errors
      }
    }
  }

  async execAsync(source: string): Promise<void> {
    const stmts = source.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of stmts) {
      if (stmt.startsWith('PRAGMA user_version =')) {
        const match = stmt.match(/PRAGMA user_version\s*=\s*(\d+)/i);
        if (match) this.userVersion = parseInt(match[1], 10);
      }
    }
  }

  async runAsync(source: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const trimmed = source.trim();

    // 1. INSERT INTO <table> (...) VALUES (...)
    const insertMatch = trimmed.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const table = insertMatch[1].toLowerCase();
      const cols = insertMatch[2].split(',').map((c) => c.trim().toLowerCase());
      const tblMap = this.tables.get(table) || new Map();
      this.tables.set(table, tblMap);

      const row: Record<string, any> = {};
      cols.forEach((col, idx) => {
        row[col] = params[idx];
      });

      const primaryKey = row.id ?? row.topic_id ?? String(Date.now());
      tblMap.set(primaryKey, row);
      this.saveToLocalStorage();
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 2. UPDATE <table> SET ... WHERE <col> = ?
    const updateMatch = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const table = updateMatch[1].toLowerCase();
      const setClause = updateMatch[2];
      const whereClause = updateMatch[3];

      const tblMap = this.tables.get(table);
      if (!tblMap) return { lastInsertRowId: 0, changes: 0 };

      // Identify target row
      const whereColMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
      const whereCol = whereColMatch ? whereColMatch[1].toLowerCase() : 'id';
      const whereVal = params[params.length - 1];

      for (const [key, row] of tblMap.entries()) {
        if (row[whereCol] === whereVal || key === whereVal) {
          // Parse SET assignments
          const setParts = setClause.split(',').map((p) => p.trim());
          let paramIdx = 0;
          for (const part of setParts) {
            const colMatch = part.match(/([a-zA-Z0-9_]+)\s*=\s*([?]|time_spent_ms\s*\+\s*\?)/i);
            if (colMatch) {
              const col = colMatch[1].toLowerCase();
              if (colMatch[2].includes('time_spent_ms')) {
                row[col] = (row[col] || 0) + (params[paramIdx] || 0);
              } else {
                row[col] = params[paramIdx];
              }
              paramIdx++;
            }
          }
          this.saveToLocalStorage();
          return { lastInsertRowId: 0, changes: 1 };
        }
      }
    }

    // 3. DELETE FROM <table> WHERE <col> = ?
    const deleteMatch = trimmed.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+(.+)/i);
    if (deleteMatch) {
      const table = deleteMatch[1].toLowerCase();
      const whereClause = deleteMatch[2];
      const tblMap = this.tables.get(table);
      if (!tblMap) return { lastInsertRowId: 0, changes: 0 };

      const whereColMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
      const whereCol = whereColMatch ? whereColMatch[1].toLowerCase() : 'id';
      const whereVal = params[0];

      for (const [key, row] of tblMap.entries()) {
        if (row[whereCol] === whereVal || key === whereVal) {
          tblMap.delete(key);
        }
      }
      this.saveToLocalStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(source: string, params: any[] = []): Promise<T | null> {
    const trimmed = source.trim();
    if (trimmed.startsWith('PRAGMA user_version')) {
      return { user_version: this.userVersion } as unknown as T;
    }
    const all = await this.getAllAsync<T>(source, params);
    return all.length > 0 ? all[0] : null;
  }

  async getAllAsync<T>(source: string, params: any[] = []): Promise<T[]> {
    const trimmed = source.trim();

    // Match SELECT ... FROM <table>
    const fromMatch = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) return [];

    const table = fromMatch[1].toLowerCase();
    const tblMap = this.tables.get(table);
    if (!tblMap) return [];

    let rows = Array.from(tblMap.values());

    // Filter by WHERE clauses
    if (/WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.id === params[0]);
    } else if (/WHERE\s+topic_id\s*=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.topic_id === params[0]);
    } else if (/WHERE\s+date\s*=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.date === params[0]);
    } else if (/WHERE\s+date\s+IS\s+NULL/i.test(trimmed)) {
      rows = rows.filter((r) => r.date == null);
    } else if (/WHERE\s+workout_id\s*=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.workout_id === params[0]);
    } else if (/WHERE\s+exercise_id\s*=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.exercise_id === params[0]);
    } else if (/WHERE\s+archived\s*=\s*0/i.test(trimmed)) {
      rows = rows.filter((r) => !r.archived);
    } else if (/WHERE\s+ended_at\s*>=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.ended_at >= params[0]);
    } else if (/WHERE\s+next_review_at\s+IS\s+NOT\s+NULL\s+AND\s+next_review_at\s*<=\s*\?/i.test(trimmed)) {
      rows = rows.filter((r) => r.next_review_at != null && r.next_review_at <= params[0]);
    }

    // ORDER BY
    if (/ORDER\s+BY\s+started_at\s+DESC/i.test(trimmed)) {
      rows.sort((a, b) => (b.started_at || 0) - (a.started_at || 0));
    } else if (/ORDER\s+BY\s+ended_at\s+DESC/i.test(trimmed)) {
      rows.sort((a, b) => (b.ended_at || 0) - (a.ended_at || 0));
    } else if (/ORDER\s+BY\s+ended_at\s+ASC/i.test(trimmed)) {
      rows.sort((a, b) => (a.ended_at || 0) - (b.ended_at || 0));
    } else if (/ORDER\s+BY\s+created_at\s+DESC/i.test(trimmed)) {
      rows.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    } else if (/ORDER\s+BY\s+name\s+ASC/i.test(trimmed)) {
      rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (/ORDER\s+BY\s+position\s+ASC/i.test(trimmed)) {
      rows.sort((a, b) => (a.position || 0) - (b.position || 0));
    }

    // LIMIT
    const limitMatch = trimmed.match(/LIMIT\s+(\d+|\?)/i);
    if (limitMatch) {
      const limitVal = limitMatch[1] === '?' ? params[params.length - 1] : parseInt(limitMatch[1], 10);
      if (typeof limitVal === 'number') {
        rows = rows.slice(0, limitVal);
      }
    }

    return rows as unknown as T[];
  }
}

let webDbInstance: WebDatabase | null = null;
let webInitPromise: Promise<WebDatabase> | null = null;

export async function getDatabase(): Promise<WebDatabase> {
  if (webDbInstance) {
    return webDbInstance;
  }
  if (webInitPromise) {
    return webInitPromise;
  }

  webInitPromise = (async () => {
    const db = new InMemoryWebDatabase();
    await runMigrations(db as any);
    webDbInstance = db;
    return db;
  })();

  return webInitPromise;
}
