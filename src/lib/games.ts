import gamesData from '../data/games.json';

export interface Game {
  id: string;
  title: string;
  titleZh?: string;
  type: 'remake' | 'remaster';
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
}

/** 显示名：优先中文名 */
export function displayName(g: Game): string {
  return g.titleZh || g.title;
}

export const games: Game[] = [...gamesData].sort(
  (a, b) => (b.releaseYear ?? 9999) - (a.releaseYear ?? 9999)
);

export const allPlatforms = [...new Set(games.flatMap((g) => g.platforms))].sort();
export const allGenres = [...new Set(games.flatMap((g) => g.genres))].sort();

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
