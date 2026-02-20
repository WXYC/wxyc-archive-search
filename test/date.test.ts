import { describe, it, expect } from 'vitest';
import {
  parseTubafrenzyDate,
  buildArchiveUrl,
  isWithinTwoWeeks,
  formatISODate,
} from '../src/utils/date.js';

describe('parseTubafrenzyDate', () => {
  it('parses YYYYMMDD format correctly', () => {
    const date = parseTubafrenzyDate('20240329');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(date.getDate()).toBe(29);
  });

  it('parses January date correctly', () => {
    const date = parseTubafrenzyDate('20240105');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
  });

  it('parses December date correctly', () => {
    const date = parseTubafrenzyDate('20231215');
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(15);
  });
});

describe('buildArchiveUrl', () => {
  it('builds correct archive URL', () => {
    const date = new Date(2024, 2, 29, 8, 0, 0); // March 29, 2024 8:00 AM
    const url = buildArchiveUrl(date);
    expect(url).toBe('https://archive.wxyc.org/?t=20240329080000');
  });

  it('pads single digits correctly', () => {
    const date = new Date(2024, 0, 5, 9, 5, 0); // Jan 5, 2024 9:05 AM
    const url = buildArchiveUrl(date);
    expect(url).toBe('https://archive.wxyc.org/?t=20240105090500');
  });
});

describe('isWithinTwoWeeks', () => {
  it('returns true for date within 2 weeks', () => {
    const now = new Date('2024-03-29');
    const recentDate = new Date('2024-03-20');
    expect(isWithinTwoWeeks(recentDate, now)).toBe(true);
  });

  it('returns true for date exactly 14 days ago', () => {
    const now = new Date('2024-03-29');
    const twoWeeksAgo = new Date('2024-03-15');
    expect(isWithinTwoWeeks(twoWeeksAgo, now)).toBe(true);
  });

  it('returns false for date older than 2 weeks', () => {
    const now = new Date('2024-03-29');
    const oldDate = new Date('2024-03-10');
    expect(isWithinTwoWeeks(oldDate, now)).toBe(false);
  });

  it('returns false for future dates', () => {
    const now = new Date('2024-03-29');
    const futureDate = new Date('2024-04-05');
    expect(isWithinTwoWeeks(futureDate, now)).toBe(false);
  });

  it('returns true for today', () => {
    const now = new Date('2024-03-29');
    const today = new Date('2024-03-29');
    expect(isWithinTwoWeeks(today, now)).toBe(true);
  });
});

describe('formatISODate', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date(2024, 2, 29);
    expect(formatISODate(date)).toBe('2024-03-29');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2024, 0, 5);
    expect(formatISODate(date)).toBe('2024-01-05');
  });
});
