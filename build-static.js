const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const output = path.join(root, "dist");
const publicDirectories = ["images"];
const retiredDataFiles = new Set([
  "diseases.json",
  "fmge-prep.json",
  "glossary.json",
  "news.json",
  "student-corner.json",
  "the-basics.json",
]);
const retiredRoutes = [
  "disease-library.html",
  "fmge-prep.html",
  "glossary.html",
  "news.html",
  "student-corner.html",
  "the-basics.html",
];
const publicExtensions = new Set([
  ".css",
  ".html",
  ".ico",
  ".js",
  ".json",
  ".txt",
  ".webmanifest",
  ".xml",
]);

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile() || !publicExtensions.has(path.extname(entry.name)) || retiredDataFiles.has(entry.name)) continue;
  fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
}

for (const directory of publicDirectories) {
  const source = path.join(root, directory);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(output, directory), { recursive: true });
}

for (const route of retiredRoutes) {
  fs.writeFileSync(
    path.join(output, route),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=blog.html"><link rel="canonical" href="https://medicine4life.org/blog.html"><title>Articles — Medicine4Life</title></head><body><p>This section has moved to <a href="blog.html">Medicine4Life Articles</a>.</p></body></html>`,
  );
}

const assetCount = fs
  .readdirSync(output, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile()).length;

console.log(`Prepared ${assetCount} public files in dist/`);
