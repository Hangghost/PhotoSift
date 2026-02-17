# 照片篩選與上傳工作流自動化工具

## 專案背景

### 現有工作流程
1. 手機拍照
2. 上傳到 Google Drive
3. 逐張點開照片，手動紀錄需刪除的檔名
4. 手動刪除不需要的照片
5. 下載到電腦
6. 分別上傳到 Google 相簿、Facebook 相簿、Line 社團相簿

### 痛點
- 逐張點開、手動紀錄、再刪除，操作繁瑣
- 整體流程缺乏自動化
- 每次處理約 200 張照片，耗時費力

### 篩選標準
- 模糊照片
- 重複照片
- 構圖不佳

### 目標
- **Phase 1**：優化批次瀏覽介面，快速標記與批次操作
- **Phase 2**：加入 AI 自動預篩功能

---

## 方案評估

### 方案總覽

| 方案 | 架構 | 開發時間 | 維護成本 | AI 擴展性 |
|------|------|----------|----------|-----------|
| **A. Local Desktop App** | Electron/Tauri + Local Server | 2-3 週 | 低 | 中 |
| **B. Local Web App** | Browser + Python Backend | 1-2 週 | 低 | 高 |
| **C. Cloud-based** | Cloud Functions + Web UI | 3-4 週 | 中 | 高 |

---

### 方案 A：Local Desktop App

**架構**
```
[Google Drive API] → [Local Python Service] → [Electron/Tauri UI]
                                            ↓
                            [Google Photos / Facebook / Line API]
```

**優點**
- 離線可用（照片 cache 後）
- 原生體驗，鍵盤快捷鍵流暢
- 不需要 server 費用

**缺點**
- 打包部署稍複雜
- 跨裝置需各自安裝

**技術選擇**
- UI：Tauri（輕量）或 Electron（生態成熟）
- Backend：Rust（Tauri 原生）或 Python sidecar
- API：googleapis, facebook-sdk

---

### 方案 B：Local Web App ⭐ 推薦

**架構**
```
[Browser UI (React/Vue)] 
        ↓ localhost:8000
[Python FastAPI Backend]
        ↓
[Google Drive] → 下載 cache → [批次瀏覽/標記] → [上傳多平台]
```

**優點**
- 開發最快，迭代容易
- UI 用 Web 技術，彈性高
- 未來可輕鬆遷移到 cloud

**缺點**
- 需手動啟動 server
- 僅限單機使用

**推薦原因**
- 符合「快速起步、未來加 AI」的需求
- 200 張照片的規模，local 處理綽綽有餘
- Web 技術對 UI 迭代最友善

---

### 方案 C：Cloud-based

**架構**
```
[Web UI - Vercel/Cloudflare Pages]
              ↓
[Cloud Functions / Cloud Run]
              ↓
[Google Drive API] ←→ [Cloud Storage cache] ←→ [多平台 API]
```

**優點**
- 任何裝置可用
- 可與他人共享
- 背景處理不佔本機資源

**缺點**
- 需處理部署、成本、安全性
- API 費用（低用量可控）
- 開發週期較長

---

## API 整合評估

| 平台 | 可行性 | 備註 |
|------|--------|------|
| **Google Drive** | ✅ 完全可行 | 標準 OAuth，無上傳限制 |
| **Google Photos** | ⚠️ 有限制 | API 只能上傳到「由 App 建立的相簿」，無法寫入既有相簿 |
| **Facebook** | ⚠️ 需審核 | Graph API 上傳相簿需 App Review，個人用可走 User Token |
| **Line 社團相簿** | ❌ 無官方 API | 只能用 Line Notify 發圖，或瀏覽器自動化（不穩定） |

### Google Photos API 限制說明
- 透過 API 建立的相簿，只有該 App 有寫入權限
- 無法上傳到使用者手動建立的既有相簿
- 解法：由程式建立專用相簿，或改用 Google Drive 資料夾作為最終儲存

