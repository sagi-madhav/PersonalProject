export const HOUR_ROW_HEIGHT = 64;

export function timeToY(startMin: number, hourRowHeight: number = HOUR_ROW_HEIGHT): number {
  return (startMin / 60) * hourRowHeight;
}

export function yToTime(y: number, hourRowHeight: number = HOUR_ROW_HEIGHT): number {
  const rawMinutes = (y / hourRowHeight) * 60;
  return Math.max(0, Math.min(1439, Math.round(rawMinutes)));
}

export function snapMinutes(minutes: number, snap: number = 15): number {
  return Math.round(minutes / snap) * snap;
}

export function clampDuration(startMin: number, durationMin: number): number {
  const maxDuration = 1440 - startMin;
  return Math.max(15, Math.min(maxDuration, durationMin));
}

export function getNowY(nowMinutes: number, hourRowHeight: number = HOUR_ROW_HEIGHT): number {
  return timeToY(nowMinutes, hourRowHeight);
}
