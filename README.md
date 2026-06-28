# AI Beginner GitHub Compass (AI 初學者 GitHub 開源指南) 🚀

> **資深技術導師 (Senior AI Mentor) 為你量身打造的 AI 開源熱門項目引航儀。**
> 本專案完美融合了 **Vite/React 19 + Tailwind CSS v4** 前端、**Express (Node.js)** 核心後端、**Gemini 3.5-flash** 智慧篩選模型，並搭配了獨立的 **Python 自動化爬蟲程式**。

---

## 🧭 項目特點與功能

1. **好看的 UI 介面：** 採用現代極簡風格與高對比色調（Cosmic Slate 風格），結合細緻的動畫與微互動。
2. **熱門 AI 榜單：** 動態獲取最新熱門 AI 開源專案（預設自 GitHub 官方 API，具備自動快取，並提供高級 Fallback 本地優質數據）。
3. **AI 自動篩選明星專案：**
   - 包含 **Python 程式好手**、**無程式碼拖拉玩家**、**全端應用工程師** 與 **理論探索者** 4 種學習者特質。
   - 使用 **Gemini 3.5-flash** 並嚴格限制 `responseSchema` JSON 結構化輸出，精確挑選出最適合該背景的 3 個項目，附帶「導師推薦上手第一步」。
4. **本地數據庫持久化：** 連接後端「輕量 SQLite/JSON 檔案數據庫」(儲存於 `database.json`)，無須任何繁瑣安裝即可對項目進行「收藏」與「刪除」等完整 CRUD 操作。
5. **獨立 Python 爬蟲：** 附帶高級網頁爬蟲與官方 API 連接腳本 (`python_crawler.py`)，助你理解底層數據獲取原理。

---

## 🛠️ 技術棧與架構設計 (導師極致推薦)

| 層級 | AI Studio 預覽與正式實作 | 導師推薦新手組合 | 說明 |
| :--- | :--- | :--- | :--- |
| **前端 (Frontend)** | Vite + React 19 + Tailwind CSS v4 | **Vite + React + Tailwind** | 提供極速熱重載與精美、響應式組件拼裝 |
| **後端 (Backend)** | Express.js (TypeScript) | **FastAPI (Python)** | 本地環境下，AI 初學者使用 Python FastAPI 承接 API 能更流暢整合機器學習庫 |
| **資料庫 (Database)** | JSON 模擬持久層 (`database.json`) | **SQLite** | 免安裝資料庫服務，檔案即資料庫，建立關聯式 DB 概念的最佳起手式 |
| **AI 智慧核心** | Google GenAI SDK (Gemini 3.5-flash) | **Gemini 3.5-flash** | 提供極速推理、精準指令遵循，且性價比極高 |

---

## 🚀 VMware Ubuntu 完整安裝與本地啟動步驟

在你的 **VMware Ubuntu** 環境中，請依照以下步驟逐一設定前端與後端環境。

### 步驟 1：基礎環境檢查
請確保 Ubuntu 系統已安裝 Node.js (建議 v18+) 以及 Python 3.10+。
```bash
# 檢查 Node.js 版本
node -v

# 檢查 Python 版本
python3 --version

# 檢查 npm 版本
npm -v
```

---

### 步驟 2：Python 爬蟲環境安裝與執行

在較新的 Ubuntu 版本中（如 Ubuntu 23.04+ 或 24.04），直接使用系統自帶的 `pip` 安裝第三方庫會觸發 `error: externally-managed-environment` (PEP 668 保護機制，避免破壞系統級別的 Python 包)。

#### 💡 導師解決方案：使用 `venv` 虛擬環境
1. **建立虛擬環境：**
   ```bash
   python3 -m venv venv
   ```
2. **啟用虛擬環境：**
   ```bash
   source venv/bin/activate
   ```
   *此時終端機前方會出現 `(venv)` 標記。*

3. **在虛擬環境中安裝套件：**
   ```bash
   pip install requests beautifulsoup4
   ```

4. **運行 Python 爬蟲：**
   ```bash
   python python_crawler.py
   ```
   *運行成功後，程式將自動測試「網頁解析模式」與「官方 API 模式」，並在終端機輸出當前最新 AI 趨勢排名。*

---

### 步驟 3：前端與 Node.js 後端服務啟動

1. **安裝專案依賴（在項目根目錄下）：**
   ```bash
   npm install
   ```

2. **設定環境變數：**
   將專案目錄下的 `.env.example` 複製一份並命名為 `.env`，填入你的 Gemini API Key：
   ```bash
   cp .env.example .env
   ```
   編輯 `.env` 檔案：
   ```env
   GEMINI_API_KEY="你的_GEMINI_API_KEY_放在這裡"
   ```
   *(如果沒有設定 API Key，系統會貼心切換到「導師模擬 AI 模式」，依然可以進行所有的篩選與收藏測試)*

3. **啟動開發伺服器：**
   ```bash
   npm run dev
   ```
   此時終端機將會顯示：
   ```text
   =================================================
   🌐 區域網路存取：http://192.168.x.x:3000
   🚀 伺服器已啟動於：http://localhost:3000
   =================================================
   ```

4. **網頁打開結果：**
   - 打開 Ubuntu 內建的瀏覽器 (如 Firefox)，在網址列輸入 `http://localhost:3000` 即可訪問精美的導航系統！
   - 如果你要從 Windows 主機訪問 VMware 內的虛擬機，可以直接輸入終端機中顯示的區域網路 IP（如 `http://192.168.x.x:3000`）。

---

## 🛠️ 導師 Debug 避坑筆記 (Senior Mentor Logs)

### 1. Python 爬蟲中的 `class` 關鍵字語法錯誤
* **錯誤現象：** `SyntaxError: invalid syntax` 指向 `repo_articles = soup.find_all("article", class="Box-row")`。
* **導師詳解：** 在 Python 中，`class` 是一個保留字（用來定義類別）。BeautifulSoup 為了解決這個命名衝突，規定在根據 CSS 類名進行過濾時，必須使用 **`class_`** (帶有底線) 或傳入字典 `attrs={"class": "Box-row"}`。
* **已修正程式碼：** `repo_articles = soup.find_all("article", class_="Box-row")`。

### 2. Node.js ES Modules 的 `require is not defined`
* **錯誤現象：** 執行 `npm run dev` 時報錯 `ReferenceError: require is not defined` 指向 `require("os")`。
* **導師詳解：** 由於專案 `package.json` 中配置了 `"type": "module"`，整個 Node 後端都是以頂級 **ES Modules (ESM)** 規範運行。在 ESM 環境中不能使用 CommonJS 的 `require()`。
* **已修正程式碼：** 在最頂層導入 `import os from "os";`，並用 `os.networkInterfaces()` 取代。

---

## 📚 課後作業與進階探索

當你成功運行此系統後，導師建議你嘗試以下挑戰：
1. **結合 Python 爬蟲與 Express API：** 嘗試將 Python 抓取下來的 JSON 結果，定時寫入後端的 `database.json` 檔案中，實現前後端完全分離的資料自動更新。
2. **將 JSON 替換為真正的 SQLite / PostgreSQL：** 在 FastAPI 內引入 SQLModel 或 SQLAlchemy，將你的收藏夾表格寫入資料庫檔案中！

*有任何問題，隨時召喚你的導師！Happy Coding!* 🚀
