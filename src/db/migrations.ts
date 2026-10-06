import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATION_V1_SQL } from './schema';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(MIGRATION_V1_SQL);
    await db.execAsync('PRAGMA user_version = 1;');
  }
}
