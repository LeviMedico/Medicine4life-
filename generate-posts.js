const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const postsFolder = "./posts";
const newsFolder = "./news";

// One icon per category, matching the hand-coded icons used elsewhere on the site.
const ICONS = {
  "AI Diagnostics": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M11 8V5M15 8V5M11 20v3M15 20v3M8 11H5M8 15H5M20 11h3M20 15h3"/></svg>`,
  "Wearables": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="8" width="10" height="12" rx="3"/><path d="M11 8V4h6v4M11 20v4h6v-4"/><circle cx="14" cy="14" r="2"/></svg>`,
  "Diagnostics": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v7l-7 12a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3l-7-12V3"/><path d="M10 3h8"/><path d="M8 18h12"/></svg>`,
  "Genomics": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2c9 7 9 7 0 14c9 7 9 7 0 14"/><path d="M20 2c-9 7-9 7 0 14c-9 7-9 7 0 14"/><path d="M8.5 5.5h13M8.5 12.5h13M8.5 15.5h13M8.5 22.5h13"/></svg>`,
};
const DEFAULT_ICON = ICONS["Diagnostics"];

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const [, frontmatterBlock, body] = match;
  const data = {};
  const lines = frontmatterBlock.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const lineMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!lineMatch) { i++; continue; }

    const [, key, rawValue] = lineMatch;
    const trimmedValue = rawValue.trim();

    if (trimmedValue === ">" || trimmedValue === ">-" || trimmedValue === "|" || trimmedValue === "|-") {
      // YAML block scalar: collect subsequent indented lines
      const folded = trimmedValue.startsWith(">");
      const collected = [];
      i++;
      while (i < lines.length && (lines[i].startsWith("  ") || lines[i].trim() === "")) {
        collected.push(lines[i].replace(/^  /, ""));
        i++;
      }
      // remove trailing blank lines
      while (collected.length && collected[collected.length - 1].trim() === "") collected.pop();
      data[key] = folded ? collected.join(" ").replace(/\s+/g, " ").trim() : collected.join("\n").trim();
    } else {
      data[key] = trimmedValue.replace(/^"(.*)"$/, "$1");
      i++;
    }
  }
  return { data, body: body.trim() };
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image }) {
  const bannerHtml = image
    ? `<div class="wrap"><img src="${image}" alt="${title}" class="post-banner reveal"></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Medicine4life</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Arimo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="icon" type="image/png" href="images/favicon-32.png">
<link rel="apple-touch-icon" href="images/favicon-180.png">
<noscript><style>.reveal{opacity:1!important;transform:none!important;}</style></noscript>
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <div class="logo"><a href="index.html" style="display:flex;"><img src="images/logo.png" alt="Medicine4life"></a></div>
    <nav class="site-nav">
      <a href="index.html">Home</a>
      <a href="blog.html">Articles</a>
      <a href="news.html">News</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
    </nav>
  </div>
</header>

<article>
  <div class="wrap post-header">
    <div class="tag">${icon}${tag}</div>
    <h1>${title}</h1>
    <div class="byline">Medicine4life · ${dateDisplay}</div>
  </div>

  ${bannerHtml}

  <div class="wrap post-body">
${htmlBody}
  </div>

  <div class="wrap" style="padding-bottom: 60px;">
    <a class="back-link" href="blog.html">&larr; Back to all posts</a>
  </div>
</article>

<footer class="site-footer">
  <div class="wrap">
    <span class="brand-mark"><svg width="16" height="16" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15h6l3-9 4 18 3-9h6"/></svg>Medicine4life — medical technology, explained clearly</span>
    <span>&copy; 2026</span>
  </div>
</footer>

<script src="script.js" defer></script>
</body>
</html>
`;
}

// ---------- Blog posts ----------
const postFiles = fs.existsSync(postsFolder) ? fs.readdirSync(postsFolder) : [];

