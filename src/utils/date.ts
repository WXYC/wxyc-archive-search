const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Parse a show date in "M/DD/YY" or "MM/DD/YY" format
 */
export function parseShowDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split('/').map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(fullYear, month - 1, day);
}

/**
 * Parse a show time string like "8:00 AM" and return hours and minutes
 */
export function parseShowTime(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Combine a date and time string to create a full Date object
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const date = parseShowDate(dateStr);
  const { hours, minutes } = parseShowTime(timeStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
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
