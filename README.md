# remakehub.org

A curated directory of official video game **remakes & remasters** — classic games (NES / SNES / PS1 / PS2 / arcade era) rebuilt for modern platforms. Built in the spirit of a "Steam store" for retro revivals.

**Live:** <https://remakehub.org>

## Stack

- **[Astro](https://astro.build)** — static-first, 190+ pre-rendered game pages, instant client-side search & filtering (zero external search service needed)
- **Vercel** — static hosting + one serverless endpoint for the submission form
- Data lives in a single JSON file: [`src/data/games.json`](src/data/games.json)

## Features

- 🔍 Search across title / original title / developer / platform / genre
- 🏷️ Filter by type (Remake / Remaster), platform, genre; 5 sort orders
- 📄 Dedicated page per game with original-vs-new comparison, facts, store links
- 📝 Community submissions: in-site form → GitHub Issue queue (human review → data file PR)

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/ (+ .vercel/output)
```

> Node.js **22.23+ or 24** required (Astro 7). Vercel uses Node 24 by default — matches.

## Deploying (Vercel)

The site auto-deploys on every push to the `0.0.1` branch (Vercel project: `remakehub.org`, domain already wired: `remakehub.org`).

No configuration needed beyond the defaults: framework preset **Astro** is auto-detected.

### Submission form backend (one-time setup)

`/submit` posts to a serverless function that files a GitHub issue in this repo. For it to work, add an environment variable in **Vercel → Settings → Environment Variables**:

| Name | Value | Scope |
|------|-------|-------|
| `GITHUB_TOKEN` | A fine-grained PAT with **Issues: Read and write** on `ameng1024/remakehub.org` | Production (and Preview) |

Create the token at <https://github.com/settings/personal-access-tokens/new> (Repository access → only this repo; Permissions → Issues → Read and write).

Without the token the site still works fully — the form will fall back to directing users to open a GitHub issue manually.

## Adding / editing games

Games are entries in `src/data/games.json`:

```json
{
  "id": "kebab-case-id",
  "title": "Title (Year) if ambiguous",
  "type": "remake | remaster",
  "originalTitle": "The original game",
  "originalPlatform": "SNES",
  "originalYear": 1996,
  "releaseYear": 2024,
  "developer": "Studio",
  "publisher": "Publisher",
  "platforms": ["Switch", "PS5", "PC"],
  "genres": ["RPG"],
  "description": "One-liner.",
  "upcoming": true
}
```

Submit via <https://remakehub.org/submit> or edit the JSON directly in a PR.

## License / data

Game titles and trademarks belong to their respective owners. This directory references them editorially.
