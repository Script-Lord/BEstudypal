function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<\/(p|div|section|article|main|header|footer|li|h[1-6])>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function getTitle(html: string, fallback: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return decodeEntities(title?.replace(/\s+/g, ' ').trim() || fallback);
}

function assertPublicHttpUrl(input: string): URL {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http and https URLs are supported');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Local URLs are not supported');
  }

  return url;
}

export async function fetchWebSource(input: string): Promise<{
  title: string;
  markdown: string;
  sourceUrl: string;
}> {
  const url = assertPublicHttpUrl(input.trim());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'StudyPalBot/1.0 (+https://studypal.local)',
        Accept: 'text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch URL (${response.status})`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('Only web pages and plain text URLs are supported');
    }

    const raw = await response.text();
    const finalUrl = response.url || url.toString();
    const title = contentType.includes('text/html')
      ? getTitle(raw, new URL(finalUrl).hostname)
      : new URL(finalUrl).hostname;
    const text = contentType.includes('text/html') ? stripHtml(raw) : raw.trim();

    if (text.length < 80) {
      throw new Error('This page did not contain enough readable text');
    }

    const markdown = `# ${title}\n\nSource: ${finalUrl}\n\n${text}`;
    return { title, markdown, sourceUrl: finalUrl };
  } finally {
    clearTimeout(timeout);
  }
}
