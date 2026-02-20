import type { ShowDetails, TubafrenzyShowResponse } from '../types.js';

const TUBAFRENZY_BASE_URL = 'http://wxyc.info/playlists';

/**
 * Map tubafrenzy JSON response to our ShowDetails type.
 * startingRadioHour is epoch ms, so we convert directly to a Date.
 */
export function mapShowDetails(response: TubafrenzyShowResponse): ShowDetails {
  return {
    dj: response.radioShow.discJockeyHandle,
    showTime: response.radioShow.timeRange,
    startTime: new Date(response.radioShow.startingRadioHour),
  };
}

/**
 * Fetch and map show details for a given flowsheet entry ID
 */
export async function getShowDetails(flowsheetEntryId: string): Promise<ShowDetails> {
  const url =
    `${TUBAFRENZY_BASE_URL}/radioShowHighlightSearchResult` +
    `?flowsheetEntry=${flowsheetEntryId}&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch show details: ${response.status}`);
  }

  const json: TubafrenzyShowResponse = await response.json();

  if (json.error) {
    throw new Error('Tubafrenzy show lookup returned an error');
  }

  return mapShowDetails(json);
}
