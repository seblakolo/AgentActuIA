// Couche COLLECTE : déterministe, 0 token LLM.
// Récupère RSS / GitHub / HN / Reddit, filtre sur 7 jours, dédoublonne.
// Chaque source est isolée dans un try/catch : une source qui tombe ne casse pas le run.

import Parser from "rss-parser";
import { RSS_SOURCES, GITHUB_REPOS, HN_QUERIES, REDDIT_SUBS } from "./sources.js";

const parser = new Parser({ timeout: 15000 });
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS || 7);
const SINCE = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
const UA = "ai-weekly-digest/1.0 (personal automation)";

const recent = (ts) => typeof ts === "number" && !Number.isNaN(ts) && ts >= SINCE;
const clip = (s, n = 280) => (s || "").replace(/\s+/g, " ").trim().slice(0, n);

async function collectRss() {
  const out = [];
  for (const s of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(s.url);
      for (const item of feed.items || []) {
        const ts = item.isoDate ? Date.parse(item.isoDate) : (item.pubDate ? Date.parse(item.pubDate) : NaN);
        if (!recent(ts)) continue;
        out.push({
          title: item.title || "(sans titre)",
          url: item.link,
          source: s.name,
          category: s.category,
          date: new Date(ts).toISOString(),
          summary: clip(item.contentSnippet || item.content),
          score: s.lowPriority ? 1 : 5,
        });
      }
    } catch (e) {
      console.warn(`[rss] ${s.name} échec: ${e.message}`);
    }
  }
  return out;
}

async function collectGithub() {
  const out = [];
  const headers = { "User-Agent": UA, Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  for (const r of GITHUB_REPOS) {
    try {
      const res = await fetch(`https://api.github.com/repos/${r.repo}/releases?per_page=5`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const releases = await res.json();
      for (const rel of releases) {
        const ts = Date.parse(rel.published_at);
        if (!recent(ts) || rel.draft) continue;
        out.push({
          title: `${r.repo} ${rel.tag_name || rel.name || ""}`.trim(),
          url: rel.html_url,
          source: `GitHub · ${r.repo}`,
          category: r.category,
          date: new Date(ts).toISOString(),
          summary: clip(rel.body, 220),
          score: rel.prerelease ? 3 : 6,
        });
      }
    } catch (e) {
      console.warn(`[github] ${r.repo} échec: ${e.message}`);
    }
  }
  return out;
}

async function collectHn() {
  const out = [];
  const sinceSec = Math.floor(SINCE / 1000);
  for (const q of HN_QUERIES) {
    try {
      const url =
        `https://hn.algolia.com/api/v1/search?tags=story` +
        `&query=${encodeURIComponent(q.query)}` +
        `&numericFilters=created_at_i>${sinceSec},points>${q.minPoints}`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const h of data.hits || []) {
        out.push({
          title: h.title,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          source: `HN (${h.points} pts)`,
          category: q.category,
          date: new Date(h.created_at_i * 1000).toISOString(),
          summary: "",
          score: Math.min(10, 4 + Math.floor(h.points / 150)),
        });
      }
    } catch (e) {
      console.warn(`[hn] "${q.query}" échec: ${e.message}`);
    }
  }
  return out;
}

async function collectReddit() {
  const out = [];
  for (const r of REDDIT_SUBS) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${r.sub}/top.json?t=week&limit=15`, {
        headers: { "User-Agent": UA },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const c of data.data?.children || []) {
        const p = c.data;
        if ((p.score || 0) < r.minScore) continue;
        out.push({
          title: p.title,
          url: p.url_overridden_by_dest || `https://reddit.com${p.permalink}`,
          source: `r/${r.sub} (${p.score})`,
          category: r.category,
          date: new Date(p.created_utc * 1000).toISOString(),
          summary: clip(p.selftext, 180),
          score: Math.min(9, 3 + Math.floor(p.score / 300)),
        });
      }
    } catch (e) {
      console.warn(`[reddit] r/${r.sub} échec: ${e.message}`);
    }
  }
  return out;
}

function dedupe(items) {
  const seen = new Set();
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  return items.filter((it) => {
    const key = norm(it.url) || norm(it.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function collectAll() {
  const batches = await Promise.all([
    collectRss(),
    collectGithub(),
    collectHn(),
    collectReddit(),
  ]);
  const items = dedupe(batches.flat());
  items.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
  const CAP = Number(process.env.MAX_ITEMS || 120);
  console.log(`[collect] ${items.length} items uniques sur ${WINDOW_DAYS}j (cap ${CAP})`);
  return items.slice(0, CAP);
}
