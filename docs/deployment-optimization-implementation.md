# PhotoSift 部署架構優化 - 實作完成報告

## 📋 概要

完成 PhotoSift 專案的部署架構優化，包含 Docker 容器化、Makefile 自動化、uv 依賴管理遷移，以及後端程式碼品質提升。

---

## ✅ 已完成項目

### 1. Python 依賴管理遷移至 uv

**變更檔案：**
- ✨ 新增 `backend/pyproject.toml` - 專案配置與依賴定義
- ✨ 新增 `backend/uv.lock` - 依賴鎖定檔案
- 🗑️ 移除 `backend/requirements.txt`
- 📝 更新 `.gitignore` - 加入 `.venv` 規則

**成果：**
- 更快的依賴解析與安裝（uv 是 Rust 實作，比 pip 快 10-100x）
- 可重現的建構環境（lockfile 確保版本一致）
- 統一的專案配置格式（pyproject.toml）

**使用方式：**
```bash
cd backend
uv sync                    # 安裝所有依賴
uv add <package>           # 新增依賴
uv run uvicorn app.main:app --reload
```

---

### 2. Docker 容器化

**新增檔案：**
- `backend/Dockerfile` - 多階段建構，基於 Python 3.12-slim + uv
- `frontend/Dockerfile` - 多階段建構，Node 22 build → Nginx 提供靜態檔案
- `frontend/nginx.conf` - Nginx 設定（SPA fallback + API 反向代理）
- `docker-compose.yml` - Production 環境編排
- `docker-compose.override.yml` - Development 環境覆蓋（hot-reload）
- `.dockerignore` - 排除不必要檔案以加速建構
- `.env.docker` - 容器環境變數範例

**架構：**
```
┌─────────────────────────────────────────────────┐
│  docker-compose (orchestration)                 │
├─────────────────────┬───────────────────────────┤
│  Frontend Container │  Backend Container        │
│  - Dev: Vite :5173  │  - Uvicorn :8000         │
│  - Prod: Nginx :80  │  - Health check enabled  │
└─────────────────────┴───────────────────────────┘
         │                      │
         ├──────────────────────┤
         │  Named Volumes       │
         │  - photosift-data    │
         │  - photos (bind)     │
         └──────────────────────┘
```

**使用方式：**
```bash
# 開發模式（hot-reload）
make dev

# Production 模式
make prod

# 自訂照片目錄
PHOTOS_DIR=~/Pictures make dev
```

**特色：**
- ✅ 健康檢查 - Backend 提供 `/api/health` 端點
- ✅ 資料持久化 - SQLite 透過 named volume 保存
- ✅ 照片目錄掛載 - 支援自訂本機路徑
- ✅ 開發/生產分離 - `docker-compose.override.yml` 自動載入

---

### 3. Makefile 自動化

**新增檔案：**
- `Makefile` - 統一的指令介面

**可用指令：**

| 類別 | 指令 | 說明 |
|------|------|------|
| **開發** | `make dev` | 啟動完整開發環境（hot-reload） |
| | `make dev-backend` | 僅啟動後端容器 |
| | `make dev-frontend` | 僅啟動前端容器 |
| | `make stop` | 停止所有容器 |
| | `make restart` | 重啟容器 |
| **建構** | `make build` | 建構所有 production images |
| | `make build-backend` | 僅建構後端 image |
| | `make build-frontend` | 僅建構前端 image |
| **程式碼品質** | `make lint` | ESLint + Ruff 檢查 |
| | `make typecheck` | TypeScript 型別檢查 |
| | `make format` | Ruff 格式化 |
| | `make check` | 執行所有檢查 |
| **依賴** | `make install` | 安裝前後端依賴 |
| | `make lock` | 更新 lock files |
| **工具** | `make logs` | 顯示容器日誌 |
| | `make shell-backend` | 進入後端容器 shell |
| | `make health` | 檢查後端健康狀態 |
| **清理** | `make clean` | 清除建構產物 |
| | `make clean-all` | 清除所有（含 Docker volumes） |

---

### 4. 後端品質與優化

**變更檔案：**
- 📝 `backend/app/main.py` - 遷移至 FastAPI lifespan context manager
- 📝 `backend/app/models/schemas.py` - `PhotoStatus` 改用 `StrEnum`
- 📝 `backend/app/routers/photos.py` - 移除未使用的 imports、修正程式碼風格
- 📝 `backend/app/config.py` - 移除未使用的 `os` import
- ✨ `backend/pyproject.toml` - 加入 Ruff 設定

**改進項目：**

1. **FastAPI lifespan 遷移**
   - 消除 `@app.on_event("startup")` deprecation warning
   - 更現代的 async context manager 寫法
   - 加入啟動時目錄驗證

2. **Ruff Linter 導入**
   - 修復所有 lint 錯誤（未使用的 imports、過長的行等）
   - 設定規則：pycodestyle、pyflakes、isort、pyupgrade、bugbear
   - 執行 `make lint` 即可檢查

3. **程式碼品質提升**
   - `PhotoStatus` 從 `str, Enum` 遷移至 `StrEnum`（更符合 Python 3.11+ 慣例）
   - 所有檔案通過 Ruff 檢查（100% clean）

---

### 5. 文件更新

**變更檔案：**
- 📝 `CLAUDE.md` - 更新開發指令、加入 Docker 與 Makefile 說明
- 📝 `README.md` - （待更新）
- 📝 `CHANGELOG.md` - （待更新）

---

## 📊 優化成果對比

| 面向 | 優化前 | 優化後 |
|------|--------|--------|
| **環境設定** | 手動建 venv、安裝依賴、分別啟動前後端 | `make dev` 一鍵啟動 |
| **依賴管理** | pip + requirements.txt、無 lockfile | uv + pyproject.toml + uv.lock |
| **環境一致性** | 依賴本機 Python/Node 版本 | Docker 容器化，完全隔離 |
| **部署** | 無標準流程 | `make build && make prod` |
| **程式碼品質** | 僅前端 ESLint | 前端 ESLint + 後端 Ruff |
| **開發體驗** | 多個手動指令 | 統一 Makefile 介面 |

---

## 🚀 下一步建議

這次已排除的項目（未來可考慮）：
- 縮圖快取機制（目前 thumbnail 端點直接回傳原圖）
- 單容器部署選項（frontend 由 FastAPI StaticFiles 提供）

---

## 📝 使用說明

### 首次啟動

```bash
# 安裝依賴（可選，make dev 會自動處理）
make install

# 啟動開發環境
PHOTOS_DIR=~/Pictures make dev

# 瀏覽器開啟
http://localhost:5173   # 前端（開發模式）
http://localhost:8000   # 後端 API
```

### 程式碼開發流程

```bash
# 開發時持續執行
make dev

# 修改程式碼後自動 hot-reload（前後端皆支援）

# 程式碼品質檢查
make check

# 格式化後端程式碼
make format
```

### Production 部署

```bash
# 建構 production images
make build

# 啟動 production 環境（Nginx 提供前端）
PHOTOS_DIR=/path/to/photos make prod

# 瀏覽器開啟
http://localhost:8080   # Nginx 前端
http://localhost:8000   # 後端 API（由 Nginx 反向代理 /api）
```

---

## 🔧 技術棧

- **容器化**: Docker + Docker Compose
- **後端依賴**: uv (Astral)
- **後端 Linter**: Ruff (Astral)
- **自動化**: GNU Make
- **前端建構**: Vite 7
- **前端服務**: Nginx (production)
