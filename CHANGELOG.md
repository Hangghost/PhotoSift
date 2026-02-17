# Changelog

All notable changes to PhotoSift will be documented in this file.

## [0.2.0] - 2026-02-17

### Added
- **Docker containerization**: Full Docker + Docker Compose setup
  - Multi-stage Dockerfiles for backend (Python 3.12 + uv) and frontend (Node 22 + Nginx)
  - Development mode with hot-reload (docker-compose.override.yml)
  - Production mode with Nginx serving static frontend
  - Healthcheck for backend container
- **Makefile automation**: 20+ commands for development, build, deployment, and maintenance
  - `make dev`, `make prod`, `make build`, `make lint`, `make check`, etc.
- **uv dependency management**: Migrated from pip to uv
  - `pyproject.toml` for project configuration
  - `uv.lock` for reproducible builds
- **Ruff linter**: Fast Python linting and formatting
  - Configured in pyproject.toml with pycodestyle, pyflakes, isort, pyupgrade rules
- **Deployment optimization plan**: Comprehensive documentation in `docs/deployment-optimization-plan.md`

### Changed
- **FastAPI lifespan migration**: Replaced deprecated `@app.on_event("startup")` with lifespan context manager
- **PhotoStatus enum**: Migrated from `str, Enum` to `StrEnum` (Python 3.11+)
- **Backend code quality**: Removed unused imports, fixed line length issues
- **CLAUDE.md**: Updated with Docker and Makefile usage instructions
- **README.md**: Comprehensive rewrite with Docker-first approach

### Removed
- `backend/requirements.txt` (replaced by pyproject.toml + uv.lock)
- Unused imports in backend code (os, shutil, UploadFile, settings, PhotoStatus from routers)

### Fixed
- All Ruff linting errors (100% clean codebase)
- Code formatting and style consistency

## [0.1.0] - 2026-02-17

### Added
- Project scaffolding: FastAPI backend + React/Vite frontend
- SQLite database with photos, sessions, uploads tables
- Load local folder API — scans for images and persists to DB
- Photo grid view with 4-column layout and status badges (keep/delete)
- Full-size photo viewer (lightbox) with navigation arrows
- Keyboard shortcuts: arrow navigation, D/K/U marking, Space viewer toggle
- Batch delete marked photos from disk
- Toolbar with folder path input, photo count stats
- Help overlay (`?` key) showing all shortcuts
- Vite proxy forwarding `/api/*` to backend
- CORS configuration for local development
- CLAUDE.md for Claude Code guidance
