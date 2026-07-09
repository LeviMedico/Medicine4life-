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

document.addEventListener("DOMContentLoaded", () => window.initReveal());

