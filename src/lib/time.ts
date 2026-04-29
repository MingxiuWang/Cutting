export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function deriveMeasuredDay(measuredAt: Date, tzOffsetMinutes: number): string {
  const local = new Date(measuredAt.getTime() + tzOffsetMinutes * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWithinEditWindow(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < EDIT_WINDOW_MS;
}
