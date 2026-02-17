# PhotoSift - 開發規劃

> **最後更新**: 2026-02-17
> **當前版本**: v0.3.0

---

## 📋 專案概述

PhotoSift 是一個本機照片批次審查工具，幫助使用者快速瀏覽、標記並刪除不需要的照片。

**核心價值：**
- 🚀 快速鍵導覽，提升審查效率
- 🎯 批次標記與刪除，節省時間
- 🔒 本機處理，隱私安全

---

## ✅ Phase 1 - 基礎功能（已完成）

### 1.1 核心功能
- [x] 載入本機資料夾，掃描照片
- [x] 網格式照片瀏覽（4 欄式佈局）
- [x] 全尺寸照片檢視器（Lightbox）
- [x] 鍵盤快捷鍵導覽（方向鍵、D/K/U、Space、Shift+D）
- [x] 照片狀態標記（pending/keep/delete）
- [x] 批次刪除標記照片
- [x] 即時統計顯示（總數、pending、keep、delete）

### 1.2 技術架構
- [x] React 19 + TypeScript + Tailwind CSS 4
- [x] FastAPI + Python 3.12
- [x] SQLite 資料庫（WAL 模式）
- [x] Zustand 狀態管理
- [x] Vite 7 開發工具

### 1.3 部署優化（v0.2.0）
- [x] Docker 容器化（多階段建構）
- [x] Docker Compose 編排（dev/prod 模式）
- [x] Makefile 自動化（20+ 指令）
- [x] uv 依賴管理（取代 pip）
- [x] Ruff linter/formatter
- [x] FastAPI lifespan 遷移
- [x] 掛載整個 HOME 目錄（支援任意本機路徑輸入）

---

## 🚧 Phase 2 - AI 預篩選（計劃中）

### 2.1 模糊偵測
- [ ] 使用 OpenCV 的 Laplacian Variance 偵測模糊照片
- [ ] 為每張照片計算 blur_score（0-100）
- [ ] 在前端顯示模糊指標
- [ ] 提供「自動標記模糊照片」功能

### 2.2 重複照片偵測
- [ ] 使用 imagehash (pHash) 計算照片指紋
- [ ] 群組相似照片（duplicate_group_id）
- [ ] 前端顯示重複照片群組
- [ ] 提供「保留最佳照片，刪除其他」功能

### 2.3 構圖評分
- [ ] 整合 Claude Vision API
- [ ] 分析照片構圖、光線、主體清晰度
- [ ] 計算 composition_score（0-100）
- [ ] 前端顯示評分並支援按評分排序

### 2.4 批次處理
- [ ] 背景任務處理（Celery + Redis）
- [ ] 進度條顯示
- [ ] 可中斷/恢復處理

---

## 🌐 Phase 3 - 雲端整合（未來規劃）

### 3.1 Google Drive 同步
- [ ] OAuth 2.0 認證
- [ ] 上傳標記為 keep 的照片到 Google Drive
- [ ] 同步狀態追蹤（uploads 資料表）
- [ ] 斷點續傳支援

### 3.2 Google Photos 上傳
- [ ] Google Photos API 整合
- [ ] 相簿分類上傳
- [ ] 元資料保留（拍攝日期、地點）

### 3.3 Facebook 上傳
- [ ] Facebook Graph API
- [ ] 批次上傳到相簿
- [ ] 隱私設定選項

---

## 🔧 技術優化（待排程）

### 架構改進
- [ ] **縮圖快取機制**
  - 載入資料夾時自動產生 WebP 縮圖（300x300）
  - 快取到 `~/.photo-workflow/cache`
  - 顯著降低網格瀏覽的載入時間

- [ ] **單容器部署模式**
  - Frontend 由 FastAPI StaticFiles 提供
  - 簡化部署，單一 `docker run` 指令
  - 適合個人本機使用場景

- [ ] **資料庫遷移工具**
  - 使用 Alembic 管理 schema 變更
  - 支援版本升級時自動遷移

### 效能優化
- [ ] **虛擬滾動 (Virtual Scrolling)**
  - 大量照片時只渲染可見區域
  - 使用 react-window 或 react-virtual

- [ ] **照片預載 (Preloading)**
  - 導覽時預載前後照片
  - 減少切換延遲

- [ ] **WebP 轉換**
  - 自動將 HEIC/JPEG 轉為 WebP
  - 減少傳輸頻寬

### 使用者體驗
- [ ] **批次操作**
  - 選取多張照片（Shift/Ctrl + Click）
  - 批次標記狀態

