/* ===================================================================
   drex blog — blog.js
   INTERACTIVITY + ANIMATION, vanilla, no deps. Jobs:
     0. run the BAKERY first (bakes the v6 material sprites into :root vars)
     1. prefers-reduced-motion gate (data-motion) — stills EVERYTHING
     1b. FOLEY — lazy WebAudio paper sound (transient+body per FEEL §B) + Android
         haptics (FEEL §A), armed on first gesture, inert under reduced motion
     2. IntersectionObserver scroll-reveal/slam with paper physics
        (+ pin-press / stamp-thunk fired as scraps land; soft drop foley)
     3. hover POINTER-TILT (lean + pick-up flap), interaction PRESS, and one
        genuinely DRAGGABLE scrap (pointer-capture + lerp settle)
     4. mobile string-pull burger nav
   No work on scroll (the observer watches). Loaded with `defer`.

   THE 5 MAGIC QUESTIONS — INTERACTIVITY (pointer-tilt, true drag, press) +
   ANIMATION (slam, settle, peel, pin-press, stamp-thunk) + FEEL (paper sound +
   haptics) answered here; MATERIAL/MAGIC/WHIMSY in bakery.js + _realism.scss.
   Legibility + reduced-motion are sacred — foley & haptics both honour them.
   =================================================================== */

// Defer the bakery's self-run so we control ordering (must be set before the
// bakery script parses — bakery.js is loaded BEFORE this file in the layout).
window.__DREX_BAKERY_DEFER__ = true;
// capture our own URL synchronously at parse time (currentScript is null later)
window.__DREX_BLOG_SRC__ = (document.currentScript && document.currentScript.src) || "";

