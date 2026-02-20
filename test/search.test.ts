import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SearchResult } from '../src/types.js';

// Mock jose (required by auth middleware)
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn(),
  errors: {
    JWTExpired: class JWTExpired extends Error {},
    JWTClaimValidationFailed: class JWTClaimValidationFailed extends Error {},
    JWSSignatureVerificationFailed: class JWSSignatureVerificationFailed extends Error {},
  },
}));

// Mock playlist service
vi.mock('../src/services/playlist.js', () => ({
  searchPlaylists: vi.fn(),
  filterResults: vi.fn((results: SearchResult[]) => results),
}));

// Mock show service
vi.mock('../src/services/show.js', () => ({
  getShowDetails: vi.fn(),
}));

import { jwtVerify } from 'jose';
import { searchPlaylists } from '../src/services/playlist.js';
import { getShowDetails } from '../src/services/show.js';
import { app } from '../src/app.js';

const mockedSearchPlaylists = vi.mocked(searchPlaylists);
const mockedGetShowDetails = vi.mocked(getShowDetails);
const mockedJwtVerify = vi.mocked(jwtVerify);

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    artist: 'Test Artist',
    song: 'Test Song',
    album: 'Test Album',
    label: 'Test Label',
    showDate: today(),
    flowsheetEntryId: '12345',
    ...overrides,
  };
}

const showDetailsResponse = {
  dj: 'DJ Test',
  showTime: '8:00 AM - 10:00 AM',
  startTime: new Date(),
};

describe('GET /search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetShowDetails.mockResolvedValue(showDetailsResponse);
  });

  it('returns 400 when no search params provided', async () => {
    const res = await app.request('/search');
    expect(res.status).toBe(400);
  });

  describe('unauthenticated (no Authorization header)', () => {
    it('probes page 1 then fetches last page when results span multiple pages', async () => {
      mockedSearchPlaylists
        // Probe call: 200 total hits, 50 per page -> last page is 4
        .mockResolvedValueOnce({
          results: [],
          totalHits: 200,
          page: 1,
          pageSize: 50,
        })
        // Actual fetch of last page
        .mockResolvedValueOnce({
          results: [makeResult()],
          totalHits: 200,
          page: 4,
          pageSize: 50,
        });

      const res = await app.request('/search?q=test');
      expect(res.status).toBe(200);

      expect(mockedSearchPlaylists).toHaveBeenCalledTimes(2);
      // First call: probe with page=1
      expect(mockedSearchPlaylists).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ q: 'test' }),
        1,
      );
      // Second call: fetch last page (ceil(200/50) = 4)
      expect(mockedSearchPlaylists).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ q: 'test' }),
        4,
      );
    });

    it('does not re-fetch when results fit on one page', async () => {
      const result = makeResult();
      mockedSearchPlaylists
        // Probe: totalHits fits in one page
        .mockResolvedValueOnce({
          results: [result],
          totalHits: 10,
          page: 1,
          pageSize: 50,
        })
        // Still called a second time with page=1 (same page)
        .mockResolvedValueOnce({
          results: [result],
          totalHits: 10,
          page: 1,
          pageSize: 50,
        });

      const res = await app.request('/search?q=test');
      expect(res.status).toBe(200);

      // Probe runs, finds totalHits <= pageSize, requestPage stays 1
      // Then the main fetch runs with page=1
      expect(mockedSearchPlaylists).toHaveBeenCalledTimes(2);
      expect(mockedSearchPlaylists).toHaveBeenNthCalledWith(1, expect.anything(), 1);
      expect(mockedSearchPlaylists).toHaveBeenNthCalledWith(2, expect.anything(), 1);
    });

    it('uses explicit page directly without probing', async () => {
      mockedSearchPlaylists.mockResolvedValueOnce({
        results: [makeResult()],
        totalHits: 200,
        page: 3,
        pageSize: 50,
      });

      const res = await app.request('/search?q=test&page=3');
      expect(res.status).toBe(200);

      // No probe -- goes directly to page 3
      expect(mockedSearchPlaylists).toHaveBeenCalledTimes(1);
      expect(mockedSearchPlaylists).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test' }),
        3,
      );
    });

    it('filters out results older than 2 weeks', async () => {
      const recentResult = makeResult({ showDate: today(), flowsheetEntryId: '1' });
      const oldResult = makeResult({ showDate: daysAgo(30), flowsheetEntryId: '2' });

      mockedSearchPlaylists
        // Probe
        .mockResolvedValueOnce({
          results: [recentResult, oldResult],
          totalHits: 2,
          page: 1,
          pageSize: 50,
        })
        // Main fetch (same page since totalHits <= pageSize)
        .mockResolvedValueOnce({
          results: [recentResult, oldResult],
          totalHits: 2,
          page: 1,
          pageSize: 50,
        });

      const res = await app.request('/search?q=test');
      const json = await res.json();

      expect(json.total).toBe(1);
      expect(json.results).toHaveLength(1);
    });

    it('includes pagination metadata in response', async () => {
      mockedSearchPlaylists.mockResolvedValueOnce({
        results: [makeResult()],
        totalHits: 451,
        page: 1,
        pageSize: 50,
      });

      const res = await app.request('/search?q=test&page=1');
      const json = await res.json();

      expect(json.page).toBe(1);
      expect(json.pageSize).toBe(50);
      expect(json.totalHits).toBe(451);
    });
  });

  describe('authenticated (valid DJ JWT)', () => {
    beforeEach(() => {
      mockedJwtVerify.mockResolvedValue({
        payload: { sub: 'user1', role: 'dj' },
        protectedHeader: { alg: 'RS256' },
        key: {} as any,
      } as any);
    });

    it('fetches page 1 without probing', async () => {
      mockedSearchPlaylists.mockResolvedValueOnce({
        results: [makeResult()],
        totalHits: 200,
        page: 1,
        pageSize: 50,
      });

      const res = await app.request('/search?q=test', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect(res.status).toBe(200);

      expect(mockedSearchPlaylists).toHaveBeenCalledTimes(1);
      expect(mockedSearchPlaylists).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test' }),
        1,
      );
    });

    it('does not filter by date', async () => {
      mockedSearchPlaylists.mockResolvedValueOnce({
        results: [
          makeResult({ showDate: today(), flowsheetEntryId: '1' }),
          makeResult({ showDate: '2020-01-01', flowsheetEntryId: '2' }),
        ],
        totalHits: 2,
        page: 1,
        pageSize: 50,
      });

      const res = await app.request('/search?q=test', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const json = await res.json();

      expect(json.total).toBe(2);
      expect(json.results).toHaveLength(2);
    });

    it('respects explicit page parameter', async () => {
      mockedSearchPlaylists.mockResolvedValueOnce({
        results: [],
        totalHits: 200,
        page: 5,
        pageSize: 50,
      });

      const res = await app.request('/search?q=test&page=5', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect(res.status).toBe(200);

      expect(mockedSearchPlaylists).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test' }),
        5,
      );
    });
  });
});
