const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const output = path.join(root, "dist");
const publicDirectories = ["admin", "images"];
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
  if (!entry.isFile() || !publicExtensions.has(path.extname(entry.name))) continue;
  fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
}

for (const directory of publicDirectories) {
  const source = path.join(root, directory);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(output, directory), { recursive: true });
}

const assetCount = fs
  .readdirSync(output, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile()).length;

console.log(`Prepared ${assetCount} public files in dist/`);
