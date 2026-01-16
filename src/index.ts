import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { searchPlaylists, filterResults } from './services/playlist.js';
import { getShowDetails } from './services/show.js';
import { isWithinTwoWeeks, buildArchiveUrl, formatISODate } from './utils/date.js';
import type { ArchiveEntry, SearchParams, SearchResponse } from './types.js';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/search', async (c) => {
  const q = c.req.query('q');
  const artist = c.req.query('artist');
  const song = c.req.query('song');
  const album = c.req.query('album');

  const params: SearchParams = { q, artist, song, album };

  if (!q && !artist && !song && !album) {
    return c.json({ error: 'At least one search parameter (q, artist, song, album) is required' }, 400);
  }

  try {
    // Search playlists
    let results = await searchPlaylists(params);

    // Apply additional filtering if specific fields were requested
    if (artist || song || album) {
      results = filterResults(results, params);
    }

    // Filter to only entries from the last 2 weeks
    const now = new Date();
    const recentResults = results.filter((result) => {
      // Search results have dates in YYYY-MM-DD format
      const date = new Date(result.showDate);
      return isWithinTwoWeeks(date, now);
    });

    // Fetch show details for each result and build archive entries
    const archiveEntries: ArchiveEntry[] = [];

    for (const result of recentResults) {
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
    };

    return c.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'An error occurred while searching' }, 500);
  }
});

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Starting WXYC Archive Search service on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

export { app };
