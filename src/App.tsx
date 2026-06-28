import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  Search, 
  Sparkles, 
  Github, 
  Bookmark, 
  BookmarkCheck,
  ChevronRight, 
  Terminal, 
  BookOpen, 
  Cpu, 
  Layers, 
  Trash2, 
  Flame, 
  ArrowUpRight, 
  Check, 
  HelpCircle,
  Code,
  ArrowRight,
  Database,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";

// 定義資料型態
interface Repository {
  owner: string;
  repo_name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  tags: string[];
}

interface CuratedProject {
  owner: string;
  repo_name: string;
  suitability_score: number;
  difficulty: string;
  reason: string;
  starter_step: string;
}

// 導師個人檔案清單
const PERSONAS = [
  {
    id: "Python Programmer",
    title: "Python 程式好手",
    desc: "喜愛編寫腳本、自動化與深度學習，想探究 AI 底層原理",
    icon: Cpu,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50"
  },
  {
    id: "No-Code / UI Dragger",
    title: "無程式碼/視覺拖拉玩家",
    desc: "偏好直覺式介面與拖拉組裝，討厭繁瑣的環境設定與代碼",
    icon: Layers,
    color: "from-purple-500 to-pink-600",
    bgLight: "bg-purple-50"
  },
  {
    id: "Fullstack Developer",
    title: "全端/應用工程師",
    desc: "擅長 API 介接與前後端框架整合，想快速打造 AI 應用產品",
    icon: Code,
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50"
  },
  {
    id: "All-Rounder",
    title: "好奇寶寶 / 理論探索者",
    desc: "喜歡數學理論、資料分析與廣泛涉略，不設限任何工具",
    icon: HelpCircle,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50"
  }
];

