/* ===================================================================
   drex blog — blog.js
   Vanilla, no deps. Three jobs, all cheap:
     1. reveal/slam in-view animations via ONE IntersectionObserver
     2. the mobile string-pull burger nav toggle
     3. a prefers-reduced-motion gate that strips motion entirely
   No work on scroll (the observer does the watching). Loaded with `defer`.
   =================================================================== */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var reduceMQ = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  /* ---- 1. motion switch ------------------------------------------------
     prefers-reduced-motion => data-motion="calm". CSS keys the hidden
     reveal state off body[data-motion="full"], so under "calm" nothing is
     ever hidden and no animation runs. Content can NEVER be trapped. */
  function applyMotion() {
    body.setAttribute("data-motion", reduceMQ.matches ? "calm" : "full");
  }
  applyMotion();
  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener("change", applyMotion);
  } else if (reduceMQ.addListener) {
    reduceMQ.addListener(applyMotion); // older Safari
  }

  /* ---- 2. reveal / slam observer --------------------------------------
     Adds `.in` when an element scrolls into view, then stops watching it.
     If reduced motion or no IO support: leave everything visible. */
  function initReveals() {
    if (reduceMQ.matches) return;
    if (!("IntersectionObserver" in window)) return;

    var targets = doc.querySelectorAll(".reveal, .slam");
    if (!targets.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }
  initReveals();

  /* ---- 3. mobile burger nav -------------------------------------------
     Toggles .open on the nav + the body (for scroll-lock hooks) and keeps
     aria-expanded in sync. Closes on link tap, Escape, or outside click. */
  function initBurger() {
    var burger = doc.getElementById("m-burger");
    var nav = doc.getElementById("mob-nav");
    if (!burger || !nav) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("open", open);
      body.classList.toggle("nav-open", open);
    }

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });

    doc.addEventListener("click", function (e) {
      if (burger.getAttribute("aria-expanded") !== "true") return;
      if (e.target.closest("#mob-nav") || e.target.closest("#m-burger")) return;
      setOpen(false);
    });
  }
  initBurger();
})();
