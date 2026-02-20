import type { SearchResult, SearchParams, TubafrenzySearchResponse } from '../types.js';
import { parseTubafrenzyDate } from '../utils/date.js';
import { formatISODate } from '../utils/date.js';

const TUBAFRENZY_BASE_URL = 'http://wxyc.info/playlists';

/**
 * Build the search query string based on provided parameters
 */
function buildSearchQuery(params: SearchParams): string {
  const terms: string[] = [];

  if (params.q) terms.push(params.q);
  if (params.artist) terms.push(params.artist);
  if (params.song) terms.push(params.song);
  if (params.album) terms.push(params.album);

  return terms.join(' ');
}

/**
 * Map tubafrenzy JSON response to our SearchResult type
 */
export function mapSearchResults(response: TubafrenzySearchResponse): SearchResult[] {
  return response.results.map((result) => ({
    artist: result.artist,
    song: result.song,
    album: result.release,
    label: result.label,
    showDate: formatISODate(parseTubafrenzyDate(result.date)),
    flowsheetEntryId: result.flowsheetEntryID,
  }));
}

/**
 * Search playlists from tubafrenzy's JSON API.
 * Returns both the mapped results and pagination metadata.
 */
export async function searchPlaylists(
  params: SearchParams,
  page: number = 1,
): Promise<{ results: SearchResult[]; totalHits: number; page: number; pageSize: number }> {
  const searchString = buildSearchQuery(params);

  if (!searchString) {
    throw new Error('At least one search parameter is required');
  }

  const url =
    `${TUBAFRENZY_BASE_URL}/searchPlaylists` +
    `?mode=simple&format=json` +
    `&searchString=${encodeURIComponent(searchString)}` +
    `&pageToDisplay=${page}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch search results: ${response.status}`);
  }

  const json: TubafrenzySearchResponse = await response.json();

  if (json.error) {
    throw new Error(json.errorMessage || 'Tubafrenzy search returned an error');
  }

  return {
    results: mapSearchResults(json),
    totalHits: json.totalHits,
    page: json.page,
    pageSize: json.pageSize,
  };
}

/**
 * Filter results to match specific search criteria
 */
export function filterResults(results: SearchResult[], params: SearchParams): SearchResult[] {
  return results.filter((result) => {
    if (params.artist && !result.artist.toLowerCase().includes(params.artist.toLowerCase())) {
      return false;
    }
    if (params.song && !result.song.toLowerCase().includes(params.song.toLowerCase())) {
      return false;
    }
    if (params.album && !result.album.toLowerCase().includes(params.album.toLowerCase())) {
      return false;
    }
    return true;
  });
}
