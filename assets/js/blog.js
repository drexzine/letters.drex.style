/* ===================================================================
   letters.drex.style — blog.js  (ES module, zero deps)
   Ported from drex-landing/app.js. The Stage orchestrator + the motion
   features that survive on the blog: opt-in audio, the lying hamburger,
   tear-away furniture, photo vandalism, the crumple+confetti finale,
   scroll reveals/slams, highlighter draw-on, and collage parallax.

   BRAND LAW: motion only. JS off = a fully usable static site. Everything
   gates on prefers-reduced-motion where the original did. The tear engine
   ONLY arms decorative furniture that carries a direct <span class="tape">
   child — the .prose reading column is never tearable.

   DROPPED from the landing: the envelope/seal cut-gate (the blog shows
   content directly), the demo-auth gate, the founder-note crumple, and the
   hero attention-CTA idle loop.
   =================================================================== */

const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

const Stage = (() => {
  /* ---- motion switch: body[data-motion] = full | calm -------------- */
  function applyMotion() {
    document.body.dataset.motion = reduceMQ.matches ? 'calm' : 'full';
  }
  reduceMQ.addEventListener?.('change', applyMotion);

  /* ---- shared rAF driver registry --------------------------------- */
  const drivers = new Set();
  let rafId = 0;
  function tick(t) {
    rafId = 0;
    fpsSample(t);
    for (const fn of drivers) { try { fn(t); } catch (_) {} }
    if (drivers.size && document.body.dataset.motion !== 'calm') schedule();
  }
  function schedule() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function addDriver(fn) {
    drivers.add(fn); schedule();
    return () => { drivers.delete(fn); };
  }

  /* ---- shared IntersectionObserver -------------------------------- */
  const ioCbs = new Map(); // element -> callback(entry, release)
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const fn = ioCbs.get(e.target);
      if (fn) fn(e, () => { io.unobserve(e.target); ioCbs.delete(e.target); });
    }
  }, { rootMargin: '200px 0px', threshold: [0, 0.18, 0.9] });
  function observe(el, fn) { if (!el) return; ioCbs.set(el, fn); io.observe(el); }

  /* ---- FPS governor: latch html[data-tier=lite] under load -------- */
  let frames = [], lastT = 0, demoted = false, fpsPausedUntil = 0;
  function pauseFps(ms) { fpsPausedUntil = Math.max(fpsPausedUntil, lastT + ms); }  // skip sampling across a known stall
  function fpsSample(t) {
    if (t < fpsPausedUntil) { lastT = t; frames = []; return; }   // inside a deliberate pause (e.g. domToCanvas)
    if (lastT) {
      const d = t - lastT;
      // A single long frame is a one-off STALL (the finale's domToCanvas capture,
      // GC, a background tab), not sustained low FPS — ignore it and reset the
      // window so the capture jank can't permanently demote us to lite (which
      // would kill squigglevision on the whole page). Only sustained load latches.
      if (d >= 100) { frames = []; }
      else {
        frames.push(d);
        if (frames.length > 8) frames.shift();
        if (!demoted && frames.length === 8) {
          const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
          if (avg > 34) { demoted = true; document.documentElement.dataset.tier = 'lite'; } // ~<29fps
        }
      }
    }
    lastT = t;
  }

  /* ---- audio bus (the real engine boots in initAudio) ------------- */
  let engine = null;
  function registerAudio(e) { engine = e; }
  function play(key, opts) { try { engine?.play?.(key, opts); } catch (_) {} }
  window.addEventListener('drexfx:play', (e) => play(e.detail?.key, e.detail));

  function armSound() { try { engine?.armForCut?.(); } catch (_) {} }

  return {
    applyMotion, addDriver, observe, registerAudio, play, armSound, pauseFps,
    get calm() { return document.body.dataset.motion === 'calm'; },
    get reduce() { return reduceMQ.matches; },
  };
})();

window.Stage = Stage;

/* ---- boot ---------------------------------------------------------- */
function boot() {
  Stage.applyMotion();
  const audio = initAudio();        // audio engine (opt-in, gesture-unlocked)
  initReveals();                    // settle-in / slam on scroll
  initHighlighter();                // highlighter + marker draw-on
  initTearAway();                   // pull a taped furniture piece free — it falls, the washi flutters
  initPhotoVandal();                // tap a photo → a random sharpie doodle scrawls on (persists)
  initInteractionSounds();          // stamp / toggle / blip on interaction
  initSoundToggle(audio);           // footer opt-in toggle
  initCollage();                    // littered collage scraps + scroll entrance + parallax
  initHamburgerJoy(audio);          // the hamburger that lies — flop, slit, pull-out nav
  initResetDesk();                  // re-show torn pieces without a reload
  // initFinale();                  // DISABLED (per request): tear-off-everything finale
                                    // ("we love people like you" crumple). Re-enable by uncommenting.
  // Hovering a card/polaroid grows its hard shadow under a live SVG filter — a
  // burst of quick re-rasters of a big sheet. Known, brief, self-inflicted stall:
  // don't let it latch tier=lite and kill squigglevision for the rest of the session.
  document.querySelectorAll('.paper, figure.polaroid').forEach((el) => {
    el.addEventListener('pointerenter', () => Stage.pauseFps(450), { passive: true });
  });
  // wake the FPS governor for the first couple seconds so html[data-tier=lite]
  // can latch under load — the CSS/IO features never register a rAF driver,
  // so without this the governor is dead code and the lite fallback unreachable.
  if (!Stage.reduce) { const stopFps = Stage.addDriver(() => {}); setTimeout(stopFps, 2200); }
}
if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);

/* ===================================================================
   Audio engine (Web Audio; gesture-unlocked; OFF by default)
   Browsers block autoplay, so the AudioContext is created/resumed only on
   the first real user gesture. Sound is opt-in (footer toggle, persisted);
   when on, short craft SFX fire on direct interactions. Buffers load lazily.
   Every feature plays through Stage.play(key) → this engine.
   =================================================================== */
