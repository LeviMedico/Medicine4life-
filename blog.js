fetch('posts.json')
  .then(response => response.json())
  .then(posts => {
    const container = document.getElementById('posts');

    container.innerHTML = "";

    posts.forEach(post => {
      container.innerHTML += `
        <article>
          <h2>${post.title}</h2>
          <p>${post.date}</p>
          <p>${post.summary}</p>
        </article>
      `;
    });
  })
  .catch(error => {
    document.getElementById('posts').innerHTML =
      "Unable to load articles.";
  });
