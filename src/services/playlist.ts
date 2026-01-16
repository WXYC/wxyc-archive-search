import * as cheerio from 'cheerio';
import type { SearchResult, SearchParams } from '../types.js';

const PROXY_BASE_URL = 'https://wxyc-proxy-production.up.railway.app/playlists';

/**
 * Build the search query string based on provided parameters
 */
function buildSearchQuery(params: SearchParams): string {
  // For the WXYC playlist search, we combine all search terms
  const terms: string[] = [];

  if (params.q) terms.push(params.q);
  if (params.artist) terms.push(params.artist);
  if (params.song) terms.push(params.song);
  if (params.album) terms.push(params.album);

  return terms.join(' ');
}

/**
 * Parse the search results HTML table
 */
export function parseSearchResults(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $('tr.playlistEntrySearchResult').each((_, row) => {
    const $row = $(row);
    const flowsheetEntryId = $row.attr('id') || '';
    const cells = $row.find('td');

    if (cells.length >= 5) {
      const showDate = $(cells[0]).text().trim();
      const artist = $(cells[1]).text().trim();
      const song = $(cells[2]).text().trim();
      const album = $(cells[3]).text().trim();
      const label = $(cells[4]).text().trim();

      results.push({
        artist,
        song,
        album,
        label,
        showDate,
        flowsheetEntryId,
      });
    }
  });

  return results;
}

/**
 * Search playlists from the WXYC proxy
 */
export async function searchPlaylists(params: SearchParams): Promise<SearchResult[]> {
  const searchString = buildSearchQuery(params);

  if (!searchString) {
    throw new Error('At least one search parameter is required');
  }

  const url = `${PROXY_BASE_URL}/searchPlaylists?mode=simple&searchString=${encodeURIComponent(searchString)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch search results: ${response.status}`);
  }

  const html = await response.text();
  return parseSearchResults(html);
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
