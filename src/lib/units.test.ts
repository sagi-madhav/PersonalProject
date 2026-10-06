import {
  kgToLb,
  lbToKg,
  formatWeight,
  calculateEstimated1RM,
  calculateSetVolume,
  getDualWeightDisplay,
} from './units';

describe('units and workout math', () => {
  it('converts kg and lb correctly', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(lbToKg(220.462)).toBeCloseTo(100, 2);
  });

  it('formats weight with display rounding', () => {
    expect(formatWeight(60, 'kg')).toBe('60 kg');
    expect(formatWeight(60, 'lb')).toBe('132.5 lb');
    expect(formatWeight(null, 'lb')).toBe('—');
  });

  it('calculates estimated 1RM using Epley formula and ignores reps > 12', () => {
    // 100 kg x 1 rep = 100 kg
    expect(calculateEstimated1RM(100, 1)).toBe(100);
    // 100 kg x 10 reps = 100 * (1 + 10/30) = 133.33 kg
    expect(calculateEstimated1RM(100, 10)).toBeCloseTo(133.33, 1);
    // reps > 12 returns null for PR tracking per spec
    expect(calculateEstimated1RM(100, 15)).toBeNull();
  });

  it('calculates set volume excluding warm-ups', () => {
    expect(calculateSetVolume(100, 5, 0)).toBe(500);
    expect(calculateSetVolume(100, 5, 1)).toBe(0); // warm-up excluded
  });

  it('returns dual weight display with primary and live conversion', () => {
    const dual = getDualWeightDisplay(60, 'lb');
    expect(dual.primary).toBe('132.5 lb');
    expect(dual.secondary).toBe('60 kg');

    const dualKg = getDualWeightDisplay(60, 'kg');
    expect(dualKg.primary).toBe('60 kg');
    expect(dualKg.secondary).toBe('132.5 lb');
  });
});
