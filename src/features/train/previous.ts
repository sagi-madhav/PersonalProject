import { WorkoutSetRecord } from '../../db/types';

export interface PreviousSetValue {
  weightKg: number | null;
  reps: number | null;
}

export function findPreviousSet(
  historicalSets: WorkoutSetRecord[],
  exerciseId: string,
  setNumber: number
): PreviousSetValue | null {
  // Filter for completed sets matching exerciseId and setNumber, newest first
  const matching = historicalSets
    .filter(
      (s) =>
        s.exercise_id === exerciseId &&
        s.set_number === setNumber &&
        s.completed_at != null
    )
    .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0));

  if (matching.length === 0) return null;

  const prev = matching[0];
  return {
    weightKg: prev.weight_kg,
    reps: prev.reps,
  };
}
