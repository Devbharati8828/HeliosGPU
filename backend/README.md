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

| Variable              | Description                                             | Default                 |
| --------------------- | ------------------------------------------------------- | ----------------------- |
| `PORT`                | HTTP port the server listens on                         | `3000`                  |
| `DB_HOST`             | MySQL host                                              | `localhost`             |
| `DB_PORT`             | MySQL port                                              | `3306`                  |
| `DB_USER`             | MySQL user                                              | —                       |
| `DB_PASSWORD`         | MySQL password                                          | —                       |
| `DB_NAME`             | Database name (letters/digits/\_ only)                  | `heliosgpu`             |
| `JWT_ACCESS_SECRET`   | Secret for access tokens (min 32 chars in production)   | —                       |
| `JWT_REFRESH_SECRET`  | Secret for refresh tokens (min 32 chars in production)  | —                       |
| `COOKIE_DOMAIN`       | (Optional) Domain scope for auth cookies                | —                       |
| `CLIENT_ORIGIN`       | Exact frontend origin for CORS and cookies              | `http://localhost:5173` |

---

## Authentication Architecture

- **Optional Auth**: Guest mode is the default; users can browse, compute solar positions, and explore 3D modes without an account. Logging in unlocks cloud-synced saved locations.
- **Password Hashing**: `bcrypt` with cost factor `12`. Passwords must be 8–72 characters.
- **Tokens**:
  - **Access token**: Short-lived JWT (15 minutes) sent in an `httpOnly`, `SameSite=Lax` cookie (or `SameSite=None; Secure` in cross-site production).
  - **Refresh token**: Long-lived JWT (7 days) sent in an `httpOnly` cookie scoped to `/api/v1/auth/refresh`. Stored **SHA-256 hashed** in MySQL and **rotated on every use**. Old refresh tokens are revoked upon rotation.
- **No Local Storage**: Zero tokens are stored in `localStorage` or `sessionStorage` — eliminating XSS token theft vectors.
- **Strict Rate Limiting**: `/api/v1/auth/login` and `/api/v1/auth/register` enforce a strict rate limit of **5 requests per 15 minutes** per client IP to mitigate brute-force attacks.
- **Cross-Domain Hosting**: When hosting the frontend and backend on distinct domains (e.g. Vercel frontend + Render/Railway backend), configure `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, and set `CLIENT_ORIGIN` to the exact frontend URL (never `*`).
- **Limitations (v1)**: Email verification, password reset, OAuth social logins, and multiple-device concurrent session management are out of scope for v1.

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

| Method   | Path                                      | Description                                              |
| -------- | ----------------------------------------- | -------------------------------------------------------- |
| `GET`    | `/api/health`                             | Returns `{ status, database }` — pings the DB            |
| `POST`   | `/api/v1/auth/register`                   | Register user `{ email, password, name }` (sets cookies) |
| `POST`   | `/api/v1/auth/login`                      | Authenticate user `{ email, password }` (sets cookies)   |
| `POST`   | `/api/v1/auth/refresh`                    | Rotates refresh token in httpOnly cookie                 |
| `POST`   | `/api/v1/auth/logout`                     | Revokes refresh token in DB, clears cookies              |
| `GET`    | `/api/v1/auth/me`                         | Returns `{ id, email, name }` for active session         |
| `GET`    | `/api/v1/locations/search?q=`             | Search saved locations                                  |
| `POST`   | `/api/v1/locations`                       | Save a location (links to user if logged in)             |
| `GET`    | `/api/v1/locations/mine`                  | Get saved locations belonging to authenticated user      |
| `DELETE` | `/api/v1/locations/:id`                   | Delete user's own location (or guest-created location)   |
| `GET`    | `/api/v1/solar?lat=&lng=&date=&time=&tz=` | Solar position                                           |
| `GET`    | `/api/v1/earth/elevation?lat=&lng=`       | Terrain elevation lookup                                 |
| `POST`   | `/api/v1/terrain/upload`                  | Upload a GeoTIFF DEM (max 100 MB)                        |

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
