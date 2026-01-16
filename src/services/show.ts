import * as cheerio from 'cheerio';
import type { ShowDetails } from '../types.js';
import { combineDateAndTime } from '../utils/date.js';

const PROXY_BASE_URL = 'https://wxyc-proxy-production.up.railway.app/playlists';

/**
 * Parse the show details from the HTML page
 */
export function parseShowDetails(html: string): ShowDetails {
  const $ = cheerio.load(html);

  // Find the header row with show info
  // Format: "3/29/24<br>8:00 AM - 10:00 AM<br>..."
  const headerCells = $('th.redlabel');
  let showDate = '';
  let showTime = '';
  let dj = '';

  headerCells.each((_, cell) => {
    const html = $(cell).html() || '';
    const text = $(cell).text().trim();

    // Check for date/time cell (contains <br> and time format)
    if (html.includes('<br>') && text.includes('AM') || text.includes('PM')) {
      const parts = html.split('<br>');
      if (parts.length >= 2) {
        // First part is the date (e.g., "3/29/24")
        showDate = parts[0].trim();
        // Second part is the time range (e.g., "8:00 AM - 10:00 AM")
        showTime = parts[1].replace(/<[^>]*>/g, '').trim();
      }
    }

    // Check for DJ cell
    if (text.includes('Disc Jockey:')) {
      const djMatch = text.match(/Disc Jockey:\s*(.+)/);
      if (djMatch) {
        dj = djMatch[1].trim();
      }
    }
  });

  // Extract start time from the time range
  const startTimeMatch = showTime.match(/^(\d{1,2}:\d{2}\s*[AP]M)/i);
  const startTimeStr = startTimeMatch ? startTimeMatch[1] : showTime.split('-')[0].trim();

  const startTime = combineDateAndTime(showDate, startTimeStr);

  return {
    dj,
    showDate,
    showTime,
    startTime,
  };
}

/**
 * Fetch and parse show details for a given flowsheet entry ID
 */
export async function getShowDetails(flowsheetEntryId: string): Promise<ShowDetails> {
  const url = `${PROXY_BASE_URL}/radioShowHighlightSearchResult?flowsheetEntry=${flowsheetEntryId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch show details: ${response.status}`);
  }

  const html = await response.text();
  return parseShowDetails(html);
}
