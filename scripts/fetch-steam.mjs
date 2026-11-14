// Fetch Steam appid + Chinese name + header image for all games.
// Produces steam-match.json: { [gameId]: { appid, steamName, steamNameZh, header } | null }
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const games = JSON.parse(readFileSync('src/data/games.json', 'utf8'));
const cachePath = 'scripts/steam-match.json';
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().replace(/[®™'’!:,&.–—-]/g, ' ').replace(/\s+/g, ' ').trim();

function searchTerm(g) {
  // Strip "(2023)" style year suffixes for search; keep core title
  return g.title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

function scoreMatch(gameTitle, storeName) {
  const a = norm(gameTitle), b = norm(storeName);
  if (!a || !b) return 0;
  const wa = a.split(' '), wb = b.split(' ');
  let hit = 0;
  for (const w of wa) if (w.length > 2 && wb.includes(w)) hit++;
  const cover = hit / Math.max(wa.length, 1);
  const exact = a === b ? 1 : 0;
  return Math.max(cover, exact);
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'remakehub-builder' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

const updated = {};
let done = 0;
for (const g of games) {
  if (cache[g.id] !== undefined && (cache[g.id]?.appid || cache[g.id] === null)) {
    updated[g.id] = cache[g.id];
    done++;
    continue;
  }
  const term = searchTerm(g);
  try {
    const sr = await fetchJSON(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=schinese&cc=us`);
    const items = sr.items || [];
    let best = null, bestScore = 0;
    for (const it of items) {
      const s = scoreMatch(term, it.name);
      if (s > bestScore) { best = it; bestScore = s; }
    }
    if (best && bestScore >= 0.6) {
      const det = await fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${best.id}&l=schinese&cc=us`);
      const d = det[best.id]?.data;
      updated[g.id] = {
        appid: best.id,
        steamName: best.name,
        steamNameZh: d?.name || best.name,
        header: d?.header_image || null,
        score: bestScore,
      };
      console.log(`✓ ${g.id} → ${best.id} ${d?.name || best.name} (${bestScore.toFixed(2)})`);
      await sleep(350);
    } else {
      updated[g.id] = null;
      console.log(`– ${g.id}: no good match (${bestScore.toFixed(2)})`);
      await sleep(250);
    }
  } catch (e) {
    updated[g.id] = cache[g.id] ?? undefined; // retry next run
    console.log(`! ${g.id}: ${e.message}`);
    await sleep(1000);
  }
  done++;
  if (done % 25 === 0) writeFileSync(cachePath, JSON.stringify(updated, null, 1));
}
writeFileSync(cachePath, JSON.stringify(updated, null, 1));
const matched = Object.values(updated).filter(Boolean).length;
console.log(`\nDONE: ${matched}/${games.length} matched`);
