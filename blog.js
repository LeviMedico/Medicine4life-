fetch('/posts')
  .then(response => response.text())
  .then(data => {
    document.getElementById('posts').innerHTML =
      "Your posts are saved. A blog renderer will be added next.";
  });
