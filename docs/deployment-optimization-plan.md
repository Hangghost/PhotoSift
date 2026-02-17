# PhotoSift 部署架構優化計畫

> **建立日期**: 2026-02-17
> **狀態**: 待審核
> **影響範圍**: 開發環境、部署流程、依賴管理

---

## 1. Docker 容器化

### 1.1 目標

將 Frontend (React/Vite) 與 Backend (FastAPI) 分別容器化，透過 `docker-compose` 統一編排，確保開發與部署環境一致。

### 1.2 架構

```
docker-compose.yml
├── frontend (Node 22 + Nginx)
│   ├── dev: Vite dev server (:5173)
│   └── prod: Nginx 提供靜態檔案，反向代理 /api → backend
├── backend (Python 3.12 + uv)
│   └── Uvicorn (:8000)
└── volumes
    ├── sqlite-data  → ~/.photo-workflow/ (持久化 SQLite DB)
    └── photos       → 使用者照片目錄 (bind mount, 唯讀)
```

### 1.3 工作項目

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 1.3.1 | 建立 `backend/Dockerfile` | 多階段建構：uv 安裝依賴 → 精簡 runtime image (python:3.12-slim) | 2 |
| 1.3.2 | 建立 `frontend/Dockerfile` | 多階段建構：Node 22 建構 → Nginx 提供靜態檔案 | 2 |
| 1.3.3 | 建立 `frontend/nginx.conf` | 靜態檔案服務 + `/api` 反向代理到 backend 容器 | 1 |
| 1.3.4 | 建立 `docker-compose.yml` | 定義 services、networks、volumes；支援 dev/prod profile | 3 |
| 1.3.5 | 建立 `docker-compose.override.yml` | 開發模式覆蓋：掛載原始碼、啟用 hot-reload | 1 |
| 1.3.6 | 建立 `.dockerignore` | 排除 node_modules、venv、__pycache__、.git 等 | 1 |
| 1.3.7 | 更新 `backend/app/config.py` | 支援容器環境的路徑設定（DB、照片目錄透過環境變數配置） | 1 |
| 1.3.8 | 建立 `.env.docker` 範例 | 容器化環境的預設環境變數 | 1 |

### 1.4 注意事項

- **照片目錄掛載**: PhotoSift 需要存取使用者本機照片，容器內透過 bind mount 掛載，backend 以唯讀模式存取（刪除操作除外）
- **SQLite 持久化**: DB 檔案需掛載到 named volume 或 host path，避免容器重啟後資料遺失
- **開發模式**: 使用 `docker-compose.override.yml` 掛載原始碼，前後端都支援 hot-reload
- **Production 模式**: Frontend 由 Nginx 提供靜態檔案，不再需要 Node runtime

---

## 2. Makefile 自動化

### 2.1 目標

提供統一的 `make` 指令界面，簡化開發、建構、部署、清理等操作。

### 2.2 指令規劃

```makefile
# === 開發環境 ===
make dev              # 啟動完整開發環境 (docker-compose up --build)
make dev-backend      # 僅啟動 backend 容器
make dev-frontend     # 僅啟動 frontend 容器
make stop             # 停止所有容器 (docker-compose down)
make restart          # 重啟所有容器

# === 建構 ===
make build            # 建構所有 production images
make build-backend    # 僅建構 backend image
make build-frontend   # 僅建構 frontend image

# === 程式碼品質 ===
make lint             # 前端 ESLint + 後端 ruff
make typecheck        # 前端 tsc --noEmit
make format           # 前端 prettier + 後端 ruff format
make check            # lint + typecheck 全部執行

# === 依賴管理 ===
make install          # 安裝前後端所有依賴
make lock             # 更新 lock files (uv lock + npm install)

# === 資料庫 ===
make db-reset         # 重置 SQLite 資料庫

# === 清理 ===
make clean            # 移除建構產物、快取
make clean-all        # clean + 移除 Docker images/volumes

# === 工具 ===
make logs             # 顯示容器日誌 (docker-compose logs -f)
make shell-backend    # 進入 backend 容器 shell
make shell-frontend   # 進入 frontend 容器 shell
make health           # 檢查 backend /api/health
```

### 2.3 工作項目

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 2.3.1 | 建立 `Makefile` | 實作上述所有指令，包含 help target 說明 | 3 |
| 2.3.2 | 加入 `.PHONY` 宣告 | 確保所有指令正確執行 | 0 |
| 2.3.3 | 支援環境變數覆蓋 | 如 `PHOTOS_DIR`, `COMPOSE_PROFILES` 等可從外部傳入 | 1 |

---

## 3. Python 依賴管理遷移至 uv

### 3.1 目標

