# AI Beginner GitHub Compass 🚀

> **English | [繁體中文](README_zh-TW.md)**

> **A customized AI open-source trending navigator designed by your Senior AI Mentor for absolute beginners.**
> This project integrates **Vite/React 19 + Tailwind CSS v4** for the frontend, **Express (Node.js)** for the backend API server, **Gemini 3.5-flash** for intelligent project auto-curation, and features a standalone **Python automated crawler/scraper script**.

---

## 🧭 Key Features

1. **Stunning UI Interface:** Designed using a clean, modern minimalist layout with high-contrast color palettes (Cosmic Slate Theme), combined with elegant transitions and micro-interactions.
2. **Trending AI Leaderboard:** Dynamically fetches the latest trending AI repositories (defaults to GitHub's official Search API with caching, and falls back to pre-populated high-quality local data if rate-limited).
3. **AI-Powered Project Auto-Curation:**
   - Features 4 distinct learner persona types: **Python Programmer**, **No-Code / UI Dragger**, **Fullstack Developer**, and **Theory Explorer**.
   - Leverages **Gemini 3.5-flash** structured JSON output (secured with strict `responseSchema` configurations) to curate exactly 3 starter projects tailored to your background, complete with "Mentor-recommended first steps".
4. **Local Database Persistence:** Connects to an Express-powered lightweight file database (`database.json`), enabling full CRUD operations for "Bookmarking/Unbookmarking" repos without any external database engines.
5. **Independent Python Crawler:** Includes a clean, beautifully annotated Python web scraper and API connector (`python_crawler.py`) to help you understand web scraping and automated pipeline concepts.

---

## 🛠️ Architecture & Tech Stack (Mentor-Recommended)

| Layer | AI Studio Preview & Implementation | Mentor's Rookie Recommendation | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vite + React 19 + Tailwind CSS v4 | **Vite + React + Tailwind** | Blazing-fast HMR and highly modular component-driven interface development. |
| **Backend** | Express.js (TypeScript) | **FastAPI (Python)** | Since AI and Data Science operate primarily in Python, FastAPI is the ultimate lightweight choice for rookies. |
| **Database** | File-based Database (`database.json`) | **SQLite** | Zero configuration needed; databases are stored as a local `.db` file. The perfect entry point for RDBMS concepts. |
| **AI Integration** | Google GenAI SDK (Gemini 3.5-flash) | **Gemini 3.5-flash** | Offers lightning-fast inference, exceptional instruction adherence, and highly competitive pricing. |

---

## 🚀 VMware Ubuntu Setup & Deployment Steps

Follow these step-by-step instructions to configure both Python and Node.js environments inside your **VMware Ubuntu** virtual machine.

### Step 1: Basic Dependency Verification
Ensure your Ubuntu operating system has Node.js (v18+ recommended) and Python 3.10+ installed.
```bash
# Check Node.js version
node -v

# Check Python version
python3 --version

# Check npm version
npm -v
```

---

### Step 2: Install & Run Python Crawler

On newer Ubuntu distros (e.g., Ubuntu 23.04+ or 24.04), installing packages system-wide via `pip` directly will trigger the `error: externally-managed-environment` (PEP 668 protection policy to prevent breaking system package managers).

#### 💡 Mentor's Solution: Virtual Environments (`venv`)
1. **Initialize a virtual environment:**
   ```bash
   python3 -m venv venv
   ```
2. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```
   *Your terminal prompt will now be prefixed with `(venv)`.*

3. **Install dependencies inside the virtual environment:**
   ```bash
   pip install requests beautifulsoup4
   ```

4. **Run the Python scraper script:**
   ```bash
   python python_crawler.py
   ```
   *Upon successful execution, the script will fetch trending repos using both HTML web scraping and official GitHub Search APIs, displaying structured results directly on your CLI.*

---

### Step 3: Start Frontend & Express Backend API

1. **Install workspace npm dependencies (at root directory):**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Duplicate `.env.example` as `.env` and populate your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in your editor:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
   ```
   *(If no API Key is specified, the application automatically triggers a mock-curation mode so you can test all features without interruption).*

3. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Upon initialization, the server will output:
   ```text
   =================================================
   🌐 Local Network Access: http://192.168.x.x:3000
   🚀 Server is running at: http://localhost:3000
   =================================================
   ```

4. **Accessing the App in Browsers:**
   - Open Ubuntu's pre-installed browser (e.g., Firefox) and direct it to `http://localhost:3000`.
   - To access the app from your Windows host, type the VMware local network IP (e.g., `http://192.168.x.x:3000`) shown on your terminal.

---

## 🛠️ Mentor Debugging Log (Senior Mentor Insights)

### 1. Python Scraper `class` SyntaxError
* **Symptom:** `SyntaxError: invalid syntax` pointed at `repo_articles = soup.find_all("article", class="Box-row")`.
* **Reasoning:** In Python, `class` is a reserved keyword for declaring classes. BeautifulSoup circumvents this naming conflict by requiring `class_` (with an underscore) or utilizing an attribute dictionary `attrs={"class": "Box-row"}`.
* **Resolved Code:** `repo_articles = soup.find_all("article", class_="Box-row")`.

### 2. Node.js ES Modules `require is not defined`
* **Symptom:** Starting `npm run dev` threw `ReferenceError: require is not defined` from `require("os")`.
* **Reasoning:** Because `"type": "module"` is configured in `package.json`, our Node backend runs using standard **ES Modules (ESM)**. CJS global features like `require` are not available under ESM.
* **Resolved Code:** Implemented ESM-compliant `import os from "os";` imports and utilized `os.networkInterfaces()`.

---

## 📚 Homework & Advanced Explorations

Now that you've successfully got the application up and running, here are several challenges from your mentor to level up your engineering skills:
1. **Combine Python Pipeline with Express API:** Write an automated cron-job or script to periodically save crawled JSON datasets into `database.json`, keeping your dashboard updated on autopilot.
2. **Migrate JSON File Database to SQL:** Transition your Express/FastAPI schema to SQLite using Sequelize, Drizzle ORM, or SQLAlchemy.

*Feel free to ping me whenever you hit a roadblock. Happy Coding!* 🚀
