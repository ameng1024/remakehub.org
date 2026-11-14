// Merge Chinese titles/descriptions + fix wrong appids into games.json
import { readFileSync, writeFileSync } from 'node:fs';

const zh = JSON.parse(readFileSync('scripts/zh.json', 'utf8'));
const games = JSON.parse(readFileSync('src/data/games.json', 'utf8'));

const appidFixes = {
  'resident-evil-2002': 304240,  // was 2050650 (RE4); RE HD REMASTER = 304240
  'quake-2021': 2310,            // was 2320 (Quake II); Quake enhanced = 2310
};

let hit = 0, miss = [];
for (const g of games) {
  const z = zh[g.id];
  if (!z) { miss.push(g.id); continue; }
  g.titleZh = z.t;
  g.description = z.d; // replace English description with Chinese
  hit++;
  const fix = appidFixes[g.id];
  if (fix && g.steamAppid !== fix) {
    g.steamAppid = fix;
    g.cover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${fix}/header.jpg`;
    console.log(`appid fix: ${g.id} → ${fix}`);
  }
}
writeFileSync('src/data/games.json', JSON.stringify(games, null, 2) + '\n');
console.log(`zh applied: ${hit}/${games.length}, missing: ${miss.join(', ') || 'none'}`);
