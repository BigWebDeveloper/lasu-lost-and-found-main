# Campus Lost & Found

A campus lost-and-found board with a React + Vite frontend and FastAPI backend. Students can browse and filter active posts, create lost/found listings with optional photos, contact the poster, and resolve their own posts without creating an account.

## Run locally

Requirements: Python 3.11+ and Node.js 20+.

From the project root, set up and start the API:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend
../.venv/bin/uvicorn app.main:app --reload
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173. The API is at http://localhost:8000, with interactive API documentation at http://localhost:8000/docs. Local development uses SQLite (`backend/lost_found.db`) and stores uploaded photos in `backend/uploads/`.

To run backend tests from the project root:

```bash
cd backend
../.venv/bin/python -m pytest -q
```

## API overview

- `GET /api/health` — API health check.
- `GET /api/listings` — active listings by default; supports `q`, `kind`, `category`, `location`, `date_from`, `date_to`, and `status=active|resolved|all`.
- `GET /api/listings/{id}` — listing details, including public contact information.
- `POST /api/listings` — create a listing. The response includes a private `resolve_token` once; save it in the poster's browser and do not expose it in public listing views.
- `PATCH /api/listings/{id}/resolve` — resolve a listing by sending `{"token":"..."}`.
- `POST /api/uploads` — upload a JPG, PNG, or WebP image (maximum 5 MB) as multipart field `image`. Returns a relative `photo_url` for the listing.

The resolve token is random and only its SHA-256 hash is stored in the database. The frontend keeps the token in local storage on the browser that created the post. Clearing that browser's data loses the ability to resolve the post; adding accounts later would provide cross-device ownership.

## Handoff for hosting

Hosting and deployment are owned by another developer. This repository is prepared for local development; before going live, configure the following in the hosting services:

- **Database:** Set `DATABASE_URL` to a reachable PostgreSQL URL using the included `psycopg` driver. The default SQLite file is for local development and is not suitable for an ephemeral application host.
- **CORS:** Set `ALLOWED_ORIGINS` in the API environment to the exact deployed frontend origin (no trailing slash). Multiple comma-separated origins are supported.
- **Frontend API URL:** Set `VITE_API_URL` to the deployed API origin when building the frontend.
- **Photo storage:** `UPLOAD_DIR` defaults to a local `uploads/` folder. This is fine locally, but many hosts erase local files on restart. Use a persistent volume or object-storage adapter for production photo uploads; update the API to return the resulting public URL.
- **HTTPS and secrets:** Serve the site and API over HTTPS. Keep database credentials in the hosting provider's secret environment settings, not in committed files.

The API creates tables on startup for this MVP. If the schema changes after launch, add database migrations before applying those changes to production.

## Branding credits

App footer: © 2026 Cipher. The bundled LASU seal is credited to Dhantegge and used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); see the [source file](https://commons.wikimedia.org/wiki/File:Lagos_State_University_logo.png). The seal is included unmodified.