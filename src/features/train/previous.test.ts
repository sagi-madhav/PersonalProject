import { findPreviousSet } from './previous';
import { WorkoutSetRecord } from '../../db/types';

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