(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var root = doc.documentElement;
  var reduceMQ = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  /* ---- 0. BAKE THE MATERIALS FIRST -----------------------------------
     The bakery is deterministic and fast (<150ms). Run it before any motion
     wiring so the sprites exist when the first frame paints. If it throws, the
     flat CSS fallback in _grounds/_post/_whimsy stays — page is never broken. */
  function runBake() {
    try {
      if (window.DrexBakery && window.DrexBakery.build) window.DrexBakery.build();
    } catch (e) {
      if (window.console && console.warn) console.warn("[drex] bakery skipped:", e);
    }
  }
  // bakery.js may be loaded by the layout (preferred) or, if absent, we inject
  // it ourselves so the material engine always runs. `defer` flag (set at top of
  // this file) keeps the bakery from self-running before we drive it.
  function bake() {
    if (window.DrexBakery && window.DrexBakery.build) { runBake(); return; }
    var s = doc.createElement("script");
    // resolve relative to this script's own URL so the baseurl is honoured.
    var here = window.__DREX_BLOG_SRC__;
    s.src = here ? here.replace(/blog\.js(\?.*)?$/, "bakery.js") : "assets/js/bakery.js";
    s.onload = runBake;
    s.onerror = function () {
      if (window.console && console.warn) console.warn("[drex] bakery.js failed to load");
    };
    doc.head.appendChild(s);
  }

  /* ---- 1. motion switch ---------------------------------------------- */
  function applyMotion() {
    body.setAttribute("data-motion", reduceMQ.matches ? "calm" : "full");
  }
  applyMotion();
  if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", applyMotion);
  else if (reduceMQ.addListener) reduceMQ.addListener(applyMotion);

  /* ---- 1b. FOLEY — WebAudio paper sound + Android haptics ------------
     FEEL.md mandate: every touch acknowledged in >=1 channel; sound + motion
     carry 100% of the feel on iOS (no vibration), haptics are Android-only
     garnish fired on the SAME tick. Each voice = a TRANSIENT (the material, the
     <=10ms tick) + a BODY (the size, 40-300ms) per FEEL §B. We jitter pitch
     +-5% / gain +-2dB on every trigger so no two strikes are identical (the
     anti-machine-gun rule). The AudioContext is created LAZILY on the first
     real user gesture (autoplay-policy compliant) and the whole module is INERT
     under prefers-reduced-motion — silence is part of a calm experience. */
  var Foley = (function () {
    var ctx = null, master = null, armed = false, noiseBuf = null;

    // jitter helpers: synthesis is a free infinite round-robin (FEEL §B).
    function jPitch(hz) { return hz * (1 + (Math.random() - 0.5) * 0.10); }   // +-5%
    function jGain(g)   { return g * Math.pow(10, (Math.random() - 0.5) * 4 / 20); } // +-2dB

    function ready() {
      if (reduceMQ.matches || !armed) return false;
      if (!ctx) return false;
      if (ctx.state === "suspended") ctx.resume();
      return ctx.state === "running";
    }

    // a small shared white-noise buffer for transients / bodies.
    function noise() {
      if (noiseBuf) return noiseBuf;
      var n = Math.floor(ctx.sampleRate * 0.4);
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }
    function srcNoise() {
      var s = ctx.createBufferSource(); s.buffer = noise(); return s;
    }
    function env(node, peak, attack, dur) {
      var g = ctx.createGain(), t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(jGain(peak), 0.0002), t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      node.connect(g); g.connect(master);
      return g;
    }

    // --- VOICES (FEEL §B) ----------------------------------------------
    // tap-select: 3ms noise->HP2k transient + 1100Hz sine body, soft.
    function tap() {
      if (!ready()) return;
      var t = ctx.currentTime;
      var nz = srcNoise(), hp = ctx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 2000; nz.connect(hp);
      env(hp, 0.05, 0.001, 0.02).gain; nz.start(t); nz.stop(t + 0.03);
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = jPitch(1100);
      env(o, 0.06, 0.004, 0.05); o.start(t); o.stop(t + 0.06);
    }
    // pick-up: 10ms noise->BP3k transient + a "flap" (LP noise sweeping 1.2k->500).
    function pickup() {
      if (!ready()) return;
      var t = ctx.currentTime;
      var tn = srcNoise(), bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = jPitch(3000); bp.Q.value = 2; tn.connect(bp);
      env(bp, 0.06, 0.001, 0.02); tn.start(t); tn.stop(t + 0.012);
      var bn = srcNoise(), lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(jPitch(1200), t);
      lp.frequency.exponentialRampToValueAtTime(500, t + 0.06);
      bn.connect(lp); env(lp, 0.07, 0.005, 0.07); bn.start(t); bn.stop(t + 0.08);
    }
    // stamp: sine drop 90->50Hz/30ms transient + BP300 Q5 noise body 150ms = MASS.
    function stamp() {
      if (!ready()) return;
      var t = ctx.currentTime;
      var o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(jPitch(90), t);
      o.frequency.exponentialRampToValueAtTime(jPitch(50), t + 0.03);
      env(o, 0.5, 0.002, 0.05); o.start(t); o.stop(t + 0.06);
      var bn = srcNoise(), bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = jPitch(300); bp.Q.value = 5; bn.connect(bp);
      env(bp, 0.28, 0.003, 0.15); bn.start(t); bn.stop(t + 0.16);
    }
    // drop / soft land: clipped 60Hz 20ms + click transient + LP200 noise body.
    function drop() {
      if (!ready()) return;
      var t = ctx.currentTime;
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = jPitch(60);
      env(o, 0.4, 0.002, 0.04); o.start(t); o.stop(t + 0.05);
      var bn = srcNoise(), lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = jPitch(200); bn.connect(lp);
      env(lp, 0.22, 0.004, 0.12); bn.start(t); bn.stop(t + 0.13);
    }
    // tape flap (peel): short LP noise sweep, lighter than pickup.
    function tape() {
      if (!ready()) return;
      var t = ctx.currentTime;
      var bn = srcNoise(), lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(jPitch(2200), t);
      lp.frequency.exponentialRampToValueAtTime(800, t + 0.05);
      bn.connect(lp); env(lp, 0.06, 0.004, 0.06); bn.start(t); bn.stop(t + 0.07);
    }

    // --- HAPTICS (Android only; same tick as sound+visual; FEEL §A) -----
    var canVibrate = !!(navigator && navigator.vibrate);
    function buzz(pat) {
      if (reduceMQ.matches || !canVibrate) return;
      try { navigator.vibrate(pat); } catch (e) { /* DND / no-op */ }
    }

    // --- ARM on first real gesture (autoplay policy) -------------------
    function arm() {
      if (armed || reduceMQ.matches) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { armed = true; return; }   // no WebAudio: haptics can still fire
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
        if (ctx.state === "suspended") ctx.resume();
      } catch (e) { ctx = null; }
      armed = true;
    }

    return {
      arm: arm,
      tap: function ()   { tap();    buzz(10); },
      pickup: function () { pickup(); buzz(20); },
      stamp: function ()  { stamp();  buzz(35); },
      drop: function ()   { drop();   buzz([30, 60, 10]); },
      tape: function ()   { tape();   /* peel: sound owns this channel */ }
    };
  })();

  // Arm the foley on the first user gesture, anywhere, once. Pointer/key/touch
  // all count as "sticky activation" for both AudioContext.resume + vibrate().
  (function armFoleyOnce() {
    if (reduceMQ.matches) return;
    function go() {
      Foley.arm();
      doc.removeEventListener("pointerdown", go, true);
      doc.removeEventListener("keydown", go, true);
      doc.removeEventListener("touchstart", go, true);
    }
    doc.addEventListener("pointerdown", go, true);
    doc.addEventListener("keydown", go, true);
    doc.addEventListener("touchstart", go, true);
  })();

  /* ---- 2. reveal / slam observer (paper physics) ---------------------
     SAFETY CONTRACT: the CSS hidden pre-animation state for .reveal/.slam is
     gated on html.js-anim. We add that class ONLY once the IntersectionObserver
     has actually been constructed — so if JS is missing/throws, IO is
     unsupported, or reduced motion is on, scraps are never stranded hidden.
     Plus: (1) above-the-fold scraps land on first paint, (2) no-IO reveals
     ALL targets, (3) a ~1.2s safety net un-hides anything the observer missed. */
  // Suppress foley during the first-paint settle so the batch of above-the-fold
  // scraps doesn't machine-gun on load; scroll-triggered lands after that DO
  // get a soft drop / stamp thunk (FEEL: acknowledge, but never a barrage).
  var soundLands = false;
  function landScrap(el) {
    if (!el || el.classList.contains("in")) return;
    el.classList.add("in");
    // as a scrap LANDS, punch in its pin / thunk down its stamp.
    var pin = el.querySelector(".pin");
    if (pin) pin.classList.add("is-press");
    var stamps = el.querySelectorAll(".stamp");
    for (var i = 0; i < stamps.length; i++) stamps[i].classList.add("is-thunk");
    // foley on the same tick as the visual land (scroll-revealed scraps only).
    if (soundLands && el.classList.contains("slam")) {
      if (stamps.length) Foley.stamp(); else Foley.drop();
    }
  }

  function initReveals() {
    if (reduceMQ.matches) return;

    var targets = doc.querySelectorAll(".reveal, .slam");
    if (!targets.length) return;

    // No IntersectionObserver support: reveal EVERY target, then bail. Never
    // arm html.js-anim here — nothing can un-hide a scroll-hidden scrap.
    if (!("IntersectionObserver" in window)) {
      for (var n = 0; n < targets.length; n++) landScrap(targets[n]);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          landScrap(e.target);
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    // FAIL-OPEN: the observer now exists and WILL run — only at this point is it
    // safe to let CSS hide scraps (html.js-anim ... .reveal/.slam{opacity:0}).
    root.classList.add("js-anim");

    var vh = window.innerHeight || doc.documentElement.clientHeight || 0;
    targets.forEach(function (el) {
      // above-the-fold scraps must show on first paint (no scroll will fire).
      if (el.getBoundingClientRect().top < vh) { landScrap(el); io.unobserve(el); return; }
      io.observe(el);
    });

    // first-paint batch has landed silently above; from here on, scroll-revealed
    // scraps may sound. (rAF defers past this synchronous .in pass.)
    requestAnimationFrame(function () { soundLands = true; });

    // SAFETY NET: anything still hidden after ~1.2s gets forced visible, so a
    // mis-firing/never-firing observer can't strand content off-screen.
    window.setTimeout(function () {
      var stuck = doc.querySelectorAll(".slam:not(.in), .reveal:not(.in)");
      for (var i = 0; i < stuck.length; i++) {
        landScrap(stuck[i]);
        io.unobserve(stuck[i]);
      }
    }, 1200);
  }

  /* ---- 3. light POINTER-TILT on scraps (pointer parallax, capped) ----
     Renamed from initDragTilt -> initPointerTilt for honesty: this is a hover
     LEAN, not a drag (true drag lives in initDrag below). A scrap leans a hair
     toward the pointer — it feels like a pickable object without leaving its
     spot. On pointer ENTER it also plays a soft "pick-up" foley flap (FEEL:
     hover = picking the object up). Cheap: rAF-throttled, capped ~4deg, and
     fully disabled under reduced motion or coarse-only (touch) pointers. */
  function initPointerTilt() {
    if (reduceMQ.matches) return;
    if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) return;

    // The ACTUAL pickable objects across home + post: card splays, polaroids,
    // the bulletin clips, the board headline, loose scraps and pull-quotes.
    var cards = doc.querySelectorAll(
      ".splay > .card, .polaroid, .board-pile > .clip, .board-head, .scrap, .pullquote"
    );
    if (!cards.length) return;
    var MAX = 4; // deg

    cards.forEach(function (card) {
      var raf = 0, tx = 0, ty = 0;
      function paint() {
        raf = 0;
        card.style.setProperty("--tilt-x", tx.toFixed(2) + "deg");
        card.style.setProperty("--tilt-y", ty.toFixed(2) + "deg");
      }
      card.addEventListener("pointerenter", function (ev) {
        if (ev.pointerType === "touch") return;
        // a taped scrap flaps its tape; an un-taped one gets the lighter pick-up.
        if (card.querySelector(".tape")) Foley.tape(); else Foley.pickup();
      });
      card.addEventListener("pointermove", function (ev) {
        if (ev.pointerType === "touch") return;
        if (card.classList.contains("is-dragging")) return;  // don't lean while dragging
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        ty = px * MAX;            // horizontal pointer → Y-ish lean
        tx = -py * MAX;           // vertical pointer → X-ish lean
        if (!raf) raf = requestAnimationFrame(paint);
      });
      card.addEventListener("pointerleave", function () {
        tx = ty = 0;
        if (!raf) raf = requestAnimationFrame(paint);
      });
    });
  }

  /* ---- 3b. interaction-driven PRESS (acknowledge every touch) --------
     FEEL principle 1: every touch gets a physical reply. Pressing a clip
     punches its pin in (drex-pin-press) and bumps the clip body (drex-lift);
     pressing a stamp thunks it down (drex-stamp-thunk). Re-triggering needs an
     animation restart, so we strip the state class, force reflow, re-add it.
     Reduced motion is honoured via the same body[data-motion="full"] CSS gate
     the entrance presses use — the classes are inert when motion is calm. */
  function replayAnim(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow so the animation can fire again
    el.classList.add(cls);
  }
  function initPress() {
    if (reduceMQ.matches) return;

    doc.addEventListener("pointerdown", function (ev) {
      if (!ev.target.closest) return;
      // a STAMP press is the heaviest object — thunk + 35ms buzz (FEEL §A).
      var stamp = ev.target.closest(".stamp");
      if (stamp) { replayAnim(stamp, "is-thunk"); Foley.stamp(); return; }

      var clip = ev.target.closest(".clip");
      if (clip) {
        replayAnim(clip.querySelector(".pin"), "is-press");
        // bump the clip body itself with the (previously unused) lift keyframe.
        replayAnim(clip.querySelector(".clip-body") || clip, "is-lift");
        // every touch acknowledged in >=1 channel: a pinned clip = stamp/thunk,
        // a taped clip = tap-select tick. (Touch fires this too: the iOS path.)
        if (clip.querySelector(".pin")) Foley.stamp(); else Foley.tap();
      }
    }, { passive: true });
  }

  /* ---- 3c. text-selection-safe DRAG-SHUFFLE (the 'pick it up' promise) --
     SHUFFLE the desk without ever stealing text selection, link clicks, or page
     scroll, and without clobbering the entrance physics / resting tilt / live 3D
     tilt. Two grip models share ONE makeDraggable:
       • litter / clips  — old behaviour: free drag (litter) or selector grip
         (clip pin/tape), moved via the independent `translate` LONGHAND so it
         composes with their `transform:rotate(...)` rake. No entrance-translate
         conflict for these (litter REVEAL/clip lands at translate 0 0).
       • in-prose reading objects (.pullquote/.callout/.definition/.figure.polaroid)
         — these carry slam/reveal whose keyframes animate the `translate`
         LONGHAND, so movement must NOT use `translate`. They move via the
         --drag-x/--drag-y custom props consumed in a transform chain (BUG-1 fix),
         and grip is decided by gripBand(): never-grip bail (links/controls/tags),
         a [data-text] bail to native selection (authoritative), then a geometric
         padding-band + caret test for the bare torn edge.
     A 6px threshold separates click from drag; preventDefault + setPointerCapture
     only AFTER threshold, so a band tap passes through and a text tap selects.
     reduced-motion: drag still tracks (direct manipulation) but the velocity lean
     / settle wobble are JS-gated off. Persistence: {x,y} per object per page in
     localStorage, restored by writing --drag-x/--drag-y. */

  // never-grip: links, form controls, and the sticker tags always win the pointer.
  var NEVER_GRIP = "a, button, input, textarea, select, summary, label, " +
    "[contenteditable], .clip-link, .clip-tag, .post-tag, [data-no-drag]";

  // computed inner-inset cache (border+padding+grip-band), keyed per element;
  // invalidated wholesale on resize / orientationchange / font change.
  var gripInsetCache = new WeakMap();
  function clearGripCache() { gripInsetCache = new WeakMap(); }
  (function bindCacheInvalidate() {
    var clear = function () { clearGripCache(); };
    window.addEventListener("resize", clear);
    window.addEventListener("orientationchange", clear);
    if (doc.fonts && doc.fonts.addEventListener) {
      doc.fonts.addEventListener("loadingdone", clear);
    }
  })();
  function gripInset(el) {
    var cached = gripInsetCache.get(el);
    if (cached) return cached;
    var cs = window.getComputedStyle(el);
    var band = parseFloat(cs.getPropertyValue("--grip-band")) || 14;
    var px = function (v) { return parseFloat(v) || 0; };
    var inset = {
      top:    px(cs.borderTopWidth) + px(cs.paddingTop) + band,
      right:  px(cs.borderRightWidth) + px(cs.paddingRight) + band,
      bottom: px(cs.borderBottomWidth) + px(cs.paddingBottom) + band,
      left:   px(cs.borderLeftWidth) + px(cs.paddingLeft) + band
    };
    gripInsetCache.set(el, inset);
    return inset;
  }
  function caretHitsText(x, y) {
    // feature-detected caret probe: does this point land on a non-empty TEXT node?
    var node = null;
    if (doc.caretRangeFromPoint) {
      var r = doc.caretRangeFromPoint(x, y);
      node = r && r.startContainer;
    } else if (doc.caretPositionFromPoint) {
      var p = doc.caretPositionFromPoint(x, y);
      node = p && p.offsetNode;
    } else {
      return null; // no caret API: caller decides (conservative)
    }
    if (node && node.nodeType === 3 && node.textContent && node.textContent.trim() !== "") {
      return true;
    }
    return false;
  }
  // gripBand: returns true only if the pointer is on draggable CHROME (the torn
  // band / fastener / .drag-grip border), never on text/links/controls.
  function gripBand(ev, el) {
    var t = ev.target;
    if (t.closest && t.closest(NEVER_GRIP)) return false;        // links/controls/tags
    if (t.closest && t.closest("[data-text]")) return false;     // PRIMARY: native selection
    // geometry: inside the inner (text) rect? then only the caret decides.
    var rect = el.getBoundingClientRect();
    var ins = gripInset(el);
    var inX = ev.clientX > rect.left + ins.left && ev.clientX < rect.right - ins.right;
    var inY = ev.clientY > rect.top + ins.top && ev.clientY < rect.bottom - ins.bottom;
    if (inX && inY) {
      var hit = caretHitsText(ev.clientX, ev.clientY);
      if (hit === true) return false;     // real text under the pointer → select
      if (hit === null) return false;     // no caret API → conservative: never steal
      // caret API exists and found no text → it's a bare inner gap; allow grip.
      return true;
    }
    return true;   // outer torn band / fastener / .drag-grip border → ARM
  }

  // makeDraggable(el, opts) — opts = {gripTest, isLink, moveVia, deskId}.
  // Back-compat: if arg2 is a STRING, it's the old handleSel (selector grip),
  // and arg3 is isLink (the .clip call site is unchanged).
  function makeDraggable(el, opts, isLinkArg) {
    if (!el || !el.setPointerCapture) return;
    // DEFAULT moveVia = "translate" so the back-compat null path (loose desk
    // litter: makeDraggable(el, null, false)) moves via the `translate` longhand,
    // which composes with its resting rotate. Only the explicit object path opts
    // into "transform-var" (in-prose objects, consumed by _realism.scss). Writing
    // --drag-x/--drag-y on litter did nothing — no CSS reads them there.
    var gripTest = null, isLink = false, moveVia = "translate", deskId = null;
    if (typeof opts === "string") {
      var handleSel = opts;
      gripTest = function (ev) {
        return !!(ev.target.closest && ev.target.closest(handleSel));
      };
      isLink = !!isLinkArg;
      moveVia = "translate";
    } else if (opts && typeof opts === "object") {
      gripTest = opts.gripTest || null;
      isLink = !!opts.isLink;
      moveVia = opts.moveVia || "transform-var";
      deskId = opts.deskId || null;
    }

    var armed = false, dragging = false, moved = false, raf = 0, pid = null;
    var startX = 0, startY = 0, originX = 0, originY = 0;
    var curX = 0, curY = 0, tgtX = 0, tgtY = 0;
    var lastMoveX = 0, lastT = 0, dragRot = 0, dragBase = "", baseCaptured = false;
    var settleRaf = 0;
    var canLean = !reduceMQ.matches;

    function write() {
      if (moveVia === "translate") {
        // Move via inline TRANSFORM, composed OVER the resting transform (dragBase,
        // captured at grab) so the card KEEPS its tilt instead of snapping flat. The
        // drag translate is outermost = pure screen-space motion, so the rect moves by
        // exactly the drag delta (no un-rotation jump that fought the drag before).
        // Inline + !important + animation cancelled = beats every competing rule.
        el.style.setProperty("transform",
          "translate(" + curX.toFixed(1) + "px," + curY.toFixed(1) + "px)" + dragBase, "important");
      } else {
        el.style.setProperty("--drag-x", curX.toFixed(1) + "px");
        el.style.setProperty("--drag-y", curY.toFixed(1) + "px");
      }
    }
    function loop() {
      raf = 0;
      // 1:1 TRACKING — the object sticks to the pointer (no floaty spring-lag).
      // The drag felt "unreliable/weird" because it lerped at 0.30/frame and
      // trailed the cursor; direct assignment frame-batched by rAF is crisp.
      curX = tgtX; curY = tgtY; write();
    }

    // restore persisted position (transform-var objects only).
    if (deskId) {
      var saved = deskLoad(deskId);
      if (saved) { curX = tgtX = saved.x; curY = tgtY = saved.y; write(); }
    }

    el.addEventListener("pointerdown", function (ev) {
      if (ev.button && ev.button !== 0) return;
      if (ev.pointerType === "touch") return;          // touch scrolls/taps/selects — never drags
      if (gripTest && !gripTest(ev, el)) return;       // grip arbiter (selector or band)
      armed = true; moved = false; pid = ev.pointerId;
      startX = ev.clientX; startY = ev.clientY; originX = tgtX; originY = tgtY;
      lastMoveX = ev.clientX; lastT = ev.timeStamp || performance.now();
      // a fresh grab cancels any in-flight settle so it doesn't fight the drag.
      if (settleRaf) { cancelAnimationFrame(settleRaf); settleRaf = 0; }
    });
    el.addEventListener("pointermove", function (ev) {
      if (!armed || ev.pointerId !== pid) return;
      var dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) + Math.abs(dy) < 6) return;   // below threshold = click, not drag
        dragging = true; moved = true; el.classList.add("is-dragging");
        try { el.setPointerCapture(pid); } catch (e) {}
        // CRITICAL: cancel the entrance animation (slam/reveal animate the translate/
        // scale longhands with `both` fill, which override inline styles) AND any
        // transition, then for the inline-transform move path capture the element's
        // current resting transform as the base. Writing inline `transform` then
        // wins over every stylesheet transform (seeded tilt, :hover, nth-child) and
        // the cancelled animation — so the card actually tracks the pointer.
        el.style.animation = "none";
        el.style.transition = "none";
        if (moveVia === "translate" && !baseCaptured) {
          // snapshot the resting transform (tilt) ONCE, on the first grab — before any
          // inline drag transform exists. Capturing every grab would re-read the
          // already-translated value and double-count on the second drag. tgtX/tgtY
          // accumulate the absolute offset; dragBase stays the constant resting tilt.
          baseCaptured = true;
          var cm = "";
          try { cm = getComputedStyle(el).transform; } catch (e) {}
          dragBase = (cm && cm !== "none") ? (" " + cm) : "";
        }
        // clear any stray selection born in the sub-6px window (one shot).
        try { if (window.getSelection) getSelection().removeAllRanges(); } catch (e) {}
        // kill the hover-tilt lean so the object doesn't wobble WHILE it drags
        // (initPointerTilt binds the same elements; it now bails on .is-dragging,
        // and we zero the residual lean here so the grab starts flat).
        el.style.setProperty("--tilt-x", "0deg");
        el.style.setProperty("--tilt-y", "0deg");
        Foley.pickup();
      }
      tgtX = originX + dx; tgtY = originY + dy;
      // velocity-driven lean (decorative; OFF under reduced motion).
      if (canLean && moveVia === "transform-var") {
        var now = ev.timeStamp || performance.now();
        var dt = now - lastT;
        if (dt > 0) {
          var vx = (ev.clientX - lastMoveX) / dt;            // px/ms
          var target = Math.max(-5, Math.min(5, vx * 26));   // clamp ±5deg
          dragRot += (target - dragRot) * 0.35;
          el.style.setProperty("--drag-rot", dragRot.toFixed(2) + "deg");
          el.style.setProperty("--drag-scale", "0.99");
        }
        lastMoveX = ev.clientX; lastT = now;
      }
      if (!raf) raf = requestAnimationFrame(loop);
      ev.preventDefault();
    });
    function settle() {
      // one-channel decaying-sine wobble on --drag-rot back to 0, + scale recover.
      var t0 = performance.now(), dur = 260, from = dragRot;
      function step(t) {
        var k = Math.min(1, (t - t0) / dur);
        var damp = Math.exp(-4.2 * k);
        var rot = from * damp * Math.cos(k * Math.PI * 2.2);
        var sc = 0.99 + 0.01 * k;
        el.style.setProperty("--drag-rot", rot.toFixed(2) + "deg");
        el.style.setProperty("--drag-scale", sc.toFixed(3));
        if (k < 1) { settleRaf = requestAnimationFrame(step); }
        else {
          dragRot = 0; settleRaf = 0;
          el.style.setProperty("--drag-rot", "0deg");
          el.style.setProperty("--drag-scale", "1");
        }
      }
      settleRaf = requestAnimationFrame(step);
    }
    function release(ev) {
      if (pid !== null && ev.pointerId !== pid) return;
      armed = false; pid = null;
      if (dragging) {                       // STAYS where dropped — no snap-home
        dragging = false; el.classList.remove("is-dragging");
        try { el.releasePointerCapture(ev.pointerId); } catch (e) {}
        if (canLean && moveVia === "transform-var") settle();
        else { el.style.setProperty && el.style.setProperty("--drag-rot", "0deg"); }
        if (deskId) deskSave(deskId, { x: tgtX, y: tgtY });
        Foley.drop();
      }
    }
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    if (isLink) el.addEventListener("click", function (ev) {   // a real drag must not navigate
      if (moved) { ev.preventDefault(); ev.stopPropagation(); moved = false; }
    }, true);

    // expose a home-reset hook for the "reset desk" button.
    if (deskId) {
      el.__deskReset = function () {
        tgtX = tgtY = 0; curX = curY = 0; dragRot = 0;
        // .is-homing adds a CSS transition on `transform` so writing the drag
        // vars to 0 slides the object home with --ease-settle (BUG-4 safe: the
        // settle never writes the transform PROPERTY).
        el.classList.add("is-homing");
        el.style.setProperty("--drag-x", "0px");
        el.style.setProperty("--drag-y", "0px");
        el.style.setProperty("--drag-rot", "0deg");
        el.style.setProperty("--drag-scale", "1");
        window.setTimeout(function () { el.classList.remove("is-homing"); }, 360);
      };
    }
  }

  /* ---- localStorage persistence (per page per stable id) — all try/catch ---- */
  function deskKey(id) {
    var path = (location && location.pathname) || "/";
    return "drex:desk:" + path + ":" + id;
  }
  function deskLoad(id) {
    try {
      var raw = window.localStorage.getItem(deskKey(id));
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o && typeof o.x === "number" && typeof o.y === "number") return o;
    } catch (e) {}
    return null;
  }
  function deskSave(id, pos) {
    try { window.localStorage.setItem(deskKey(id), JSON.stringify(pos)); } catch (e) {}
  }
  function deskClear(ids) {
    try {
      for (var i = 0; i < ids.length; i++) window.localStorage.removeItem(deskKey(ids[i]));
    } catch (e) {}
  }

  function initDrag() {
    // THE HANDLE IS THE FASTENER — you move a paper by grabbing the washi TAPE (or pin)
    // that holds it down. Obvious, skeuomorphic, and it never steals text selection or a
    // link click (those live in the paper BODY, which the fastener doesn't cover). Hover
    // the fastener → the whole paper GLOWS so you see what you'll move. Touch never drags.
    root.classList.add("js-drag");

    var papers = [].slice.call(doc.querySelectorAll(
      ".board-litter .litter, .board-pile .clip, " +
      ".prose .pullquote, .prose .callout, .prose .figure.polaroid"
    ));
    var draggables = [];
    for (var i = 0; i < papers.length; i++) {
      (function (el) {
        // only FASTENED papers are movable, and only the fastener arms the drag.
        var fasteners = el.querySelectorAll(":scope > .tape, :scope > .pin");
        if (!fasteners.length) return;
        draggables.push(el);
        var isLink = !!(el.classList && el.classList.contains("clip"));
        makeDraggable(el, {
          gripTest: function (ev) {
            var f = ev.target.closest && ev.target.closest(".tape, .pin");
            return !!(f && el.contains(f));
          },
          isLink: isLink, moveVia: "translate"
        });
        // the paper glows while the pointer is over its fastener — the "grab here" cue.
        for (var k = 0; k < fasteners.length; k++) {
          fasteners[k].addEventListener("pointerenter", function (ev) {
            if (ev.pointerType !== "touch") el.classList.add("grip-hot");
          });
          fasteners[k].addEventListener("pointerleave", function () {
            el.classList.remove("grip-hot");
          });
        }
      })(papers[i]);
    }

    // "RESET THE DESK" — one gesture, every page: snap every object home by clearing
    // its inline drag transform so the CSS resting tilt returns.
    var resets = doc.querySelectorAll("[data-desk-reset]");
    for (var r = 0; r < resets.length; r++) {
      resets[r].addEventListener("click", function () {
        for (var m = 0; m < draggables.length; m++) {
          draggables[m].style.transform = "";
          draggables[m].style.transition = "";
          draggables[m].style.animation = "";
        }
        Foley.drop();
      });
    }
  }

  /* ---- 4. mobile burger nav (unchanged) ----------------------------- */
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
        setOpen(false); burger.focus();
      }
    });
    doc.addEventListener("click", function (e) {
      if (burger.getAttribute("aria-expanded") !== "true") return;
      if (e.target.closest("#mob-nav") || e.target.closest("#m-burger")) return;
      setOpen(false);
    });
  }

  /* ---- boot ---------------------------------------------------------- */
  function boot() {
    bake();          // materials first
    initReveals();
    initPointerTilt();
    initDrag();
    initPress();
    initBurger();
  }
  if (doc.readyState !== "loading") boot();
  else doc.addEventListener("DOMContentLoaded", boot);

  void root; // referenced for clarity; root.classList.add('baked') happens in bakery
})();