function initAudio() {
  const KEYS = ['cut', 'marker', 'rustle', 'snip', 'stamp', 'taperip', 'toggle', 'underline',
    'retrocard1', 'retrocard2', 'retrocard3', 'retropola1', 'retropola2', 'retropola3'];
  const buffers = new Map();
  const pending = new Set();   // keys requested before audio was ready (first-gesture race)
  let ctx = null, loading = null, enabled = false;

  try { enabled = localStorage.getItem('drex-sound') === 'on'; } catch (_) {}

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
    return ctx;
  }

  // The mobile unlock. On stubborn WebKit/Chromium the context won't flip to
  // 'running' until a source has actually been start()ed from a user gesture;
  // doing so also absorbs the first-sound swallow. Cheap, so fire it on every
  // gesture until the context is confirmed running.
  function unlockNow() {
    if (!ensureCtx()) return;
    try {
      const s = ctx.createBufferSource();
      s.buffer = ctx.createBuffer(1, 1, 22050);
      s.connect(ctx.destination);
      s.start(0);
    } catch (_) {}
    if (ctx.state === 'suspended') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    if (ctx.state === 'running') stopUnlock();
  }
  function load() {
    if (loading || !ctx) return loading;
    // mp3 first (small, universal), then fall back to ogg if the fetch OR
    // decodeAudioData fails — we ship ogg for every key.
    loading = Promise.all(KEYS.map(async (k) => {
      for (const ext of ['mp3', 'ogg']) {
        try {
          const res = await fetch(`/assets/audio/${k}.${ext}`);
          if (!res.ok) continue;
          buffers.set(k, await ctx.decodeAudioData(await res.arrayBuffer()));
          return;                                  // decoded — done with this key
        } catch (_) { /* try the next format */ }
      }
    }));
    return loading;
  }
  // Unlock on the END of a gesture (pointerup / touchend / click), not just the
  // start. CAPTURE phase so feature handlers' stopPropagation can't swallow it;
  // keep listening until the context is actually running.
  const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'click'];
  function stopUnlock() { UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock, true)); }
  function unlock() {
    unlockNow();
    if (enabled) load();
  }
  UNLOCK_EVENTS.forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true, capture: true }));

  function emitChange() { try { window.dispatchEvent(new Event('drexfx:soundchange')); } catch (_) {} }

  // Actually emit the sound. Assumes ctx is running and (for samples) the buffer
  // is decoded — callers gate on that or defer via play().
  function fire(key, opts) {
    if (key === 'crinkle') return synthCrinkle(ctx, opts);   // synthesized paper crinkle (no sample)
    if (key === 'squeak')  return synthSqueak(ctx, opts);    // synthesized felt-tip marker squeak
    if (key === 'fanfare') return synthFanfare(ctx, opts);   // synthesized triumphant arpeggio
    const buf = buffers.get(key);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? (0.94 + Math.random() * 0.12);
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 0.32;
    src.connect(g).connect(ctx.destination);
    src.start();
  }

  const engine = {
    play(key, opts = {}) {
      if (!enabled || !ctx) return;
      const synth = key === 'crinkle' || key === 'squeak' || key === 'fanfare';
      // Ready right now → fire immediately (the common, warm path).
      if (ctx.state === 'running' && (synth || buffers.has(key))) return fire(key, opts);
      // Not ready: the context is still resuming or the buffer is still decoding.
      // Defer one shot per key and fire once ready; collapsing repeats keeps the
      // rapid drag-snips from bursting all at once.
      if (pending.has(key)) return;
      pending.add(key);
      const resumed = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
      const loaded  = synth ? Promise.resolve() : load();
      Promise.all([resumed, loaded]).then(() => {
        pending.delete(key);
        if (enabled && ctx && ctx.state === 'running') fire(key, opts);
      }).catch(() => pending.delete(key));
    },
    // A deliberate craft gesture (a tear, the finale) turns sound ON for the
    // session — unless the visitor has explicitly muted via the footer toggle.
    armForCut() {
      try { if (localStorage.getItem('drex-sound') === 'off') return; } catch (_) {}
      unlockNow(); load();
      if (!enabled) { enabled = true; emitChange(); }
    },
    setEnabled(on) {
      enabled = on;
      try { localStorage.setItem('drex-sound', on ? 'on' : 'off'); } catch (_) {}
      if (on) { unlockNow(); load()?.then(() => engine.play('toggle', { gain: 0.3 })); }
      emitChange();
    },
    get enabled() { return enabled; },
  };
  Stage.registerAudio(engine);
  return engine;
}

/* ===================================================================
   Reveals: sections / cards / furniture settle in on scroll.
   Uses the individual `translate` property (NOT transform) so the lift
   composes with each element's resting tilt instead of clobbering it.
   Hidden state lives in CSS under body[data-motion="full"]; under calm,
   reduced-motion, or tier=lite everything is shown instantly.
   =================================================================== */
function initReveals() {
  // No IntersectionObserver → never add `.reveal`, so the CSS hidden state never
  // applies and all content is shown. The reveal can NEVER hide real content.
  if (!('IntersectionObserver' in window)) return;
  // Only littered SMALL objects animate (polaroids, cards, section heads). The
  // big anchor sheets stay put. Per-group index gives a real cascade.
  const groups = [
    document.querySelectorAll('figure.polaroid, .clip'),
    document.querySelectorAll('.callout, .definition, .pullquote, .post-banner, .subscribe-card'),
    document.querySelectorAll('.post-head, .section-head, .post-eyebrow, .post-standfirst, .post-tags, .post-nav, .back-line'),
  ];
  const marked = [];

  // The shared observer pre-fires 200px BEFORE an item enters — perfect for a
  // primed fade, wrong for a slam you have to actually watch. Slams get a
  // dedicated observer with a NEGATIVE bottom margin so a piece only drops once
  // it's genuinely on screen.
  const slamCfg = new Map();
  const slamIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target; slamIO.unobserve(el);
      const cfg = slamCfg.get(el) || { i: 0, hard: false };
      el.style.animationDelay = (cfg.hard ? cfg.i * 120 : cfg.i * 60) + 'ms';
      el.classList.add('in');
    }
  }, { rootMargin: '0px 0px -18% 0px', threshold: 0.01 });

  groups.forEach((nodes, gi) => nodes.forEach((el, i) => {
    const slam = gi < 2;                         // furniture SLAMS in; heads just settle
    el.classList.add('reveal');
    marked.push(el);
    if (slam) {
      el.classList.add('slam');
      slamCfg.set(el, { i, hard: gi === 1 });   // group 1 hits harder + cascades slower
      slamIO.observe(el);
    } else {
      Stage.observe(el, (e, release) => {
        if (!e.isIntersecting) return;           // gate on visibility only, not ratio
        el.style.transitionDelay = (i * 70) + 'ms';
        el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
        el.classList.add('in');
        release();
      });
    }
  }));
  // belt-and-suspenders: reveal any straggler the observer missed — but ONLY if
  // it's already on screen, so we never burn an off-screen slam's one-shot drop.
  setTimeout(() => marked.forEach((el) => {
    if (el.classList.contains('in')) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) el.classList.add('in');
  }), 4000);
}

/* ===================================================================
   Highlighter / marker draw-on: the .hl band and .ul underlines swipe in
   left→right the moment they enter. Pure CSS animation toggled by an `.in`
   class; the same data-motion / tier gating applies.
   =================================================================== */
function initHighlighter() {
  if (!('IntersectionObserver' in window)) return;  // leave marks fully drawn
  document.querySelectorAll('.hl, .ul, .m-hl, .m-underline').forEach((el) => {
    el.classList.add('draw');
    Stage.observe(el, (e, release) => {
      if (!e.isIntersecting) return;
      el.classList.add('in');
      release();
    });
  });
}

/* ---- interaction SFX (no-op until sound is switched on) -------------
   Buttons + nav keep the tactile craft foley (stamp / toggle). Cards and
   polaroids get a retro 90s/edutainment blip layer: a random clip from a
   small per-type family, never repeating the previous one. CC0 (Kenney),
   see assets/audio/CREDITS-retro.txt. ONE ordered chain → exactly one sound
   per tap, and nothing tappable is silent. */
function initInteractionSounds() {
  const FAMILIES = {
    card: ['retrocard1', 'retrocard2', 'retrocard3'],
    pola: ['retropola1', 'retropola2', 'retropola3'],
  };
  const last = {};
  function pick(fam) {
    const list = FAMILIES[fam], n = list.length;
    let i = Math.floor(Math.random() * n);
    if (n > 1 && i === last[fam]) i = (i + 1) % n;
    last[fam] = i;
    return list[i];
  }
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.hb-tray a')) Stage.play(pick('card'), { gain: 0.34 });  // hamburger nav links -> 90s blip
    else if (t.closest('.btn')) Stage.play('stamp', { gain: 0.32 });
    else if (t.closest('.mast nav a') || t.closest('footer .links a')) Stage.play('toggle', { gain: 0.24 });
    else if (t.closest('figure.polaroid .ph')) {            // a photo got vandalised
      Stage.play('squeak', { gain: 0.17 }); Stage.play(pick('pola'), { gain: 0.22 });
    }
    else if (t.closest('.callout, .definition')) Stage.play(pick('card'), { gain: 0.3 });
    else if (t.closest('figure.polaroid')) Stage.play(pick('pola'), { gain: 0.26 });
    else if (t.closest('.pullquote, .stamp, .m-note')) Stage.play(pick('card'), { gain: 0.22 });
  });
}

