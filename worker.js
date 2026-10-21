const REPO_OWNER = 'Brannua';
const REPO_NAME = 'standalone-pages';
const REPO_BRANCH = 'main';
const HEXO_ORIGIN = 'https://brannua.github.io';
const CACHE_SECONDS = 300;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseFrontmatter(md) {
  const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { meta: {}, body: md };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  });
  return { meta, body: md.slice(match[0].length) };
}

function isTableSeparator(line) {
  const parts = line.split('|').slice(1, -1).map(c => c.trim());
  return parts.length > 0 && parts.every(p => /^[:-]+$/.test(p));
}

function parseTable(lines) {
  const headerCells = lines[0].split('|').slice(1, -1).map(c => c.trim());
  const bodyRows = lines.slice(2).map(line => line.split('|').slice(1, -1).map(c => c.trim()));

  let html = '<table><thead><tr>';
  headerCells.forEach(h => {
    html += `<th>${escapeHtml(h)}</th>`;
  });
  html += '</tr></thead><tbody>';
  bodyRows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${escapeHtml(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function extractTables(md) {
  const lines = md.split('\n');
  const tables = [];
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      let tableLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        const t = lines[j].trim();
        if (t.startsWith('|') && t.endsWith('|')) {
          tableLines.push(lines[j]);
          j++;
        } else {
          break;
        }
      }
      if (tableLines.length >= 2 && isTableSeparator(tableLines[1])) {
        tables.push(parseTable(tableLines));
        out.push(`__TABLE_${tables.length - 1}__`);
        i = j;
        continue;
      }
    }
    out.push(line);
    i++;
  }
  return { text: out.join('\n'), tables };
}

function extractImages(md) {
  const images = [];
  const text = md.replace(/<img[^>]+>/gi, match => {
    images.push(match);
    return `__IMG_${images.length - 1}__`;
  });
  return { text, images };
}

function mdToHtml(md, slug) {
  const { meta, body } = parseFrontmatter(md);
  const title = meta.title || '';
  const pageTitle = title || slug || 'Untitled';
  const date = meta.date || '';

  const { text: bodyWithTablePlaceholders, tables } = extractTables(body);
  const { text: bodyWithPlaceholders, images } = extractImages(bodyWithTablePlaceholders);
  let html = escapeHtml(bodyWithPlaceholders);

  // code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });

  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // headings
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // bold & italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

  // unordered lists
  html = html.replace(/^(\s*)[-*] (.*$)/gim, (m, indent, text) => {
    return `<li>${text}</li>`;
  });
  // wrap consecutive li in ul (simple version)
  html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>\n${m}</ul>\n`);

  // ordered lists
  html = html.replace(/^(\s*)\d+\. (.*$)/gim, '<li>$2</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, m => {
    if (m.includes('<ul>')) return m;
    return `<ol>\n${m}</ol>\n`;
  });

  // blockquote
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

  // paragraphs and line breaks
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h\d|pre|ul|ol|blockquote|li)/.test(block)) return block;
    if (/^__(TABLE|IMG)_\d+__$/.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  // restore images and tables
  html = html.replace(/__IMG_(\d+)__/g, (m, idx) => images[idx]);
  html = html.replace(/__TABLE_(\d+)__/g, (m, idx) => tables[idx]);

  const dateLine = date ? `<p class="date">${escapeHtml(date)}</p>` : '';

  return `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)}</title>
<style>
:root { --bg:#fafafa; --text:#333; --accent:#3BBC69; --muted:#777; --code:#f4f4f4; }
@media (prefers-color-scheme: dark) { :root { --bg:#1a1a1a; --text:#e5e5e5; --muted:#999; --code:#2a2a2a; } }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; max-width: 720px; margin: 0 auto; padding: 2rem 1rem; }
h1 { border-bottom: 2px solid var(--accent); padding-bottom: .3rem; }
h2 { margin-top: 2rem; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code { background: var(--code); padding: .1rem .3rem; border-radius: 3px; font-family: Consolas, monospace; }
pre { background: var(--code); padding: 1rem; border-radius: 6px; overflow-x: auto; }
pre code { background: none; padding: 0; }
.date { color: var(--muted); font-size: .9rem; margin-top: -1rem; }
blockquote { border-left: 4px solid var(--accent); margin: 0; padding-left: 1rem; color: var(--muted); }
img { max-width: 100%; height: auto; }
ul, ol { padding-left: 1.5rem; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
th, td { border: 1px solid #ddd; padding: .5rem .75rem; text-align: left; }
th { background: var(--code); font-weight: 600; }
footer { margin-top: 4rem; border-top: 1px solid #ddd; padding-top: 1rem; font-size: .85rem; color: var(--muted); text-align: center; }
</style>
</head>
<body>
${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
${dateLine}
${html}
</body>
</html>`;
}

async function fetchMarkdown(path) {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${path}.md`;
  return fetch(url, {
    headers: { 'User-Agent': 'Cloudflare-Worker' },
    cf: { cacheTtl: 60 }
  });
}

async function fallbackToHexo(request) {
  const url = new URL(request.url);
  url.hostname = 'brannua.github.io';
  url.protocol = 'https:';
  const originalHost = new URL(request.url).hostname;
  const headers = new Headers(request.headers);
  headers.set('Host', originalHost);
  return fetch(url, {
    method: request.method,
    headers: headers,
    body: request.body
  });
}

async function handleRequest(request) {
  const url = new URL(request.url);
  let pathname = url.pathname;

  // Let static assets through to hexo
  if (/\.[a-zA-Z0-9]{2,10}$/.test(pathname)) {
    return fallbackToHexo(request);
  }

  if (pathname.endsWith('/')) pathname += 'index';
  if (pathname.startsWith('/')) pathname = pathname.slice(1);

  // Root goes straight to hexo
  if (!pathname || pathname === 'index') {
    return fallbackToHexo(request);
  }

  const mdRes = await fetchMarkdown(pathname);

  if (mdRes.status === 200) {
    const mdText = await mdRes.text();
    const html = mdToHtml(mdText, pathname);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`
      }
    });
  }

  return fallbackToHexo(request);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
