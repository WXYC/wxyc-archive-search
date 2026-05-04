import { describe, expect, it } from 'vitest';

import { mapSearchResults } from '../src/services/playlist.js';
import type { TubafrenzySearchResponse } from '../src/types.js';
import {
  CHARSET_TORTURE_ENTRIES,
  charsetEntryId,
} from './charset-torture.js';

const buildResponse = (artist: string): TubafrenzySearchResponse => ({
  error: false,
  totalHits: 1,
  page: 1,
  pageSize: 1,
  searchString: artist,
  yearCounts: {},
  results: [
    {
      flowsheetEntryID: '42',
      artist,
      song: 'Some Song',
      release: 'Some Album',
      label: 'Some Label',
      radioShowID: '1',
      date: '20240101',
    },
  ],
});

describe('charset-torture: tubafrenzy JSON response mapping', () => {
  it.each(CHARSET_TORTURE_ENTRIES.map((entry) => [charsetEntryId(entry), entry] as const))(
    'preserves %s in the artist field',
    (_id, entry) => {
      const results = mapSearchResults(buildResponse(entry.input));
      expect(results).toHaveLength(1);
      expect(results[0].artist).toBe(entry.input);
    },
  );
});

describe('charset-torture: JSON response codec', () => {
  it.each(CHARSET_TORTURE_ENTRIES.map((entry) => [charsetEntryId(entry), entry] as const))(
    'preserves %s through JSON.stringify -> JSON.parse',
    (_id, entry) => {
      const restored = JSON.parse(JSON.stringify({ artist: entry.input }));
      expect(restored.artist).toBe(entry.input);
    },
  );
});

describe('charset-torture: URL search-param round-trip', () => {
  it.each(CHARSET_TORTURE_ENTRIES.map((entry) => [charsetEntryId(entry), entry] as const))(
    'preserves %s as a query value',
    (_id, entry) => {
      const url = new URL('https://test.local/search');
      url.searchParams.set('q', entry.input);
      const parsed = new URL(url.toString());
      expect(parsed.searchParams.get('q')).toBe(entry.input);
    },
  );
});
