import { timeToY, yToTime, snapMinutes, clampDuration } from './layout';
import { packColumns } from './packing';
import { findFreeGaps } from './gaps';
import { BlockRecord } from '../../../db/types';

describe('timeline calculations', () => {
  it('converts time to Y and Y to time accurately', () => {
    // 60 minutes with 64 row height = 64
    expect(timeToY(60, 64)).toBe(64);
    // 90 minutes = 1.5 * 64 = 96
    expect(timeToY(90, 64)).toBe(96);
    expect(yToTime(64, 64)).toBe(60);
  });

  it('snaps minutes to 15-min intervals', () => {
    expect(snapMinutes(14)).toBe(15);
    expect(snapMinutes(22)).toBe(15);
    expect(snapMinutes(23)).toBe(30);
    expect(snapMinutes(0)).toBe(0);
  });

  it('clamps duration to stay within 24 hours', () => {
    // Block starting at 23:30 (1410 min) with 60 min duration should clamp to 30 min (until 24:00)
    expect(clampDuration(1410, 60)).toBe(30);
  });

  it('packs overlapping blocks into side-by-side columns', () => {
    const blocks: BlockRecord[] = [
      {
        id: '1',
        title: 'Meeting 1',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: 540, // 9:00
        duration_min: 60,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 1,
        updated_at: 1,
      },
      {
        id: '2',
        title: 'Meeting 2',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: 570, // 9:30 (overlaps with Meeting 1)
        duration_min: 60,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 2,
        updated_at: 2,
      },
    ];

    const packed = packColumns(blocks, 3);
    expect(packed.length).toBe(2);
    expect(packed[0].totalColumns).toBe(2);
    expect(packed[0].column).toBe(0);
    expect(packed[1].column).toBe(1);
  });

  it('does not overlap touching blocks', () => {
    const blocks: BlockRecord[] = [
      {
        id: '1',
        title: 'Task 1',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: 540, // 9:00 - 10:00
        duration_min: 60,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 1,
        updated_at: 1,
      },
      {
        id: '2',
        title: 'Task 2',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: 600, // 10:00 - 11:00 (touches but no overlap)
        duration_min: 60,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 2,
        updated_at: 2,
      },
    ];

    const packed = packColumns(blocks, 3);
    expect(packed.length).toBe(2);
    expect(packed[0].column).toBe(0);
    expect(packed[1].column).toBe(0); // same column since they don't overlap!
  });

  it('finds free gaps >= 45 min and ignores untimed blocks', () => {
    const blocks: BlockRecord[] = [
      {
        id: '1',
        title: 'Morning Block',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: 420, // 7:00 - 8:00
        duration_min: 60,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 1,
        updated_at: 1,
      },
      {
        id: '2',
        title: 'Untimed task',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: null,
        duration_min: null,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 2,
        updated_at: 2,
      },
      {
        id: '3',
        title: 'Late Morning',
        kind: 'task',
        category: 'work',
        date: '2026-10-06',
        start_min: 600, // 10:00 - 11:00 (free gap between 8:00 and 10:00 is 120 min)
        duration_min: 60,
        done_at: null,
        notes: null,
        link_type: null,
        link_id: null,
        created_at: 3,
        updated_at: 3,
      },
    ];

    const gaps = findFreeGaps(blocks, 420, 660, 45); // 7:00 to 11:00
    expect(gaps.length).toBe(1);
    expect(gaps[0].startMin).toBe(480); // 8:00
    expect(gaps[0].durationMin).toBe(120); // 2 hours free
  });
});
