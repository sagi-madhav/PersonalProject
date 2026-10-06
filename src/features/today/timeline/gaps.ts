import { BlockRecord } from '../../../db/types';

export interface FreeGap {
  startMin: number;
  durationMin: number;
}

export function findFreeGaps(
  blocks: BlockRecord[],
  dayStartMin: number = 7 * 60, // 7 AM
  dayEndMin: number = 21 * 60, // 9 PM
  minGapDuration: number = 45
): FreeGap[] {
  const timed = blocks
    .filter((b) => b.start_min != null && b.duration_min != null && b.duration_min > 0)
    .sort((a, b) => a.start_min! - b.start_min!);

  if (timed.length === 0) {
    const totalDay = dayEndMin - dayStartMin;
    if (totalDay >= minGapDuration) {
      return [{ startMin: dayStartMin, durationMin: totalDay }];
    }
    return [];
  }

  // Merge occupied intervals
  const occupied: { start: number; end: number }[] = [];
  for (const b of timed) {
    const s = Math.max(dayStartMin, b.start_min!);
    const e = Math.min(dayEndMin, b.start_min! + b.duration_min!);
    if (s >= e) continue;

    if (occupied.length > 0 && occupied[occupied.length - 1].end >= s) {
      occupied[occupied.length - 1].end = Math.max(occupied[occupied.length - 1].end, e);
    } else {
      occupied.push({ start: s, end: e });
    }
  }

  const gaps: FreeGap[] = [];
  let pointer = dayStartMin;

  for (const occ of occupied) {
    if (occ.start - pointer >= minGapDuration) {
      gaps.push({
        startMin: pointer,
        durationMin: occ.start - pointer,
      });
    }
    pointer = Math.max(pointer, occ.end);
  }

  if (dayEndMin - pointer >= minGapDuration) {
    gaps.push({
      startMin: pointer,
      durationMin: dayEndMin - pointer,
    });
  }

  return gaps;
}