/* ===================================================================
   Photo VANDALISM: tap a figure.polaroid and a random sharpie doodle scrawls
   straight onto it — moustache, googly eyes, "this one!", a big cross-out, a
   crown. Each mark draws on (stroke wipe), lands in a random marker colour at
   a random spot/tilt/size, and STAYS until reload. Marks live in a no-pointer
   overlay that overflows the photo box so a stroke can spill past the edge.
   Hand-drawn irregular paths (no live boil filter). Full-motion only; tearing
   a photo carries its doodles away with it.
   =================================================================== */
function initPhotoVandal() {
  if (Stage.reduce) return;                          // calm/reduced → leave the photos clean
  const PALETTE = ['var(--colorado)', 'var(--ink)', 'var(--grass-deep)', 'var(--lazuli)', 'var(--schoolbus)'];
  const CAP = 24;                                    // per-photo ceiling; oldest recycles out
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Each mark: a viewBox + inner SVG. Strokes carry pathLength="1" so the CSS
  // draw-on wipes them on regardless of true length. `currentColor` = the marker.
  const MARKS = [
    // scribble scratch-out
    () => ['0 0 100 70', `<path pathLength="1" d="M6 40 Q18 8 30 38 Q42 66 54 36 Q66 8 78 40 Q90 64 96 34"/><path pathLength="1" d="M8 52 Q22 26 36 52 Q50 76 64 50 Q78 26 92 50"/>`, 3.2],
    // big X cross-out
    () => ['0 0 100 100', `<path pathLength="1" d="M14 16 L86 86"/><path pathLength="1" d="M86 18 L16 84"/>`, 4.2],
    // circle + "this one!" arrow
    () => ['0 0 120 90', `<path pathLength="1" d="M60 18 C24 14 14 60 44 70 C82 82 96 36 64 22 C52 17 40 22 40 22"/><path pathLength="1" d="M70 70 q22 6 34 -8"/><path pathLength="1" d="M96 56 l10 8 -12 8"/>`, 3],
    // moustache
    () => ['0 0 120 50', `<path pathLength="1" d="M60 14 C58 26 50 30 44 28 C30 24 20 30 14 40 C26 36 36 40 44 36 C54 31 58 22 60 14 C62 22 66 31 76 36 C84 40 94 36 106 40 C100 30 90 24 76 28 C70 30 62 26 60 14Z"/>`, 2.6],
    // nerd glasses
    () => ['0 0 130 60', `<circle pathLength="1" cx="36" cy="34" r="20"/><circle pathLength="1" cx="94" cy="34" r="20"/><path pathLength="1" d="M56 30 q9 -8 18 0"/><path pathLength="1" d="M16 28 l-12 -8"/><path pathLength="1" d="M114 28 l12 -8"/>`, 3.4],
    // devil horns
    () => ['0 0 120 60', `<path pathLength="1" d="M20 56 C8 36 10 14 26 6 C24 24 30 40 44 50"/><path pathLength="1" d="M100 56 C112 36 110 14 94 6 C96 24 90 40 76 50"/>`, 3.6],
    // halo
    () => ['0 0 120 50', `<ellipse pathLength="1" cx="60" cy="26" rx="42" ry="14"/>`, 3.4],
    // crown
    () => ['0 0 120 60', `<path pathLength="1" d="M14 52 L24 14 L44 38 L60 10 L76 38 L96 14 L106 52 Z"/>`, 3.6],
    // googly eyes (filled sclera + pupil — pop in, no wipe)
    () => ['0 0 120 60', `<g class="googly"><circle cx="40" cy="30" r="22" fill="#fff" stroke="var(--ink)" stroke-width="2.5"/><circle cx="${~~R(32,48)}" cy="${~~R(24,38)}" r="9" fill="var(--ink)"/><circle cx="84" cy="30" r="22" fill="#fff" stroke="var(--ink)" stroke-width="2.5"/><circle cx="${~~R(76,92)}" cy="${~~R(24,38)}" r="9" fill="var(--ink)"/></g>`, 0],
    // sparkle burst
    () => ['0 0 110 90', `<path pathLength="1" d="M30 46 L34 28 L38 46 L56 50 L38 54 L34 72 L30 54 L12 50 Z"/><path pathLength="1" d="M78 26 L81 14 L84 26 L96 29 L84 32 L81 44 L78 32 L66 29 Z"/><path pathLength="1" d="M82 64 L84 56 L86 64 L94 66 L86 68 L84 76 L82 68 L74 66 Z"/>`, 2.6],
    // word stamp
    () => { const word = pick(['ICON!', 'YES', 'COOL', 'A STAR', 'THE ONE', 'LEGEND']);
      return ['0 0 160 60', `<text x="80" y="44" text-anchor="middle" font-family="var(--f-hand)" font-size="46" fill="currentColor" stroke="none" transform="rotate(-4 80 30)">${word}</text>`, 0]; },
    // exclamations
    () => ['0 0 70 80', `<path pathLength="1" d="M22 8 L18 50"/><circle cx="17" cy="66" r="3.5" fill="currentColor" stroke="none"/><path pathLength="1" d="M52 8 L48 50"/><circle cx="47" cy="66" r="3.5" fill="currentColor" stroke="none"/>`, 5],
    // heart
    () => ['0 0 100 90', `<path pathLength="1" d="M50 78 C12 50 8 24 28 16 C42 10 50 26 50 30 C50 26 58 10 72 16 C92 24 88 50 50 78 Z"/>`, 3.4],
  ];

  function layerFor(fig) {
    let layer = fig.querySelector(':scope > .vandal-layer');
    if (layer) return layer;
    const ph = fig.querySelector(':scope > .ph');
    if (!ph) return null;
    layer = document.createElement('div');
    layer.className = 'vandal-layer';
    // pin to the photo box within the figure (ph.offsetParent === fig; both position:relative)
    layer.style.left = ph.offsetLeft + 'px';
    layer.style.top = ph.offsetTop + 'px';
    layer.style.width = ph.offsetWidth + 'px';
    layer.style.height = ph.offsetHeight + 'px';
    fig.appendChild(layer);
    return layer;
  }

  function scrawl(fig) {
    if (fig.dataset.torn != null) return;            // a torn photo is on its way out — don't draw
    const layer = layerFor(fig);
    if (!layer) return;
    const [vb, inner, sw] = pick(MARKS)();
    const wrap = document.createElement('div');
    wrap.className = 'sharpie';
    wrap.style.setProperty('--vc', pick(PALETTE));
    wrap.style.setProperty('--vr', R(-26, 26).toFixed(1) + 'deg');
    wrap.style.setProperty('--vs', R(0.7, 1.25).toFixed(2));
    wrap.style.left = R(18, 82).toFixed(1) + '%';
    wrap.style.top = R(20, 80).toFixed(1) + '%';
    wrap.innerHTML = `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" ` +
      `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
    layer.appendChild(wrap);
    while (layer.children.length > CAP) layer.firstChild.remove();   // recycle the oldest
  }

  document.querySelectorAll('figure.polaroid').forEach((fig) => {
    fig.addEventListener('click', (e) => {
      if (e.target.closest('a,button,input,textarea,select,label')) return;   // let real controls work
      scrawl(fig);
    });
  });
}

/* ---- footer opt-in sound toggle (button.snd / #snd-toggle) --------- */
function initSoundToggle(audio) {
  const b = document.getElementById('snd-toggle') || document.querySelector('button.snd');
  if (!b) return;
  const sync = () => {
    b.setAttribute('aria-pressed', String(audio.enabled));
    b.textContent = audio.enabled ? 'sound on' : 'sound off';
  };
  sync();
  window.addEventListener('drexfx:soundchange', sync);   // stay in sync when a tear turns sound on
  b.addEventListener('click', () => { audio.setEnabled(!audio.enabled); sync(); });
}

/* ===================================================================
   Synthesized SFX (no audio asset) — paper crinkle, felt-tip squeak,
   triumphant fanfare. Played via Stage.play('crinkle'|'squeak'|'fanfare').
   =================================================================== */
function synthCrinkle(ctx, opts = {}) {
  const now = ctx.currentTime;
  const dur = 0.07 + Math.random() * 0.10;
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  const atk = Math.max(1, Math.floor(n * 0.12));            // soft attack -> no click-y digital onset
  for (let i = 0; i < n; i++) {
    const decay = Math.pow(1 - i / n, 1.5);
    const attack = i < atk ? i / atk : 1;
    const pop = Math.random() < 0.03 ? (Math.random() * 2 - 1) * 0.7 : (Math.random() * 2 - 1) * 0.13;
    d[i] = pop * decay * attack;
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 240 + Math.random() * 180;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300 + Math.random() * 1200; lp.Q.value = 0.4;
  const g = ctx.createGain(); g.gain.value = (opts.gain ?? 0.20) * (0.75 + Math.random() * 0.5);
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
  src.start(now); src.stop(now + dur);
}

function synthSqueak(ctx, opts = {}) {
  const now = ctx.currentTime;
  const dur = 0.10 + Math.random() * 0.09;
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  const atk = Math.max(1, Math.floor(n * 0.10));
  for (let i = 0; i < n; i++) {
    const attack = i < atk ? i / atk : 1;
    const decay = Math.pow(1 - i / n, 1.2);
    d[i] = (Math.random() * 2 - 1) * decay * attack;
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7 + Math.random() * 6;
  const f0 = 900 + Math.random() * 700, f1 = f0 * (1.7 + Math.random() * 1.1);   // scrub upward
  bp.frequency.setValueAtTime(f0, now);
  bp.frequency.linearRampToValueAtTime(f1, now + dur * 0.6);
  bp.frequency.linearRampToValueAtTime(f0 * 1.2, now + dur);
  const g = ctx.createGain(); g.gain.value = (opts.gain ?? 0.16) * (0.8 + Math.random() * 0.4);
  src.connect(bp); bp.connect(g); g.connect(ctx.destination);
  src.start(now); src.stop(now + dur);
}

function synthFanfare(ctx, opts = {}) {
  const now = ctx.currentTime;
  const base = (opts.gain ?? 0.30);
  const root = 392;                                  // G4 — warm, not shrill
  const steps = [1, 5 / 4, 3 / 2, 2, 5 / 2];          // root · maj3 · 5 · octave · maj3-up
  steps.forEach((mult, i) => {
    const t = now + i * 0.085;
    const f = root * mult;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = ctx.createGain();
    const peak = base * (i === steps.length - 1 ? 1.15 : 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(ctx.destination);
    o1.start(t); o2.start(t); o1.stop(t + 0.45); o2.stop(t + 0.45);
  });
}

/* ===================================================================
   Crumple shader + lazy lib loader — shared by the finale.
   =================================================================== */
const CRUMPLE_NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g);
}`;
const CRUMPLE_VERT = CRUMPLE_NOISE + `
uniform float uT; varying vec2 vUv; varying vec3 vViewPos; varying float vT;
float fold(vec2 p){
  float v=0.0, amp=1.0, tot=0.0, f=1.0;
  for(int i=0;i<3;i++){ float n=snoise(p*f+float(i)*17.3); v+=amp*(abs(n)*2.0-1.0); tot+=amp; amp*=0.5; f*=2.0; }
  return v/tot;
}
vec3 crumple(vec2 p, float t){
  vec2 xy=p*(1.0-0.45*t);
  xy+=vec2(fold(p*1.2+5.0), fold(p*1.2-5.0))*0.10*t;
  float r=length(p); float env=(0.16-r*r*0.24);
  float z=(env+fold(p*1.5+9.0)*0.55)*t;
  return vec3(xy,z);
}
void main(){ vUv=uv; vT=uT; vec3 P=crumple(position.xy,uT); vec4 mv=modelViewMatrix*vec4(P,1.0); vViewPos=mv.xyz; gl_Position=projectionMatrix*mv; }`;
const CRUMPLE_FRAG = `
precision highp float;
uniform sampler2D uTex; varying vec2 vUv; varying vec3 vViewPos; varying float vT;
void main(){
  vec3 albedo=texture2D(uTex,vUv).rgb;
  vec3 N=normalize(cross(dFdx(vViewPos),dFdy(vViewPos)));   // flat shading -> hard facets
  if(N.z<0.0) N=-N;
  if(!gl_FrontFacing) albedo=mix(albedo,vec3(0.95,0.92,0.84),0.7);   // blank paper underside
  vec3 L=normalize(vec3(0.35,0.55,0.75));
  float lam=clamp(dot(N,L),0.0,1.0);
  float light=0.5+0.74*lam;
  vec3 H=normalize(L+vec3(0.0,0.0,1.0));
  float spec=pow(max(dot(N,H),0.0),20.0)*0.07;
  float shade=light+spec;
  shade=mix(1.0,shade,smoothstep(0.0,0.10,vT));            // at rest -> flat albedo == DOM
  gl_FragColor=vec4(albedo*shade,1.0);
}`;

// Lazy-load three + modern-screenshot ONCE (esm.sh caches). Only on first tear.
let _crumpleLibs = null;
function loadCrumpleLibs() {
  if (!_crumpleLibs) _crumpleLibs = Promise.all([
    import('https://esm.sh/three@0.160.0'),
    import('https://esm.sh/modern-screenshot@4'),
  ]);
  return _crumpleLibs;
}

/* ===================================================================
   TEAR-AWAY: any taped piece of decorative furniture can be pulled free.
   Grab a piece by its body (not a link or button) and drag. It peels up
   against the washi tape — the harder you pull, the higher it lifts. Pull
   past the tape's hold (or flick it fast) and it RIPS free: a haptic tick,
   the page drops under gravity and fades, and the washi flutters down on
   its own. Let go before it gives and the tape snaps it back.

   Pointer-only delight, gated to full motion. Torn pieces keep their slot
   (a same-size hidden spacer) so siblings never jump, and everything is back
   on reload. Touch only hijacks a clearly-intentional pull so a downward
   scroll that starts on a card still scrolls the page.

   SCOPE: the arm selector below is decorative furniture ONLY, and arm()
   additionally requires a direct <span class="tape"> child + skips real
   controls — so the .prose reading column can NEVER be torn.
   =================================================================== */
function initTearAway() {
  if (Stage.reduce) return;                 // reduced motion: leave the collage whole
  if (!('PointerEvent' in window)) return;

  const SLOP    = 7;        // px of travel before a grab becomes a pull
  const THRESH  = 116;      // px of pull the tape holds before it lets go
  const FLICK   = 1.3;      // px/ms — a fast, deliberate flick rips it free early
  const FLICK_MIN = 46;     // ...but only past this travel, so a twitch never counts
  const GRAVITY = 0.0024;   // px/ms² — the fallen page accelerates down
  const CONTROL = 'a,button,input,textarea,select,label,[contenteditable]';

  // ---- "tore off EVERYTHING" tracking → the finale ----
  const armed = [];
  let tornAny = false, finaleFired = false;

  // Stash a snapshot of the INTACT collage the instant tearing begins, so the
  // finale can crumple the whole recognizable site. Deferred to idle so the grab
  // never janks. Re-grab on EVERY pull so finaleShot tracks the viewport you're
  // actually looking at as you tear your way down the page.
  let capturing = false;
  function captureSite() {
    if (finaleFired || capturing) return;
    capturing = true;
    const go = () => {
      Stage.pauseFps(2500);                                  // domToCanvas stalls a frame — don't demote to lite
      loadCrumpleLibs().then(([, ms]) => {
        const bg = getComputedStyle(document.body).backgroundColor || '#FEF6E4';
        const sx = scrollX, sy = scrollY;                      // the viewport you're looking at RIGHT NOW
        const skip = (n) => {
          if (!n || !n.classList) return true;                 // text nodes etc → keep
          if (n.id && /^finale-/.test(n.id)) return false;
          if (n.classList.contains('tape-fall')) return false;
          if (n.dataset && n.dataset.torn != null) return false;   // already-torn piece
          return true;
        };
        return ms.domToCanvas(document.body, { scale: 1, backgroundColor: bg, filter: skip }).then((full) => {
          const W0 = Math.max(1, innerWidth), H0 = Math.max(1, innerHeight);
          const cv = document.createElement('canvas'); cv.width = W0; cv.height = H0;
          const g = cv.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, W0, H0);
          g.drawImage(full, -sx, -sy);
          return cv;
        });
      }).then((cv) => { if (cv) finaleShot = cv; }).catch(() => {}).finally(() => { capturing = false; });
    };
    (window.requestIdleCallback || ((f) => setTimeout(f, 1)))(go, { timeout: 1000 });
  }

  function checkCleared() {
    if (finaleFired || !tornAny || !armed.length) return;
    if (armed.every((el) => el.dataset.torn != null || !el.isConnected)) {
      finaleFired = true;
      try { window.dispatchEvent(new Event('drexfx:cleared')); } catch (_) {}
    }
  }

  function arm(el) {
    if (!el || el.dataset.tearable != null) return;    // skip if missing / already armed
    if (el.closest(CONTROL)) return;                   // never arm an interactive control
    if (!el.querySelector(':scope > .tape')) return;   // only pieces actually held by tape
    el.dataset.tearable = '';
    // images are draggable by default — without this, grabbing a polaroid photo
    // starts the browser's native image drag and steals the tear gesture.
    el.querySelectorAll('img').forEach((img) => { img.draggable = false; });
    el.addEventListener('dragstart', (e) => e.preventDefault());
    armed.push(el);
    armPiece(el);
  }

  // BLOG FURNITURE ONLY — the .prose reading column is never in this set, and
  // arm() additionally requires a direct .tape child + a non-control element.
  document.querySelectorAll(
    '.pullquote, .callout, .definition, figure.polaroid, .m-note, .stamp, .clip, .board-head'
  ).forEach(arm);

  function armPiece(el) {
    let grabbing = false, pulling = false, done = false, pid = null;
    let sx = 0, sy = 0, base = '';
    let lastX = 0, lastY = 0, lt = 0, vx = 0, vy = 0;

    el.addEventListener('pointerdown', onDown);
    el.__tear = () => { if (!done) detach(0, 44, 0, 0.45, 7); };   // QA / reset hook

    function onDown(e) {
      if (done || grabbing) return;
      if (e.button != null && e.button !== 0) return;   // primary button / touch only
      if (e.target.closest(CONTROL)) return;            // let real controls work
      e.stopPropagation();                              // inner piece wins over its parent
      grabbing = true; pulling = false;
      pid = e.pointerId;
      sx = lastX = e.clientX; sy = lastY = e.clientY; lt = e.timeStamp; vx = vy = 0;
      base = getComputedStyle(el).transform;
      if (base === 'none') base = '';
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }

    function commit() {
      pulling = true;
      captureSite();                          // first real pull → stash the intact site for the finale
      try { el.setPointerCapture(pid); } catch (_) {}
      el.classList.add('tearing');
      el.style.transition = 'none';
    }

    function onMove(e) {
      if (done || !grabbing || e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!pulling) {
        if (Math.hypot(dx, dy) < SLOP) return;
        // touch: a mostly-vertical drag (EITHER direction) is a page scroll, not a
        // pull — bow out before committing so scrolling never tears a piece.
        if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) { teardown(); return; }
        commit();
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lt);
      vx = (e.clientX - lastX) / dt; vy = (e.clientY - lastY) / dt;
      lastX = e.clientX; lastY = e.clientY; lt = e.timeStamp;

      const dist = Math.hypot(dx, dy);
      const p = Math.min(1, dist / THRESH);
      el.style.setProperty('--pull', p.toFixed(3));
      const rot = Math.max(-22, Math.min(22, dx * 0.05)) * (0.4 + 0.6 * p);
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) ${base}`;

      if (dist >= THRESH || (dist >= FLICK_MIN && Math.hypot(vx, vy) >= FLICK)) detach(dx, dy, vx, vy, rot);
    }

    function onUp() {
      if (done || !grabbing) return;
      if (pulling) { snapBack(); return; }
      teardown();
      // a clean TAP (no drag) on a home clip opens the post — tap reads, drag tears.
      // (taps that land on a real link never reach here; onDown bows out on controls.)
      if (el.classList.contains('clip')) {
        const a = el.querySelector('.clip-title a, a[href]');
        if (a && a.href) window.location.href = a.href;
      }
    }

    // remove the live drag listeners; optionally keep the .tearing class (mid-animation)
    function teardown(keepClass) {
      grabbing = false; pulling = false;
      try { el.releasePointerCapture(pid); } catch (_) {}
      window.removeEventListener('pointermove', onMove, { passive: false });
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!keepClass) { el.classList.remove('tearing'); el.style.transition = ''; el.style.transform = ''; el.style.removeProperty('--pull'); }
    }

    // not enough force — the tape wins and pulls it home
    function snapBack() {
      teardown(true);
      el.style.transition = 'transform .5s cubic-bezier(.34,1.42,.5,1), box-shadow .4s ease';
      el.style.transform = '';
      el.style.setProperty('--pull', '0');
      Stage.play('rustle', { gain: 0.12, rate: 1.12 });
      const end = () => {
        el.classList.remove('tearing');
        el.style.transition = ''; el.style.transform = ''; el.style.removeProperty('--pull');
        el.removeEventListener('transitionend', end);
      };
      el.addEventListener('transitionend', end);
      setTimeout(end, 650);
    }

    // enough force — it rips free
    function detach(dx, dy, vx0, vy0, rot0) {
      if (done) return;
      done = true;
      captureSite();                          // safety net for programmatic tears (__tear/tearAll)
      teardown(true);
      try { navigator.vibrate && navigator.vibrate([7, 22, 13]); } catch (_) {}   // haptic rip
      Stage.play('taperip', { gain: 0.42 });
      setTimeout(() => Stage.play('rustle', { gain: 0.22, rate: 0.9 }), 90);
      el.dataset.torn = '';
      tornAny = true;
      flyTape();
      fallPaper(dx, dy, vx0, vy0, rot0);
      checkCleared();                    // last piece torn? (resolves again once it's removed)
    }

    // the page: drops under gravity, keeps its flick momentum, spins, fades.
    // Pinned position:fixed so the long fall is OUT of document flow — a fixed
    // element never extends the scrollable height. A same-size spacer takes its
    // slot so the pieces around it never jump.
    function fallPaper(dx, dy, vx0, vy0, rot0) {
      const cs = getComputedStyle(el);
      const margin = cs.margin;
      // An ABSOLUTE/FIXED piece (e.g. the home board-snap polaroid, pinned to the desk)
      // is already OUT of document flow, so it holds no slot — adding a spacer would
      // inject a phantom block and shove everything below it down. Only in-flow pieces
      // (the .clip cards, notes, etc.) get a spacer so their neighbours don't jump.
      const inFlow = cs.position !== 'absolute' && cs.position !== 'fixed';
      // measure the true untransformed layout box in viewport coords
      const t = el.style.transform, ro = el.style.rotate, tr = el.style.translate, scl = el.style.scale;
      el.style.transform = 'none'; el.style.rotate = 'none'; el.style.translate = 'none'; el.style.scale = 'none';
      const L = el.getBoundingClientRect();
      el.style.transform = t; el.style.rotate = ro; el.style.translate = tr; el.style.scale = scl;

      if (inFlow) {
        const spacer = document.createElement('div');
        spacer.dataset.tearSpacer = '';
        spacer.style.cssText = 'flex:0 0 auto;visibility:hidden;pointer-events:none;width:' +
          L.width + 'px;height:' + L.height + 'px;margin:' + margin;
        el.parentNode.insertBefore(spacer, el);
      }

      el.classList.remove('tearing');
      el.style.transition = 'none';
      el.style.willChange = 'transform, opacity';
      el.style.position = 'fixed';
      el.style.left = L.left + 'px';
      el.style.top = L.top + 'px';
      el.style.width = L.width + 'px';
      el.style.height = L.height + 'px';
      el.style.margin = '0';
      el.style.zIndex = '70';
      el.style.pointerEvents = 'none';
      el.style.removeProperty('--pull');

      let px = dx, py = dy, rot = rot0;
      let velX = vx0, velY = Math.max(vy0, 0.05);
      let vrot = vx0 * 6; if (Math.abs(vrot) < 0.02) vrot = rot0 >= 0 ? 0.05 : -0.05;
      let life = 0, last = 0;
      const stop = Stage.addDriver((tNow) => {
        if (!last) { last = tNow; return; }
        const dt = Math.min(tNow - last, 50); last = tNow;
        life += dt;
        velY += GRAVITY * dt;
        px += velX * dt; py += velY * dt; rot += vrot * dt;
        el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) ${base}`;
        const op = life < 140 ? 1 : Math.max(0, 1 - (life - 140) / 760);
        el.style.opacity = op.toFixed(3);
        if (op <= 0 || py > innerHeight + L.height + 80) {
          stop();
          el.remove();                       // gone till reload / reset-desk; the spacer keeps the slot
          checkCleared();
        }
      });
    }

    // the washi: let go of the page, it flutters down on its own like a feather
    function flyTape() {
      el.querySelectorAll(':scope > .tape').forEach((tp, i) => {
        const r = tp.getBoundingClientRect();
        const w = tp.offsetWidth, h = tp.offsetHeight;
        const wrap = document.createElement('div');
        wrap.className = 'tape-fall';
        wrap.style.left = (r.left + r.width / 2 - w / 2) + 'px';
        wrap.style.top  = (r.top + r.height / 2 - h / 2) + 'px';
        wrap.style.width = w + 'px';
        wrap.style.height = h + 'px';
        wrap.style.animationDelay = (i * 90) + 'ms';
        tp.style.position = 'absolute';
        tp.style.left = '0'; tp.style.top = '0';
        tp.style.right = 'auto'; tp.style.bottom = 'auto'; tp.style.margin = '0';
        wrap.appendChild(tp);                                  // keeps its own washi tilt
        document.body.appendChild(wrap);
        wrap.addEventListener('animationend', () => wrap.remove());
      });
    }
  }

  /* ---- QA / reset hooks: list / tear pieces programmatically ---- */
  window.__drexTear = {
    list: () => [...document.querySelectorAll('[data-tearable]')].map((e) => e.className.trim()),
    tear: (sel) => { const el = document.querySelector(sel); if (el && el.__tear) el.__tear(); },
    // stash the intact-site snapshot FIRST, then tear once it's ready
    tearAll: () => {
      captureSite();
      let waited = 0;
      const t = setInterval(() => {
        waited += 120;
        if (finaleShot || waited > 2600) {
          clearInterval(t);
          armed.forEach((el) => { if (el.dataset.torn == null && el.isConnected) el.__tear?.(); });
        }
      }, 120);
    },
  };
}

