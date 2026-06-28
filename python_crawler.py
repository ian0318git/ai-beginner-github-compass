#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Senior Mentor Code: GitHub Trending Scraper (Python)
--------------------------------------------------
這是一個專為 AI 初學者設計的高效、乾淨、且附帶完整註解的 Python 爬蟲與 API 獲取程式。
它支援兩種模式：
1. 實體網頁爬取：使用 requests + BeautifulSoup 抓取 github.com/trending 頁面。
2. 官方 API 獲取：使用 GitHub Search API 獲取當前最熱門/趨勢中的 AI 開源項目（更穩定，不易因 GitHub 頁面結構改變而失效）。

使用前，請確保已安裝依賴：
pip install requests beautifulsoup4
"""

import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional

# 設定請求標頭，模擬真實瀏覽器，避免被 GitHub 阻擋 (Rate Limit 或 403 Forbidden)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
}


def scrape_github_trending(language: Optional[str] = None, spoken_language_code: Optional[str] = None) -> List[Dict]:
    """
    方法一：網頁爬蟲 (Web Scraper)
    爬取 GitHub Trending 官方網頁。
    
    :param language: 程式語言篩選，例如 'python', 'typescript', 'go' (不分大小寫)
    :param spoken_language_code: 口語語言代碼，例如 'zh' 代表中文項目
    :return: 包含熱門項目資訊的字典列表
    """
    # 建立 Trending URL
    url = "https://github.com/trending"
    if language:
        url += f"/{language.lower()}"
    
    params = {}
    if spoken_language_code:
        params["spoken_language_code"] = spoken_language_code

    print(f"[Info] 正在爬取網頁：{url} ...", file=sys.stderr)
    
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        # 檢查 HTTP 狀態碼
        if response.status_code != 200:
            print(f"[Error] 無法連接到 GitHub Trending, 狀態碼: {response.status_code}", file=sys.stderr)
            return []
        
        soup = BeautifulSoup(response.text, "html.parser")
        # GitHub Trending 每個項目都放在 <article class="Box-row"> 中
        repo_articles = soup.find_all("article", class_="Box-row")
        
        trending_repos = []
        for index, article in enumerate(repo_articles, start=1):
            repo_info = {}
            
            # 1. 抓取作者與項目名稱
            # 位於 h2 class="h3 lh-condensed" 底下的 <a> 標籤
            title_tag = article.find("h2", class_="h3")
            if not title_tag:
                continue
            a_tag = title_tag.find("a")
            if not a_tag:
                continue
            
            # 提取 href 例如 "/AUTOMATIC1111/stable-diffusion-webui"
            href = a_tag.get("href", "").strip("/")
            parts = href.split("/")
            if len(parts) >= 2:
                repo_info["owner"] = parts[0]
                repo_info["repo_name"] = parts[1]
                repo_info["url"] = f"https://github.com/{href}"
            else:
                continue
            
            # 2. 抓取項目描述 (Description)
            # 位於 <p class="col-9 text-gray my-1 pr-4"> 內
            desc_tag = article.find("p", class_="col-9")
            repo_info["description"] = desc_tag.text.strip() if desc_tag else "No description available."
            
            # 3. 抓取程式語言 (Language)
            # 位於 itemprop="programmingLanguage" 的 <span> 中
            lang_tag = article.find(attrs={"itemprop": "programmingLanguage"})
            repo_info["language"] = lang_tag.text.strip() if lang_tag else "Unknown"
            
            # 4. 抓取總星星數 (Stars) 與 分叉數 (Forks)
            # 尋找帶有特定 SVG 圖標的 <a> 標籤，或者在底部的 div 內尋找
            # 我們可以直接抓取特定 class 或遍歷連結
            meta_links = article.find_all("a", class_="Link--muted")
            
            # 第一個 Link--muted 通常是 Stars，第二個 is Forks
            stars_text = "0"
            forks_text = "0"
            if len(meta_links) >= 1:
                stars_text = meta_links[0].text.strip().replace(",", "")
            if len(meta_links) >= 2:
                forks_text = meta_links[1].text.strip().replace(",", "")
                
            # 將 K (例如 1.2k) 轉換成數字
            def parse_metric(val_str: str) -> int:
                val_str = val_str.lower().replace(" ", "")
                try:
                    if "k" in val_str:
                        return int(float(val_str.replace("k", "")) * 1000)
                    return int(val_str)
                except ValueError:
                    return 0
            
            repo_info["stars"] = parse_metric(stars_text)
            repo_info["forks"] = parse_metric(forks_text)
            
            # 5. 抓取今日新增星星數 (Stars Today)
            # 位於底部帶有 "stars today" 結尾文本的 span
            today_stars_tag = article.find("span", class_="d-inline-block float-sm-right")
            if today_stars_tag:
                # 文字格式通常為 "X stars today" 或 "X stars this week"
                today_text = today_stars_tag.text.strip()
                repo_info["stars_today_text"] = today_text
                # 提取數字
                today_num = "".join(filter(str.isdigit, today_text))
                repo_info["stars_today"] = int(today_num) if today_num else 0
            else:
                repo_info["stars_today_text"] = "0 stars today"
                repo_info["stars_today"] = 0
                
            repo_info["rank"] = index
            trending_repos.append(repo_info)
            
        return trending_repos
        
    except Exception as e:
        print(f"[Error] 爬網過程發生異常: {str(e)}", file=sys.stderr)
        return []


def fetch_github_api_trending(topic: str = "ai", days_ago: int = 30) -> List[Dict]:
    """
    方法二：使用官方 GitHub Search API (極度推薦！)
    獲取最近熱度飆升的開源項目。
    因為網頁爬蟲常因網頁結構修改而失效，正式專案更傾向使用 API 獲取趨勢。
    這裡篩選：最近 days_ago 天內創建，且包含 topic (如 ai, llm) 的熱門項目。
    
    :param topic: 搜尋主題，如 'ai', 'machine-learning', 'llm'
    :param days_ago: 查詢過去幾天內的項目
    :return: 結構化項目列表
    """
    import datetime
    
    # 計算日期，例如 30 天前： "YYYY-MM-DD"
    target_date = (datetime.date.today() - datetime.timedelta(days=days_ago)).isoformat()
    
    # 建構查詢參數：包含指定 topic 且在 target_date 之後創建
    # 範例: q=topic:ai+created:>2023-11-01&sort=stars&order=desc
    query = f"topic:{topic} created:>{target_date}"
    url = f"https://api.github.com/search/repositories"
    
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": 20  # 取前 20 個最熱門的項目
    }
    
    # 增加 API 專用 headers
    api_headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AI-Beginner-Github-Compass"
    }
    
    print(f"[Info] 正在請求 GitHub Search API：{url}?q={query} ...", file=sys.stderr)
    
    try:
        response = requests.get(url, headers=api_headers, params=params, timeout=10)
        if response.status_code != 200:
            print(f"[Error] API 請求失敗，狀態碼: {response.status_code}, 內容: {response.text}", file=sys.stderr)
            return []
            
        data = response.json()
        items = data.get("items", [])
        
        api_repos = []
        for index, item in enumerate(items, start=1):
            repo_info = {
                "rank": index,
                "owner": item.get("owner", {}).get("login"),
                "repo_name": item.get("name"),
                "url": item.get("html_url"),
                "description": item.get("description") or "No description provided.",
                "language": item.get("language") or "Python",
                "stars": item.get("stargazers_count", 0),
                "forks": item.get("forks_count", 0),
                "stars_today_text": f"+{item.get('stargazers_count', 0)} total",
                "stars_today": item.get("stargazers_count", 0)
            }
            api_repos.append(repo_info)
            
        return api_repos
        
    except Exception as e:
        print(f"[Error] API 獲取發生異常: {str(e)}", file=sys.stderr)
        return []


if __name__ == "__main__":
    print("=========================================")
    print(" 導師示範：GitHub 趨勢自動抓取工具 (Python)")
    print("=========================================\n")
    
    # 1. 執行方法一：網頁爬蟲 (抓取 Python 語言的熱門項目)
    print("--- 1. 開始測試網頁爬蟲 (爬取 Python Trending) ---")
    web_results = scrape_github_trending(language="python")[:3]  # 僅顯示前 3 筆
    
    for repo in web_results:
        print(f"排名 #{repo['rank']}: {repo['owner']}/{repo['repo_name']}")
        print(f"  連結: {repo['url']}")
        print(f"  星星: {repo['stars']} ⭐ | Fork: {repo['forks']}")
        print(f"  描述: {repo['description']}")
        print(f"  今日趨勢: {repo['stars_today_text']}")
        print("-" * 50)
        
    # 延遲一下避免頻繁存取
    time.sleep(1)
    
    # 2. 執行方法二：官方 API 獲取 (最近 30 天最熱門的 AI 項目)
    print("\n--- 2. 開始測試 GitHub 官方 Search API (搜尋 AI 主題) ---")
    api_results = fetch_github_api_trending(topic="ai", days_ago=30)[:3]  # 僅顯示前 3 筆
    
    for repo in api_results:
        print(f"排名 #{repo['rank']}: {repo['owner']}/{repo['repo_name']}")
        print(f"  連結: {repo['url']}")
        print(f"  語言: {repo['language']}")
        print(f"  星星: {repo['stars']} ⭐")
        print(f"  描述: {repo['description']}")
        print("-" * 50)
        
    print("\n[Success] 兩種抓取模式執行完成！")
