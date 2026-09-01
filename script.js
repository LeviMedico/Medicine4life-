// Scroll-reveal: fades/slides elements with class "reveal" into view as they enter the viewport.
// Exposed on window so pages that insert cards dynamically (e.g. via fetch) can re-run it afterward.
window.initReveal = function () {
  const revealEls = document.querySelectorAll(".reveal:not(.reveal-bound)");

  if (!("IntersectionObserver" in window) || revealEls.length === 0) {
    revealEls.forEach(el => el.classList.add("in-view", "reveal-bound"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach(el => {
    el.classList.add("reveal-bound");
    observer.observe(el);
  });
};

function hydrateSiteShell() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const activeClass = (page) => (currentPage === page ? " active" : "");
  const header = document.querySelector(".site-header");
  const footer = document.querySelector(".site-footer");

  if (header) {
    header.innerHTML = `
      <div class="wrap site-shell-inner">
        <a class="site-brand" href="index.html" aria-label="Medicine4Life home">
          <img src="images/favicon-180.png" alt="" width="52" height="52">
          <span>Medicine4Life</span>
        </a>
        <button class="site-menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="site-navigation">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav" id="site-navigation" aria-label="Primary navigation">
          <a class="${activeClass("index.html")}" href="index.html">Home</a>
          <a class="${activeClass("blog.html")}" href="blog.html">Articles</a>
          <a class="${activeClass("about.html")}" href="about.html">About</a>
          <a class="${activeClass("contact.html")}" href="contact.html">Contact</a>
          <a class="nav-search${activeClass("search.html")}" href="search.html" aria-label="Search articles">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <span>Search</span>
          </a>
          <span class="site-status"><i></i> Closed testing soon</span>
        </nav>
      </div>`;

    const menuButton = header.querySelector(".site-menu-button");
    const navigation = header.querySelector(".site-nav");
    menuButton?.addEventListener("click", () => {
      const open = navigation.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
  }

  if (footer) {
    footer.innerHTML = `
      <div class="wrap site-footer-grid">
        <div class="site-footer-brand">
          <a class="site-brand" href="index.html"><img src="images/favicon-180.png" alt="" width="52" height="52"><span>Medicine4Life</span></a>
          <p>Clinical education, made approachable.</p>
        </div>
        <div class="site-footer-links"><strong>Explore</strong><a href="index.html#features">Features</a><a href="blog.html">Articles</a><a href="about.html">About</a><a href="contact.html">Contact</a></div>
        <div class="site-footer-links"><strong>Legal</strong><a href="privacy.html">Privacy policy</a><a href="disclaimer.html">Disclaimer</a></div>
      </div>
      <div class="wrap site-footer-bottom"><span>© 2026 Medicine4Life. Owned by Sushil Dethaliya.</span><span>For medical education only.</span></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  hydrateSiteShell();
  window.initReveal();
});

