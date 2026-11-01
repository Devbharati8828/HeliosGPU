# HeliosGPU Backend

Node.js / Express REST API for the HeliosGPU solar simulation frontend.

> **The backend is optional.** The frontend degrades gracefully — location search falls back to Open-Meteo geocoding when the backend is unreachable.

---

## Requirements

- Node.js ≥ 18
- MySQL 8+ (or MariaDB 10.6+)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable      | Description                      | Default     |
|---------------|----------------------------------|-------------|
| `PORT`        | HTTP port the server listens on  | `3000`      |
| `DB_HOST`     | MySQL host                       | `localhost` |
| `DB_PORT`     | MySQL port                       | `3306`      |
| `DB_USER`     | MySQL user                       | —           |
| `DB_PASSWORD` | MySQL password                   | —           |
| `DB_NAME`     | Database name (letters/digits/_ only) | `helios_db` |

---

## Install & Run

```bash
# Install dependencies
npm install

# Start (creates DB tables on first run)
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server will:
1. Validate `DB_NAME` format.
2. Create the database if it doesn't exist.
3. Run `CREATE TABLE IF NOT EXISTS` for all tables.
4. Start listening on `PORT`.

---

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Returns `{ status, database }` — pings the DB |
| `GET` | `/api/v1/locations/search?q=` | Search saved locations |
| `POST` | `/api/v1/locations` | Save a location |
| `GET` | `/api/v1/solar?lat=&lng=&date=&time=&tz=` | Solar position |
| `GET` | `/api/v1/earth/elevation?lat=&lng=` | Terrain elevation lookup |
| `POST` | `/api/v1/terrain/upload` | Upload a GeoTIFF DEM (max 100 MB) |

---

## Docker

A `docker-compose.yml` in the `database/` folder starts MySQL:

```bash
cd database
docker compose up
```

Tables are created automatically on first start via `initDB()`. There is no separate `schema.sql` file — the source of truth is [`src/models/init.js`](src/models/init.js).

---

## Architecture Notes

- **Rate limiting**: 100 requests / 15 min per IP on all `/api` routes.
- **File uploads**: DEM files (`.tif`, `.tiff`, `.dem`) stored under `uploads/dems/`, max 100 MB.
- **DB pool**: `mysql2/promise` connection pool (10 connections).