/* ===================================================================
   COLLAGE — littered scraps fade/slide in on scroll + drift on parallax.
   =================================================================== */
function initCollage(){
  var scraps = Array.prototype.slice.call(document.querySelectorAll('.cg-scrap'));
  if (!scraps.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    scraps.forEach(function (s) { s.classList.add('cg-in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('cg-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    scraps.forEach(function (s) { io.observe(s); });
  } else {
    scraps.forEach(function (s) { s.classList.add('cg-in'); });
  }

  if (!reduce) {
    var px = scraps.filter(function (s) { return s.hasAttribute('data-cg-parallax'); });
    if (px.length) {
      var ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      function apply() {
        ticking = false;
        var mid = vh / 2;
        for (var i = 0; i < px.length; i++) {
          var s = px[i];
          var r = s.getBoundingClientRect();
          var center = r.top + r.height / 2;
          var rel = (center - mid) / mid;
          if (rel < -1.4 || rel > 1.4) continue;
          var depth = parseFloat(s.getAttribute('data-cg-parallax')) || 6;
          var offset = (-rel * depth).toFixed(2);
          s.style.setProperty('--cg-py', offset + 'px');
        }
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () {
        vh = window.innerHeight || document.documentElement.clientHeight; onScroll();
      }, { passive: true });
      apply();
    }
  }
}

/* ===================================================================
   RESET DESK — a button.reset-desk re-shows every torn piece without a
   reload. Torn originals were removed from the DOM (their hidden spacer kept
   the slot), so the honest, layout-safe restore is a soft page reload — but
   we keep it scroll-position-aware. If there is nothing torn yet, the button
   stays inert (CSS can hide it until the finale, or it can sit in the footer).
   =================================================================== */
function initResetDesk() {
  document.querySelectorAll('button.reset-desk').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // The fallen pages were el.remove()'d; the cleanest reload-free restore of
      // their exact original markup + slot is to reload. We do it without losing
      // the reader's place.
      try { sessionStorage.setItem('drex-reset-scroll', String(scrollY)); } catch (_) {}
      location.reload();
    });
  });
  // restore scroll after a reset-driven reload
  try {
    const y = sessionStorage.getItem('drex-reset-scroll');
    if (y != null) {
      sessionStorage.removeItem('drex-reset-scroll');
      addEventListener('load', () => scrollTo(0, parseInt(y, 10) || 0), { once: true });
    }
  } catch (_) {}
}