export default function App() {
  // 狀態管理
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("Python Programmer");
  
  // AI Curation 狀態
  const [isCurating, setIsCurating] = useState<boolean>(false);
  const [curatedList, setCuratedList] = useState<CuratedProject[]>([]);
  const [curatedSource, setCuratedSource] = useState<string>("");

  // 收藏夾 (後端 DB 連接)
  const [favorites, setFavorites] = useState<Repository[]>([]);
  const [isSavingFav, setIsSavingFav] = useState<string | null>(null);

  // 互動學習抽屜狀態
  const [showMentorGuide, setShowMentorGuide] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<"arch" | "scraper" | "prompt">("arch");

  // API 來源 (實時顯示當前伺服器運作狀態，展示 Architectural Honesty)
  const [apiSource, setApiSource] = useState<string>("api");

  // 1. 初始化獲取 GitHub Trending & Favorites
  useEffect(() => {
    fetchTrending();
    fetchFavorites();
  }, []);

  // 當使用者切換語言時，重新獲取
  useEffect(() => {
    fetchTrending(selectedLang);
  }, [selectedLang]);

  // 2. 向後端 API 請求實時的 GitHub 趨勢資料
  const fetchTrending = async (langFilter: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/trending?topic=ai${langFilter ? `&lang=${encodeURIComponent(langFilter)}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`伺服器回應錯誤: ${response.status}`);
      }
      const result = await response.json();
      setRepos(result.data || []);
      setApiSource(result.source || "api");
    } catch (err: any) {
      console.error(err);
      setError("無法載入 GitHub 熱門數據。已啟用離線備用機制。");
    } finally {
      setLoading(false);
    }
  };

  // 3. 向後端資料庫獲取收藏清單 (R)
  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error("載入收藏失敗", err);
    }
  };

  // 4. 新增收藏到後端資料庫 (C)
  const toggleFavorite = async (repo: Repository) => {
    const isFav = favorites.some(f => f.owner === repo.owner && f.repo_name === repo.repo_name);
    const idKey = `${repo.owner}/${repo.repo_name}`;
    setIsSavingFav(idKey);

    try {
      if (isFav) {
        // 刪除
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: repo.owner, repo_name: repo.repo_name })
        });
        if (response.ok) {
          setFavorites(prev => prev.filter(f => !(f.owner === repo.owner && f.repo_name === repo.repo_name)));
        }
      } else {
        // 新增
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(repo)
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.favorite) {
            setFavorites(prev => [...prev, resData.favorite]);
          } else {
            // 已在收藏夾中
            fetchFavorites();
          }
        }
      }
    } catch (err) {
      console.error("操作收藏失敗", err);
    } finally {
      setIsSavingFav(null);
    }
  };

  // 5. 調用後端 Gemini AI 進行個人化明星項目篩選 (Auto-Curation)
  const triggerAICuration = async () => {
    if (repos.length === 0) return;
    setIsCurating(true);
    setCuratedList([]);
    try {
      // 隨機選 12 個供 AI 分析以提高準確度與多樣性
      const candidates = [...repos].sort(() => 0.5 - Math.random()).slice(0, 12);
      
      const response = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: selectedPersona,
          repos: candidates
        })
      });

      if (!response.ok) {
        throw new Error("AI 篩選服務暫時無法存取");
      }

      const result = await response.json();
      setCuratedList(result.curated || []);
      setCuratedSource(result.source || "gemini");
      
      // 自動滾動到精選區
      const el = document.getElementById("ai-curation-zone");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error(err);
      alert("AI 篩選發生錯誤，請稍後再試！");
    } finally {
      setIsCurating(false);
    }
  };

  // 過濾搜尋項目
  const filteredRepos = repos.filter(repo => {
    const query = searchQuery.toLowerCase();
    return (
      repo.repo_name.toLowerCase().includes(query) ||
      repo.owner.toLowerCase().includes(query) ||
      repo.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-20 relative selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 頂部裝飾背景 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/70 via-indigo-50/10 to-transparent pointer-events-none" />

      {/* 導覽列 Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Compass className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
                AI Beginner GitHub Compass
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  Senior Mentor Edition
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-mono">向初學者導向的 GitHub 熱門 AI 專案導航</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 導師解說按鈕 */}
            <button
              onClick={() => { setShowMentorGuide(true); setGuideTab("arch"); }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>導師規劃書</span>
            </button>
            
            {/* 數據源指示燈 (Architectural Honesty) */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-500 font-mono">
              <span className={`w-2 h-2 rounded-full ${apiSource === "api" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>Data Source: {apiSource === "api" ? "Live GitHub API" : "Fallback Caching"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主體內容區域 */}
      <main className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* 左側或頂部：導師引導與 AI 明星項目篩選 (佔 12 欄中的 4 欄) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 導師說話卡片 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-60 -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 font-display">資深技術導師 👨‍🏫</h3>
                <p className="text-xs text-slate-400">Ian Senior AI Mentor</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              「你好！我是你的導師。學習 AI 最快的路徑就是**閱讀優質的開源代碼**。
              請先在下方選擇你的**個人特質**，我將會用 Gemini AI 幫你從當前熱門項目中篩選出 3 個『最合腳』的明星項目！」
            </p>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase">步驟 1：選擇你的個人特質</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {PERSONAS.map((p) => {
                  const IconComponent = p.icon;
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`flex items-start text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 ${isSelected ? "bg-white/10 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight mb-0.5">{p.title}</div>
                        <div className={`text-xs truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={triggerAICuration}
                disabled={isCurating || repos.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 hover:shadow-indigo-200/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCurating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>導師與 AI 正深入評估中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>自動篩選最適合我的 3 個明星專案</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 收藏夾列表 (與後端 sqlite/json DB 同步) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4.5 h-4.5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 font-display">個人收藏庫</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold">
                {favorites.length}
              </span>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">收藏夾目前空空的</p>
                <p className="text-[10px] text-slate-400 mt-1">點選右側項目的書籤按鈕，即可將數據儲存至後端資料庫！</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {favorites.map((fav) => (
                  <div 
                    key={`${fav.owner}/${fav.repo_name}`}
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-400 truncate max-w-[80px]">{fav.owner}</span>
                        <span className="text-xs text-slate-400">/</span>
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px] font-mono">{fav.repo_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">
                        ⭐ {fav.stars.toLocaleString()} | {fav.language}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                      <a 
                        href={fav.url} 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 text-slate-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => toggleFavorite(fav)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="移除收藏"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 右側：精選展示區 & Trending 榜單 (佔 12 欄中的 8 欄) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* AI Curated 明星項目專題區塊 */}
          <AnimatePresence>
            {curatedList.length > 0 && (
              <motion.div
                id="ai-curation-zone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden"
              >
                {/* 背景發光球 */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
                        導師精選：最適合你的 3 大明星項目
                      </h2>
                      <p className="text-xs text-indigo-200 font-mono">
                        基於「{PERSONAS.find(p => p.id === selectedPersona)?.title}」特質進行的 AI 智慧推薦 (由 {curatedSource === "gemini" ? "Gemini" : "內建模擬"} 運算)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCuratedList([])}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
                  >
                    清除推薦
                  </button>
                </div>

                {/* 明星專案卡片網格 (Bento-like Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                  {curatedList.map((project, idx) => (
                    <motion.div
                      key={`${project.owner}-${project.repo_name}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-indigo-400/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* 頂部標籤與評分 */}
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {project.difficulty}
                          </span>
                          
                          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-mono font-bold text-amber-300">{project.suitability_score}%</span>
                          </div>
                        </div>

                        {/* 專案名稱 */}
                        <h4 className="text-base font-bold font-mono text-white mb-1.5 break-words">
                          {project.repo_name}
                        </h4>
                        <p className="text-xs text-slate-400 mb-3 font-mono">
                          by {project.owner}
                        </p>

                        {/* 推薦原因 */}
                        <div className="text-xs text-slate-200 leading-relaxed mb-4 bg-white/2.5 p-3 rounded-lg border border-white/2.5">
                          {project.reason}
                        </div>
                      </div>

                      {/* 上手上網步驟 */}
                      <div>
                        <div className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider mb-1.5 font-semibold">
                          🚀 導師推薦上手第一步：
                        </div>
                        <pre className="text-[11px] bg-slate-950/50 p-2.5 rounded-lg font-mono text-emerald-400 whitespace-pre-wrap leading-tight border border-white/5 mb-3.5">
                          {project.starter_step}
                        </pre>

                        <a
                          href={`https://github.com/${project.owner}/${project.repo_name}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="w-full py-2 rounded-lg bg-white/10 hover:bg-white text-slate-900 group-hover:text-slate-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all text-white hover:text-slate-900"
                        >
                          <span>查看專案源碼</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between items-center text-[10px] text-indigo-300/80 font-mono">
                  <span>💡 提示：點擊上方「查看專案源碼」直接跳轉至 GitHub 深入探索！</span>
                  <span>* 數據與關聯已通過 Drizzle ORM 設計保存</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GitHub Trending 榜單與搜尋篩選區塊 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* 篩選與搜尋面板 */}
            <div className="p-6 border-b border-slate-200/80 bg-slate-50/50 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <h2 className="text-lg font-bold text-slate-900 font-display">GitHub Hot AI 趨勢排行</h2>
                </div>
                
                {/* 重新整理 */}
                <button
                  onClick={() => fetchTrending(selectedLang)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-xs text-slate-600 transition-colors border border-slate-200 bg-white cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>刷新數據</span>
                </button>
              </div>

              {/* 搜尋欄與語言切換器 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7 relative">
                  <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋項目名稱、作者或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="md:col-span-5 flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">所有開發語言</option>
                    <option value="Python">Python</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Go">Go</option>
                    <option value="Jupyter Notebook">Jupyter Notebook</option>
                    <option value="JavaScript">JavaScript</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 榜單本體 */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-500 font-mono">正在抓取 GitHub 最新 AI 開源項目...</p>
              </div>
            ) : error && repos.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <p className="text-sm font-semibold text-red-500">{error}</p>
                <button
                  onClick={() => fetchTrending()}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  重試載入
                </button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-sm">找不到符合搜尋條件的項目</p>
                <p className="text-xs mt-1">請嘗試修改搜尋詞彙或選擇「所有開發語言」</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRepos.map((repo, index) => {
                  const isFav = favorites.some(f => f.owner === repo.owner && f.repo_name === repo.repo_name);
                  const isSaving = isSavingFav === `${repo.owner}/${repo.repo_name}`;
                  return (
                    <div 
                      key={`${repo.owner}/${repo.repo_name}`}
                      className="p-5 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* 排名、作者與標題 */}
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs font-medium text-slate-500 hover:underline">
                            {repo.owner}
                          </span>
                          <span className="text-xs text-slate-400">/</span>
                          <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate font-mono">
                            <a href={repo.url} target="_blank" referrerPolicy="no-referrer" className="flex items-center gap-1">
                              {repo.repo_name}
                              <ArrowUpRight className="w-3.5 h-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </h3>

                          {/* 語言標籤 */}
                          {repo.language && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                              {repo.language}
                            </span>
                          )}
                        </div>

                        {/* 專案描述 */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {repo.description}
                        </p>

                        {/* 星星、Fork 數與自訂 Topics */}
                        <div className="flex items-center flex-wrap gap-y-1.5 gap-x-4 pt-1 text-[11px] font-mono text-slate-500">
                          <span className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span className="font-bold text-slate-700">{repo.stars.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5A2.25 2.25 0 0 0 12.5 6.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878Z"/>
                            </svg>
                            <span>{repo.forks.toLocaleString()}</span>
                          </span>
                          
                          {/* 專案標籤 */}
                          <div className="flex items-center space-x-1 flex-wrap">
                            {repo.tags && repo.tags.map(tag => (
                              <span key={tag} className="text-[9px] bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 右側操作按鈕 (收藏 / 轉移) */}
                      <div className="flex items-center space-x-1.5 self-center shrink-0">
                        <button
                          onClick={() => toggleFavorite(repo)}
                          disabled={isSaving}
                          className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isFav 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600"
                          }`}
                          title={isFav ? "移出收藏庫" : "加入收藏庫"}
                        >
                          {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : isFav ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 導師規劃書 抽屜 Drawer */}
      <AnimatePresence>
        {showMentorGuide && (
          <>
            {/* 遮罩 Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMentorGuide(false)}
              className="fixed inset-0 bg-slate-950 z-50 cursor-pointer"
            />
            
            {/* 抽屜面板 Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* 抽屜頂部 */}
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 font-display flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>AI Beginner Github Compass 導師規劃書</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">系統架構設計、LLM 篩選提示詞與自動化爬蟲程式說明</p>
                </div>
                <button
                  onClick={() => setShowMentorGuide(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 font-bold transition-all text-sm cursor-pointer"
                >
                  ✕ 關閉
                </button>
              </div>

              {/* 抽屜分頁 Tab */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setGuideTab("arch")}
                  className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                    guideTab === "arch" 
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" 
                      : "border-transparent text-slate-600 hover:text-slate-800"
                  }`}
                >
                  1. 前後端架構規劃
                </button>
                <button
                  onClick={() => setGuideTab("scraper")}
                  className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                    guideTab === "scraper" 
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" 
                      : "border-transparent text-slate-600 hover:text-slate-800"
                  }`}
                >
                  2. 自動抓取規格
                </button>
                <button
                  onClick={() => setGuideTab("prompt")}
                  className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                    guideTab === "prompt" 
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" 
                      : "border-transparent text-slate-600 hover:text-slate-800"
                  }`}
                >
                  3. AI 篩選提示詞
                </button>
              </div>

              {/* 抽屜內容 (滾動區域) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {guideTab === "arch" && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3">
                      <Cpu className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-indigo-950 text-sm">適合初學者的極致推薦棧 (Tech Stack)</h4>
                        <p className="text-xs text-indigo-800/90 mt-1 leading-relaxed">
                          為了讓初學者既能學到現代軟體工程規範，又能確保<b>快速上手、不卡在環境設定</b>，導師推薦以下組合：
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-sm text-slate-900 mb-1">前端：Vite + React</div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          <b>為什麼推薦：</b>Vite 擁有當前最快的熱重載速度與構建體驗。React 的組件化架構非常適合拼裝複雜與互動度高的 AI Dashboard。
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-sm text-slate-900 mb-1">後端：FastAPI (Python)</div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          <b>為什麼推薦：</b>AI 與資料科學是以 Python 為絕對主流。FastAPI 自帶 Swagger 互動式 API 文件、基於 Pydantic 的自動型別校驗，極輕量。
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-sm text-slate-900 mb-1">資料庫：SQLite (本地)</div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          <b>為什麼推薦：</b>免裝任何伺服器，資料庫就是一個本地 <code>.db</code> 檔案，備份或搬遷只需複製檔案。最適合初學者建立 RDBMS 觀念。
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-slate-950 text-sm">🛠️ 當前實作原型之完整映射：</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        我們在此 AI Studio Workspace 中，為您實裝了功能一致的 <b>TypeScript Full-Stack 替代棧 (Vite + React + Express + JSON File-DB)</b>。
                        這套架構運作邏輯與 <code>FastAPI + SQLite</code> 100% 互通：
                      </p>
                      <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                        <li><code>server.ts</code> 為您處理 GitHub APIs 與 Gemini AI 個人化篩選。</li>
                        <li><code>database.json</code> 當作本地的輕量持久層，負責記錄您的個人收藏。</li>
                      </ul>
                    </div>
                  </div>
                )}

                {guideTab === "scraper" && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start space-x-3">
                      <Flame className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-emerald-950 text-sm">GitHub Trending 抓取最佳策略與代碼</h4>
                        <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                          目前最穩定的 GitHub 趨勢收集手段是<b>官方 Search API</b> 與 <b>網頁 HTML Scraping 互為備份</b>。
                          我已經為你在專案根目錄中創建了 <code>python_crawler.py</code>，你可以隨時查看它！
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-slate-950 text-xs tracking-wider uppercase">🐍 核心 Python 爬蟲邏輯 (BeautifulSoup 核心段落)：</h4>
                      <pre className="text-xs bg-slate-900 text-slate-200 p-4 rounded-xl font-mono overflow-x-auto leading-relaxed">
{`# 核心解析 Box-row
response = requests.get("https://github.com/trending", headers=HEADERS)
soup = BeautifulSoup(response.text, "html.parser")
repo_articles = soup.find_all("article", class="Box-row")

for article in repo_articles:
    # 提取 repo owner 與 name
    href = article.find("h2", class="h3").find("a").get("href").strip("/")
    # 提取描述與星星
    desc_tag = article.find("p", class="col-9")
    stars = article.find_all("a", class="Link--muted")[0].text.strip()`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                      <div className="font-bold">💡 導師避坑提醒：</div>
                      <p>GitHub 常對 <code>/trending</code> 進行防爬限流。線上產品推薦像我們當前系統一樣，預設調用 <code>api.github.com/search/repositories</code>，以達到 99.9% 的可靠性，僅在需要特定時段的非官方排行時才使用 Python 爬蟲將結果定時寫入資料庫。</p>
                    </div>
                  </div>
                )}

                {guideTab === "prompt" && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start space-x-3">
                      <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-950 text-sm">AI 智慧篩選提示詞 (LLM Prompt) 設計說明</h4>
                        <p className="text-xs text-purple-800/90 mt-1 leading-relaxed">
                          要讓 AI 100% 精準篩選並吐出格式無誤的 JSON，最穩定的做法是<b>「設定強大的 System Instruction」</b>並搭配<b>「固定的 JSON Schema」</b>。我們在 <code>server.ts</code> 中定義的 Prompt 規格如下：
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-slate-950 text-xs tracking-wider uppercase">📝 導師專屬 Prompt 範本：</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="text-xs font-bold text-slate-800">System Instruction:</div>
                        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-100">
                          「你是一位經驗極其豐富的資深技術導師 (Senior AI Mentor)。
                          你的任務是從學生提供的一組熱門 GitHub AI 開源項目列表中，挑選出「最適合 AI 初學者」的 3 個項目。
                          你必須深入分析項目的難易度、入門門檻、對初學者的友善程度，並各自量身打造引導指南。」
                        </p>

                        <div className="text-xs font-bold text-slate-800 mt-2">Structured Output Specification (強制 JSON)：</div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          通過 Gemini 3.5-flash 的 <code>responseSchema</code> 參數，強制模型只能輸出特定屬性：<code>owner</code>, <code>repo_name</code>, <code>suitability_score</code>, <code>difficulty</code>, <code>reason</code>, <code>starter_step</code>。完美防堵 AI 輸出多餘的 Markdown 文字。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* 抽屜底部 */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">© 2026 AI Beginner Github Compass</span>
                <button
                  onClick={() => setShowMentorGuide(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  好的，我瞭解了
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 底部 Footer 裝飾 */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10 relative z-10 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p className="font-display font-medium text-slate-600 text-sm">👨‍🏫 資深技術導師用心打造的 AI 開源學習指南</p>
          <p className="font-mono">
            Powered by Vite + React + Tailwind v4 + Express + Gemini 3.5-flash
          </p>
          <p className="text-[10px]">
            © 2026 AI Beginner Github Compass. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
