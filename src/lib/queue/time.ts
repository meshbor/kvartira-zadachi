export const MOSCOW_TZ = "Europe/Moscow";
export const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

export function moscowDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MOSCOW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatMoscowClock(date = new Date()): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MOSCOW_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatMoscowDate(date = new Date()): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MOSCOW_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function nextMoscowMidnight(date = new Date()): Date {
  const [year, month, day] = moscowDay(date).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0) - MOSCOW_OFFSET_MS);
}

export function secondsUntilReset(date = new Date()): number {
  return Math.max(0, Math.ceil((nextMoscowMidnight(date).getTime() - date.getTime()) / 1000));
}
