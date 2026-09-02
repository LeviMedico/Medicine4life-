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

const showcase = document.querySelector("[data-showcase]");
const showcaseTabs = Array.from(document.querySelectorAll("[data-showcase-key]"));

const showcaseContent = {
  tutor: {
    mode: "tutor",
    image: "images/app-screens/ai-tutor.png",
    alt: "Medicine4Life AI Clinical Tutor screen",
    kicker: "Understand",
    title: "Turn a question into a learning path.",
    description: "Ask naturally, then move into a simpler explanation, a comparison, an MCQ, or flashcards without breaking your study flow.",
    points: [
      "Clinical explanations in a structured reading view",
      "One-tap follow-ups for active learning",
      "Clear educational and privacy boundaries"
    ],
    statOne: "5",
    statOneLabel: "learning actions",
    statTwo: "1",
    statTwoLabel: "focused conversation",
    badgeOne: "Ready to learn",
    badgeTwo: "Source-aware"
  },
  medquest: {
    mode: "medquest",
    image: "images/app-screens/medquest.png",
    alt: "Medicine4Life MedQuest topic paths screen",
    kicker: "Play",
    title: "Make recall feel worth returning to.",
    description: "Move through subject paths with short challenges that test recognition, connection, and clinical reasoning—not just isolated facts.",
    points: [
      "MedDecode, Drug Match, and Diagnose It",
      "Subject paths with progressive difficulty",
      "Explanations that make every answer useful"
    ],
    statOne: "3",
    statOneLabel: "game formats",
    statTwo: "3",
    statTwoLabel: "difficulty levels",
    badgeOne: "Daily challenge",
    badgeTwo: "XP + streaks"
  },
  mastery: {
    mode: "mastery",
    image: "images/app-screens/home.png",
    alt: "Medicine4Life home and mastery dashboard",
    kicker: "Measure",
    title: "Turn activity into a clear next step.",
    description: "Study, play, reading, and recall contribute to one calm progress view, helping learners see momentum without chasing disconnected scores.",
    points: [
      "Subject strength and recent learning together",
      "Quiz, flashcard, and game signals in one model",
      "Weekly rhythm that encourages consistent study"
    ],
    statOne: "6",
    statOneLabel: "learning signals",
    statTwo: "1",
    statTwoLabel: "progress system",
    badgeOne: "Subject strength",
    badgeTwo: "Weekly rhythm"
  }
};

let showcaseChangeId = 0;

const updateShowcase = (key, focusTab = false) => {
  const content = showcaseContent[key];
  if (!showcase || !content) return;

  const activeTab = showcaseTabs.find((tab) => tab.dataset.showcaseKey === key);
  showcaseTabs.forEach((tab) => {
    const isActive = tab === activeTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  if (focusTab) activeTab?.focus();
  showcase.dataset.mode = content.mode;

  const panel = showcase.querySelector("[role='tabpanel']");
  panel?.setAttribute("aria-labelledby", activeTab?.id || "");
  showcase.querySelector("[data-showcase-kicker]").textContent = content.kicker;
  showcase.querySelector("[data-showcase-title]").textContent = content.title;
  showcase.querySelector("[data-showcase-description]").textContent = content.description;
  showcase.querySelector("[data-showcase-points]").innerHTML = content.points.map((point) => `<li>${point}</li>`).join("");
  showcase.querySelector("[data-showcase-stat-one]").textContent = content.statOne;
  showcase.querySelector("[data-showcase-stat-one-label]").textContent = content.statOneLabel;
  showcase.querySelector("[data-showcase-stat-two]").textContent = content.statTwo;
  showcase.querySelector("[data-showcase-stat-two-label]").textContent = content.statTwoLabel;
  showcase.querySelector("[data-showcase-badge-one]").textContent = content.badgeOne;
  showcase.querySelector("[data-showcase-badge-two]").textContent = content.badgeTwo;

  const metrics = showcase.querySelector(".showcase-metrics");
  metrics?.classList.remove("pulse");
  requestAnimationFrame(() => metrics?.classList.add("pulse"));

  const phone = showcase.querySelector("[data-showcase-phone]");
  const image = showcase.querySelector("[data-showcase-image]");
  const changeId = ++showcaseChangeId;
  phone?.classList.add("is-changing");
  window.setTimeout(() => {
    if (changeId !== showcaseChangeId || !image) return;
    image.src = content.image;
    image.alt = content.alt;
    requestAnimationFrame(() => phone?.classList.remove("is-changing"));
  }, 150);
};

showcaseTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => updateShowcase(tab.dataset.showcaseKey));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % showcaseTabs.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + showcaseTabs.length) % showcaseTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = showcaseTabs.length - 1;
    updateShowcase(showcaseTabs[nextIndex].dataset.showcaseKey, true);
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const masteryRing = document.querySelector(".mastery-ring[data-progress]");

const animateMastery = () => {
  if (!masteryRing || masteryRing.dataset.animated === "true") return;
  masteryRing.dataset.animated = "true";
  showcase?.querySelector(".showcase-metrics")?.classList.add("pulse");
  const target = Number(masteryRing.dataset.progress) || 0;
  const value = masteryRing.querySelector("[data-mastery-value]");
  if (reducedMotion.matches) {
    masteryRing.style.setProperty("--progress", target);
    if (value) value.textContent = `${target}%`;
    return;
  }
  const started = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - started) / 1050, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    masteryRing.style.setProperty("--progress", current);
    if (value) value.textContent = `${current}%`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if (masteryRing && "IntersectionObserver" in window) {
  const masteryObserver = new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      animateMastery();
      observer.disconnect();
    }
  }, { threshold: .4 });
  masteryObserver.observe(masteryRing);
} else {
  animateMastery();
}

document.querySelectorAll(".feature-more").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".feature-more[open]").forEach((openDetail) => {
      if (openDetail !== detail) openDetail.open = false;
    });
  });
});

if (!reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((surface) => {
    let frame;
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        surface.style.setProperty("--tilt-x", `${(-y * 3.2).toFixed(2)}deg`);
        surface.style.setProperty("--tilt-y", `${(x * 3.2).toFixed(2)}deg`);
      });
    });
    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
    });
  });
}

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

      articleGrid.innerHTML = selected.map((post, index) => {
        const title = escapeHtml(String(post.title || "Medicine4Life article"));
        const summary = escapeHtml(String(post.summary || "A focused clinical reading from Medicine4Life."));
        const tag = escapeHtml(String(post.tag || "Clinical reading"));
        const link = escapeHtml(String(post.link || "blog.html"));
        const minutes = post.readMinutes ? `${escapeHtml(String(post.readMinutes))} min read` : "Clinical reading";

        return `
          <a class="article-card article-enter" href="${link}" style="--article-delay: ${index * .07}s">
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
