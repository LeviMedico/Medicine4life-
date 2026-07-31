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
  "The Basics": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="10"/><path d="M14 10v5l3 2"/></svg>`,
  "FMGE Prep": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12l4 4v16H6z"/><path d="M18 4v4h4"/><path d="M9 14h10M9 18h10M9 10h5"/></svg>`,
  "Student Corner": `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9l10-4 10 4-10 4-10-4z"/><path d="M8 12v6c0 1.5 3 3 6 3s6-1.5 6-3v-6"/><path d="M24 9v7"/></svg>`,
};
const DEFAULT_ICON = ICONS["Diagnostics"];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
      const collected = [trimmedValue.replace(/^"(.*)"$/, "$1")];
      i++;
      // Support plain wrapped values: subsequent indented lines that aren't "key: value" continue this value
      while (
        i < lines.length &&
        lines[i].startsWith("  ") &&
        lines[i].trim() !== "" &&
        !/^\s*[A-Za-z0-9_]+:\s/.test(lines[i])
      ) {
        collected.push(lines[i].trim());
        i++;
      }
      data[key] = collected.join(" ").replace(/\s+/g, " ").trim();
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

function renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image, author, summary }) {
  const bannerHtml = image
    ? `<div class="wrap"><img src="${image}" alt="${title}" class="post-banner reveal"></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3611MH8QQQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3611MH8QQQ');
    gtag('config', 'AW-18331622783');
  </script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2371873453043295"
     crossorigin="anonymous"></script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Medicine4life</title>
<meta name="description" content="${summary.replace(/"/g, '&quot;')}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${summary.replace(/"/g, '&quot;')}">
<meta property="og:type" content="article">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display&family=Arimo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
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
      <a href="the-basics.html">The Basics</a>
      <a href="student-corner.html">Student Corner</a>
      <a href="fmge-prep.html">FMGE Prep</a>
      <a href="glossary.html">Glossary</a>
      <a href="disease-library.html">Disease Library</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="search.html" class="nav-search" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      </a>
    </nav>
  </div>
</header>

<article>
  <div class="wrap post-header">
    <div class="tag">${icon}${tag}</div>
    <h1>${title}</h1>
    <div class="byline">${author || "Medicine4life"} · ${dateDisplay}</div>
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
    <span class="footer-owner">Owned by — Sushil Dethaliya</span>
    <div class="footer-social">
      <a href="https://www.instagram.com/medicine4life__?igsh=MW44NHNyOGFtdzhuOA%3D%3D&utm_source=qr" target="_blank" rel="noopener" aria-label="Medicine4life on Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
      </a>
    </div>
    <span class="footer-legal"><a href="privacy.html">Privacy Policy</a> · <a href="disclaimer.html">Disclaimer</a></span>
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
    const author = data.author || "";
    const summary = data.summary || body.split("\n").find(l => l.trim().length > 0) || "";
    const readMinutes = estimateReadTime(body);

    const htmlBody = marked(body);
    const slug = file.replace(".md", "");
    const link = `${slug}.html`;

    fs.writeFileSync(link, renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image, author, summary }));

    return {
  title,
  date: data.date || "",
  dateDisplay,
  tag,
  summary: summary.length > 160 ? summary.slice(0, 157) + "...": summary,
  content: body,
  readMinutes,
  image,
  link,
};
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

// ---------- The Basics ----------
const theBasicsFolder = "./the-basics-posts";
const theBasicsFiles = fs.existsSync(theBasicsFolder) ? fs.readdirSync(theBasicsFolder) : [];

const theBasicsPosts = theBasicsFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(theBasicsFolder, file), "utf8");
    const { data, body } = parseFrontmatter(raw);

    const title = data.title || "Untitled";
    const tag = "The Basics";
    const icon = ICONS[tag] || DEFAULT_ICON;
    const dateDisplay = formatDate(data.date);
    const image = data.image || "";
    const author = data.author || "";
    const summary = data.summary || body.split("\n").find(l => l.trim().length > 0) || "";
    const readMinutes = estimateReadTime(body);

    const htmlBody = marked(body);
    const slug = file.replace(".md", "");
    const link = `${slug}.html`;

    fs.writeFileSync(link, renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image, author, summary }));

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

fs.writeFileSync("the-basics.json", JSON.stringify(theBasicsPosts, null, 2));
console.log(`Generated ${theBasicsPosts.length} The Basics page(s) and the-basics.json`);

// ---------- Student Corner ----------
const studentCornerFolder = "./student-corner-posts";
const studentCornerFiles = fs.existsSync(studentCornerFolder) ? fs.readdirSync(studentCornerFolder) : [];

const studentCornerPosts = studentCornerFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(studentCornerFolder, file), "utf8");
    const { data, body } = parseFrontmatter(raw);

    const title = data.title || "Untitled";
    const tag = "Student Corner";
    const icon = ICONS[tag] || DEFAULT_ICON;
    const dateDisplay = formatDate(data.date);
    const image = data.image || "";
    const author = data.author || "";
    const summary = data.summary || body.split("\n").find(l => l.trim().length > 0) || "";
    const readMinutes = estimateReadTime(body);

    const htmlBody = marked(body);
    const slug = file.replace(".md", "");
    const link = `${slug}.html`;

    fs.writeFileSync(link, renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image, author, summary }));

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

fs.writeFileSync("student-corner.json", JSON.stringify(studentCornerPosts, null, 2));
console.log(`Generated ${studentCornerPosts.length} Student Corner page(s) and student-corner.json`);

// ---------- FMGE Prep ----------
const fmgePrepFolder = "./fmge-prep-posts";
const fmgePrepFiles = fs.existsSync(fmgePrepFolder) ? fs.readdirSync(fmgePrepFolder) : [];

const fmgePrepPosts = fmgePrepFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(fmgePrepFolder, file), "utf8");
    const { data, body } = parseFrontmatter(raw);

    const title = data.title || "Untitled";
    const tag = "FMGE Prep";
    const icon = ICONS[tag] || DEFAULT_ICON;
    const subject = data.subject || "";
    const dateDisplay = formatDate(data.date);
    const image = data.image || "";
    const author = data.author || "";
    const summary = data.summary || body.split("\n").find(l => l.trim().length > 0) || "";
    const readMinutes = estimateReadTime(body);

    const htmlBody = marked(body);
    const slug = file.replace(".md", "");
    const link = `${slug}.html`;

    fs.writeFileSync(link, renderPostPage({ title, dateDisplay, tag, icon, htmlBody, image, author, summary }));

    return {
      title,
      date: data.date || "",
      dateDisplay,
      tag,
      subject,
      summary: summary.length > 160 ? summary.slice(0, 157) + "..." : summary,
      readMinutes,
      image,
      link,
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync("fmge-prep.json", JSON.stringify(fmgePrepPosts, null, 2));
console.log(`Generated ${fmgePrepPosts.length} FMGE Prep page(s) and fmge-prep.json`);

function renderNewsPage({ title, dateDisplay, htmlBody, summary, sourceName, sourceUrl, image, author }) {
  const bannerHtml = image
    ? `<div class="wrap"><img src="${image}" alt="${title}" class="post-banner reveal"></div>`
    : "";
  const sourceHtml = sourceUrl
    ? `<p><a href="${sourceUrl}" target="_blank" rel="noopener">Source: ${sourceName || "Link"} &rarr;</a></p>`
    : (sourceName ? `<p class="byline" style="border:none;padding:0;">Source: ${sourceName}</p>` : "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3611MH8QQQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3611MH8QQQ');
    gtag('config', 'AW-18331622783');
  </script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2371873453043295"
     crossorigin="anonymous"></script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Medicine4life</title>
<meta name="description" content="${summary.replace(/"/g, '&quot;')}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${summary.replace(/"/g, '&quot;')}">
<meta property="og:type" content="article">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display&family=Arimo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
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
      <a href="the-basics.html">The Basics</a>
      <a href="student-corner.html">Student Corner</a>
      <a href="fmge-prep.html">FMGE Prep</a>
      <a href="glossary.html">Glossary</a>
      <a href="disease-library.html">Disease Library</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="search.html" class="nav-search" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      </a>
    </nav>
  </div>
</header>

<article>
  <div class="wrap post-header">
    <div class="tag"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h6l3-9 4 18 3-9h6"/></svg>News</div>
    <h1>${title}</h1>
    <div class="byline">${author || "Medicine4life"} · ${dateDisplay}</div>
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
    <span class="footer-owner">Owned by — Sushil Dethaliya</span>
    <div class="footer-social">
      <a href="https://www.instagram.com/medicine4life__?igsh=MW44NHNyOGFtdzhuOA%3D%3D&utm_source=qr" target="_blank" rel="noopener" aria-label="Medicine4life on Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
      </a>
    </div>
    <span class="footer-legal"><a href="privacy.html">Privacy Policy</a> · <a href="disclaimer.html">Disclaimer</a></span>
    <span>&copy; 2026</span>
  </div>
</footer>

<script src="script.js" defer></script>
</body>
</html>
`;
}

