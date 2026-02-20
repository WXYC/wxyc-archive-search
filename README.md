# WXYC Archive Search Service

A REST API that searches WXYC playlist archives and returns archive.wxyc.org URLs for playback.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Hono
- **Auth:** jose (JWT/JWKS verification), @wxyc/shared (role definitions)
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `BETTER_AUTH_JWKS_URL` | `https://api.wxyc.org/auth/jwks` | JWKS endpoint for JWT verification |

## API Endpoints

### `GET /search`

Search WXYC playlist archives. Returns results with archive playback URLs.

**Access control:**
- Unauthenticated: results are filtered to the last 2 weeks
- Authenticated DJs (Bearer JWT with dj/musicDirector/stationManager/admin role): all results returned

**Query Parameters:**

| Param    | Description                              |
|----------|------------------------------------------|
| `q`      | General search term (searches all fields) |
| `artist` | Filter by artist name                    |
| `song`   | Filter by song title                     |
| `album`  | Filter by album/release name             |
| `page`   | Page number (default: 1)                 |

At least one search parameter (`q`, `artist`, `song`, `album`) is required.

**Example Request:**

```bash
# Unauthenticated (last 2 weeks only)
curl "http://localhost:3000/search?q=radiohead"

# With pagination
curl "http://localhost:3000/search?q=radiohead&page=2"

# Authenticated DJ (all results)
curl -H "Authorization: Bearer <jwt>" "http://localhost:3000/search?q=radiohead"
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
  "total": 1,
  "page": 1,
  "pageSize": 25,
  "totalHits": 150
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
│   ├── middleware/
│   │   └── auth.ts           # JWT/JWKS auth middleware
│   ├── services/
│   │   ├── playlist.ts       # Search playlists via tubafrenzy JSON API
│   │   └── show.ts           # Fetch show details via tubafrenzy JSON API
│   ├── utils/
│   │   └── date.ts           # Date parsing and archive URL generation
│   └── types.ts              # TypeScript interfaces
├── test/
│   ├── fixtures/             # JSON response fixtures
│   ├── auth.test.ts
│   ├── playlist.test.ts
│   ├── show.test.ts
│   └── date.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Data Flow

1. User makes a search request with query parameters
2. Service queries tubafrenzy's JSON API (`http://wxyc.info/playlists/searchPlaylists?format=json`)
3. JSON response is mapped to internal types
4. If unauthenticated, results are filtered to the last 2 weeks
5. For each result, the show detail JSON API is called for DJ name and show time
6. Archive URLs are constructed from the show's `startingRadioHour` epoch timestamp
7. JSON response is returned with metadata, archive URLs, and pagination info

## License

ISC
