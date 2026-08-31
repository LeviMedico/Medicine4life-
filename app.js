const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");

const setHeaderState = () => {
  header?.classList.toggle("scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  menu?.classList.toggle("open", !isOpen);
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Open navigation");
    menu?.classList.remove("open");
  });
});

const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add("in-view"));
}

const articleGrid = document.querySelector("[data-article-grid]");

const escapeHtml = (value = "") => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

if (articleGrid) {
  fetch("posts.json")
    .then((response) => {
      if (!response.ok) throw new Error("Article feed unavailable");
      return response.json();
    })
    .then((posts) => {
      const selected = Array.isArray(posts) ? posts.slice(0, 3) : [];

      if (!selected.length) {
        articleGrid.innerHTML = '<p class="article-empty">Reviewed Medicine4Life articles will appear here after publication.</p>';
        return;
      }

      articleGrid.innerHTML = selected.map((post) => {
        const title = escapeHtml(String(post.title || "Medicine4Life article"));
        const summary = escapeHtml(String(post.summary || "A focused clinical reading from Medicine4Life."));
        const tag = escapeHtml(String(post.tag || "Clinical reading"));
        const link = escapeHtml(String(post.link || "blog.html"));
        const minutes = post.readMinutes ? `${escapeHtml(String(post.readMinutes))} min read` : "Clinical reading";

        return `
          <a class="article-card" href="${link}">
            <span class="article-tag">${tag}</span>
            <h3>${title}</h3>
            <p>${summary}</p>
            <span class="article-meta">${minutes} &nbsp;→</span>
          </a>`;
      }).join("");
    })
    .catch(() => {
      articleGrid.innerHTML = '<p class="article-empty">The reading library is temporarily unavailable. <a href="blog.html">Browse articles directly →</a></p>';
    });
}
