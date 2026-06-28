import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// 初始化 Gemini API 客戶端
// 使用 aistudio-build 的 User-Agent 以進行遙測
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ 未設定 GEMINI_API_KEY 環境變數。AI 篩選功能將提供優質的靜態模擬回應。");
}

// 數據儲存路徑 (模擬 SQLite 數據庫，使用 JSON 檔案儲存以確保免依賴且具持久性)
const DB_FILE = path.join(process.cwd(), "database.json");

// 初始化數據庫
interface DatabaseSchema {
  favorites: any[];
  curations: any[];
}

function initDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: DatabaseSchema = {
      favorites: [],
      curations: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("讀取資料庫失敗，重新初始化：", err);
    return { favorites: [], curations: [] };
  }
}

function saveDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("寫入資料庫失敗：", err);
  }
}

// 靜態熱門 AI 項目備用數據 (當 GitHub API 達到限制或離線時使用)
const FALLBACK_REPOS = [
  {
    owner: "ollama",
    repo_name: "ollama",
    url: "https://github.com/ollama/ollama",
    description: "Get up and running with large language models locally. Run Llama 3, Mistral, Gemma, and other models in your machine.",
    language: "Go",
    stars: 94200,
    forks: 7500,
    tags: ["LLM", "Local Run", "Tooling"]
  },
  {
    owner: "langchain-ai",
    repo_name: "langchain",
    url: "https://github.com/langchain-ai/langchain",
    description: "🦜🔗 Build context-aware reasoning applications. A robust framework to build LLM-powered agents and workflows.",
    language: "Python",
    stars: 87500,
    forks: 13200,
    tags: ["Agents", "Framework", "Python"]
  },
  {
    owner: "Significant-Gravitas",
    repo_name: "AutoGPT",
    url: "https://github.com/Significant-Gravitas/AutoGPT",
    description: "AutoGPT is the vision of power-user, multi-agent AI systems, designed to automate complex, multi-step tasks autonomously.",
    language: "Python",
    stars: 165000,
    forks: 41000,
    tags: ["Agents", "Automation", "Autonomous"]
  },
  {
    owner: "microsoft",
    repo_name: "autogen",
    url: "https://github.com/microsoft/autogen",
    description: "A programming framework for agentic AI. AutoGen enables multiple agents to converse, cooperate and solve tasks together.",
    language: "Python",
    stars: 32000,
    forks: 4800,
    tags: ["Agents", "Multi-Agent", "Microsoft"]
  },
  {
    owner: "huggingface",
    repo_name: "transformers",
    url: "https://github.com/huggingface/transformers",
    description: "🤗 Transformers: State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.",
    language: "Python",
    stars: 132000,
    forks: 26000,
    tags: ["Deep Learning", "Models", "HuggingFace"]
  },
  {
    owner: "cpacker",
    repo_name: "MemGPT",
    url: "https://github.com/cpacker/MemGPT",
    description: "Memory-QA: Teaching LLMs to manage their own memory for unbounded context and persistent agent sessions.",
    language: "Python",
    stars: 11800,
    forks: 1400,
    tags: ["Memory", "Agents", "Advanced"]
  },
  {
    owner: "shishirpatil",
    repo_name: "gorilla",
    url: "https://github.com/shishirpatil/gorilla",
    description: "Gorilla: Large Language Model Connected with Massive APIs. Enables fine-tuned LLMs to call 1600+ APIs.",
    language: "Python",
    stars: 10400,
    forks: 1100,
    tags: ["API Call", "Fine-tuning", "Tool-Use"]
  },
  {
    owner: "milvus-io",
    repo_name: "milvus",
    url: "https://github.com/milvus-io/milvus",
    description: "A highly-scalable, fast and reliable vector database built for GenAI, retrieval and similarity search workloads.",
    language: "Go",
    stars: 29500,
    forks: 4200,
    tags: ["Vector DB", "RAG", "Data Storage"]
  },
  {
    owner: "FlowiseAI",
    repo_name: "Flowise",
    url: "https://github.com/FlowiseAI/Flowise",
    description: "Drag & drop UI to build your customized LLM flow using Langchain, Llamaindex and multiple components.",
    language: "TypeScript",
    stars: 28400,
    forks: 4500,
    tags: ["No-Code", "UI Drag-Drop", "TypeScript"]
  },
  {
    owner: "chatchat-space",
    repo_name: "Langchain-Chatchat",
    url: "https://github.com/chatchat-space/Langchain-Chatchat",
    description: "Langchain-Chatchat (formerly langchain-ChatGLM) - Local knowledge based LLM QA application focus on Chinese.",
    language: "Python",
    stars: 31200,
    forks: 5600,
    tags: ["RAG", "Chinese Focus", "Local Run"]
  },
  {
    owner: "lmstudio-ai",
    repo_name: "lms",
    url: "https://github.com/lmstudio-ai/lms",
    description: "CLI and developer tools for LM Studio. Run any open-source LLM locally on your computer with a single command.",
    language: "TypeScript",
    stars: 8400,
    forks: 520,
    tags: ["Local Run", "CLI", "Tooling"]
  }
];

