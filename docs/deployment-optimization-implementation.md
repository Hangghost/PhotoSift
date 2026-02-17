# PhotoSift 部署架構優化 - 實作完成報告

> **最後更新**: 2026-02-17
> **當前版本**: v0.3.0

## 📋 概要

PhotoSift 專案的部署架構持續優化，從初始的 Docker 容器化（v0.2.0）到獨立容器管理與路徑掛載優化（v0.3.0），實現了完整的開發與部署工作流程。

---

## 📚 版本歷史

### v0.3.0 - 2026-02-17 - 獨立容器管理與路徑掛載優化

**核心改進：**
- ✅ **獨立容器管理**: Dev 和 Prod 環境完全分離，可同時運行
- ✅ **容器暫停/恢復**: 快速釋放與恢復資源（保留容器狀態）
- ✅ **路徑掛載優化**: 支援任意本機路徑輸入
- ✅ **專案規劃文件**: PLAN.md 記錄未來開發方向

**新增指令：**
```bash
make pause-dev/pause-prod   # 暫停容器（保留狀態）
make resume-dev/resume-prod # 恢復容器
make stop-dev/stop-prod     # 獨立停止並刪除容器
make restart-dev/restart-prod # 獨立重啟容器
make logs-dev/logs-prod     # 分別查看日誌
make status                 # 顯示容器狀態與健康檢查
make deploy                 # 完整重建並部署 production
```

**技術細節：**
- 使用不同的 Docker Compose project name (`photosift-dev`, `photosift-prod`)
- 掛載整個 HOME 目錄到容器，不再需要 `PHOTOS_DIR` 環境變數
- Port 調整：dev frontend 3002、prod frontend 8888（避免衝突）
- 容器內設定 HOME 環境變數支援 `expanduser()`
- 修復容器內路徑展開錯誤（加入 try-catch）

---

### v0.2.0 - 2026-02-17 - 初始部署架構優化

**核心改進：**
- ✅ Docker 容器化
- ✅ Makefile 自動化
- ✅ uv 依賴管理
- ✅ Ruff linter
- ✅ FastAPI lifespan 遷移

---

## ✅ 已完成項目（累積）

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

### 首次啟動（v0.3.0 更新）

```bash
# 安裝依賴（可選，make dev 會自動處理）
make install

# 啟動開發環境（不需要 PHOTOS_DIR 環境變數）
make dev

# 瀏覽器開啟
http://localhost:3002   # 前端（開發模式）
http://localhost:8000   # 後端 API

# 在瀏覽器輸入框中輸入本機路徑
~/Downloads/photos
/Users/yourname/Pictures/trip
```

### 容器管理（v0.3.0 新增）

```bash
# 暫停容器（釋放資源但保留狀態）
make pause-dev      # 或 make pause-prod

# 稍後恢復
make resume-dev     # 或 make resume-prod

# 查看狀態
make status

# 完全停止並刪除容器
make stop-dev       # 或 make stop-prod

# 重啟運行中的容器
make restart-dev    # 或 make restart-prod
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

# 查看開發日誌
make logs-dev
```

### Production 部署（v0.3.0 更新）

```bash
# 方法 1: 完整重建並部署（推薦）
make deploy

# 方法 2: 手動分步驟
make build          # 建構 production images
make prod           # 啟動 production 環境（背景執行）

# 瀏覽器開啟
http://localhost:8888   # Nginx 前端
http://localhost:8000   # 後端 API

# 查看生產日誌
make logs-prod

# 停止生產環境
make stop-prod
```

---

## 🔧 技術棧

- **容器化**: Docker + Docker Compose
- **後端依賴**: uv (Astral)
- **後端 Linter**: Ruff (Astral)
- **自動化**: GNU Make
- **前端建構**: Vite 7
- **前端服務**: Nginx (production)

---

## 📊 v0.3.0 詳細變更

### 1. 獨立容器管理架構

**問題背景：**
- v0.2.0 中 dev 和 prod 使用相同的 Docker Compose project
- `make stop` 會同時停止 dev 和 prod 容器
- 無法同時運行兩種環境（port 衝突）

**解決方案：**
```makefile
COMPOSE_DEV := docker compose -p photosift-dev
COMPOSE_PROD := docker compose -p photosift-prod -f docker-compose.yml
```

**效果：**
- Dev 和 Prod 完全獨立，可同時運行
- 獨立的啟動、停止、重啟指令
- 分別的日誌查看

### 2. 容器暫停/恢復功能

**新增指令對比：**