- [ ] **篩選與排序**
  - 按狀態、日期、評分篩選
  - 多種排序方式（名稱、日期、評分）

- [ ] **復原功能 (Undo)**
  - 撤銷最近的標記操作
  - 撤銷刪除（從資料庫恢復，檔案已刪除則無法恢復）

- [ ] **搜尋功能**
  - 檔名搜尋
  - EXIF 元資料搜尋（日期、相機型號）

### 開發工具
- [ ] **測試覆蓋**
  - Frontend: Vitest + React Testing Library
  - Backend: pytest
  - E2E: Playwright

- [ ] **CI/CD Pipeline**
  - GitHub Actions
  - 自動測試 + Lint
  - Docker image 建構與推送

- [ ] **日誌與監控**
  - 結構化日誌（JSON format）
  - 日誌輪轉 (log rotation)
  - 錯誤追蹤（Sentry）

---

## 🚀 遠端部署規劃（未來）

當需要部署到遠端 server 時，需考慮以下項目：

### 基礎設施
- [ ] **反向代理**
  - Nginx/Caddy 前端
  - HTTPS 憑證（Let's Encrypt）
  - Rate limiting

- [ ] **檔案儲存策略**
  - 使用者上傳照片到 server（取代本機目錄掛載）
  - S3 相容物件儲存（MinIO/AWS S3）
  - 儲存空間限制與清理機制

- [ ] **使用者認證**
  - OAuth 2.0（Google/GitHub）
  - JWT token 認證
  - 多使用者資料隔離

- [ ] **資料庫**
  - 遷移至 PostgreSQL（支援多用戶並發）
  - 資料庫備份策略
  - 連線池 (connection pooling)

### 擴展性
- [ ] **水平擴展**
  - 多個 backend 實例
  - Load balancer
  - Session 共享（Redis）

- [ ] **背景任務處理**
  - Celery + Redis
  - AI 處理佇列
  - 上傳任務佇列

### 安全性
- [ ] **輸入驗證**
  - 路徑遍歷防護
  - 檔案類型白名單
  - 檔案大小限制

- [ ] **權限控制**
  - RBAC (Role-Based Access Control)
  - 資料夾訪問權限
  - API rate limiting

### 監控與維運
- [ ] **健康檢查**
  - Liveness/Readiness probes
  - 自動重啟機制

- [ ] **效能監控**
  - Prometheus + Grafana
  - 資源使用追蹤
  - 慢查詢偵測

- [ ] **備份與恢復**
  - 自動資料庫備份
  - 照片備份策略
  - 災難恢復計畫

---

## 📦 打包與分發（未來）

### 桌面應用程式
- [ ] **Electron 打包**
  - 打包成 Windows/macOS/Linux 應用程式
  - 內建 Python runtime
  - 一鍵安裝

### Docker 分發
- [ ] **簡化版 Docker image**
  - 單一指令啟動
  - 預設配置優化
  - 使用者友好的文檔

### CLI 工具
- [ ] **命令列介面**
  - 無 UI 模式批次處理
  - 腳本化工作流程

---

## 🎯 近期優先級

### High Priority（下個 Sprint）
1. 縮圖快取機制（顯著提升效能）
2. 測試覆蓋（確保程式碼品質）
3. 虛擬滾動（支援大量照片）

### Medium Priority（Phase 2）
1. AI 預篩選功能
2. 批次操作與篩選
3. 復原功能

### Low Priority（Phase 3）
1. 雲端整合
2. 遠端部署
3. 桌面應用打包

---

## 📝 變更紀錄

### v0.3.0 - 2026-02-17
- ✅ 獨立容器管理（dev/prod 完全分離）
- ✅ 容器暫停/恢復功能
- ✅ 掛載整個 HOME 目錄支援任意路徑
- ✅ 專案規劃文件 (PLAN.md)
- ✅ Port 調整避免衝突

### v0.2.0 - 2026-02-17
- ✅ Docker 容器化
- ✅ Makefile 自動化
- ✅ uv 依賴管理
- ✅ Ruff linter
- ✅ FastAPI lifespan 遷移

### v0.1.0 - 2026-02-17
- ✅ 初始專案架構
- ✅ 基礎照片瀏覽與標記功能
- ✅ 鍵盤快捷鍵
- ✅ 批次刪除

---

## 🤝 貢獻指南

目前此專案為個人使用，暫不開放外部貢獻。

---

## 📧 聯絡資訊

如有問題或建議，請開 GitHub Issue。
