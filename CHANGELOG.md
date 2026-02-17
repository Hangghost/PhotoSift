# Changelog

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