### Facebook Graph API 說明
- 需要 `publish_to_groups` 或 `pages_manage_posts` 權限
- 個人開發者可使用 User Access Token（有效期短，需定期更新）
- 正式上線需通過 App Review

### Line 替代方案
- **Line Notify**：可發送圖片通知，但不是相簿功能
- **瀏覽器自動化**：使用 Playwright/Puppeteer，但易受 UI 變動影響
- **建議**：此步驟維持手動，或改用其他平台

---

## 選定方案：Local Web App

### 技術架構

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Grid View  │  │  Keyboard   │  │   Upload    │     │
│  │  Component  │  │  Navigator  │  │   Manager   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API (localhost:8000)
┌─────────────────────────▼───────────────────────────────┐
│                 Python FastAPI Backend                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Google    │  │    Photo    │  │   Upload    │     │
│  │ Drive Sync  │  │   Cache     │  │   Service   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐                       │
│  │   SQLite    │  │  AI Module  │ (Phase 2)            │
│  │  Database   │  │  (Optional) │                       │
│  └─────────────┘  └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
                          │
     ┌────────────────────┼────────────────────┐
     ▼                    ▼                    ▼
[Google Drive]    [Google Photos]       [Facebook]
```

### 技術選擇

**Frontend**
- Framework: React + TypeScript
- UI Library: Tailwind CSS
- State: Zustand 或 React Context
- 圖片懶加載: react-window 或 react-virtualized

**Backend**
- Framework: Python FastAPI
- Database: SQLite (輕量、無需額外服務)
- Cache: 本地檔案系統 (`~/.photo-workflow/cache/`)
- OAuth: authlib 或 google-auth

**AI 模組 (Phase 2)**
- 模糊檢測: OpenCV (Laplacian variance)
- 重複檢測: imagehash (perceptual hash)
- 構圖評分: Claude Vision API 或 local model

---

## 開發階段規劃

### Phase 1：批次瀏覽與基礎操作（1-2 週）

#### Week 1: 核心功能
- [ ] 專案初始化 (FastAPI + React)
- [ ] Google Drive OAuth 整合
- [ ] 照片列表 API（讀取指定資料夾）
- [ ] 縮圖下載與 cache
- [ ] Grid View UI（顯示縮圖）

#### Week 2: 操作與上傳
- [ ] 鍵盤導航（←→ 切換, Space 放大, D 標記刪除, K 標記保留）
- [ ] 批次標記狀態管理
- [ ] 一鍵刪除已標記照片（Google Drive API）
- [ ] Google Photos 上傳功能
- [ ] 進度狀態持久化（SQLite）

### Phase 2：AI 預篩功能（1-2 週）

#### 模糊檢測
```python
import cv2

def detect_blur(image_path: str, threshold: float = 100.0) -> bool:
    """
    使用 Laplacian 方差檢測模糊
    variance < threshold 視為模糊
    """
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold
```

#### 重複檢測
```python
from imagehash import phash
from PIL import Image

def find_duplicates(image_paths: list[str], threshold: int = 5) -> list[set]:
    """
    使用 perceptual hash 找出相似照片群組
    hash 差異 <= threshold 視為重複
    """
    hashes = {}
    for path in image_paths:
        h = phash(Image.open(path))
        hashes[path] = h
    
    # 分群邏輯...
    return duplicate_groups
```

#### 構圖評分（Claude Vision API）
```python
import anthropic

def evaluate_composition(image_base64: str) -> dict:
    """
    使用 Claude Vision 評估構圖品質
    """
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_base64}},
                {"type": "text", "text": "請評估這張照片的構圖品質（1-10分），並簡短說明原因。回傳 JSON: {score: number, reason: string}"}
            ]
        }]
    )
    return parse_response(response)
