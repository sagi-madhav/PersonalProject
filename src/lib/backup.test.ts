import { validateBackup, BackupData } from './backup';

describe('backup validation', () => {
  const sampleBackup: BackupData = {
    version: 1,
    exportedAt: 1728240000000,
    data: {
      blocks: [],
      focus_sessions: [],
      learn_progress: [],
      dsa_problems: [],
      exercises: [],
      exercise_photos: [],
      workouts: [],
      workout_sets: [],
    },
  };

  it('validates a valid backup payload', () => {
    const result = validateBackup(sampleBackup);
    expect(result.version).toBe(1);
    expect(result.data.blocks).toEqual([]);
  });

  it('rejects invalid or missing version', () => {
    expect(() => validateBackup({ ...sampleBackup, version: 0 })).toThrow(
      'Unsupported or missing backup version'
    );
  });

  it('rejects missing table arrays', () => {
    const invalid = {
      version: 1,
      exportedAt: 12345,
      data: {
        blocks: [],
        // missing other tables
      },
    };
    expect(() => validateBackup(invalid)).toThrow('Backup missing table array');
  });
});
