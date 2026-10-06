const KG_TO_LB = 2.20462;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

export function formatWeight(
  kg: number | null | undefined,
  unit: 'kg' | 'lb' = 'kg'
): string {
  if (kg == null || isNaN(kg)) return '—';
  if (unit === 'lb') {
    const lb = kgToLb(kg);
    return `${(Math.round(lb * 2) / 2).toFixed(1).replace(/\.0$/, '')} lb`;
  }
  return `${(Math.round(kg * 2) / 2).toFixed(1).replace(/\.0$/, '')} kg`;
}

export function displayWeightValue(
  kg: number | null | undefined,
  unit: 'kg' | 'lb' = 'kg'
): number {
  if (kg == null || isNaN(kg)) return 0;
  if (unit === 'lb') {
    return Math.round(kgToLb(kg) * 2) / 2;
  }
  return Math.round(kg * 2) / 2;
}

export function parseInputWeightToKg(
  inputValue: number,
  unit: 'kg' | 'lb' = 'kg'
): number {
  if (unit === 'lb') {
    return lbToKg(inputValue);
  }
  return inputValue;
}

export function calculateEstimated1RM(weightKg: number, reps: number): number | null {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps > 12) return null; // spec: ignore sets with reps > 12 for 1RM PRs
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function calculateSetVolume(
  weightKg: number | null | undefined,
  reps: number | null | undefined,
  isWarmup: number = 0
): number {
  if (isWarmup === 1 || !weightKg || !reps || weightKg <= 0 || reps <= 0) {
    return 0;
  }
  return weightKg * reps;
}
