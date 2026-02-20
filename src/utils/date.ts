const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Parse a tubafrenzy date string in YYYYMMDD format
 */
export function parseTubafrenzyDate(dateStr: string): Date {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10);
  const day = parseInt(dateStr.slice(6, 8), 10);
  return new Date(year, month - 1, day);
}

/**
 * Build an archive URL from a Date object
 * Format: https://archive.wxyc.org/?t=YYYYMMDDHHmmss
 */
export function buildArchiveUrl(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = '00';

  return `https://archive.wxyc.org/?t=${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Check if a date is within the last two weeks
 */
export function isWithinTwoWeeks(date: Date, referenceDate: Date = new Date()): boolean {
  const diff = referenceDate.getTime() - date.getTime();
  return diff >= 0 && diff <= TWO_WEEKS_MS;
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
