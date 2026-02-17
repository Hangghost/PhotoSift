# Changelog

All notable changes to PhotoSift will be documented in this file.

## [0.3.0] - 2026-02-17

### Added
- **獨立容器管理**: Dev 和 Prod 環境完全獨立，可同時運行
  - 使用不同的 Docker Compose project name (`photosift-dev`, `photosift-prod`)
  - 新增 `make pause-dev/pause-prod` - 暫停容器但保留狀態
  - 新增 `make resume-dev/resume-prod` - 快速恢復暫停的容器
  - 新增 `make stop-dev/stop-prod` - 獨立停止並刪除容器
  - 新增 `make restart-dev/restart-prod` - 獨立重啟容器
  - 新增 `make logs-dev/logs-prod` - 分別查看日誌
- **容器狀態管理**: 新增 `make status` 顯示 dev/prod 容器狀態與健康檢查
- **部署指令**: 新增 `make deploy` 完整重建並部署 production 環境
- **專案規劃文件**: 新增 `PLAN.md` 記錄已完成功能與未來規劃
  - Phase 2: AI 預篩選（模糊偵測、重複照片、構圖評分）
  - Phase 3: 雲端整合（Google Drive、Photos、Facebook）
  - 技術優化待排程（縮圖快取、測試、CI/CD 等）
  - 遠端部署規劃（認證、多用戶、監控等）

### Changed
- **掛載整個 HOME 目錄**: 支援在前端直接輸入任意本機路徑
  - 不再需要 `PHOTOS_DIR` 環境變數
  - 可輸入 `~/Downloads/photos` 或完整路徑
  - 容器內自動設定 HOME 環境變數支援 `expanduser()`
- **Port 調整**:
  - Dev frontend: 5173 → 3002（避免常見 port 衝突）
  - Prod frontend: 8080 → 8888
- **前端提示更新**: Placeholder 提示使用者輸入本機路徑
- **容器 expanduser() 錯誤處理**: 加入 try-catch 避免容器內無 HOME 變數時崩潰

### Fixed
- 修復容器內無法使用 `~` 展開路徑的問題
- 修復 port 衝突問題（8080 被佔用）

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