// GitHub API 快取 (避免過度存取觸發 Rate Limit)
let apiCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘

// ================= API Endpoints =================

// 1. 獲取 GitHub 熱門 AI 開源項目
app.get("/api/trending", async (req, res) => {
  const { topic = "ai", lang = "" } = req.query;

  // 如果有快取且未過期，直接回傳快取
  if (apiCache && (Date.now() - apiCache.timestamp < CACHE_DURATION) && !lang) {
    return res.json({ source: "cache", data: apiCache.data });
  }

  try {
    const query = `topic:${topic}` + (lang ? ` language:${lang}` : "");
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;
    
    console.log(`[GitHub API] 正在抓取: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AI-Beginner-Github-Compass"
      },
      signal: AbortSignal.timeout(6000) // 6 秒超時
    });

    if (!response.ok) {
      throw new Error(`GitHub API 回傳非 200 狀態: ${response.status}`);
    }

    const json = await response.json();
    const items = json.items || [];
    
    const mapped = items.map((item: any, idx: number) => ({
      owner: item.owner?.login || "unknown",
      repo_name: item.name || "unknown",
      url: item.html_url || "",
      description: item.description || "No description provided.",
      language: item.language || "Python",
      stars: item.stargazers_count || 0,
      forks: item.forks_count || 0,
      tags: item.topics ? item.topics.slice(0, 3) : ["AI"]
    }));

    if (mapped.length > 0) {
      if (!lang) {
        apiCache = { data: mapped, timestamp: Date.now() };
      }
      return res.json({ source: "api", data: mapped });
    } else {
      throw new Error("GitHub 回傳空列表");
    }
  } catch (error: any) {
    console.error("⚠️ 無法獲取 live GitHub 項目，改為回傳內建優質備用數據：", error.message);
    
    // 根據程式語言進行本地端過濾
    let filteredFallback = FALLBACK_REPOS;
    if (lang) {
      filteredFallback = FALLBACK_REPOS.filter(
        repo => repo.language.toLowerCase() === (lang as string).toLowerCase()
      );
    }
    
    return res.json({
      source: "fallback",
      message: `由於 GitHub 頻率限制，已自動加載備份。錯誤詳情: ${error.message}`,
      data: filteredFallback
    });
  }
});

// 2. 透過 AI 自動分析與挑選最適合 AI 初學者的三個明星項目
// 這邊實作了導師在 Task 3 中所設計的 LLM Prompt (提示詞) 與結構化輸出 (JSON Schema)
app.post("/api/curate", async (req, res) => {
  const { userProfile = "All-Rounder", repos = [] } = req.body;

  if (!repos || repos.length === 0) {
    return res.status(400).json({ error: "請提供可供 AI 篩選的項目列表" });
  }

  // 如果沒有設定 Gemini API Key，回傳優質的模擬 curation
  if (!ai) {
    console.log("[Mock Curate] 使用模擬 AI 篩選...");
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 依據不同 profile 回傳不同精選
    let selectedMock = [];
    if (userProfile === "Python Programmer") {
      selectedMock = [FALLBACK_REPOS[1], FALLBACK_REPOS[4], FALLBACK_REPOS[9]]; // langchain, transformers, langchain-chatchat
    } else if (userProfile === "No-Code / UI Dragger") {
      selectedMock = [FALLBACK_REPOS[8], FALLBACK_REPOS[0], FALLBACK_REPOS[10]]; // Flowise, ollama, lmstudio
    } else {
      selectedMock = [FALLBACK_REPOS[0], FALLBACK_REPOS[1], FALLBACK_REPOS[8]]; // ollama, langchain, Flowise
    }

    const mockCurated = selectedMock.map((repo, i) => ({
      repo_name: repo.repo_name,
      owner: repo.owner,
      suitability_score: 95 - i * 4,
      reason: `【導師推薦】針對您的個人特質：『${userProfile}』。${repo.repo_name} 的架構簡單明瞭，且開箱即用。非常適合您跨入 AI 領域。`,
      starter_step: `1. 複製該項目：git clone ${repo.url}\n2. 閱讀 README 內的 Quick Start，執行本地安裝。\n3. 嘗試跑通第一個範例。`,
      difficulty: i === 0 ? "Entry-Level (簡單)" : "Intermediate (中等)"
    }));

    return res.json({ source: "mock", curated: mockCurated });
  }

  try {
    // 準備給 LLM 分析的 repo 資料
    const repoListString = repos.map((r: any, idx: number) => {
      return `[項目 #${idx+1}]
名稱: ${r.owner}/${r.repo_name}
網址: ${r.url}
語言: ${r.language}
星星數: ${r.stars}
描述: ${r.description}
標籤: ${r.tags ? r.tags.join(", ") : "None"}`;
    }).join("\n\n");

    const systemInstruction = `你是一位親切、幽默且經驗極其豐富的資深技術導師 (Senior AI Mentor)。
你的任務是從學生提供的一組熱門 GitHub AI 開源項目列表中，挑選出「最適合 AI 初學者」的 3 個項目。
你必須深入分析項目的難易度、入門門檻、對初學者的友善程度，並為這 3 個明星項目各自量身打造一份極致實用的初學者引導指南。`;

    const userPrompt = `
親愛的導師，我是一位 AI 初學者。
我的個人特質 / 背景是：【${userProfile}】

以下是當前最新抓取到的 GitHub 熱門項目列表：
---------------------------------------------
${repoListString}
---------------------------------------------

請從中自動幫我篩選出最適合我的 3 個明星項目。
請務必嚴格按照以下要求的 JSON Schema 回傳結構化資料，不要回傳任何額外的 Markdown 文字或對話：

要求的 JSON 結構格式為：
[
  {
    "owner": "項目擁有者",
    "repo_name": "項目名稱",
    "suitability_score": 85, // 0-100 的初學者適合度評分
    "difficulty": "Entry-Level (簡單) 或 Intermediate (中等) 或 Advanced (進階)",
    "reason": "針對該學生的個人特質與背景，詳細說明為什麼這個項目非常適合他入門。請用繁體中文，語氣親切專業。",
    "starter_step": "給初學者的第一步具體行動指南。例如：下載 LM Studio、註冊 API、或跑通哪個特定 sample。請條列式繁體中文。"
  },
  ... (總共剛好 3 個項目)
]
`;

    console.log(`[Gemini API] 正在進行 AI 自動篩選，對象特質: ${userProfile}`);

    // 調用 Gemini API，使用推薦的 gemini-3.5-flash 模型，並強制設定 responseSchema 確保 JSON 解析 100% 成功！
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "精選出的 3 個最適合初學者的項目",
          items: {
            type: Type.OBJECT,
            properties: {
              owner: { type: Type.STRING, description: "項目擁有者" },
              repo_name: { type: Type.STRING, description: "項目名稱" },
              suitability_score: { type: Type.INTEGER, description: "初學者適合度評分 (0-100)" },
              difficulty: { type: Type.STRING, description: "難易度標籤，例如 Entry-Level (簡單)" },
              reason: { type: Type.STRING, description: "為該特質背景量身打造的推薦理由（繁體中文）" },
              starter_step: { type: Type.STRING, description: "給初學者的具體第一步上手指南（繁體中文，條列式）" }
            },
            required: ["owner", "repo_name", "suitability_score", "difficulty", "reason", "starter_step"]
          }
        }
      }
    });

    const resultText = response.text || "[]";
    const curatedList = JSON.parse(resultText);

    // 儲存此次篩選紀錄到資料庫 (SQLite/JSON 模擬)
    const db = initDB();
    db.curations.push({
      timestamp: new Date().toISOString(),
      userProfile,
      curated: curatedList
    });
    // 只保留最近 10 次的 curation 紀錄
    if (db.curations.length > 10) {
      db.curations.shift();
    }
    saveDB(db);

    return res.json({ source: "gemini", curated: curatedList });

  } catch (error: any) {
    console.error("Gemini API 篩選發生錯誤: ", error);
    return res.status(500).json({ error: `AI 篩選失敗: ${error.message}` });
  }
});

// 3. 獲取收藏夾列表 (Read)
app.get("/api/favorites", (req, res) => {
  const db = initDB();
  return res.json(db.favorites);
});

// 4. 新增收藏項目 (Create)
app.post("/api/favorites", (req, res) => {
  const repo = req.body;
  if (!repo || !repo.repo_name || !repo.owner) {
    return res.status(400).json({ error: "無效的項目格式" });
  }

  const db = initDB();
  // 檢查是否已存在
  const exists = db.favorites.some(
    f => f.owner === repo.owner && f.repo_name === repo.repo_name
  );

  if (!exists) {
    const newFav = {
      ...repo,
      bookmarked_at: new Date().toISOString()
    };
    db.favorites.push(newFav);
    saveDB(db);
    return res.json({ success: true, favorite: newFav });
  }

  return res.json({ success: true, message: "項目已在收藏夾中" });
});

// 5. 刪除收藏項目 (Delete)
app.delete("/api/favorites", (req, res) => {
  const { owner, repo_name } = req.body;
  if (!owner || !repo_name) {
    return res.status(400).json({ error: "請提供項目擁有者與名稱" });
  }

  const db = initDB();
  const initialLength = db.favorites.length;
  db.favorites = db.favorites.filter(
    f => !(f.owner === owner && f.repo_name === repo_name)
  );

  if (db.favorites.length < initialLength) {
    saveDB(db);
    return res.json({ success: true, message: "已成功從收藏夾移除" });
  }
  return res.status(404).json({ error: "找不到該收藏項目" });
});

// ================= Vite Middleware & Setup =================

async function startServer() {
  // 開發模式：使用 Vite 處理
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // 生產模式：靜態檔案服務
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=================================================`);
    printLocalIPs();
    console.log(`🚀 伺服器已啟動於：http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}

function printLocalIPs() {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`🌐 區域網路存取：http://${net.address}:${PORT}`);
      }
    }
  }
}

startServer();