/* ===================================================================
   THE FINALE. Tear off EVERY piece of furniture and the leftover page
   crumples into a paper ball (the crumple shader, run FORWARD: flat → wad)
   that falls, shrinks, spins, and fades — revealing the reward behind it: a
   hand-drawn star, "we love people like you", a triumphant fanfare, and a
   burst of zine-stamp confetti. The shader is the flourish; the reward +
   confetti + fanfare ALWAYS land (a plain CSS fade replaces the crumple under
   lite / no-WebGL / capture failure). One-shot per page load.
   =================================================================== */
let finaleStarted = false, finaleRewardShown = false;
let finaleShot = null;     // canvas of the INTACT site, stashed by initTearAway the moment tearing begins

function initFinale() {
  window.addEventListener('drexfx:cleared', () => {
    if (finaleStarted) return; finaleStarted = true;
    runFinale().catch(() => revealReward());     // any crumple failure → still reward
  });
  // QA hook: trigger the finale without tearing every piece by hand
  window.__drexFinale = () => { try { window.dispatchEvent(new Event('drexfx:cleared')); } catch (_) {} };
}

const FINALE_VALUES = ['Communion', 'Reverence', 'Conviction', 'Self-awareness',
  'Cultivation', 'Generativity', 'zine', 'Drex', 'made with reverence'];

