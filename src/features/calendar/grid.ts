import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';

export interface CalendarDay {
  date: Date;
  dateKey: string; // 'YYYY-MM-DD'
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function buildMonthGrid(
  year: number,
  month: number, // 0-indexed (0 = Jan, 9 = Oct)
  weekStartsOn: 'sun' | 'mon' = 'sun'
): CalendarDay[] {
  const currentMonthDate = new Date(year, month, 1);
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);

  const startWeekDay = weekStartsOn === 'mon' ? 1 : 0;
  const gridStart = startOfWeek(monthStart, { weekStartsOn: startWeekDay });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: startWeekDay });

  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  return allDays.map((d) => ({
    date: d,
    dateKey: format(d, 'yyyy-MM-dd'),
    dayNumber: d.getDate(),
    isCurrentMonth: isSameMonth(d, currentMonthDate),
    isToday: isSameDay(d, today),
  }));
}
