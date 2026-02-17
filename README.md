# PhotoSift

Local web app for batch photo review — browse a folder of photos in a grid, mark each as keep/delete with keyboard shortcuts, then batch-delete the rejects.

## Quick Start

### Prerequisites
- **Option A (Docker)**: Docker + Docker Compose
- **Option B (Local)**: Python 3.12+ + Node.js 18+ + [uv](https://github.com/astral-sh/uv)

### Setup & Run

#### Option A: Docker (Recommended)

```bash
# Install dependencies
make install

# Start dev environment (hot-reload enabled)
PHOTOS_DIR=~/Pictures make dev

# Open browser
open http://localhost:5173
```

#### Option B: Local Development

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, enter a local folder path (e.g. `~/Pictures/trip`), click **Load**.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `← →` | Previous / next photo |
| `↑ ↓` | Previous / next row |
| `Space` | Toggle full-size viewer |
| `Esc` | Close viewer |
| `D` | Mark for deletion |
| `K` | Mark as keep |
| `U` | Undo mark (set pending) |
| `Shift+D` | Delete all marked photos from disk |
| `?` | Show keyboard shortcuts help |

## Available Commands

```bash
make dev              # Start dev environment (hot-reload)
make prod             # Start production environment
make stop             # Stop all containers
make build            # Build production images
make lint             # Run linters (ESLint + Ruff)
make typecheck        # TypeScript type checking
make format           # Format backend code (Ruff)
make check            # Run all checks (lint + typecheck)
make logs             # Show container logs
make health           # Check backend health
make clean            # Remove build artifacts
make help             # Show all available commands
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Zustand
- **Backend**: Python 3.12 + FastAPI + SQLite
- **Dev tooling**: Vite 7, uv, Ruff
- **Deployment**: Docker + Docker Compose + Nginx

## Project Structure

```
PhotoSift/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py       # App entry, lifespan, CORS
│   │   ├── config.py     # Settings (Pydantic)
│   │   ├── database.py   # SQLite connection & schema
│   │   ├── routers/      # API endpoints
│   │   └── models/       # Pydantic schemas
│   ├── Dockerfile
│   ├── pyproject.toml    # Dependencies (uv)
│   └── uv.lock
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── store/        # Zustand state
│   │   ├── hooks/        # Custom hooks
│   │   └── services/     # API client
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.override.yml  # Dev overrides
├── Makefile
└── CLAUDE.md             # AI assistant guidance

```

## Development

### Code Quality

```bash
# Run all checks
make check

# Auto-format backend
make format

# Lint only
make lint
```

### Docker Development

The project uses `docker-compose.override.yml` for development:
- Source code mounted for hot-reload
- Frontend runs Vite dev server on :5173
- Backend runs with `--reload` flag

### Production Deployment

```bash
# Build images
make build

# Start production mode
PHOTOS_DIR=/path/to/photos make prod

# Access via Nginx
open http://localhost:8080
```

In production mode:
- Frontend served by Nginx (static build)
- Nginx reverse proxies `/api` to backend
- Optimized images (multi-stage builds)

## Environment Variables

See `.env.docker` for container environment configuration:

```bash
DATABASE_PATH=/data/data.db
CACHE_DIR=/data/cache
FRONTEND_URL=http://localhost:8080
DEBUG=false
```

For local development, copy `backend/.env.example` to `backend/.env`.

## Roadmap

- **Phase 1** (current): Batch browsing, keyboard navigation, mark & delete
- **Phase 2**: AI pre-filtering (blur detection, duplicate detection, composition scoring)
- **Phase 3**: Google Drive sync, Google Photos / Facebook upload

## License

MIT