function buildReward() {
  let root = document.getElementById('finale-reward');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'finale-reward';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.innerHTML =
    '<div class="finale-card" tabindex="-1">' +
      '<svg class="finale-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 L14.7 9.1 L21.6 9.4 L16.1 13.8 L18.1 20.6 L12 16.4 L5.9 20.6 L7.9 13.8 L2.4 9.4 L9.3 9.1 Z"/></svg>' +
      '<p class="finale-head scrawl">we love people like you</p>' +
      '<p class="finale-sub">you took the whole thing apart &mdash; that’s exactly the spirit.</p>' +
      '<button class="btn" type="button" id="finale-again">start over &rarr;</button>' +
    '</div>';
  document.body.appendChild(root);
  root.querySelector('#finale-again').addEventListener('click', () => location.reload());
  return root;
}

function revealReward() {
  if (finaleRewardShown) return;
  finaleRewardShown = true;
  const reward = buildReward();
  document.documentElement.classList.add('finale-on', 'finale-reveal');   // scroll-lock + show
  reward.classList.add('show');
  const card = reward.querySelector('.finale-card');
  try { card && card.focus({ preventScroll: true }); } catch (_) {}
  Stage.armSound && Stage.armSound();           // the climax earns sound (unless muted)
  Stage.play('fanfare', { gain: 0.32 });
  burstConfetti();
}