```

### Phase 3：擴展平台（可選）
- [ ] Facebook Graph API 整合
- [ ] 研究 Line 替代方案
- [ ] 批次上傳佇列與進度顯示

---

## 資料結構設計

### SQLite Schema

```sql
-- 照片資訊
CREATE TABLE photos (
    id TEXT PRIMARY KEY,           -- Google Drive file ID
    name TEXT NOT NULL,
    drive_folder_id TEXT,
    thumbnail_path TEXT,           -- local cache path
    full_image_path TEXT,
    status TEXT DEFAULT 'pending', -- pending, keep, delete, uploaded
    blur_score REAL,               -- AI: 模糊分數
    duplicate_group_id TEXT,       -- AI: 重複群組
    composition_score REAL,        -- AI: 構圖分數
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 工作階段
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    drive_folder_id TEXT,
    total_photos INTEGER,
    processed_photos INTEGER,
    status TEXT DEFAULT 'active',  -- active, completed, cancelled
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 上傳紀錄
CREATE TABLE uploads (
    id TEXT PRIMARY KEY,
    photo_id TEXT REFERENCES photos(id),
    platform TEXT,                 -- google_photos, facebook
    platform_id TEXT,              -- 上傳後的平台 ID
    status TEXT,                   -- pending, success, failed
    error_message TEXT,
    created_at TIMESTAMP
);
```

---

## 鍵盤快捷鍵設計

| 按鍵 | 功能 |
|------|------|
| `←` / `→` | 上一張 / 下一張 |
| `↑` / `↓` | 上一列 / 下一列（Grid 模式）|
| `Space` | 放大檢視目前照片 |
| `D` | 標記刪除 |
| `K` | 標記保留 |
| `U` | 取消標記 |
| `Shift + D` | 批次刪除所有已標記 |
| `Shift + U` | 批次上傳所有保留照片 |
| `1-5` | 快速評分（未來功能）|
| `/` | 搜尋 / 篩選 |
| `?` | 顯示快捷鍵說明 |

---

## 專案目錄結構

```
photo-workflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # 設定管理
│   │   ├── database.py          # SQLite 連線
│   │   ├── routers/
│   │   │   ├── drive.py         # Google Drive API
│   │   │   ├── photos.py        # 照片管理
│   │   │   └── upload.py        # 上傳服務
│   │   ├── services/
│   │   │   ├── google_drive.py
│   │   │   ├── google_photos.py
│   │   │   ├── facebook.py
│   │   │   └── ai_analyzer.py   # Phase 2
│   │   └── models/
│   │       └── schemas.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PhotoGrid.tsx
│   │   │   ├── PhotoViewer.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── KeyboardHandler.tsx
│   │   ├── hooks/
│   │   │   ├── usePhotos.ts
│   │   │   └── useKeyboard.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── photoStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── docker-compose.yml           # 可選：容器化部署
```

---

## 環境設定

### Google Cloud Console 設定
1. 建立新專案
2. 啟用 API：
   - Google Drive API
   - Google Photos Library API
3. 建立 OAuth 2.0 憑證（Desktop App 類型）
4. 下載 `credentials.json`

### 環境變數 (.env)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback

# Facebook (Optional)
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Anthropic (Phase 2)
ANTHROPIC_API_KEY=your_api_key

# App Settings
CACHE_DIR=~/.photo-workflow/cache
DATABASE_PATH=~/.photo-workflow/data.db
```

---

## 下一步行動

1. **初始化專案結構**
   ```bash
   mkdir photo-workflow && cd photo-workflow
   # 建立 backend / frontend 目錄
   ```

2. **設定 Google Cloud 專案**
   - 前往 https://console.cloud.google.com
   - 建立專案並啟用必要 API

3. **實作 MVP**
   - 從 Google Drive OAuth 開始
   - 完成照片列表與縮圖顯示
   - 加入鍵盤操作

---

## 參考資源

- [Google Drive API 文件](https://developers.google.com/drive/api/v3/reference)
- [Google Photos Library API](https://developers.google.com/photos/library/guides/overview)
- [Facebook Graph API - Photos](https://developers.facebook.com/docs/graph-api/reference/photo/)
- [FastAPI 文件](https://fastapi.tiangolo.com/)
- [React 文件](https://react.dev/)
