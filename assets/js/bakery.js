/* ============================================================================
   drex blog — bakery.js
   THE MATERIAL ENGINE. Ported (not paraphrased) from the WORKING v6 zine-maker
   proof-of-concept (zine-maker-proof-of-concept/mockups/compose-v6.html). The
   v6 bakers — bakeCardstock, edgePath, the torn two-zone rim, bakeTape, bakePin,
   bakeSticker(stamp), bakeChip, bakeAvatar, bakeDesk, bakeSceneLight — are
   reused verbatim where possible; adapted only as the blog's CSS-var contract
   forces (sprites baked into :root --bk-* data-URIs instead of per-element
   <canvas>, because the blog themes stable class names, not v6's .piece nodes).

   Runs ONCE at boot (well under 150ms), deterministic via the v6 seeded PRNG.
   Surfaces are BAKED RASTER (REFS 33); CSS light is layered on in _realism.scss.

   THE 5 MAGIC QUESTIONS answered here:
     MATERIAL  — real paper tooth, fiber whiskers, two-zone torn cores, dye bleed.
     MAGIC     — every scrap is its own object (seeded) — no two tiles alike.
     WHIMSY    — torn ends, hand-cut wobble, glossy pushpin, patchy stamp.
     (interactivity + animation live in blog.js, gated by reduced-motion.)
   ============================================================================ */
