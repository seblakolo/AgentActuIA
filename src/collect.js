// Couche COLLECTE : déterministe, 0 token LLM.
import Parser from "rss-parser";
import { RSS_SOURCES, GOOGLE_NEWS_QUERIES, GITHUB_REPOS, HN_QUERIES } from "./sources.js";

const parser = new Parser({ timeout: 15000 });
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS || 7);
const SINCE = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
const UA = "ai-weekly-digest/1.0 (personal automation)";

const recent = (ts) => typeof ts === "number" && !Number.isNaN(ts) && ts >= SINCE;
const clip = (s, n = 280) => (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

async function collectRss() {
  const out = [];
  for (const s of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(s.url);
      for (const item of feed.items || []) {
        const ts = item.isoDate ? Date.parse(item.isoDate) : (item.pubDate ? Date.parse(item.pubDate) : NaN);
        if (!recent(ts)) continue;
        out.push({ title: item.title || "(sans titre)", url: item.link, source: s.name,
          category: s.category, date: new Date(ts).toISOString(),
          summary: clip(item.contentSnippet || item.content), score: s.lowPriority ? 1 : 5 });
      }
    } catch (e) { console.warn(`[rss] ${s.name} échec: ${e.message}`); }
  }
  return out;
}

async function collectGoogleNews() {
  const out = [];
  for (const q of GOOGLE_NEWS_QUERIES) {
    try {
      // when:7d -> Google ne renvoie que les articles récents (sinon tri par pertinence = vieux articles)
      const query = `${q.query} when:${WINDOW_DAYS}d`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(url);
      let n = 0;
      for (const item of feed.items || []) {
        const ts = item.isoDate ? Date.parse(item.isoDate) : (item.pubDate ? Date.parse(item.pubDate) : NaN);
        if (!recent(ts)) continue;
        if (n++ >= 6) break;
        out.push({ title: item.title || "(sans titre)", url: item.link, source: `Google News · ${q.query}`,
          category: q.category, date: new Date(ts).toISOString(),
          summary: clip(item.contentSnippet || item.content, 160), score: 4 });
      }
    } catch (e) { console.warn(`[gnews] "${q.query}" échec: ${e.message}`); }
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
      for (const rel of await res.json()) {
        const ts = Date.parse(rel.published_at);
        if (!recent(ts) || rel.draft) continue;
        out.push({ title: `${r.repo} ${rel.tag_name || rel.name || ""}`.trim(), url: rel.html_url,
          source: `GitHub · ${r.repo}`, category: r.category, date: new Date(ts).toISOString(),
          summary: clip(rel.body, 220), score: rel.prerelease ? 3 : 6 });
      }
    } catch (e) { console.warn(`[github] ${r.repo} échec: ${e.message}`); }
  }
  return out;
}

async function collectHn() {
  const out = [];
  const sinceSec = Math.floor(SINCE / 1000);
  for (const q of HN_QUERIES) {
    try {
      const url = `https://hn.algolia.com/api/v1/search?tags=story&query=${encodeURIComponent(q.query)}&numericFilters=created_at_i>${sinceSec},points>${q.minPoints}`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const h of data.hits || []) {
        out.push({ title: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          source: `HN (${h.points} pts)`, category: q.category,
          date: new Date(h.created_at_i * 1000).toISOString(), summary: "",
          score: Math.min(10, 4 + Math.floor(h.points / 150)) });
      }
    } catch (e) { console.warn(`[hn] "${q.query}" échec: ${e.message}`); }
  }
  return out;
}

function dedupe(items) {
  const seen = new Set();
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  return items.filter((it) => {
    const key = norm(it.title) || norm(it.url);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// Quota par rubrique : garantit que chaque section remonte, puis complète au score.
function selectByQuota(items, cap, quotas) {
  items.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
  const picked = [];
  const seen = new Set();
  for (const cat of Object.keys(quotas)) {
    let n = 0;
    for (const it of items) {
      if (it.category !== cat || seen.has(it)) continue;
      picked.push(it); seen.add(it);
      if (++n >= quotas[cat]) break;
    }
  }
  for (const it of items) {
    if (picked.length >= cap) break;
    if (!seen.has(it)) { picked.push(it); seen.add(it); }
  }
  return picked.slice(0, cap).sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
}

export async function collectAll() {
  const batches = await Promise.all([collectRss(), collectGoogleNews(), collectGithub(), collectHn()]);
  const items = dedupe(batches.flat());
  const CAP = Number(process.env.MAX_ITEMS || 120);
  const byCat = {};
  for (const it of items) byCat[it.category] = (byCat[it.category] || 0) + 1;
  console.log(`[collect] ${items.length} items uniques sur ${WINDOW_DAYS}j — ia:${byCat.ia||0} media:${byCat.media||0} design:${byCat.design||0} (cap ${CAP})`);
  // au moins 18 média et 12 design garantis, le reste au score
  return selectByQuota(items, CAP, { media: 18, design: 12, ia: 999 });
}
