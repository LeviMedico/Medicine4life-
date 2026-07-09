const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const postsFolder = "./posts";

const files = fs.readdirSync(postsFolder);

const posts = files
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const content = fs.readFileSync(
      path.join(postsFolder, file),
      "utf8"
    );

    const titleMatch = content.match(/title:\s*"(.+)"/);
    const dateMatch = content.match(/date:\s*(.+)/);

    const title = titleMatch ? titleMatch[1] : "Untitled";
    const date = dateMatch ? dateMatch[1] : "";

    const body = content
      .replace(/^---[\s\S]*?---/, "")
      .trim();

    const htmlContent = marked(body);

    const slug = file.replace(".md", "");

    const page = `
<!DOCTYPE html>
<html>
<head>
<title>${title} - Medicine4Life</title>
<meta name="description" content="${title}">
<link rel="stylesheet" href="style.css">
</head>

<body>

<header class="site-header">
<div class="wrap">
<div class="logo">Medicine4Life</div>
<nav class="site-nav">
<a href="index.html">Home</a>
<a href="blog.html">Articles</a>
<a href="about.html">About</a>
<a href="contact.html">Contact</a>
</nav>
</div>
</header>

<main class="article-page">

<h1>${title}</h1>
<p>${date}</p>

${htmlContent}

</main>

</body>
</html>
`;

    fs.writeFileSync(
      `${slug}.html`,
      page
    );

    return {
      title,
      date,
      summary: "",
      link: `${slug}.html`
    };
  });

fs.writeFileSync(
  "posts.json",
  JSON.stringify(posts, null, 2)
);

console.log("Articles generated");