const posts = postFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(postsFolder, file), "utf8");
    const { data, body } = parseFrontmatter(raw);

    const title = data.title || "Untitled";
    const tag = data.tag || "Diagnostics";
    const icon = ICONS[tag] || DEFAULT_ICON;
    const dateDisplay = formatDate(data.date);
    const image = data.image || "";
    const summary = data.summary || body.split("\n").find(l => l.trim().length > 0) || "";
    const readMinutes = estimateReadTime(body);

    const htmlBody = marked(body);
    const slug = file.replace(".md", "");
    const link = `${slug}.html`;

    fs.writeFileSync(link, renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image }));

    return {
      title,
      date: data.date || "",
      dateDisplay,
      tag,
      summary: summary.length > 160 ? summary.slice(0, 157) + "..." : summary,
      readMinutes,
      image,
      link,
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

function renderNewsPage({ title, dateDisplay, htmlBody, summary, sourceName, sourceUrl, image }) {
  const bannerHtml = image
    ? `<div class="wrap"><img src="${image}" alt="${title}" class="post-banner reveal"></div>`
    : "";
  const sourceHtml = sourceUrl
    ? `<p><a href="${sourceUrl}" target="_blank" rel="noopener">Source: ${sourceName || "Link"} &rarr;</a></p>`
    : (sourceName ? `<p class="byline" style="border:none;padding:0;">Source: ${sourceName}</p>` : "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Medicine4life</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Arimo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="icon" type="image/png" href="images/favicon-32.png">
<link rel="apple-touch-icon" href="images/favicon-180.png">
<noscript><style>.reveal{opacity:1!important;transform:none!important;}</style></noscript>
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <div class="logo"><a href="index.html" style="display:flex;"><img src="images/logo.png" alt="Medicine4life"></a></div>
    <nav class="site-nav">
      <a href="index.html">Home</a>
      <a href="blog.html">Articles</a>
      <a href="news.html">News</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
    </nav>
  </div>
</header>

<article>
  <div class="wrap post-header">
    <div class="tag"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h6l3-9 4 18 3-9h6"/></svg>News</div>
    <h1>${title}</h1>
    <div class="byline">Medicine4life · ${dateDisplay}</div>
  </div>

  ${bannerHtml}

  <div class="wrap post-body">
    <p>${summary}</p>
    ${htmlBody}
    ${sourceHtml}
  </div>

  <div class="wrap" style="padding-bottom: 60px;">
    <a class="back-link" href="news.html">&larr; Back to all news</a>
  </div>
</article>

<footer class="site-footer">
  <div class="wrap">
    <span class="brand-mark"><svg width="16" height="16" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15h6l3-9 4 18 3-9h6"/></svg>Medicine4life — medical technology, explained clearly</span>
    <span>&copy; 2026</span>
  </div>
</footer>

<script src="script.js" defer></script>
</body>
</html>
`;
}

// ---------- News items ----------
const newsFiles = fs.existsSync(newsFolder) ? fs.readdirSync(newsFolder) : [];

const newsItems = newsFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(newsFolder, file), "utf8");
    const { data, body } = parseFrontmatter(raw);

    const title = data.title || "Untitled";
    const dateDisplay = formatDate(data.date);
    const summary = data.summary || "";
    const image = data.image || "";
    const htmlBody = body && body.trim() ? marked(body) : "";
    const slug = file.replace(".md", "");
    const link = `news-${slug}.html`;

    fs.writeFileSync(link, renderNewsPage({
      title, dateDisplay, htmlBody, summary, image,
      sourceName: data.sourceName || "", sourceUrl: data.sourceUrl || ""
    }));

    return {
      title,
      date: data.date || "",
      dateDisplay,
      summary,
      image,
      sourceName: data.sourceName || "",
      sourceUrl: data.sourceUrl || "",
      link,
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync("news.json", JSON.stringify(newsItems, null, 2));

console.log(`Generated ${posts.length} post page(s), posts.json, and news.json (${newsItems.length} item(s))`);
