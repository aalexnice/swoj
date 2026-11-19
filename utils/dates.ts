/** ISO date (YYYY-MM-DD) `offset` days from today. Server-side helper for dashboards. */
export function isoDayFromToday(offset = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
