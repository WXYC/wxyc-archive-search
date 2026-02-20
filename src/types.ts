export interface SearchResult {
  artist: string;
  song: string;
  album: string;
  label: string;
  showDate: string;
  flowsheetEntryId: string;
}

export interface ShowDetails {
  dj: string;
  showTime: string;
  startTime: Date;
}

export interface ArchiveEntry {
  artist: string;
  song: string;
  album: string;
  label: string;
  showDate: string;
  showTime: string;
  dj: string;
  archiveUrl: string;
}

export interface SearchResponse {
  results: ArchiveEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalHits: number;
}

export interface SearchParams {
  q?: string;
  artist?: string;
  song?: string;
  album?: string;
}

/** Tubafrenzy JSON API response for searchPlaylists */
export interface TubafrenzySearchResponse {
  error: boolean;
  errorMessage?: string;
  totalHits: number;
  page: number;
  pageSize: number;
  searchString: string;
  yearCounts: Record<string, number>;
  results: TubafrenzySearchResult[];
}

export interface TubafrenzySearchResult {
  flowsheetEntryID: string;
  artist: string;
  song: string;
  release: string;
  label: string;
  radioShowID: string;
  date: string; // YYYYMMDD
}

/** Tubafrenzy JSON API response for radioShowHighlightSearchResult */
export interface TubafrenzyShowResponse {
  error?: boolean;
  highlightedEntryID?: number;
  radioShow: {
    id: number;
    date: string; // MM/DD/YY (unused -- use startingRadioHour instead)
    timeRange: string;
    discJockeyHandle: string;
    startingRadioHour: number; // epoch ms
    previousShowID: number;
    nextShowID: number;
  };
  entries: unknown[];
}