從 `pip + requirements.txt` 遷移至 [uv](https://github.com/astral-sh/uv)，獲得更快的依賴解析與安裝速度、統一的 lockfile 管理。

### 3.2 遷移方案

- 在 `backend/` 下建立 `pyproject.toml`，將依賴從 `requirements.txt` 遷移過去
- 使用 `uv lock` 產生 `uv.lock` 確保可重現建構
- Dockerfile 中使用 `uv` 安裝依賴（利用 `uv sync --frozen`）
- 移除舊的 `venv/` 和 `requirements.txt`（保留過渡期可並存）

### 3.3 工作項目

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 3.3.1 | 建立 `backend/pyproject.toml` | 定義專案 metadata + dependencies，從 requirements.txt 遷移 | 2 |
| 3.3.2 | 執行 `uv lock` 產生 lockfile | 產生 `uv.lock` 並加入版本控制 | 1 |
| 3.3.3 | 更新 `backend/Dockerfile` | 使用 `uv sync --frozen` 安裝依賴 | 1 |
| 3.3.4 | 更新 `.gitignore` | 排除 `.venv`，加入 uv 相關規則 | 0 |
| 3.3.5 | 移除 `requirements.txt` | 確認遷移完成後刪除 | 0 |
| 3.3.6 | 更新 `CLAUDE.md` | 更新開發指令為 uv 版本 | 1 |

### 3.4 遷移後的開發流程

```bash
# 首次設定（取代 python3 -m venv + pip install）
cd backend
uv sync

# 新增依賴
uv add <package>

# 執行開發伺服器
uv run uvicorn app.main:app --reload --port 8000
```

---

## 4. 其他優化建議

### 4.1 後端程式碼品質工具 — 加入 Ruff

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 4.1.1 | 加入 ruff 作為 dev dependency | 在 `pyproject.toml` 加入 `[tool.ruff]` 設定 | 1 |
| 4.1.2 | 設定 ruff 規則 | 啟用 pyflakes, pycodestyle, isort 等常用規則 | 1 |

**理由**: Ruff 是目前最快的 Python linter/formatter，與 uv 同為 Astral 出品，整合度佳。

### 4.2 健康檢查與 Graceful Shutdown

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 4.2.1 | Docker healthcheck 設定 | 在 docker-compose 為 backend 加入 `/api/health` 健康檢查 | 1 |
| 4.2.2 | 加入 lifespan handler | 將 `@app.on_event("startup")` 遷移至 FastAPI lifespan（消除 deprecation warning） | 1 |

**理由**: `on_event` 在 FastAPI 中已被標記為 deprecated，建議使用 lifespan context manager。

### 4.3 縮圖快取機制

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 4.3.1 | 實作縮圖產生服務 | 載入照片時產生縮圖並快取到 `cache_dir` | 3 |
| 4.3.2 | 修改 `/api/photos/{id}/thumbnail` | 從快取目錄提供縮圖，而非原圖 | 1 |

**理由**: 目前 thumbnail 端點直接返回原圖，大量高解析度照片會造成前端載入緩慢。建議在 `load-folder` 時產生 WebP 縮圖（如 300x300），顯著降低頻寬與渲染時間。

### 4.4 前端建構產物由 Backend 提供（可選的單容器模式）

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 4.4.1 | 加入 single-container 部署選項 | 建構前端後將 `dist/` 由 FastAPI `StaticFiles` 提供 | 2 |

**理由**: 對於本機使用場景，單容器模式更簡單。使用者只需 `docker run` 一個 image 即可使用。雙容器模式保留給需要獨立擴展的部署場景。

### 4.5 環境變數驗證與啟動檢查

| # | 任務 | 說明 | 預估點數 |
|---|------|------|----------|
| 4.5.1 | 加入啟動時環境檢查 | 在 lifespan handler 中驗證照片目錄可存取、DB 路徑可寫入 | 1 |

**理由**: 容器化後若 volume 未正確掛載，應在啟動時立即提示錯誤而非等到使用者操作時才失敗。

---

## 5. 實作優先順序建議

```
Phase A — 基礎設施（建議 Sprint 1）
├── 3.3.1-3.3.6  uv 遷移（先做，因為 Dockerfile 依賴此結果）
├── 1.3.1-1.3.8  Docker 容器化
└── 2.3.1-2.3.3  Makefile 自動化

Phase B — 品質提升（建議 Sprint 2）
├── 4.1.1-4.1.2  Ruff linter
├── 4.2.1-4.2.2  健康檢查 + lifespan 遷移
└── 4.5.1        啟動環境驗證

Phase C — 效能優化（建議 Sprint 3）
├── 4.3.1-4.3.2  縮圖快取
└── 4.4.1        單容器部署選項（可選）
```

---

## 6. 預期成果

| 面向 | 現狀 | 優化後 |
|------|------|--------|
| **環境設定** | 手動建 venv、安裝依賴、分別啟動前後端 | `make dev` 一鍵啟動 |
| **依賴管理** | pip + requirements.txt、無 lockfile | uv + pyproject.toml + uv.lock |
| **環境一致性** | 依賴本機 Python/Node 版本 | Docker 容器化，環境完全隔離 |
| **部署** | 無標準部署流程 | `make build` + `docker-compose up -d` |
| **程式碼品質** | 僅前端 ESLint | 前端 ESLint + 後端 Ruff |
| **效能** | 縮圖=原圖、載入慢 | WebP 縮圖快取、載入快 |
