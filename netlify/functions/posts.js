const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  const postsPath = path.join(process.cwd(), "posts");

  const files = fs.readdirSync(postsPath);

  const posts = files
    .filter(file => file.endsWith(".md"))
    .map(file => {
      const content = fs.readFileSync(
        path.join(postsPath, file),
        "utf8"
      );

      const title = content.match(/title:\s*["']?(.*?)["']?\n/);
      const date = content.match(/date:\s*["']?(.*?)["']?\n/);

      return {
        title: title ? title[1] : "Untitled",
        date: date ? date[1] : "",
        link: file.replace(".md", ".html")
      };
    });

  return {
    statusCode: 200,
    body: JSON.stringify(posts)
  };
};
