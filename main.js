/* ============================================================
   Caristo Surgical Excellence — main.js
   Handles: mobile menu, entrance animations, word-split
   headlines, number counters, reduced motion compliance.
   ============================================================ */

(function () {
  "use strict";

  /* ── Reduced motion check ── */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ── 1. Mobile menu toggle ── */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.contains("open");

      if (isOpen) {
        mobileMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.querySelector(".material-symbols-outlined").textContent =
          "menu";
        menuToggle.setAttribute("aria-label", "Open navigation menu");
        // Hide after transition ends
        setTimeout(() => {
          if (!mobileMenu.classList.contains("open")) {
            mobileMenu.hidden = true;
          }
        }, 300);
      } else {
        mobileMenu.hidden = false;
        // Force reflow before adding open class so transition plays
        mobileMenu.offsetHeight;
        mobileMenu.classList.add("open");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.querySelector(".material-symbols-outlined").textContent =
          "close";
        menuToggle.setAttribute("aria-label", "Close navigation menu");
      }
    });

    // Close menu when a link inside it is clicked
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.querySelector(".material-symbols-outlined").textContent =
          "menu";
        menuToggle.setAttribute("aria-label", "Open navigation menu");
        setTimeout(() => { mobileMenu.hidden = true; }, 300);
      });
    });
  }

  /* ── 2. Word-by-word headline split ── */
  function splitWords(el, text) {
    el.innerHTML = "";
    const words = text.trim().split(/\s+/);
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      if (!prefersReducedMotion) {
        span.style.animationDelay = (i * 0.1) + "s";
      }
      el.appendChild(span);
    });
  }

  const headlineTexts = {
    // Hero h1
    ".word-split[aria-label='Excellence in Cardiothoracic Surgery']":
      "Excellence in Cardiothoracic Surgery",
    // Quote
    ".word-split[aria-label='Restoring heart health through surgical innovation and empathy.']":
      "“Restoring heart health through surgical innovation and empathy.”",
  };

  Object.entries(headlineTexts).forEach(([selector, text]) => {
    const el = document.querySelector(selector);
    if (el) splitWords(el, text);
  });

  /* ── 3. IntersectionObserver — entrance animations ── */
  const THRESHOLD = 0.1;

  function observeElements(selector, animClass, options = {}) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animClass);
          entry.target.classList.remove(
            "will-animate",
            "will-animate-image",
            "will-animate-line"
          );
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: THRESHOLD, ...options });

    els.forEach((el) => obs.observe(el));
  }

  // Standard content blocks
  observeElements(".will-animate", "animate-entrance");
  // Images
  observeElements(".will-animate-image", "animate-image");
  // Divider lines
  observeElements(".will-animate-line", "animate-line");

  // Word-split headlines (triggered by visibility)
  const wordHeadlines = document.querySelectorAll(".word-split");
  if (wordHeadlines.length) {
    const headlineObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-words");
          headlineObs.unobserve(entry.target);
        }
      });
    }, { threshold: THRESHOLD });
    wordHeadlines.forEach((el) => headlineObs.observe(el));
  }

  /* ── 4. Number counters ── */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = prefersReducedMotion ? 0 : 1400;
    const suffix = el.dataset.suffix || "";
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOutCubic(progress) * target);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + suffix;
    }

    requestAnimationFrame(tick);
  }

  const counters = document.querySelectorAll(".counter");
  if (counters.length) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Also trigger the entrance animation
          entry.target.classList.add("animate-entrance");
          entry.target.classList.remove("will-animate");
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach((el) => counterObs.observe(el));
  }

  /* ── 5. Active nav link on scroll ── */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll("nav a.nav-link");

  if (sections.length && navLinks.length) {
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => sectionObs.observe(s));
  }

  /* ── 6. Contact form — basic handler ── */
  const form = document.getElementById("contact-form");
  const formSuccess = document.getElementById("form-success");

  if (form && formSuccess) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Basic required-field validation
      const requiredFields = form.querySelectorAll("[required]");
      let valid = true;
      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderBottomColor = "var(--color-error)";
        } else {
          field.style.borderBottomColor = "";
        }
      });
      if (!valid) return;

      // Show success message
      form.querySelectorAll("input, select, button").forEach((el) => {
        el.disabled = true;
      });
      formSuccess.hidden = false;
      formSuccess.focus();
    });
  }

})();