| 操作 | 指令 | Docker 命令 | 容器狀態 | 恢復方式 | 速度 |
|------|------|-------------|---------|---------|------|
| 暫停 | `make pause-dev` | `docker compose stop` | 停止但保留 | `make resume-dev` | ⚡ 快 |
| 停止 | `make stop-dev` | `docker compose down` | 刪除 | `make dev` | 🐢 慢（重建） |
| 重啟 | `make restart-dev` | `docker compose restart` | 重啟運行中 | N/A | ⚡ 快 |

**使用場景：**
- 午休或暫時離開 → `make pause-dev`（節省資源）
- 回來繼續工作 → `make resume-dev`（幾秒恢復）
- 修改 Dockerfile → `make stop-dev` + `make dev`（完整重建）

### 3. 路徑掛載優化

**v0.2.0 方式：**
```bash
# 需要指定 PHOTOS_DIR 環境變數
PHOTOS_DIR=~/Pictures make dev
```

**v0.3.0 方式：**
```yaml
# docker-compose.yml
volumes:
  - ${HOME}:${HOME}  # 掛載整個 HOME 目錄
environment:
  - HOME=${HOME}     # 傳遞 HOME 環境變數
```

```bash
# 啟動時不需要參數
make dev

# 前端直接輸入本機路徑
~/Downloads/photos
/Users/yourname/Pictures
```

**容器內錯誤處理：**
```python
# backend/app/routers/photos.py
try:
    folder = Path(req.folder_path).expanduser().resolve()
except RuntimeError:
    # Docker 環境可能無 HOME，fallback 到直接 resolve
    folder = Path(req.folder_path).resolve()
```

### 4. Port 調整

**變更原因：**
- Port 8080 常被其他服務佔用
- Port 5173 與其他 Vite 專案衝突

**調整結果：**
- Dev frontend: 5173 → **3002**
- Prod frontend: 8080 → **8888**
- Backend: 8000（不變）

**環境變數支援：**
```yaml
ports:
  - "${FRONTEND_DEV_PORT:-3002}:5173"   # 可覆蓋
  - "${FRONTEND_PORT:-8888}:80"         # 可覆蓋
```

### 5. 容器狀態管理

**`make status` 輸出範例：**
```
📊 Development Containers:
NAME                   IMAGE                 STATUS    PORTS
photosift-dev-backend-1    photosift-backend    Up        0.0.0.0:8000->8000/tcp
photosift-dev-frontend-1   photosift-frontend   Up        0.0.0.0:3002->5173/tcp

📊 Production Containers:
  (none running)

🏥 Health Check:
  Backend:  ✅ Healthy
  Dev Frontend (3002):  ✅ Reachable
  Prod Frontend (8888): ❌ Unreachable

🔗 Access URLs:
  Dev Frontend:  http://localhost:3002
  Prod Frontend: http://localhost:8888
  Backend API:   http://localhost:8000
```

### 6. 專案規劃文件

**PLAN.md 內容結構：**
- ✅ Phase 1（已完成）：基礎功能 + 部署優化
- 🚧 Phase 2（計劃中）：AI 預篩選
- 🌐 Phase 3（未來）：雲端整合
- 🔧 技術優化待排程：縮圖快取、測試、CI/CD 等
- 🚀 遠端部署規劃：認證、多用戶、監控等
- 📦 打包與分發：Electron、CLI 工具等

---

## 📈 優化成果對比（更新至 v0.3.0）

| 面向 | v0.1.0 | v0.2.0 | v0.3.0 |
|------|--------|--------|--------|
| **環境設定** | 手動建 venv、分別啟動 | `make dev` 一鍵啟動 | 同 v0.2.0 |
| **依賴管理** | pip + requirements.txt | uv + pyproject.toml | 同 v0.2.0 |
| **容器管理** | N/A | 統一管理 | **獨立管理 dev/prod** |
| **路徑輸入** | N/A | 需設定 `PHOTOS_DIR` | **直接輸入任意路徑** |
| **暫停/恢復** | N/A | 無 | **pause/resume 指令** |
| **狀態查看** | N/A | 手動 `docker ps` | **`make status` 統一介面** |
| **Port 管理** | N/A | 可能衝突 | **避免常見衝突** |
| **部署** | 無標準流程 | `make prod` | **`make deploy` 完整重建** |

---

## 🎯 下一步計劃

根據 PLAN.md，接下來的優先級：

### High Priority
1. **縮圖快取機制**（顯著提升瀏覽效能）
2. **測試覆蓋**（確保程式碼品質）
3. **虛擬滾動**（支援大量照片）

### Medium Priority
4. **AI 預篩選**（模糊偵測、重複照片）
5. **批次操作與篩選**
6. **復原功能**

### Low Priority
7. **雲端整合**
8. **遠端部署**
9. **桌面應用打包**
