const fs = require("fs");
const path = require("path");

const postsFolder = "./posts";

const files = fs.readdirSync(postsFolder);

const posts = files
  .filter(file => file.endsWith(".md"))
  .map(file => {
    const content = fs.readFileSync(
      path.join(postsFolder, file),
      "utf8"
    );

    const title = content.match(/title:\s*(.*)/);
    const date = content.match(/date:\s*(.*)/);

    return {
      title: title ? title[1].replace(/"/g, "") : "Untitled",
      date: date ? date[1].replace(/"/g, "") : "",
      summary: "",
      link: file.replace(".md", ".html")
    };
  });

fs.writeFileSync(
  "posts.json",
  JSON.stringify(posts, null, 2)
);

console.log("posts.json generated");
