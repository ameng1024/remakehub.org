// Apply manual appid fixes, fetch details for them, merge into games.json
import { readFileSync, writeFileSync } from 'node:fs';

const fixes = {
  'mafia-definitive-edition': 1030840,
  'broken-sword-reforged': 2544110,
  'shadow-warrior-2013': 233130,
  'wonder-boy-asha': 1420080,
  'flashback-2013': null,   // delisted, no Steam version
  'ninja-gaiden-2004': null, // Xbox exclusive, no Steam version
};

const cache = JSON.parse(readFileSync('scripts/steam-match.json', 'utf8'));
const games = JSON.parse(readFileSync('src/data/games.json', 'utf8'));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 1. apply fixes (fetch zh details for newly fixed appids)
for (const [gid, appid] of Object.entries(fixes)) {
  if (appid === null) { cache[gid] = null; console.log(`fix ${gid} → null`); continue; }
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=schinese&cc=us`);
  const det = await res.json();
  const d = det[appid]?.data;
  if (!d) { console.log(`fix ${gid} → ${appid} FAILED`); continue; }
  cache[gid] = { appid, steamName: d.name, steamNameZh: d.name, header: d.header_image, score: 1 };
  console.log(`fix ${gid} → ${appid} ✓ ${d.name}`);
  await sleep(300);
}
writeFileSync('scripts/steam-match.json', JSON.stringify(cache, null, 1));

// 2. merge into games.json
let withSteam = 0, withCover = 0;
for (const g of games) {
  const m = cache[g.id];
  if (m?.appid) {
    g.steamAppid = m.appid;
    if (m.header) { g.cover = m.header; withCover++; }
    withSteam++;
  }
}
writeFileSync('src/data/games.json', JSON.stringify(games, null, 2) + '\n');
console.log(`\nmerged: ${withSteam} with appid, ${withCover} with cover image`);