(function (global) {
  "use strict";

  var DPR = Math.min(2, global.devicePixelRatio || 1);

  /* ---- palette §4 EXACT (mirrors _tokens.scss / the brand PDF) ---- */
  var PAL = {
    grass:    [28, 171, 91],
    oats:     [254, 246, 228],
    sambas:   [65, 77, 87],
    colorado: [247, 84, 88],
    lazuli:   [36, 150, 201],
    schoolbus:[236, 175, 33],
    happy:    [241, 221, 1],
    kraft:    [214, 196, 160]   // warm kraft for the byline strip (v6 bakeKraft tone)
  };

  /* ---- seeded RNG (v6 verbatim) — deterministic per sprite, different per seed ---- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* construction-paper tone shift (v6 verbatim base): desaturate a hair, warm it.
     `ds` is the desaturation toward luminance. v6 used a flat 0.10 which, on the
     colored brand stock, pulls the faces toward pastel. For richly-DYED cardstock
     (the v6 desk target) we want the colored faces to keep more of their chroma —
     so callers pass a smaller ds (or 0) for colored stock. Default stays 0.10 so
     the Oats desk / sheets are unchanged. */
  function constructionTone(rgb, ds) {
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var lum = r * 0.299 + g * 0.587 + b * 0.114;
    ds = (ds === undefined) ? 0.10 : ds;
    r = r + (lum - r) * ds; g = g + (lum - g) * ds; b = b + (lum - b) * ds;
    r += 4; b -= 5; g += 1;
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
  }

  /* value-noise with injectable rng (v6 verbatim) — de-tiles the tooth. */
  function valueNoise(w, h, cell, rng) {
    rng = rng || Math.random;
    var gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2;
    var g = new Float32Array(gw * gh);
    for (var i = 0; i < g.length; i++) g[i] = rng();
    var sm = function (t) { return t * t * (3 - 2 * t); };
    return function (x, y) {
      var fx = x / cell, fy = y / cell;
      var ix = Math.floor(fx), iy = Math.floor(fy);
      var tx = sm(fx - ix), ty = sm(fy - iy);
      var a = g[iy * gw + ix], b = g[iy * gw + ix + 1],
          c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
      return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    };
  }

  /* Bake cardstock — the v6 paper-tooth baker, verbatim. Mottle + per-pixel tooth
     + rotated fiber whiskers + a top-left→bottom-right light gradient. This is
     the per-pixel realism (REFS 22/32). */
  function bakeCardstock(ctx, w, h, rgb0, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var colored = !!opts.colored;
    var fiber = opts.fiber !== undefined ? opts.fiber : 1;
    var scale = opts.scale !== undefined ? opts.scale : 1;
    var rot   = opts.rot   !== undefined ? opts.rot   : 0;
    var dens  = opts.density !== undefined ? opts.density : 1;
    // colored brand stock keeps MORE chroma (ds 0.04) so scraps read as richly
    // dyed cardstock, not pastel paper; neutral Oats keeps the v6 0.10.
    var ds = (colored ? 0.04 : 0.10);
    var rgb = opts.tone === false ? rgb0 : constructionTone(rgb0, ds);
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var mottBig = valueNoise(w, h, Math.max(40, Math.min(w, h) / 2.4) * scale, rng);
    var mottMid = valueNoise(w, h, 22 * scale, rng);
    var mottFin = valueNoise(w, h, 9 * scale, rng);
    var r0 = rgb[0], g0 = rgb[1], b0 = rgb[2];
    var lum = (r0 * 0.299 + g0 * 0.587 + b0 * 0.114) / 255;
    var mAmp = (colored ? 30 : 22) * dens;
    var mMid = (colored ? 20 : 14) * dens;
    var tAmp = (colored ? (30 + 16 * (1 - lum)) : (22 + 18 * (1 - lum))) * dens;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var m = (mottBig(x, y) - 0.5) * mAmp + (mottMid(x, y) - 0.5) * mMid +
                (mottFin(x, y) - 0.5) * (colored ? 9 : 5) * dens;
        var tooth = (rng() - 0.5) * tAmp;
        var dr = m + tooth, dg = m + tooth, db = m + tooth;
        if (m > 0) { dr += 2.5; dg += 1.2; } else { db += 2.2; }
        d[i]     = clamp(r0 + dr, 0, 255);
        d[i + 1] = clamp(g0 + dg, 0, 255);
        d[i + 2] = clamp(b0 + db, 0, 255);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    ctx.save();
    ctx.lineCap = 'round';
    var density = colored ? 380 : 900;
    var nf = Math.floor((w * h) / density * fiber);
    for (var k = 0; k < nf; k++) {
      var fx = rng() * w, fy = rng() * h;
      var baseAng = rot + ((rng() < 0.78) ? (rng() * 0.64 - 0.32) : (Math.PI / 2 + rng() * 0.64 - 0.32));
      var len = 10 + rng() * (colored ? 30 : 20);
      var light = rng() < 0.5;
      var la = colored ? (.05 + rng() * .08) : (.03 + rng() * .06);
      var da = colored ? (.04 + rng() * .06) : (.02 + rng() * .04);
      ctx.lineWidth = 0.6 + rng() * 0.7;
      ctx.strokeStyle = light ? 'rgba(255,255,255,' + la + ')' : 'rgba(0,0,0,' + da + ')';
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(baseAng) * len, fy + Math.sin(baseAng) * len);
      ctx.stroke();
    }
    ctx.restore();

    var gl = ctx.createLinearGradient(0, 0, w, h);
    gl.addColorStop(0, 'rgba(255,255,255,' + (colored ? .12 : .10) + ')');
    gl.addColorStop(.5, 'rgba(255,255,255,0)');
    gl.addColorStop(1, 'rgba(0,0,0,' + (colored ? .12 : .10) + ')');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
  }

  /* ---------- REAL HAND EDGES (v6 verbatim) ----------
     torn: macro wander + fine fiber jitter (outward-biased so the rim overhangs
     the silhouette, never cuts inward). cut: a slow gentle scissor waver. */
  function edgePath(w, h, type, pad, rng, ampMul, outset) {
    rng = rng || Math.random;
    pad = pad || 0; ampMul = ampMul || 1; outset = outset || 0;
    var pts = [], norms = [];
    var seg = type === 'torn' ? 3.4 : 11;
    var amp = (type === 'torn' ? 4.6 * DPR : 1.5 * DPR) * ampMul;
    function side(x0, y0, x1, y1) {
      var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      var n = Math.max(2, Math.round(len / (seg * DPR)));
      var nx = -dy / len, ny = dx / len;
      var macroF = 0.6 + rng() * 1.6;
      var macroPh = rng() * Math.PI * 2;
      var macroA = type === 'torn' ? amp * (0.9 + rng() * 0.9) : amp * 0.7;
      // SECOND, SLOWER macro wave (its own freq/phase/amp) so the torn baseline is
      // a beat of two incommensurate low-freq waves, not one clean periodic sine —
      // the silhouette wanders irregularly per side (REFS 9/12/30). Sub-1 freq so it
      // bows across the whole edge; amplitude comparable to the fast wave.
      var macroF2 = 0.25 + rng() * 0.7;
      var macroPh2 = rng() * Math.PI * 2;
      var macroA2 = (type === 'torn' ? amp * (0.7 + rng() * 1.0) : 0);
      // a faint sub-low drift so even the wave *envelope* isn't constant.
      var driftPh = rng() * Math.PI * 2;
      for (var i = 0; i < n; i++) {
        var t = i / n, off;
        if (type === 'torn') {
          var drift = 0.78 + 0.30 * Math.sin(t * Math.PI * (0.5 + rng() * 0.4) + driftPh);
          var macro = Math.sin(t * Math.PI * 2 * macroF + macroPh) * macroA * drift +
                      Math.sin(t * Math.PI * 2 * macroF2 + macroPh2) * macroA2;
          var micro = (rng() - 0.5) * 2 * amp;
          var raw = macro * 0.5 + micro;
          off = outset + Math.abs(raw) * 0.78 + raw * 0.10;
        } else {
          off = Math.sin(t * Math.PI * (1 + rng() * 1.5)) * amp * 0.6 + (rng() - 0.5) * amp * 0.5;
        }
        pts.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off]);
        norms.push([nx, ny]);
      }
    }
    var x0 = pad, y0 = pad, x1 = w - pad, y1 = h - pad;
    side(x0, y0, x1, y0); side(x1, y0, x1, y1); side(x1, y1, x0, y1); side(x0, y1, x0, y0);
    return { pts: pts, norms: norms };
  }
  function tracePath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  /* helpers to make a sized canvas + emit a data-URI */
  function makeCanvas(wpx, hpx) {
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(wpx)); cv.height = Math.max(1, Math.round(hpx));
    return cv;
  }
  function uri(cv) { return 'url("' + cv.toDataURL('image/png') + '")'; }

  /* =========================================================================
     ADAPTED-FOR-CSS-VAR BAKERS
     The blog themes stable classes, so we bake reusable SPRITES the SCSS
     consumes via background / border-image, instead of v6's per-.piece canvas.
     ========================================================================= */

  /* (1) The DESK — v6 bakeDesk's Oats-tooth field, but baked as ONE large
     NON-REPEATING surface (>=1600px) the body paints with background-size:cover.
     v6's small phone tiled a 480px sprite; on a full-page blog desk that tile's
     repeat became the #1 website-tell — an identical sprite stamped into a visible
     mat-grid. So: (a) bake at 1600px (low-frequency grain that never reveals a
     seam at cover), and (b) DROP the cutting-mat micro-grid entirely — that faint
     REGULAR grid was exactly what made any repeat legible. The tooth + fiber +
     warm low-freq mottle carry the surface; nothing in here is periodic. */
  function bakeDesk(set) {
    var W = 1600, H = 1600;          // one big field, NOT a tile (no DPR — keep
                                     // the data-URI small; cover upscales gently)
    var cv = makeCanvas(W, H);
    var ctx = cv.getContext('2d');
    // Warm Oats tooth across the whole field. scale up the noise cells a touch so
    // the macro-mottle reads as one continuous lit surface, not many small cells.
    // F5: a TOOTHIER baked field — more fiber + density so the cover-scaled baked
    // layer (not the CSS grain) is no longer the thing washing out in big bare zones.
    bakeCardstock(ctx, W, H, PAL.oats, { fiber: 2.0, scale: 2.4, rot: 0.05, density: 1.85,
      rng: mulberry32(hashStr('desk')) });
    // warm-dark mottle bias: a faint LOW-frequency umber wash so the desk grain
    // has a warm shadow direction (not a uniform pale field). Big cells (no seam).
    (function () {
      var rng = mulberry32(hashStr('deskmottle'));
      var mott = valueNoise(W, H, 220, rng);
      var mim = ctx.getImageData(0, 0, W, H), md = mim.data;
      for (var yy = 0; yy < H; yy++) {
        for (var xx = 0; xx < W; xx++) {
          var ii = (yy * W + xx) * 4;
          var v = (mott(xx, yy) - 0.5);          // -0.5..0.5
          var warm = v * 16;                       // amplitude of the mottle
          md[ii]     = clamp(md[ii]     + warm * 0.9, 0, 255); // R warms up in lights
          md[ii + 1] = clamp(md[ii + 1] + warm * 0.7, 0, 255);
          md[ii + 2] = clamp(md[ii + 2] + warm * 0.4 - 2, 0, 255); // B biases darker/warmer
        }
      }
      ctx.putImageData(mim, 0, 0);
    })();
    // NO cutting-mat micro-grid: the faint regular grid is what makes a surface
    // read as a tiled scan. The tooth/fiber/mottle above carry the desk alone.
    set('--bk-desk', uri(cv));
    // a smaller plain-tooth tile reused as generic paper grain on sheets
    var gc = makeCanvas(360 * DPR, 360 * DPR);
    bakeCardstock(gc.getContext('2d'), gc.width, gc.height, PAL.oats,
      { fiber: 1.35, scale: 1, rot: 0.0, density: 1.15, rng: mulberry32(hashStr('grain')) });
    set('--bk-grain', uri(gc));
  }

  /* (2) ONE soft tinted SCENE LIGHT (v6 bakeSceneLight wash) — a warm top-left
     highlight + mild cool bottom-right falloff baked to a full-viewport sprite.
     No text-contrast holes here (the blog's reading column is on its own clean
     sheet); this is a gentle captured-object wash laid over the whole desk. */
  function bakeSceneLight(set) {
    var W = 900, H = 1400;          // light is smooth — no DPR cost needed
    var cv = makeCanvas(W, H);
    var ctx = cv.getContext('2d');
    // (1) BROAD warm rake — a top-left -> bottom-right linear so the WHOLE desk
    // shows ONE directional falloff (lit edge-to-edge), not a single lit corner.
    // This is the key-light wash that v6's small phone got "for free" from its
    // tight radial; a full-page blog desk needs the linear to carry the rake
    // across the lower-half too. Kept gentle so prose on sheets stays AA-legible.
    var rake = ctx.createLinearGradient(0, 0, W, H);
    rake.addColorStop(0, 'rgba(255,250,236,0.20)');
    rake.addColorStop(.5, 'rgba(255,250,236,0.04)');
    rake.addColorStop(1, 'rgba(255,250,236,0)');
    ctx.fillStyle = rake; ctx.fillRect(0, 0, W, H);
    // (2) WIDER warm key radial from top-left — larger radius + higher mid stop
    // so the highlight reaches well past the corner and the falloff is gradual
    // across the upper two-thirds (was: faded to 0 by ~42%, lighting one corner).
    var hi = ctx.createRadialGradient(W * 0.26, H * 0.12, 30, W * 0.30, H * 0.18, H * 1.15);
    hi.addColorStop(0, 'rgba(255,250,236,0.30)');
    hi.addColorStop(.40, 'rgba(255,250,236,0.16)');
    hi.addColorStop(.72, 'rgba(255,250,236,0.04)');
    hi.addColorStop(1, 'rgba(255,250,236,0)');
    ctx.fillStyle = hi; ctx.fillRect(0, 0, W, H);
    // (3) cool/warm-umber bottom-right falloff — keeps the cool corner so the
    // directional read is preserved end to end.
    var lo = ctx.createRadialGradient(W * 0.82, H * 0.92, H * 0.12, W * 0.86, H * 0.97, H * 0.62);
    lo.addColorStop(0, 'rgba(64,58,44,0)');
    lo.addColorStop(1, 'rgba(64,58,44,0.11)');
    ctx.fillStyle = lo; ctx.fillRect(0, 0, W, H);
    set('--bk-light', uri(cv));
  }

  /* (3) PIECE FACE tiles — the torn colored-paper scrap SURFACE. We bake a
     square tile of stock (the v6 bakeCardstock face) per brand colour; the
     SCSS lays it as the scrap background and adds the two-zone torn EDGE via a
     separate border-image sprite (4). This decomposition is what lets ONE
     baked sprite skin any sized .scrap / .sheet — the v6 per-element approach
     adapted to the blog's reusable classes. */
  function bakePieceFace(set, name, key, colored) {
    var S = 256 * DPR;
    var cv = makeCanvas(S, S);
    bakeCardstock(cv.getContext('2d'), S, S, PAL[key], {
      colored: colored, fiber: colored ? 1.15 : 1, scale: 0.9, rot: hashStr(name) % 7 * 0.18,
      density: colored ? (key === 'colorado' ? 1.3 : 1.1) : .95,
      rng: mulberry32(hashStr('face' + name))
    });
    set(name, uri(cv));
  }

  /* (4) TWO-ZONE TORN EDGE border sprite (REFS 8/9). REBUILT round 2.
     The previous version STROKED soft/blurred rim bands onto a transparent
     canvas and then punched out the centre. That produced exactly the two
     forbidden failures: (REFS 8) a SYMMETRIC BLUR HALO around all four sides
     (the soft strokes feathered alpha OUTSIDE the silhouette in every
     direction), and (REFS 9) NO revealed white fiber core — the colored face
     was never drawn under the rim, so the tear had nothing to bare.

     The fix is a FACE-FIRST silhouette carve, ported from v6 bakePiece's
     clip-then-bake logic:
       (1) DRAW the colored cardstock FACE across the whole canvas.
       (2) CARVE a hand-jittered torn silhouette path (per-row x-jitter via the
           pooled seed) and CLIP to it.
       (3) Inside that clip, stroke a 1–4px near-Oats WHITE FIBER band hugging
           the silhouette, its width swelling/pinching along the tear.
       (4) HARD-clear everything OUTSIDE the silhouette to rgba(0,0,0,0) with a
           crisp even-odd punch — NO blur, NO feather — so the abrupt cutline is
           the only thing under the box-shadow contact cast (no outward glow).
     A 100×100 crop now shows: colored face -> white fiber core -> abrupt
     transparent cutline, never an outward symmetric glow. */
  // bake (and cache) ONE colored cardstock face per stock, sized to the edge
  // sprite. Shared across that stock's variant rims so the 30 edge bakes don't
  // each re-run the costly per-pixel tooth loop (the torn SILHOUETTE differs per
  // variant; the face stock is the same dyed paper, so reuse is correct + fast).
  var _edgeFaceCache = {};
  function edgeFaceFor(key, colored, W, H) {
    if (_edgeFaceCache[key]) return _edgeFaceCache[key];
    var fc = makeCanvas(W, H);
    bakeCardstock(fc.getContext('2d'), W, H, PAL[key], {
      colored: colored, fiber: colored ? 1.15 : 1, scale: 0.9,
      rot: hashStr(key) % 7 * 0.18, density: colored ? (key === 'colorado' ? 1.3 : 1.1) : .95,
      rng: mulberry32(hashStr('edgeface' + key))
    });
    _edgeFaceCache[key] = fc;
    return fc;
  }
  function bakeTornEdge(set, name, key, colored, variant) {
    var S = 200, BLEED = 16;                 // css units; *DPR below
    var W = (S + BLEED * 2) * DPR, H = (S + BLEED * 2) * DPR;
    var cv = makeCanvas(W, H);
    var ctx = cv.getContext('2d');
    var rgb = constructionTone(PAL[key], colored ? 0.04 : 0.10);
    // seed varies per variant so a POOL of edges per stock never clones a
    // neighbour (REFS 12/30 no-clones rule). Multiply the variant into the hash
    // so variant rims are well-separated in seed space, not near-duplicates.
    var rng = mulberry32(hashStr('edge' + name + '~') ^ ((variant || 1) * 0x9E3779B1 >>> 0));
    var pad = BLEED * DPR;
    var outset = 4.5 * DPR;
    var ep = edgePath(W, H, 'torn', pad, rng, 1.05, outset);
    var pts = ep.pts, norms = ep.norms;
    var nP = pts.length;

    // ---- (1) DRAW THE COLORED FACE across the whole canvas (so the tear has
    // real dyed stock to bare). Cached per stock (see edgeFaceFor). ----
    var faceCv = edgeFaceFor(key, colored, W, H);

    // ---- (2) CLIP to the torn silhouette, paint the face inside it ----
    ctx.save();
    tracePath(ctx, pts); ctx.clip();
    ctx.drawImage(faceCv, 0, 0);

    // (a) DYE CORE/SKIN — saturated dye-soaked very rim (inside the clip, so it
    // never bleeds past the silhouette).
    var dyeAlpha = colored ? 0.30 : 0.14;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(' + (rgb[0] * 0.72 | 0) + ',' + (rgb[1] * 0.72 | 0) + ',' +
      (rgb[2] * 0.72 | 0) + ',' + dyeAlpha + ')';
    ctx.lineWidth = 3.0 * DPR; tracePath(ctx, pts); ctx.stroke(); ctx.restore();

    // (b) WHITE FIBER CORE — the revealed cottony pulp band immediately INSIDE
    // the silhouette (REFS 9). Near-Oats #FEF6E4-or-lighter, 1–4px, width
    // VARYING along the tear via two beaten low-freq waves so it swells to a
    // thick downy band in spots and nearly vanishes in others (never machine
    // ric-rac). Drawn as short per-segment strokes so each segment taps its own
    // local width. All inside the clip -> the band lives just within the cut,
    // no feathered alpha outside it.
    var coreR = clamp(rgb[0] + (255 - rgb[0]) * 0.80, 0, 255); // toward #FEF6E4+
    var coreG = clamp(rgb[1] + (246 - rgb[1]) * 0.80, 0, 255);
    var coreB = clamp(rgb[2] + (228 - rgb[2]) * 0.80, 0, 255);
    var coreRGB = (coreR | 0) + ',' + (coreG | 0) + ',' + (coreB | 0);
    var wF1 = 1.4 + rng() * 2.2, wP1 = rng() * Math.PI * 2;
    var wF2 = 0.4 + rng() * 1.1, wP2 = rng() * Math.PI * 2;
    function coreWidthAt(idx) {
      var u = idx / nP;
      var m = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * wF1 + wP1);
      m *= 0.55 + 0.45 * Math.sin(u * Math.PI * 2 * wF2 + wP2) * 0.5 + 0.225;
      m = clamp(m * 1.18 - 0.12, 0, 1);   // push troughs to ~0 (bare patches)
      return m;
    }
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // (i) soft underlay: ONE blurred whole-path stroke (a single filter pass —
    // not a blur per segment, which dominated bake time) gives the band a faint
    // cottony haze without the per-segment cost.
    ctx.filter = 'blur(' + (0.7 * DPR) + 'px)';
    ctx.strokeStyle = 'rgba(' + coreRGB + ',0.26)';
    ctx.lineWidth = 2.4 * DPR; tracePath(ctx, pts); ctx.stroke();
    ctx.filter = 'none';
    // (ii) the crisp cottony core band — width SWELLS/PINCHES along the tear via
    // the modulator, drawn as short per-segment strokes so each segment carries
    // its own local width (the irregular two-zone tell). No blur => cheap.
    for (var s = 0; s < nP; s++) {
      var ca = pts[s], cb = pts[(s + 1) % nP];
      var m = coreWidthAt(s);
      if (m <= 0.05) continue;             // a bare spot — flat dye shows through
      ctx.strokeStyle = 'rgba(' + coreRGB + ',' + (0.78 * (0.40 + 0.60 * m)).toFixed(3) + ')';
      ctx.lineWidth = (1.0 + 3.0 * m) * DPR;   // 1–4px
      ctx.beginPath(); ctx.moveTo(ca[0], ca[1]); ctx.lineTo(cb[0], cb[1]); ctx.stroke();
    }
    ctx.restore();

    // (c) pale top-left fiber GLINT on the lit side of the cut (very low alpha)
    ctx.save(); ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(254,250,238,0.30)'; ctx.lineWidth = 1.0 * DPR;
    ctx.translate(-0.5 * DPR, -0.5 * DPR); tracePath(ctx, pts); ctx.stroke();
    ctx.restore();

    ctx.restore();   // end silhouette clip

    // ---- (4) HARD CUTLINE — clear everything OUTSIDE the silhouette to fully
    // transparent with an even-odd punch (NO blur, NO feather). The torn face is
    // already clipped to the path; this guarantees a crisp alpha cliff so the
    // CSS box-shadow contact cast is the only thing under the rim (REFS 8). ----
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.rect(0, 0, W, H);                   // outer rect
    ctx.moveTo(pts[0][0], pts[0][1]);       // inner silhouette (reverse winding
    for (var q = pts.length - 1; q >= 0; q--) ctx.lineTo(pts[q][0], pts[q][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill('evenodd');                    // erase the ring OUTSIDE the tear
    ctx.restore();

    // ---- sparse pale PULP WHISKERS poking just past the cut (v6 character).
    // Drawn AFTER the punch but kept SHORT (≤~3px) and pale, with their own tiny
    // contact darkening, so they read as a few stray fibers — not a glow ring.
    ctx.save(); ctx.lineCap = 'round';
    var sprout = 0.14 + rng() * 0.10, lenMul = 0.7 + rng() * 0.5;
    for (var i = 0; i < pts.length; i++) {
      if (rng() > sprout) continue;
      var p = pts[i], nrm = norms[i];
      var ja = (rng() - 0.5) * 0.6, ca = Math.cos(ja), sa = Math.sin(ja);
      var ox = nrm[0] * ca - nrm[1] * sa, oy = nrm[0] * sa + nrm[1] * ca;
      var len = (rng() < 0.10 ? (2.2 + rng() * 1.6) : (0.7 + rng() * 1.5)) * lenMul * DPR;
      var wob = (rng() - 0.5) * 0.7 * DPR;
      ctx.strokeStyle = 'rgba(254,250,240,' + (0.22 + rng() * 0.22).toFixed(2) + ')';
      ctx.lineWidth = (0.4 + rng() * 0.4) * DPR;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + ox * len + wob * oy, p[1] + oy * len - wob * ox); ctx.stroke();
    }
    ctx.restore();

    // slice = BLEED + the tear band; the SCSS border-image slice matches.
    set(name, uri(cv));
    set(name + '-slice', String(Math.round((BLEED + 22) * DPR)));
  }

  /* (5) TRANSLUCENT WASHI TAPE strip (v6 bakeTape verbatim minus the per-strip
     shadow canvas — the lifted-end shadow is handled in CSS). Hand-torn ends,
     translucent long edges, fibre striations, sheen, defined torn boundary.
     One horizontal strip baked per tint; SCSS rotates instances. */
  function bakeTape(set, name, tint) {
    var w = 120, h = 34;
    var rgb = (tint === 'oats') ? [234, 219, 188] : (PAL[tint] || PAL.happy);
    var rng = mulberry32(hashStr('tape' + tint));
    var cv = makeCanvas(w * DPR, h * DPR);
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    // ASYMMETRIC MICRO-SERRATED TORN ENDS (REFS 17): the two ends must DIFFER —
    // different tooth count, different mean lean (3–10° off square), different
    // micro-serration. Each end gets its own seeded profile and a fine high-freq
    // serration superimposed on the coarse tear so the boundary nibbles like a
    // hand-torn cello/washi end, not a clean zig-zag.
    function endX(side) {
      var arr = [], base = side === 'left' ? 0 : W;
      var dir = side === 'left' ? 1 : -1;
      var teeth = 6 + (rng() * 4 | 0);          // 6..9, differs per end
      var leanDeg = (3 + rng() * 7) * (rng() < 0.5 ? -1 : 1);   // 3–10° off square
      var lean = Math.tan(leanDeg * Math.PI / 180);
      var serF = 2.2 + rng() * 1.8, serP = rng() * Math.PI * 2; // fine serration
      for (var i = 0; i <= teeth; i++) {
        var t = i / teeth, y = H * t;
        var coarse = Math.abs(rng() * 2 - 1) * 4 * DPR;          // big nibble (inward)
        var ser = Math.abs(Math.sin(t * Math.PI * 2 * serF + serP)) * 1.4 * DPR; // micro serration
        var leanOff = (t - 0.5) * H * lean;              // slanted end (off-square)
        // inset = how far the torn boundary sits IN from the strip edge.
        var inset = coarse + ser + rng() * 2.0 * DPR + leanOff;
        inset = Math.max(0, inset);
        arr.push([base + dir * inset, y]);
      }
      return arr;
    }
    var left = endX('left'), right = endX('right');
    function clipStrip() {
      ctx.beginPath(); ctx.moveTo(left[0][0], 0);
      left.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
      right.slice().reverse().forEach(function (p) { ctx.lineTo(p[0], p[1]); });
      ctx.closePath();
    }
    ctx.save(); clipStrip(); ctx.clip();
    // RAISE translucency (REFS 15/16): real washi/cello tape lets the underlying
    // ground read THROUGH the body, not just at the edges. Drop the body fill from
    // 0.50 to ~0.30 so 20-35% of whatever the strip crosses shows through the whole
    // span (multiply-composited in CSS), and bias the very centre even thinner so
    // the most-lit middle is the most see-through — a tape highlight, not a slab.
    ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.30)';
    ctx.fillRect(0, 0, W, H);
    for (var k = 0; k < H * 0.6; k++) {
      var y = rng() * H;
      ctx.strokeStyle = rng() < .5 ? 'rgba(255,255,255,' + (.04 + rng() * .08) + ')'
                                   : 'rgba(0,0,0,' + (.03 + rng() * .05) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      var x0 = rng() * W * 0.4, x1 = x0 + W * 0.3 + rng() * W * 0.5;
      ctx.moveTo(x0, y); ctx.lineTo(Math.min(W, x1), y + (rng() * 2 - 1)); ctx.stroke();
    }
    // LENGTHWISE WRINKLE / AIR BUBBLE (REFS 18): ≥1 tonal event per ~80px so the
    // strip reads as PRESSED, not a flat slab. A wrinkle = a thin lengthwise
    // crease (dark trough + bright lit lip a hair above it); a bubble = a soft
    // round lens of trapped air (bright dome, dark contact rim below). Both run
    // WITH the tape length (REFS 18 lengthwise). Count scales with strip length.
    var events = Math.max(1, Math.round((w / 80)) + 1);
    for (var e = 0; e < events; e++) {
      if (rng() < 0.6) {
        // --- WRINKLE: a wandering lengthwise crease ---
        var wy = H * (0.25 + rng() * 0.5);
        var x0w = rng() * W * 0.2, x1w = W * (0.55 + rng() * 0.4);
        var amp = (0.6 + rng() * 1.0) * DPR, ph = rng() * Math.PI * 2, fr = 1 + rng() * 2;
        var crease = function (dy, color, lw) {
          ctx.strokeStyle = color; ctx.lineWidth = lw * DPR; ctx.beginPath();
          for (var xx = x0w; xx <= x1w; xx += 3 * DPR) {
            var yy = wy + dy * DPR + Math.sin((xx - x0w) / (x1w - x0w) * Math.PI * fr + ph) * amp;
            (xx === x0w) ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        };
        crease(0.9, 'rgba(0,0,0,0.10)', 1.3);          // shadow trough
        crease(-0.8, 'rgba(255,255,255,0.16)', 1.0);   // lit lip above it
      } else {
        // --- BUBBLE: a soft round lens of trapped air ---
        var bx = W * (0.18 + rng() * 0.64), by = H * (0.3 + rng() * 0.4);
        var br = (3 + rng() * 4) * DPR;
        var dome = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 0, bx, by, br);
        dome.addColorStop(0, 'rgba(255,255,255,0.20)');
        dome.addColorStop(0.7, 'rgba(255,255,255,0.04)');
        dome.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = dome;
        ctx.beginPath(); ctx.ellipse(bx, by, br, br * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.filter = 'blur(' + (0.5 * DPR) + 'px)';
        ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 1 * DPR;
        ctx.beginPath(); ctx.ellipse(bx, by + br * 0.5, br * 0.9, br * 0.4, 0, 0, Math.PI); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
    // translucent long edges + nibbled ends (washi)
    ctx.save(); clipStrip(); ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    var fade = ctx.createLinearGradient(0, 0, 0, H);
    fade.addColorStop(0, 'rgba(0,0,0,0.32)'); fade.addColorStop(.12, 'rgba(0,0,0,0)');
    fade.addColorStop(.88, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);
    var fx = ctx.createLinearGradient(0, 0, W, 0);
    fx.addColorStop(0, 'rgba(0,0,0,0.28)'); fx.addColorStop(.10, 'rgba(0,0,0,0)');
    fx.addColorStop(.90, 'rgba(0,0,0,0)'); fx.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = fx; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // diagonal matte sheen
    ctx.save(); clipStrip(); ctx.clip();
    var sheen = ctx.createLinearGradient(0, 0, W, H);
    sheen.addColorStop(0, 'rgba(255,255,255,0)'); sheen.addColorStop(.4, 'rgba(255,255,255,0.14)');
    sheen.addColorStop(.55, 'rgba(255,255,255,0.04)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // defined torn boundary (soft multiply edge)
    ctx.save(); clipStrip();
    ctx.lineWidth = 1.4 * DPR; ctx.strokeStyle = 'rgba(44,40,30,0.20)'; ctx.stroke();
    ctx.restore();
    set(name, uri(cv));
  }

  /* (6) The glossy plastic PUSHPIN (v6 bakePin verbatim, near-birdseye). */
  function bakePin(set) {
    var rgb = [228, 62, 64];       // brand-leaning red pin
    var bw = 30, bh = 36, grow = 12;
    var cv = makeCanvas((bw + grow * 2) * DPR, (bh + grow * 2) * DPR);
    var ctx = cv.getContext('2d');
    ctx.scale(DPR, DPR); ctx.translate(grow, grow);
    // specular uses a WARM near-white (Oats-leaning), not pure #fff — a glossy
    // plastic dome under the warm scene light reflects a warm key, never #fff
    // (brand: no pure white). K is the rim-shade target.
    var Wc = [255, 250, 240], K = [0, 0, 0];
    var mix = function (c, t, f) {
      return 'rgb(' + clamp(Math.round(c[0] + (t[0] - c[0]) * f), 0, 255) + ',' +
        clamp(Math.round(c[1] + (t[1] - c[1]) * f), 0, 255) + ',' +
        clamp(Math.round(c[2] + (t[2] - c[2]) * f), 0, 255) + ')';
    };
    var cx = bw / 2, S = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    var rh = bw * 0.34, headCy = rh + 3, visible = bw * 0.32, tipY = headCy + rh + visible;
    var pinTopY = headCy + rh * 0.55, pinHalf = bw * 0.072, cant = 0.085;
    function drawHead() {
      var g = ctx.createRadialGradient(cx - rh * 0.30, headCy - rh * 0.40, rh * 0.05, cx - rh * 0.04, headCy - rh * 0.02, rh * 1.22);
      g.addColorStop(0.00, mix(rgb, Wc, 0.90)); g.addColorStop(0.16, mix(rgb, Wc, 0.44));
      g.addColorStop(0.50, S); g.addColorStop(0.84, mix(rgb, K, 0.18)); g.addColorStop(1.00, mix(rgb, K, 0.05));
      ctx.beginPath(); ctx.arc(cx, headCy, rh, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, headCy, rh, 0, Math.PI * 2); ctx.clip();
      var rg = ctx.createRadialGradient(cx + rh * 0.4, headCy + rh * 0.46, rh * 0.05, cx + rh * 0.4, headCy + rh * 0.46, rh * 0.85);
      rg.addColorStop(0, mix(rgb, Wc, 0.32)); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.5; ctx.fillStyle = rg; ctx.fillRect(cx - rh, headCy - rh, rh * 2, rh * 2); ctx.restore();
      // bright catchlight — warm near-white, not pure #fff (glossy plastic under
      // the warm key). This is the spec that makes the orb read 3D, not a dot.
      ctx.save(); ctx.filter = 'blur(0.5px)';
      ctx.beginPath(); ctx.ellipse(cx - rh * 0.28, headCy - rh * 0.30, rh * 0.30, rh * 0.16, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,251,242,0.92)'; ctx.fill(); ctx.restore();
    }
    function drawPin() {
      ctx.beginPath();
      ctx.moveTo(cx - pinHalf, pinTopY); ctx.lineTo(cx + pinHalf, pinTopY);
      ctx.lineTo(cx + pinHalf * 0.10, tipY); ctx.lineTo(cx - pinHalf * 0.10, tipY); ctx.closePath();
      var mg = ctx.createLinearGradient(cx - pinHalf, 0, cx + pinHalf, 0);
      mg.addColorStop(0.00, '#828b92'); mg.addColorStop(0.32, '#f4f7f8');
      mg.addColorStop(0.52, '#cdd5d9'); mg.addColorStop(1.00, '#767f86');
      ctx.fillStyle = mg; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, tipY, pinHalf * 0.16, 1.1, 0, 0, Math.PI * 2); ctx.fillStyle = '#6b747b'; ctx.fill();
      // v6 stem-base shadow: where the steel meets the orb it sits in shade
      ctx.save(); ctx.filter = 'blur(1px)'; ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(cx, pinTopY + 1.5, pinHalf * 1.5, 1.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // soft cast shadow under-right of the orb — its OWN small offset tinted cast
    // (warm umber, not black) so the pin sits ABOVE the scrap, casting onto it.
    ctx.save(); ctx.filter = 'blur(3px)'; ctx.globalAlpha = 0.22; ctx.fillStyle = '#19170f';
    ctx.beginPath(); ctx.ellipse(cx + rh * 0.42, headCy + rh * 0.66, rh * 0.95, rh * 0.56, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save();
    ctx.translate(cx, tipY); ctx.rotate(-cant); ctx.translate(-cx, -tipY);
    // v6 tiny contact shadow where the canted tip meets the paper
    ctx.save(); ctx.filter = 'blur(1.1px)'; ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath(); ctx.ellipse(cx, tipY, 2.2, 1.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    drawPin(); drawHead();
    ctx.restore();
    set('--bk-pin', uri(cv));
    set('--bk-pin-w', String(bw + grow * 2));
    set('--bk-pin-h', String(bh + grow * 2));
  }

  /* (7) PATCHY baked INK STAMP ring (REFS 20–24). A rounded-rect rubber-stamp
     border with patchy bleed/broken ink + xerox specks, transparent centre so
     it frames a label. Used by .stamp. Multiply-only when composited in CSS. */
  function bakeStamp(set) {
    var w = 220, h = 84, pad = 8;
    var cv = makeCanvas(w * DPR, h * DPR);
    var ctx = cv.getContext('2d');
    ctx.scale(DPR, DPR);
    var rng = mulberry32(hashStr('stamp'));
    var ink = PAL.colorado;
    // rounded-rect stroke, patchy via dashed multi-pass + jittered alpha
    function rr(o) {
      var r = 9, x = pad + o, y = pad + o, ww = w - 2 * (pad + o), hh = h - 2 * (pad + o);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + ww, y, x + ww, y + hh, r);
      ctx.arcTo(x + ww, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r);
      ctx.arcTo(x, y, x + ww, y, r);
      ctx.closePath();
    }
    ctx.lineCap = 'round';
    for (var pass = 0; pass < 5; pass++) {
      ctx.save();
      ctx.translate((rng() - 0.5) * 1.2, (rng() - 0.5) * 1.2);
      ctx.lineWidth = 2.4 + rng() * 0.8;
      ctx.strokeStyle = 'rgba(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ',' + (0.16 + rng() * 0.12).toFixed(2) + ')';
      ctx.setLineDash([4 + rng() * 18, 1 + rng() * 4]);
      ctx.lineDashOffset = rng() * 30;
      rr(0); ctx.stroke();
      ctx.restore();
    }
    // soft bleed gain (REFS 21)
    ctx.save(); ctx.filter = 'blur(0.8px)';
    ctx.lineWidth = 2.0; ctx.strokeStyle = 'rgba(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ',0.10)';
    rr(0); ctx.stroke(); ctx.restore();
    // xerox specks (REFS 22)
    for (var s = 0; s < 90; s++) {
      var sx = rng() * w, sy = rng() * h;
      ctx.fillStyle = 'rgba(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ',' + (0.05 + rng() * 0.12).toFixed(2) + ')';
      ctx.fillRect(sx, sy, rng() * 1.4 + 0.4, rng() * 1.4 + 0.4);
    }
    set('--bk-stamp', uri(cv));
  }

  /* ---- run the bakery: set vars on :root, fast, deterministic ---- */
  function build() {
    var root = document.documentElement;
    function set(k, v) { root.style.setProperty(k, v); }
    var t0 = (global.performance && performance.now) ? performance.now() : 0;

    bakeDesk(set);
    bakeSceneLight(set);

    bakePieceFace(set, '--bk-piece-oats',   'oats',      false);
    bakePieceFace(set, '--bk-piece-grass',  'grass',     true);
    bakePieceFace(set, '--bk-piece-sambas', 'sambas',    true);
    bakePieceFace(set, '--bk-piece-coral',  'colorado',  true);
    bakePieceFace(set, '--bk-piece-lazuli', 'lazuli',    true);
    bakePieceFace(set, '--bk-piece-kraft',  'schoolbus', true);

    // bake a POOL of edge variants per stock so adjacent scraps never clone an
    // identical torn rim. Variant 1 keeps the bare --bk-edge-<name> (+ -slice) the
    // existing SCSS already consumes; -1..-3 give _grounds/_realism a de-clone pool.
    [
      ['--bk-edge-oats',   'oats',      false],
      ['--bk-edge-grass',  'grass',     true],
      ['--bk-edge-sambas', 'sambas',    true],
      ['--bk-edge-coral',  'colorado',  true],
      ['--bk-edge-lazuli', 'lazuli',    true],
      ['--bk-edge-kraft',  'schoolbus', true]
    ].forEach(function (e) {
      // >=3 distinct seeds per stock so _grounds/_realism can rotate rims across
      // adjacent .clip nth-children and neighbours never share a profile (REFS 12/30).
      for (var v = 1; v <= 4; v++) {
        bakeTornEdge(set, e[0] + '-' + v, e[1], e[2], v);
      }
      // alias variant 1 to the bare name (back-compat with current SCSS contract)
      bakeTornEdge(set, e[0], e[1], e[2], 1);
    });

    bakeTape(set, '--bk-tape-happy',  'happy');
    bakeTape(set, '--bk-tape-lazuli', 'lazuli');
    bakeTape(set, '--bk-tape-coral',  'colorado');
    bakeTape(set, '--bk-tape-oats',   'oats');

    bakePin(set);
    bakeStamp(set);

    root.classList.add('baked');     // SCSS gate: only swap to sprites once baked
    var t1 = (global.performance && performance.now) ? performance.now() : 0;
    if (t0) root.setAttribute('data-bake-ms', String(Math.round(t1 - t0)));
  }

  // expose for blog.js to invoke first; also self-run if loaded standalone.
  global.DrexBakery = { build: build };
  if (!global.__DREX_BAKERY_DEFER__) {
    if (document.readyState !== 'loading') build();
    else document.addEventListener('DOMContentLoaded', build);
  }
})(window);
