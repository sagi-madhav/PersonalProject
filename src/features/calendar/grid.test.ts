import { buildMonthGrid } from './grid';

describe('calendar month grid', () => {
  it('builds month grid for October 2026 starting on Sunday', () => {
    // Oct 2026 (month index 9)
    const grid = buildMonthGrid(2026, 9, 'sun');
    // Weeks should be multiple of 7
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(28);
    expect(grid.length).toBeLessThanOrEqual(42);

    // Oct 1 2026 is a Thursday, so previous Sunday (Sep 27) is first day
    expect(grid[0].dayNumber).toBe(27);
    expect(grid[0].isCurrentMonth).toBe(false);

    // Find Oct 6
    const oct6 = grid.find((d) => d.dateKey === '2026-10-06');
    expect(oct6).toBeDefined();
    expect(oct6?.isCurrentMonth).toBe(true);
    expect(oct6?.dayNumber).toBe(6);
  });

  it('builds month grid starting on Monday', () => {
    const grid = buildMonthGrid(2026, 9, 'mon');
    expect(grid.length % 7).toBe(0);
    // First day should be Monday Sep 28
    expect(grid[0].dayNumber).toBe(28);
    expect(grid[0].isCurrentMonth).toBe(false);
  });

  it('correctly handles leap year February', () => {
    // Feb 2028 (leap year, month index 1)
    const grid = buildMonthGrid(2028, 1, 'sun');
    const feb29 = grid.find((d) => d.dateKey === '2028-02-29');
    expect(feb29).toBeDefined();
    expect(feb29?.isCurrentMonth).toBe(true);
  });
});
