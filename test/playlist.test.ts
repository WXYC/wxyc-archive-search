import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mapSearchResults, searchPlaylists, filterResults } from '../src/services/playlist.js';
import type { TubafrenzySearchResponse } from '../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('mapSearchResults', () => {
  it('maps JSON response to SearchResult array', () => {
    const json: TubafrenzySearchResponse = JSON.parse(
      readFileSync(join(fixturesDir, 'search-results.json'), 'utf-8'),
    );
    const results = mapSearchResults(json);

    expect(results).toHaveLength(3);

    expect(results[0]).toEqual({
      artist: 'Radiohead',
      song: 'Creep',
      album: 'Pablo Honey',
      label: 'Capitol',
      showDate: '2024-03-29',
      flowsheetEntryId: '2380735',
    });

    expect(results[1]).toEqual({
      artist: 'Radiohead',
      song: 'Knives',
      album: 'Amnesiac',
      label: 'Capitol',
      showDate: '2012-04-22',
      flowsheetEntryId: '1019985',
    });

    expect(results[2]).toEqual({
      artist: 'Radiohead',
      song: 'Airbag',
      album: 'OK Computer',
      label: 'Capitol',
      showDate: '2011-05-03',
      flowsheetEntryId: '886910',
    });
  });

  it('maps release field to album', () => {
    const json: TubafrenzySearchResponse = {
      error: false,
      totalHits: 1,
      page: 1,
      pageSize: 25,
      searchString: 'test',
      yearCounts: {},
      results: [
        {
          flowsheetEntryID: '1',
          artist: 'Test Artist',
          song: 'Test Song',
          release: 'Test Album',
          label: 'Test Label',
          radioShowID: '100',
          date: '20240101',
        },
      ],
    };
    const results = mapSearchResults(json);
    expect(results[0].album).toBe('Test Album');
  });

  it('handles empty results', () => {
    const json: TubafrenzySearchResponse = {
      error: false,
      totalHits: 0,
      page: 1,
      pageSize: 25,
      searchString: 'nothing',
      yearCounts: {},
      results: [],
    };
    const results = mapSearchResults(json);
    expect(results).toHaveLength(0);
  });
});

describe('searchPlaylists', () => {
  const fixtureJson: TubafrenzySearchResponse = JSON.parse(
    readFileSync(join(fixturesDir, 'search-results.json'), 'utf-8'),
  );

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches with correct URL and returns mapped results', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(fixtureJson), { status: 200 }),
    );

    const result = await searchPlaylists({ q: 'radiohead' });

    expect(fetch).toHaveBeenCalledWith(
      'http://wxyc.info/playlists/searchPlaylists?mode=simple&format=json&searchString=radiohead&pageToDisplay=1',
    );
    expect(result.results).toHaveLength(3);
    expect(result.totalHits).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it('combines multiple search params into query string', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...fixtureJson, results: [] }), { status: 200 }),
    );

    await searchPlaylists({ q: 'test', artist: 'Radiohead', song: 'Creep', album: 'Pablo' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('searchString=test%20Radiohead%20Creep%20Pablo'),
    );
  });

  it('passes page parameter as pageToDisplay', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(fixtureJson), { status: 200 }),
    );

    await searchPlaylists({ q: 'test' }, 5);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('pageToDisplay=5'),
    );
  });

  it('throws when no search parameters provided', async () => {
    await expect(searchPlaylists({})).rejects.toThrow('At least one search parameter is required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws on non-OK HTTP response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 500 }),
    );

    await expect(searchPlaylists({ q: 'test' })).rejects.toThrow('Failed to fetch search results: 500');
  });

  it('throws when API returns error flag', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: true, errorMessage: 'Bad query' }), { status: 200 }),
    );

    await expect(searchPlaylists({ q: 'test' })).rejects.toThrow('Bad query');
  });

  it('throws generic message when API error has no message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: true }), { status: 200 }),
    );

    await expect(searchPlaylists({ q: 'test' })).rejects.toThrow('Tubafrenzy search returned an error');
  });
});

describe('filterResults', () => {
  const sampleResults = [
    {
      artist: 'Radiohead',
      song: 'Creep',
      album: 'Pablo Honey',
      label: 'Capitol',
      showDate: '2024-03-29',
      flowsheetEntryId: '123',
    },
    {
      artist: 'Radiohead',
      song: 'Karma Police',
      album: 'OK Computer',
      label: 'Capitol',
      showDate: '2024-03-28',
      flowsheetEntryId: '124',
    },
    {
      artist: 'The Strokes',
      song: 'Reptilia',
      album: 'Room on Fire',
      label: 'RCA',
      showDate: '2024-03-27',
      flowsheetEntryId: '125',
    },
  ];

  it('filters by artist', () => {
    const filtered = filterResults(sampleResults, { artist: 'Strokes' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].artist).toBe('The Strokes');
  });

  it('filters by song', () => {
    const filtered = filterResults(sampleResults, { song: 'Creep' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].song).toBe('Creep');
  });

  it('filters by album', () => {
    const filtered = filterResults(sampleResults, { album: 'OK Computer' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].album).toBe('OK Computer');
  });

  it('filters with multiple criteria', () => {
    const filtered = filterResults(sampleResults, { artist: 'Radiohead', album: 'Pablo' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].song).toBe('Creep');
  });

  it('is case insensitive', () => {
    const filtered = filterResults(sampleResults, { artist: 'radiohead' });
    expect(filtered).toHaveLength(2);
  });

  it('returns all results when no filters specified', () => {
    const filtered = filterResults(sampleResults, {});
    expect(filtered).toHaveLength(3);
  });

  it('returns empty array when no matches', () => {
    const filtered = filterResults(sampleResults, { artist: 'Nirvana' });
    expect(filtered).toHaveLength(0);
  });
});
