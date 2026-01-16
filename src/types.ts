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
  showDate: string;
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
}

export interface SearchParams {
  q?: string;
  artist?: string;
  song?: string;
  album?: string;
}
