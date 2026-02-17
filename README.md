# PhotoSift

Local web app for batch photo review — browse a folder of photos in a grid, mark each as keep/delete with keyboard shortcuts, then batch-delete the rejects.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Run

```bash
# Terminal 1 — Backend (port 8000)
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend
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

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Zustand
- **Backend**: Python FastAPI + SQLite
- **Dev tooling**: Vite

## Roadmap

- **Phase 1** (current): Batch browsing, keyboard navigation, mark & delete
- **Phase 2**: AI pre-filtering (blur detection, duplicate detection, composition scoring)
- **Phase 3**: Google Drive sync, Google Photos / Facebook upload