// ---------- Glossary page ----------
function renderGlossaryPage(entries) {
  const sorted = [...entries].sort((a, b) => a.term.localeCompare(b.term));
  let lastLetter = "";
  const entriesHtml = sorted.map(e => {
    const letter = e.term.charAt(0).toUpperCase();
    const letterHtml = letter !== lastLetter ? `<div class="glossary-letter">${letter}</div>` : "";
    lastLetter = letter;
    return `${letterHtml}
  <div class="glossary-entry" id="${slugify(e.term)}">
    <div class="glossary-term-row">
      ${e.image ? `<img src="${e.image}" alt="${e.term}" class="glossary-thumb">` : ""}
      <div class="glossary-term">${e.term}</div>
    </div>
    <div class="glossary-def">${e.definition}</div>
  </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3611MH8QQQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3611MH8QQQ');
    gtag('config', 'AW-18331622783');
  </script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2371873453043295"
     crossorigin="anonymous"></script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Glossary — Medicine4life</title>
<meta name="description" content="Plain-language definitions of medical technology and research terms used across Medicine4life.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display&family=Arimo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="icon" type="image/png" href="images/favicon-32.png">
<link rel="apple-touch-icon" href="images/favicon-180.png">
<noscript><style>.reveal{opacity:1!important;transform:none!important;}</style></noscript>
<style>
  .glossary-entry { padding: 20px 0; border-bottom: 1px solid var(--line); }
  .glossary-entry:last-child { border-bottom: none; }
  .glossary-term-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .glossary-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .glossary-term { font-family: var(--font-display); font-size: 1.15rem; margin-bottom: 0; }
  .glossary-def { color: var(--ink-soft); line-height: 1.6; }
  .glossary-letter { font-family: var(--font-mono); font-size: 0.8rem; letter-spacing: 0.08em; color: var(--signal); margin-top: 36px; margin-bottom: 4px; text-transform: uppercase; }
  .glossary-letter:first-child { margin-top: 0; }
</style>
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <div class="logo"><a href="index.html" style="display:flex;"><img src="images/logo.png" alt="Medicine4life"></a></div>
    <nav class="site-nav">
      <a href="index.html">Home</a>
      <a href="blog.html">Articles</a>
      <a href="news.html">News</a>
      <a href="the-basics.html">The Basics</a>
      <a href="student-corner.html">Student Corner</a>
      <a href="fmge-prep.html">FMGE Prep</a>
      <a href="glossary.html" class="active">Glossary</a>
      <a href="disease-library.html">Disease Library</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="search.html" class="nav-search" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      </a>
    </nav>
  </div>
</header>

<main class="wrap page-body">
  <h1>Glossary</h1>
  <p style="color: var(--ink-soft); margin-bottom: 20px;">Plain-language definitions of terms you'll see across the site. Growing as new articles are published.</p>

  ${entriesHtml || '<p style="color: var(--ink-soft);">No terms yet.</p>'}
</main>

<footer class="site-footer">
  <div class="wrap">
    <span class="brand-mark"><svg width="16" height="16" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15h6l3-9 4 18 3-9h6"/></svg>Medicine4life — medical technology, explained clearly</span>
    <span class="footer-owner">Owned by — Sushil Dethaliya</span>
    <div class="footer-social">
      <a href="https://www.instagram.com/medicine4life__?igsh=MW44NHNyOGFtdzhuOA%3D%3D&utm_source=qr" target="_blank" rel="noopener" aria-label="Medicine4life on Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
      </a>
    </div>
    <span class="footer-legal"><a href="privacy.html">Privacy Policy</a> · <a href="disclaimer.html">Disclaimer</a></span>
    <span>&copy; 2026</span>
  </div>
</footer>

<script src="script.js" defer></script>
</body>
</html>
`;
}

// ---------- Disease Library page ----------
function renderDiseaseLibraryPage(entries) {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  const cardsHtml = sorted.map(d => `
  <div class="disease-card" id="${slugify(d.name)}">
    ${d.image ? `<img src="${d.image}" alt="${d.name}" class="disease-image">` : ""}
    <div class="disease-name">${d.name}</div>
    <div class="disease-section-label">Overview</div>
    <div class="disease-text">${d.overview}</div>
    <div class="disease-section-label">Why it matters</div>
    <div class="disease-text">${d.whyItMatters}</div>
    <div class="disease-section-label">Current treatment landscape</div>
    <div class="disease-text">${d.treatment}</div>
  </div>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3611MH8QQQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3611MH8QQQ');
    gtag('config', 'AW-18331622783');
  </script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2371873453043295"
     crossorigin="anonymous"></script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Disease Library — Medicine4life</title>
<meta name="description" content="General, plain-language overviews of diseases and conditions covered across Medicine4life articles — not a substitute for medical advice.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display&family=Arimo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="icon" type="image/png" href="images/favicon-32.png">
<link rel="apple-touch-icon" href="images/favicon-180.png">
<noscript><style>.reveal{opacity:1!important;transform:none!important;}</style></noscript>
<style>
  .disease-card { padding: 24px 0; border-bottom: 1px solid var(--line); }
  .disease-image { width: 100%; max-height: 280px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
  .disease-card:last-child { border-bottom: none; }
  .disease-name { font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 10px; }
  .disease-section-label { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--signal); margin-top: 14px; margin-bottom: 4px; }
  .disease-section-label:first-of-type { margin-top: 0; }
  .disease-text { color: var(--ink-soft); line-height: 1.6; }
  .disease-note { margin-top: 40px; padding: 16px 20px; background: var(--bg-alt); border: 1px solid var(--line); border-radius: 8px; font-size: 0.9rem; color: var(--ink-soft); }
</style>
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <div class="logo"><a href="index.html" style="display:flex;"><img src="images/logo.png" alt="Medicine4life"></a></div>
    <nav class="site-nav">
      <a href="index.html">Home</a>
      <a href="blog.html">Articles</a>
      <a href="news.html">News</a>
      <a href="the-basics.html">The Basics</a>
      <a href="student-corner.html">Student Corner</a>
      <a href="fmge-prep.html">FMGE Prep</a>
      <a href="glossary.html">Glossary</a>
      <a href="disease-library.html" class="active">Disease Library</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="search.html" class="nav-search" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      </a>
    </nav>
  </div>
</header>

<main class="wrap page-body">
  <h1>Disease Library</h1>
  <p style="color: var(--ink-soft); margin-bottom: 20px;">General overviews of conditions referenced in our articles — background context, not diagnosis or treatment guidance.</p>

  ${cardsHtml || '<p style="color: var(--ink-soft);">No entries yet.</p>'}

  <div class="disease-note">
    This library provides general background information only and does not cover every aspect of these conditions. It is not medical advice — see our <a href="disclaimer.html">Disclaimer</a> for more, and always consult a healthcare professional for questions about a specific diagnosis or treatment.
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <span class="brand-mark"><svg width="16" height="16" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15h6l3-9 4 18 3-9h6"/></svg>Medicine4life — medical technology, explained clearly</span>
    <span class="footer-owner">Owned by — Sushil Dethaliya</span>
    <div class="footer-social">
      <a href="https://www.instagram.com/medicine4life__?igsh=MW44NHNyOGFtdzhuOA%3D%3D&utm_source=qr" target="_blank" rel="noopener" aria-label="Medicine4life on Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
      </a>
    </div>
    <span class="footer-legal"><a href="privacy.html">Privacy Policy</a> · <a href="disclaimer.html">Disclaimer</a></span>
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

// ---------- Glossary ----------
const glossaryFolder = "glossary";
const glossaryFiles = fs.existsSync(glossaryFolder) ? fs.readdirSync(glossaryFolder) : [];

const glossaryEntries = glossaryFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(glossaryFolder, file), "utf8");
    const { data } = parseFrontmatter(raw);
    return {
      term: data.term || "Untitled",
      definition: data.definition || "",
      image: data.image || "",
    };
  });

fs.writeFileSync("glossary.html", renderGlossaryPage(glossaryEntries));
fs.writeFileSync("glossary.json", JSON.stringify(
  glossaryEntries.map(e => ({ ...e, slug: slugify(e.term) })), null, 2
));
console.log(`Generated glossary.html, glossary.json (${glossaryEntries.length} term(s))`);

// ---------- Disease Library ----------
const diseasesFolder = "diseases";
const diseaseFiles = fs.existsSync(diseasesFolder) ? fs.readdirSync(diseasesFolder) : [];

const diseaseEntries = diseaseFiles
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const raw = fs.readFileSync(path.join(diseasesFolder, file), "utf8");
    const { data } = parseFrontmatter(raw);
    return {
      name: data.name || "Untitled",
      overview: data.overview || "",
      whyItMatters: data.whyItMatters || "",
      treatment: data.treatment || "",
      image: data.image || "",
    };
  });

fs.writeFileSync("disease-library.html", renderDiseaseLibraryPage(diseaseEntries));
fs.writeFileSync("diseases.json", JSON.stringify(
  diseaseEntries.map(d => ({ ...d, slug: slugify(d.name) })), null, 2
));
console.log(`Generated disease-library.html, diseases.json (${diseaseEntries.length} entr${diseaseEntries.length === 1 ? "y" : "ies"})`);

// ---------- Typography (CMS-controlled site fonts) ----------
const FONT_STACKS = {
  "Libre Baskerville": '"Libre Baskerville", Georgia, serif',
  "Playfair Display": '"Playfair Display", Georgia, serif',
  "Merriweather": '"Merriweather", Georgia, serif',
  "Lora": '"Lora", Georgia, serif',
  "Fraunces": '"Fraunces", Georgia, serif',
  "DM Serif Display": '"DM Serif Display", Georgia, serif',
  "Arimo": '"Arimo", -apple-system, sans-serif',
  "Inter": '"Inter", -apple-system, sans-serif',
  "Source Sans 3": '"Source Sans 3", -apple-system, sans-serif',
  "Work Sans": '"Work Sans", -apple-system, sans-serif',
  "Nunito Sans": '"Nunito Sans", -apple-system, sans-serif',
};

const typographySettingsPath = "settings/typography.json";
if (fs.existsSync(typographySettingsPath) && fs.existsSync("style.css")) {
  const settings = JSON.parse(fs.readFileSync(typographySettingsPath, "utf8"));
  const headingStack = FONT_STACKS[settings.headingFont] || FONT_STACKS["Libre Baskerville"];
  const bodyStack = FONT_STACKS[settings.bodyFont] || FONT_STACKS["Arimo"];

  let css = fs.readFileSync("style.css", "utf8");
  css = css.replace(/--font-display:\s*[^;]+;/, `--font-display: ${headingStack};`);
  css = css.replace(/--font-body:\s*[^;]+;/, `--font-body: ${bodyStack};`);
  fs.writeFileSync("style.css", css);
  console.log(`Applied typography: heading = ${settings.headingFont}, body = ${settings.bodyFont}`);
} else {
  console.log("No typography settings found — skipping font update.");
}
