# WXYC Archive Search Service

A REST API that searches WXYC playlist archives and returns archive.wxyc.org URLs for playback.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Hono
- **HTML Parsing:** cheerio
- **Testing:** Vitest
- **Deployment:** Railway

## Installation

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The server starts on `http://localhost:3000` by default. Set the `PORT` environment variable to change this.

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## API Endpoints

### `GET /search`

Search WXYC playlist archives. Returns results from the last 2 weeks with archive playback URLs.

**Query Parameters:**

| Param    | Description                            |
|----------|----------------------------------------|
| `q`      | General search term (searches all fields) |
| `artist` | Filter by artist name                  |
| `song`   | Filter by song title                   |
| `album`  | Filter by album/release name           |

At least one parameter is required.

**Example Request:**

```bash
curl "http://localhost:3000/search?q=radiohead"
curl "http://localhost:3000/search?artist=radiohead&song=creep"
```

**Example Response:**

```json
{
  "results": [
    {
      "artist": "Radiohead",
      "song": "Creep",
      "album": "Pablo Honey",
      "label": "Capitol",
      "showDate": "2024-03-29",
      "showTime": "8:00 AM - 10:00 AM",
      "dj": "DJ Deceitful",
      "archiveUrl": "https://archive.wxyc.org/?t=20240329080000"
    }
  ],
  "total": 1
}
```

### `GET /health`

Health check endpoint for deployment platforms.

**Response:**

```json
{
  "status": "ok"
}
```

## Deployment

### Railway

1. Install the Railway CLI
2. Run `railway init` to create a new project
3. Run `railway up` to deploy

The `npm run start` script is configured for production deployments.

## Project Structure

```
wxyc-archive-search/
├── src/
│   ├── index.ts              # Hono app and routes
│   ├── services/
│   │   ├── playlist.ts       # Search and parse playlist results
│   │   └── show.ts           # Fetch and parse show details
│   ├── utils/
│   │   └── date.ts           # Date parsing and archive URL generation
│   └── types.ts              # TypeScript interfaces
├── test/
│   ├── fixtures/             # Sample HTML files for testing
│   ├── playlist.test.ts
│   ├── show.test.ts
│   └── date.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Data Flow

1. User makes a search request with query parameters
2. Service fetches results from the WXYC playlist proxy
3. HTML table is parsed to extract search results
4. Results are filtered to entries from the last 2 weeks
5. For each result, the show detail page is fetched to get DJ name and show time
6. Archive URLs are constructed using the show start time
7. JSON response is returned with all metadata and archive URLs

## License

ISC
