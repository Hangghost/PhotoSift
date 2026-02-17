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
make dev

# Open browser
open http://localhost:3002
```

在瀏覽器輸入框中輸入本機照片目錄路徑，例如：
- `~/Downloads/photos`
- `/Users/yourname/Pictures/trip`

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

Open http://localhost:3002 (dev) or http://localhost:8888 (prod), enter a local folder path (e.g. `~/Pictures/trip`), click **Load**.

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
| `F` | Toggle featured (★) |
| `Shift+D` | Delete all marked photos from disk |
| `?` | Show keyboard shortcuts help |

## Available Commands

### 開發與生產
```bash
make dev              # 啟動開發環境 (hot-reload)
make prod             # 啟動生產環境 (背景執行)
make deploy           # 完整重建並部署 production
```

### 容器管理
```bash
make pause-dev        # 暫停 dev 容器 (保留狀態)
make resume-dev       # 恢復 dev 容器
make stop-dev         # 停止並刪除 dev 容器
make restart-dev      # 重啟 dev 容器

make pause-prod       # 暫停 prod 容器
make resume-prod      # 恢復 prod 容器
make stop-prod        # 停止並刪除 prod 容器
make restart-prod     # 重啟 prod 容器

make stop             # 停止所有容器 (dev + prod)
```

### 監控與除錯
```bash
make status           # 查看容器狀態與健康檢查
make logs-dev         # 查看 dev 日誌
make logs-prod        # 查看 prod 日誌
make health           # 檢查 backend 健康狀態
```

### 程式碼品質
```bash
make lint             # Run linters (ESLint + Ruff)
make typecheck        # TypeScript type checking
make format           # Format backend code (Ruff)
make check            # Run all checks (lint + typecheck)
```

### 其他
```bash
make build            # Build production images
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
# 完整重建並部署
make deploy

# 或手動分步驟
make build          # Build images
make prod           # Start production mode

# Access via Nginx
open http://localhost:8888
```

In production mode:
- Frontend served by Nginx (static build)
- Nginx reverse proxies `/api` to backend
- Optimized images (multi-stage builds)
- 背景執行，可關閉 terminal

### 容器管理最佳實踐

```bash
# 暫時停止（快速恢復，節省資源）
make pause-dev      # 或 make pause-prod

# 稍後恢復
make resume-dev     # 或 make resume-prod

# 完全停止（需要重建）
make stop-dev       # 或 make stop-prod

# 查看狀態
make status
```

## Environment Variables

See `.env.docker` for container environment configuration:

```bash
DATABASE_PATH=/data/data.db
CACHE_DIR=/data/cache
FRONTEND_URL=http://localhost:8888
DEBUG=false
```

For local development, copy `backend/.env.example` to `backend/.env`.

## Features

- ✅ 批次瀏覽照片網格 (4 欄)
- ✅ 鍵盤快速導航 (方向鍵、Space 全螢幕)
- ✅ 快速標記狀態 (K 保留 / D 刪除 / U 取消)
- ✅ **精選功能 (F 鍵切換，★ 標記，批次複製到「精選/」資料夾)**
- ✅ 批次刪除標記照片 (Shift+D)
- ✅ Docker 容器化部署 (開發/生產環境分離)
- ✅ 本機照片路徑支援 (支援 `~/` 展開)

## Roadmap

詳細規劃請見 [PLAN.md](PLAN.md)

- **Phase 1** (✅ 已完成): Batch browsing, keyboard navigation, mark & delete, featured photos, Docker deployment
- **Phase 2** (🚧 計劃中): AI pre-filtering (blur detection, duplicate detection, composition scoring)
- **Phase 3** (未來): Google Drive sync, Google Photos / Facebook upload, 遠端部署

## License

MIT
