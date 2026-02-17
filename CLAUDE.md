# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PhotoSift is a local web app for batch photo review: load a folder of photos, browse them in a grid, mark each as keep/delete using keyboard shortcuts, then batch-delete the rejects. Built with a React frontend and Python FastAPI backend communicating over REST on localhost.

## Commands

### Backend (Python FastAPI)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev          # dev server on :5173, proxies /api to :8000
npm run build        # production build to dist/
npx tsc --noEmit     # type-check without emitting
```

### First-time setup
```bash
# Backend
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

## Architecture

```
Browser (React, :5173)  ──/api──▶  FastAPI (:8000)  ──▶  SQLite + local filesystem
```

- **Frontend** (`frontend/src/`): React + TypeScript + Tailwind CSS + Zustand
  - `store/photoStore.ts` — central state: photo list, selection, status marking
  - `hooks/useKeyboard.ts` — keyboard shortcut handler (arrows, D/K/U, Space, Shift+D)
  - `services/api.ts` — typed fetch wrapper for all backend endpoints
  - `components/` — Toolbar (folder input + stats), PhotoGrid, PhotoViewer (lightbox), HelpOverlay

- **Backend** (`backend/app/`): FastAPI + SQLite (via raw sqlite3, no ORM)
  - `main.py` — app entry, CORS, router registration
  - `config.py` — pydantic-settings config (paths, ports, env vars)
  - `database.py` — SQLite schema init + connection context manager (WAL mode)
  - `routers/photos.py` — all photo endpoints: load-folder, list, status update, batch ops, image serving
  - `models/schemas.py` — Pydantic request/response models

### Key API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/photos/load-folder` | Scan local folder, insert photos into DB |
| GET | `/api/photos` | List photos (filterable by folder, status) |
| GET | `/api/photos/{id}/image` | Serve full-size image file |
| PATCH | `/api/photos/{id}/status` | Set single photo status (pending/keep/delete) |
| PATCH | `/api/photos/batch/status` | Batch status update |
| DELETE | `/api/photos/batch/delete-marked` | Delete files marked "delete" from disk + DB |

### Data flow
1. User enters a local folder path → `POST /load-folder` scans it, writes to SQLite
2. Frontend fetches photo list, displays grid with thumbnails served from backend
3. User navigates with arrow keys, marks with D/K/U
4. Status changes go via PATCH to backend → persisted in SQLite
5. "Delete Marked" removes files from disk and DB

## Conventions

- Photo IDs are SHA-256 hashes of `folder/filename` (first 16 hex chars)
- Image files are served directly from their original paths (no copy to cache yet)
- Frontend Vite proxy forwards `/api/*` to backend at `:8000`
- SQLite DB defaults to `~/.photo-workflow/data.db`
- Supported image extensions: jpg, jpeg, png, heic, heif, webp, bmp, tiff, tif

## Planned phases (from photo-workflow-planner.md)

- **Phase 1** (current): Batch browsing, keyboard nav, mark & delete — no cloud APIs yet
- **Phase 2**: AI pre-filtering (blur detection via OpenCV, duplicate detection via imagehash, composition scoring via Claude Vision)
- **Phase 3**: Google Drive sync, Google Photos upload, Facebook upload