function burstConfetti() {
  const layer = document.createElement('div');
  layer.id = 'finale-confetti';
  layer.setAttribute('aria-hidden', 'true');
  const COLORS = ['var(--colorado)', 'var(--grass)', 'var(--lazuli)', 'var(--schoolbus)', 'var(--happy)', 'var(--sambas)'];
  const N = 54;
  for (let i = 0; i < N; i++) {
    const b = document.createElement('span');
    b.className = 'zine-confetti';
    const c = COLORS[i % COLORS.length];
    const kind = Math.random();
    if (kind < 0.32) { b.classList.add('zc-word'); b.textContent = FINALE_VALUES[Math.floor(Math.random() * FINALE_VALUES.length)]; b.style.color = c; }
    else if (kind < 0.58) { b.classList.add('zc-star'); b.textContent = '★'; b.style.color = c; }
    else { b.style.background = c; if (Math.random() < 0.5) b.classList.add('zc-round'); }
    b.style.left = (50 + (Math.random() * 2 - 1) * 10).toFixed(1) + '%';
    b.style.setProperty('--dx', (Math.random() * 2 - 1).toFixed(2));           // outward spread
    b.style.setProperty('--kick', (-0.6 - Math.random() * 0.7).toFixed(2));    // initial upward kick (× vh)
    b.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    b.style.setProperty('--delay', (Math.random() * 0.22).toFixed(2) + 's');
    b.style.setProperty('--dur', (1.9 + Math.random() * 1.6).toFixed(2) + 's');
    b.style.setProperty('--scale', (0.7 + Math.random() * 0.8).toFixed(2));
    b.addEventListener('animationend', () => b.remove());
    layer.appendChild(b);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4600);
}

// crumple ramp: drive uT from→to over dur with the 24fps step + crinkle patter.
// Raw rAF (not Stage.addDriver) so it runs to completion regardless of motion state.
function crumpleRamp(uniforms, from, to, dur, render) {
  return new Promise((resolve) => {
    const t0 = performance.now(), STEP = 1000 / 24;
    let lastQ = -1, lastSnd = -1e9;
    const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    (function fr(now) {
      let p = (now - t0) / dur; if (p > 1) p = 1;
      const q = Math.floor((now - t0) / STEP);
      if (q !== lastQ) { lastQ = q; const pq = Math.min(q * STEP / dur, 1); uniforms.uT.value = from + (to - from) * ease(pq); render(); }
      if (now - lastSnd > 70) { lastSnd = now; Stage.play('crinkle'); if (Math.random() < 0.5) Stage.play('crinkle'); }
      if (p < 1) requestAnimationFrame(fr);
      else { uniforms.uT.value = to; render(); resolve(); }
    })(performance.now());
  });
}

async function runFinale() {
  const root = document.documentElement;
  root.classList.add('finale-on');                 // lock scroll immediately
  buildReward();                                    // exists behind, hidden until revealReward()

  // lite / no-WebGL → skip the shader, just reward
  if (root.dataset.tier === 'lite' || !window.WebGLRenderingContext) { revealReward(); return; }

  const [THREE, ms] = await loadCrumpleLibs();      // throws offline → caught → revealReward()
  await document.fonts.ready;

  // The texture is the WHOLE intact site, stashed when tearing began — by now the
  // live DOM is an empty husk. Fall back to a live viewport grab only if the stash
  // never happened (e.g. programmatic).
  let texCanvas, texW, texH;
  if (finaleShot && finaleShot.width) {
    texCanvas = finaleShot; texW = finaleShot.width; texH = finaleShot.height;
  } else {
    const bg = getComputedStyle(document.body).backgroundColor || '#FEF6E4';
    const skip = (n) => !(n && n.id && /^finale-/.test(n.id)) && !(n && n.classList && n.classList.contains('tape-fall'));
    const snap = await ms.domToCanvas(document.body, { scale: 1, backgroundColor: bg, filter: skip });
    const W0 = Math.max(1, innerWidth), H0 = Math.max(1, innerHeight);
    texCanvas = document.createElement('canvas'); texCanvas.width = W0; texCanvas.height = H0;
    const g2 = texCanvas.getContext('2d'); g2.fillStyle = bg; g2.fillRect(0, 0, W0, H0);
    g2.drawImage(snap, -scrollX, -scrollY);
    texW = W0; texH = H0;
  }

  const W = Math.max(1, innerWidth), H = Math.max(1, innerHeight);
  const host = document.createElement('div'); host.id = 'finale-host';
  document.body.appendChild(host);
  const R = new THREE.WebGLRenderer({ alpha: true, antialias: true });   // throws if no WebGL → caught upstream
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.setSize(W, H);
  host.appendChild(R.domElement);

  const scene = new THREE.Scene();
  const fov = 35;
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.01, 100);
  cam.position.set(0, 0, 0.5 / Math.tan(THREE.MathUtils.degToRad(fov) / 2));

  // size the sheet to the texture's aspect, CONTAINed in the viewport (height == 1),
  // so the whole recognizable site is on screen before it crumples
  const texAspect = texW / texH, viewAspect = W / H;
  let planeW, planeH;
  if (texAspect >= viewAspect) { planeW = viewAspect; planeH = viewAspect / texAspect; }
  else { planeH = 1; planeW = texAspect; }

  const tex = new THREE.CanvasTexture(texCanvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const uniforms = { uT: { value: 0 }, uTex: { value: tex } };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH, 80, 80),
    new THREE.ShaderMaterial({ vertexShader: CRUMPLE_VERT, fragmentShader: CRUMPLE_FRAG, uniforms,
      side: THREE.DoubleSide, extensions: { derivatives: true } })
  );
  scene.add(mesh);
  const render = () => R.render(scene, cam);
  render();
  root.classList.add('finale-hide');               // hide the empty husk — the intact snapshot stands in

  // 0) hold the restored site on screen for a beat ("wait — it's back?")
  await new Promise((r) => setTimeout(r, 320));
  // 1) the whole site crumples: flat sheet → tight wad
  await crumpleRamp(uniforms, 0, 1, 1000, render);
  // 2) the wad falls away, revealing the reward behind it
  revealReward();
  host.style.transition = 'transform 1.2s cubic-bezier(.5,0,.85,.5), opacity 1.1s ease-in';
  host.style.transformOrigin = '50% 42%';
  requestAnimationFrame(() => {
    host.style.transform = 'translateY(64vh) scale(.06) rotate(214deg)';
    host.style.opacity = '0';
  });
  Stage.play('rustle', { gain: 0.3, rate: 0.82 });
  setTimeout(() => { host.remove(); try { R.dispose && R.dispose(); } catch (_) {} }, 1350);
}

