import gamesData from '../data/games.json';

export interface Game {
  id: string;
  title: string;
  titleZh?: string;
  type: 'remake' | 'remaster' | 'fan-remake';
  originalTitle: string;
  originalPlatform: string;
  originalYear: number | null;
  releaseYear: number | null;
  developer: string;
  publisher: string;
  platforms: string[];
  genres: string[];
  description: string;
  upcoming?: boolean;
  steamAppid?: number;
  cover?: string;
  fanLinks?: { repo?: string; site?: string };
}

export const typeZh: Record<Game['type'], string> = {
  remake: '重制版',
  remaster: '高清复刻',
  'fan-remake': '民间重制',
};

/** 显示名：优先中文名 */
export function displayName(g: Game): string {
  return g.titleZh || g.title;
}

export const games: Game[] = [...gamesData].sort(
  (a, b) => (b.releaseYear ?? 9999) - (a.releaseYear ?? 9999)
);

export const allPlatforms = [...new Set(games.flatMap((g) => g.platforms))].sort();
export const allGenres = [...new Set(games.flatMap((g) => g.genres))].sort();

/** 原作平台归一化：把别名合并成标准平台 */
const PLATFORM_ALIASES: Record<string, string> = {
  'Famicom': 'NES/FC',
  'NES': 'NES/FC',
  'Arcade': 'Arcade',
  'SNES': 'SFC',
  'Game Boy': 'GB/GBC',
  'GBC': 'GB/GBC',
  'GBA': 'GBA',
  'N64': 'N64',
  'GameCube': 'NGC',
  'DS': 'NDS',
  '3DS': '3DS',
  'New 3DS': '3DS',
  'Wii': 'Wii',
  'Wii U': 'Wii U',
  'Switch': 'Switch',
  'Switch 2': 'Switch 2',
  'PS1': 'PS1',
  'PS2': 'PS2',
  'PS3': 'PS3',
  'PS4': 'PS4',
  'PS5': 'PS5',
  'PSP': 'PSP',
  'PS Vita': 'PS Vita',
  'Xbox': 'Xbox',
  'Xbox 360': 'Xbox 360',
  'Xbox One': 'Xbox One',
  'Xbox Series': 'Xbox Series',
  'PC': 'PC',
  'Saturn': 'Saturn',
  'Dreamcast': 'Dreamcast',
  'Master System': 'Master System',
  'Genesis': 'MD',
  'Quest': 'Quest',
};

/** 该游戏的原作平台（归一化后） */
export function originalPlatformKey(g: Game): string {
  // 组合值（如 "PS3 / Xbox 360"）→ 取第一个平台
  const first = g.originalPlatform.split(/[/,]/)[0].trim();
  return PLATFORM_ALIASES[g.originalPlatform] ?? PLATFORM_ALIASES[first] ?? first;
}

/** 全部原作平台（含计数），按数量排序 */
export function allOriginalPlatforms(): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const g of games) {
    const k = originalPlatformKey(g);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/** 平台 key → URL 安全 slug */
export function platformSlug(key: string): string {
  return key.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** slug → 平台 key */
export function platformKeyFromSlug(slug: string): string | undefined {
  return allOriginalPlatforms().find(p => platformSlug(p.key) === slug)?.key;
}

/** 某原作平台的全部条目：老游戏被重制成什么 */
export function gamesByOriginalPlatform(key: string): Game[] {
  return games.filter((g) => originalPlatformKey(g) === key);
}

/** 某平台上发行的重制/复刻版 */
export function remakesOnPlatform(key: string): Game[] {
  return games.filter((g) => g.platforms.some(p => PLATFORM_ALIASES[p] ?? p) === key || g.platforms.includes(key));
}

/** 与 g 同原作标题（模糊）的其他版本 —— 用于"版本链" */
export function relatedVersions(g: Game): Game[] {
  const key = normalizeTitle(g.originalTitle);
  return games.filter(
    (o) => o.id !== g.id && normalizeTitle(o.originalTitle) === key
  );
}

/** g 的同原作民间重制版 */
export function fanRemakesOf(g: Game): Game[] {
  return games.filter(
    (o) => o.id !== g.id && o.type === 'fan-remake' && normalizeTitle(o.originalTitle) === normalizeTitle(g.originalTitle)
  );
}

function normalizeTitle(t: string): string {
  return t.toLowerCase()
    .replace(/[®™'’!:,&.–—-]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getGame(id: string): Game | undefined {
  return games.find((g) => g.id === id);
}

/** 各平台官方商店搜索/直达链接（中文界面） */
export function storeLinks(g: Game): { name: string; url: string; primary?: boolean }[] {
  const links: { name: string; url: string; primary?: boolean }[] = [];
  if (g.steamAppid) {
    links.push({ name: 'Steam', url: `https://store.steampowered.com/app/${g.steamAppid}/?l=schinese`, primary: true });
  }
  if (g.platforms.includes('Switch') || g.platforms.includes('Switch 2')) {
    links.push({ name: 'Nintendo eShop', url: `https://store.nintendo.com.hk/games/search?q=${encodeURIComponent(g.title)}` });
  }
  if (g.platforms.some(p => p.startsWith('PS'))) {
    links.push({ name: 'PlayStation Store', url: `https://store.playstation.com/zh-hans-hk/search/${encodeURIComponent(g.title)}` });
  }
  if (g.platforms.some(p => p.startsWith('Xbox'))) {
    links.push({ name: 'Xbox 商店', url: `https://www.xbox.com/zh-HK/search?q=${encodeURIComponent(g.title)}` });
  }
  return links;
}
