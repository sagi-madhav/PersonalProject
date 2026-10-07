import { findPreviousSet } from './previous';
import { WorkoutSetRecord } from '../../db/types';
import { SPLIT_ROUTINES, getRoutineById } from './routines';

describe('previous set values lookup', () => {
  const sets: WorkoutSetRecord[] = [
    {
      id: 's1',
      workout_id: 'w1',
      exercise_id: 'ex-bench',
      position: 0,
      set_number: 1,
      weight_kg: 80,
      reps: 10,
      rpe: null,
      is_warmup: 0,
      completed_at: 1000,
    },
    {
      id: 's2',
      workout_id: 'w2',
      exercise_id: 'ex-bench',
      position: 0,
      set_number: 1,
      weight_kg: 85,
      reps: 8,
      rpe: null,
      is_warmup: 0,
      completed_at: 2000, // Newer workout
    },
    {
      id: 's3',
      workout_id: 'w2',
      exercise_id: 'ex-bench',
      position: 0,
      set_number: 2,
      weight_kg: 85,
      reps: 7,
      rpe: null,
      is_warmup: 0,
      completed_at: 2050,
    },
  ];

  it('finds previous set from the most recent completed workout', () => {
    const prevSet1 = findPreviousSet(sets, 'ex-bench', 1);
    expect(prevSet1).toEqual({ weightKg: 85, reps: 8 });

    const prevSet2 = findPreviousSet(sets, 'ex-bench', 2);
    expect(prevSet2).toEqual({ weightKg: 85, reps: 7 });
  });

  it('returns null when no previous set exists', () => {
    const none = findPreviousSet(sets, 'ex-squat', 1);
    expect(none).toBeNull();
  });
});

describe('Split Routines (Upper/Lower + Biceps)', () => {
  it('includes all 4 routines for the split', () => {
    expect(SPLIT_ROUTINES.length).toBe(4);
    const ids = SPLIT_ROUTINES.map((r: any) => r.id);
    expect(ids).toContain('upper-a');
    expect(ids).toContain('lower-body');
    expect(ids).toContain('biceps-hypertrophy');
    expect(ids).toContain('upper-b');
  });

  it('each routine has valid exercises and can be looked up by id', () => {
    for (const r of SPLIT_ROUTINES) {
      expect(r.title).toBeTruthy();
      expect(r.exercises.length).toBeGreaterThan(0);
      const found = getRoutineById(r.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(r.id);

      for (const ex of r.exercises) {
        expect(ex.name).toBeTruthy();
        expect(ex.targetSets).toBeGreaterThan(0);
        expect(ex.defaultReps).toBeGreaterThan(0);
        expect(ex.defaultWeightLb).toBeGreaterThan(0);
      }
    }
  });
});
