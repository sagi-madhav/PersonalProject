import { format, parse, addDays, subDays } from 'date-fns';

export function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateToKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseKeyToDate(key: string): Date {
  return parse(key, 'yyyy-MM-dd', new Date());
}

export function getOffsetDayKey(key: string, days: number): string {
  const d = parseKeyToDate(key);
  return formatDateToKey(days >= 0 ? addDays(d, days) : subDays(d, Math.abs(days)));
}

export function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function snapToMinutes(minutes: number, snap: number = 15): number {
  return Math.round(minutes / snap) * snap;
}

export function startMinToTimeString(startMin: number, format24h: boolean = false): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(startMin)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const padMin = mins.toString().padStart(2, '0');

  if (format24h) {
    const padHour = hours.toString().padStart(2, '0');
    return `${padHour}:${padMin}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${padMin} ${period}`;
}

export function formatDurationMinutes(durationMin: number): string {
  if (durationMin <= 0) return '0m';
  const h = Math.floor(durationMin / 60);
  const m = durationMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatTimeRange(startMin: number, durationMin: number, format24h: boolean = false): string {
  const endMin = Math.min(1440, startMin + durationMin);
  return `${startMinToTimeString(startMin, format24h)} – ${startMinToTimeString(endMin, format24h)}`;
}
