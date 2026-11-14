import gamesData from '../data/games.json';

export interface Game {
  id: string;
  title: string;
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
}

export const games: Game[] = [...gamesData].sort(
  (a, b) => (b.releaseYear ?? 9999) - (a.releaseYear ?? 9999)
);

export const allPlatforms = [...new Set(games.flatMap((g) => g.platforms))].sort();
export const allGenres = [...new Set(games.flatMap((g) => g.genres))].sort();

export function getGame(id: string): Game | undefined {
  return games.find((g) => g.id === id);
}
