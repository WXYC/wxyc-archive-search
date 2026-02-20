import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mapShowDetails, getShowDetails } from '../src/services/show.js';
import type { TubafrenzyShowResponse } from '../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('mapShowDetails', () => {
  it('maps JSON response to ShowDetails', () => {
    const json: TubafrenzyShowResponse = JSON.parse(
      readFileSync(join(fixturesDir, 'show-detail.json'), 'utf-8'),
    );
    const details = mapShowDetails(json);

    expect(details.dj).toBe('DJ Deceitful');
    expect(details.showTime).toBe('8:00 AM - 10:00 AM');
    expect(details.startTime).toBeInstanceOf(Date);
    expect(details.startTime.getTime()).toBe(1711713600000);
  });

  it('converts epoch ms to Date correctly', () => {
    const json: TubafrenzyShowResponse = {
      radioShow: {
        id: 1,
        date: '1/15/24',
        timeRange: '6:00 PM - 8:00 PM',
        discJockeyHandle: 'Night Owl',
        startingRadioHour: 1705363200000,
        previousShowID: 0,
        nextShowID: 2,
      },
      entries: [],
    };
    const details = mapShowDetails(json);

    expect(details.dj).toBe('Night Owl');
    expect(details.showTime).toBe('6:00 PM - 8:00 PM');
    expect(details.startTime.getTime()).toBe(1705363200000);
  });

  it('handles empty DJ handle', () => {
    const json: TubafrenzyShowResponse = {
      radioShow: {
        id: 1,
        date: '3/29/24',
        timeRange: '8:00 AM - 10:00 AM',
        discJockeyHandle: '',
        startingRadioHour: 1711713600000,
        previousShowID: 0,
        nextShowID: 2,
      },
      entries: [],
    };
    const details = mapShowDetails(json);
    expect(details.dj).toBe('');
  });
});

describe('getShowDetails', () => {
  const fixtureJson: TubafrenzyShowResponse = JSON.parse(
    readFileSync(join(fixturesDir, 'show-detail.json'), 'utf-8'),
  );

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches with correct URL and returns mapped details', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(fixtureJson), { status: 200 }),
    );

    const details = await getShowDetails('2380735');

    expect(fetch).toHaveBeenCalledWith(
      'http://wxyc.info/playlists/radioShowHighlightSearchResult?flowsheetEntry=2380735&format=json',
    );
    expect(details.dj).toBe('DJ Deceitful');
    expect(details.showTime).toBe('8:00 AM - 10:00 AM');
    expect(details.startTime.getTime()).toBe(1711713600000);
  });

  it('throws on non-OK HTTP response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 404 }),
    );

    await expect(getShowDetails('999')).rejects.toThrow('Failed to fetch show details: 404');
  });

  it('throws when API returns error flag', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: true, radioShow: null, entries: [] }), { status: 200 }),
    );

    await expect(getShowDetails('999')).rejects.toThrow('Tubafrenzy show lookup returned an error');
  });
});
