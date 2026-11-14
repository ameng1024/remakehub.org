import type { APIRoute } from 'astro';

const REPO = 'ameng1024/remakehub.org';
const LABEL = 'submission';

export const prerender = false;

function clean(v: unknown, max = 200): string {
  return String(v ?? '').trim().slice(0, max);
}

export const POST: APIRoute = async ({ request }) => {
  // Basic spam throttle: same IP at most once per minute (best-effort, in-memory).
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const last = throttle.get(ip);
  if (last && now - last < 60_000) {
    return new Response(JSON.stringify({ error: 'Too many submissions — please wait a minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  throttle.set(ip, now);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const title = clean(body.title, 120);
  const originalTitle = clean(body.originalTitle, 120);
  const type = body.type === 'remaster' ? 'remaster' : 'remake';
  const description = clean(body.description, 400);
  const releaseYear = clean(body.releaseYear, 4);
  const originalPlatform = clean(body.originalPlatform, 60);
  const originalYear = clean(body.originalYear, 4);
  const platforms = clean(body.platforms, 120);
  const developer = clean(body.developer, 80);
  const genres = clean(body.genres, 80);
  const source = clean(body.source, 300);

  if (!title || !originalTitle || !description) {
    return new Response(JSON.stringify({ error: 'title, originalTitle and description are required.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = import.meta.env.GITHUB_TOKEN;
  if (!token) {
    // Fallback: no token configured — tell the client to use the GitHub issue link.
    return new Response(JSON.stringify({
      error: 'Submissions are temporarily offline. Please use the GitHub issue link below the form instead.',
      fallbackIssue: `https://github.com/${REPO}/issues/new?title=${encodeURIComponent('[Submission] ' + title)}`,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const issueBody = [
    `**Type:** ${type}`,
    `**Original:** ${originalTitle}${originalYear ? ` (${originalYear})` : ''}${originalPlatform ? ` — ${originalPlatform}` : ''}`,
    releaseYear ? `**Release year:** ${releaseYear}` : '',
    platforms ? `**Platforms:** ${platforms}` : '',
    developer ? `**Developer:** ${developer}` : '',
    genres ? `**Genres:** ${genres}` : '',
    source ? `**Source:** ${source}` : '',
    '',
    '**Description:**',
    description,
    '',
    '---',
    '_Submitted via remakehub.org/submit_',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'remakehub-submit',
      },
      body: JSON.stringify({
        title: `[Submission] ${title}`,
        body: issueBody,
        labels: [LABEL],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`GitHub API ${res.status}: ${detail.slice(0, 300)}`);
      return new Response(JSON.stringify({
        error: 'Could not file the submission — please use the GitHub issue link below the form instead.',
        fallbackIssue: `https://github.com/${REPO}/issues/new?title=${encodeURIComponent('[Submission] ' + title)}`,
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    const issue = await res.json();
    throttle.set(ip, now); // confirm on success
    return new Response(JSON.stringify({ ok: true, issueUrl: issue.html_url }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit error', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error — please retry later.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

const throttle = new Map<string, number>();
