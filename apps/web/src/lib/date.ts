/**
 * Local calendar date as YYYY-MM-DD. Uses the browser's local timezone instead
 * of `toISOString()` (which is UTC) so an evening log in IST — or any timezone
 * ahead of/behind UTC — is stamped with the correct local day, not tomorrow's
 * or yesterday's.
 */
export function todayLocalISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
