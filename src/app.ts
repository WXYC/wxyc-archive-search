import { Hono } from 'hono';
import { searchPlaylists, filterResults } from './services/playlist.js';
import { getShowDetails } from './services/show.js';
import { isWithinTwoWeeks, buildArchiveUrl, formatISODate } from './utils/date.js';
import { authMiddleware } from './middleware/auth.js';
import type { ArchiveEntry, SearchParams, SearchResponse } from './types.js';

const app = new Hono<{ Variables: { authenticated: boolean } }>();

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/search', authMiddleware, async (c) => {
  const q = c.req.query('q');
  const artist = c.req.query('artist');
  const song = c.req.query('song');
  const album = c.req.query('album');
  const page = parseInt(c.req.query('page') || '1', 10);

  const params: SearchParams = { q, artist, song, album };

  if (!q && !artist && !song && !album) {
    return c.json({ error: 'At least one search parameter (q, artist, song, album) is required' }, 400);
  }

  const authenticated = c.get('authenticated');
  const explicitPage = c.req.query('page');

  try {
    let requestPage = page;

    // Tubafrenzy returns results oldest-first. For unauthenticated users
    // (who only see the last 2 weeks), start from the last page so we
    // actually get recent results. We need a preliminary request to learn
    // the total number of pages.
    if (!authenticated && !explicitPage) {
      const probe = await searchPlaylists(params, 1);
      if (probe.totalHits > probe.pageSize) {
        requestPage = Math.ceil(probe.totalHits / probe.pageSize);
      }
    }

    const { results: searchResults, totalHits, page: currentPage, pageSize } =
      await searchPlaylists(params, requestPage);

    // Apply additional filtering if specific fields were requested
    let results = searchResults;
    if (artist || song || album) {
      results = filterResults(results, params);
    }

    // If not authenticated, filter to only entries from the last 2 weeks
    if (!authenticated) {
      const now = new Date();
      results = results.filter((result) => {
        const date = new Date(result.showDate);
        return isWithinTwoWeeks(date, now);
      });
    }

    // Fetch show details for each result and build archive entries
    const archiveEntries: ArchiveEntry[] = [];

    for (const result of results) {
      try {
        const showDetails = await getShowDetails(result.flowsheetEntryId);

        archiveEntries.push({
          artist: result.artist,
          song: result.song,
          album: result.album,
          label: result.label,
          showDate: formatISODate(showDetails.startTime),
          showTime: showDetails.showTime,
          dj: showDetails.dj,
          archiveUrl: buildArchiveUrl(showDetails.startTime),
        });
      } catch (error) {
        console.error(`Failed to fetch show details for ${result.flowsheetEntryId}:`, error);
      }
    }

    const response: SearchResponse = {
      results: archiveEntries,
      total: archiveEntries.length,
      page: currentPage,
      pageSize,
      totalHits,
    };

    return c.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'An error occurred while searching' }, 500);
  }
});

export { app };