/* ===================================================================
   The hamburger that LIES. Drag the dangling burger; the whole nav strand
   feeds out of the cut; over-pull tears it; tap to reel home. Links click-
   through once open. Keyboard / reduced-motion → plain dropdown.
   Targets #hb #m-burger #hb-fallen #hb-tray. Ported verbatim.
   =================================================================== */
function initHamburgerJoy(audio) {
  const hb = document.getElementById('hb');
  const burger = document.getElementById('m-burger');
  const fallen = document.getElementById('hb-fallen');
  const tray = document.getElementById('hb-tray');
  if (!hb || !burger || !fallen || !tray) return;

  const OPEN = 1, STRAIN = 1.04, DANGER = 1.13;   // string is anchored at the slit + stretches; tear when taut (~34px of stretch)
  let TRAVEL = 230;   // px of drag → pull 0..1; recomputed by calibrate() from the live strand height (was hardcoded to the old, longer nav)
  let pull = 0, dragging = false, startPull = 0, startY = 0, moved = false, torn = false, lastVibe = 0;

  const setPull = (p) => {
    pull = p; hb.style.setProperty('--pull', p.toFixed(3));
    hb.classList.toggle('is-straining', p >= STRAIN && p < DANGER);
  };
  const setState = (s) => { hb.dataset.state = s; };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
  const arm = () => { try { Stage.armSound && Stage.armSound(); } catch (_) {} };

  function flop() {
    setState('fallen'); setPull(0);
    burger.setAttribute('aria-expanded', 'true');
    arm(); Stage.play('rustle', { gain: 0.3 }); buzz(12);
  }
  function plainOpen() {
    const open = hb.dataset.state !== 'plain';
    setState(open ? 'plain' : 'rest');
    burger.setAttribute('aria-expanded', String(open));
  }
  function reset() {
    if (torn) return;
    setState('rest'); setPull(0);
    burger.setAttribute('aria-expanded', 'false');
    Stage.play('rustle', { gain: 0.2, rate: 1.12 });
  }
  function tear() {
    torn = true; setState('torn'); hb.classList.remove('is-straining', 'is-dragging');
    Stage.play('taperip', { gain: 0.45 }); setTimeout(() => Stage.play('cut', { gain: 0.3 }), 90);
    buzz([35, 30, 90]);
    setTimeout(() => {
      torn = false; hb.classList.add('respawning'); setState('rest'); setPull(0);
      burger.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(() => requestAnimationFrame(() => hb.classList.remove('respawning')));
    }, 1050);
  }

  burger.addEventListener('click', (e) => {
    if (Stage.calm || e.detail === 0) { plainOpen(); return; }      // reduced-motion / keyboard → plain menu
    if (hb.dataset.state === 'rest') flop(); else reset();
  });

  // the dangling burger is the drag handle (so the links stay click-through)
  fallen.addEventListener('pointerdown', (e) => {
    if (torn || (hb.dataset.state !== 'fallen' && hb.dataset.state !== 'open')) return;
    e.preventDefault();
    dragging = true; moved = false; startPull = pull; startY = e.clientY; lastVibe = 0;
    hb.classList.add('is-dragging');
    try { fallen.setPointerCapture(e.pointerId); } catch (_) {}
    arm();
  });
  fallen.addEventListener('pointermove', (e) => {
    if (!dragging || torn) return;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > 5) moved = true;
    const p = Math.max(0, Math.min(DANGER, startPull + dy / TRAVEL));   // clamp AT the clear point — no overshoot-stop
    setPull(p);
    if (p >= STRAIN) {                                               // escalating warning before the tear
      const lvl = Math.floor((p - STRAIN) / 0.045);
      if (lvl > lastVibe) { lastVibe = lvl; buzz(6 + lvl * 7); Stage.play('snip', { gain: 0.08 + lvl * 0.02, rate: 1 + lvl * 0.05 }); }
    } else lastVibe = 0;
    if (p >= DANGER) { dragging = false; hb.classList.remove('is-dragging'); tear(); }
  });
  const up = () => {
    if (!dragging || torn) return;
    dragging = false; hb.classList.remove('is-dragging');
    if (!moved) { reset(); return; }                                // a tap (no drag) on the burger reels it home
    if (pull >= 0.8) { setState('open'); setPull(OPEN); hb.classList.add('pulled'); Stage.play('snip', { gain: 0.2 }); buzz(10); }
    else { setState('fallen'); setPull(0); }
  };
  fallen.addEventListener('pointerup', up);
  fallen.addEventListener('pointercancel', up);

  // ── auto-calibrate the pull distance so the grab handle always peeks below the
  // slit, no matter how many nav items the strand holds. It used to be a hardcoded
  // 260px tuned to a longer nav; a shorter nav retracted the handle up out of reach.
  // Measure the handle's natural gap below the slit → --retract. Recalc on resize +
  // once fonts settle (item heights shift as the brand font loads).
  const strand = document.getElementById('hb-strand');
  const slit = hb.querySelector('.hb-slit');
  function calibrate() {
    if (!strand || !slit) return;
    const had = hb.style.getPropertyValue('--pull');
    hb.style.setProperty('--pull', '1');                     // fully extended (translateY 0) → handle at its natural low point (--pull defaults to 0, so we can't just clear it)
    const gap = fallen.getBoundingClientRect().top - slit.getBoundingClientRect().bottom;
    if (had) hb.style.setProperty('--pull', had); else hb.style.removeProperty('--pull');   // restore synchronously — no repaint between
    const retract = Math.max(120, Math.round(gap - 14));     // 14px of the handle peeks below the slit
    hb.style.setProperty('--retract', retract + 'px');
    TRAVEL = Math.round(retract * 0.88);                     // preserve the original 230/260 drag feel
  }
  calibrate();
  window.addEventListener('resize', calibrate, { passive: true });
  try { document.fonts && document.fonts.ready.then(calibrate); } catch (_) {}

  window.__drexHb = { flop, reset, tear, open: () => { setState('open'); setPull(OPEN); },
    setPull, get pull(){return pull;}, get state(){return hb.dataset.state;} };
}
