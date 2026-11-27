// Shared with vailyf-journey/main.js: palette, helpers, painted specimens and annotations.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
// ---------- palette ----------
const C = {
  tiredA: '#b9ab94', tiredB: '#9c8f7a', ochre: '#c9b48a', olive: '#a59a6a', oliveD: '#7f7650', brownLeaf: '#9a7f55',
  g1: '#a9c27a', g2: '#8ea860', g3: '#5f8a4e', g4: '#4e6e3c',
  water: '#8fb6cf', waterD: '#5b87a6', glass: '#8fa3b0',
  dal: '#e3b54a', roti: '#d9a766', rotiD: '#b9834a', plate: '#c9c2b4', red: '#c8442a',
  pot: '#c98a64', potD: '#a86a48', cup: '#a99c88', coffee: '#6b4a35', moon: '#d9c28a',
  accent: '#e07b28',  // marigold: the one recurring accent (ticks, flowers, score marker)
  rose: '#d9707a', team: ['#5b87a6', '#c0645a', '#8a6fb0', '#d9a440'],
  greyWash: '#9aa0a3', ochreWash: '#d8c8a4', greenWash: '#c3d6a0',
};

// ---------- small helpers ----------
const fade2 = (t, a, b, fi = .5, fo = .5) => ss(seg(t, a, a + fi)) * (1 - ss(seg(t, b - fo, b)));
function spr(L, k = 2) {   // sprite at k× resolution, so camera push-ins stay crisp
  const [x0, y0, x1, y1] = bbox(L), c2 = document.createElement('canvas');
  c2.width = Math.max(1, (x1 - x0) * k); c2.height = Math.max(1, (y1 - y0) * k);
  const c = c2.getContext('2d'); c.scale(k, k); c.translate(-x0, -y0); for (const s of L) drawS(c, s, 1);
  return { cv: c2, x0, y0, w: x1 - x0, h: y1 - y0 };
}
function obj(L) { return { S: L, sp: spr(L) }; }
// draw an object at (x,y) in the current world transform, painted to fraction p
function put(o, x, y, p = 1, a = 1, sc = 1) {
  if (p <= 0 || a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha *= a;
  if (p >= 1) ctx.drawImage(o.sp.cv, o.sp.x0, o.sp.y0, o.sp.w, o.sp.h); else drawList(ctx, o.S, p);
  ctx.restore();
}
function washPoly(c, pts, fill, a, passes = 3, jit = 5) {
  for (let p = 0; p < passes; p++) {
    c.beginPath(); pts.forEach(([x, y], i) => { const xx = x + rnd(-jit, jit), yy = y + rnd(-jit, jit); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); });
    c.closePath(); c.globalAlpha = a / passes * 1.6; c.fillStyle = fill; c.fill();
  }
  c.globalAlpha = 1;
}
function blob(cx, cy, rx, ry, n = 28, wob = .08, seed = 0) {
  const out = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = 1 + wob * (vnoise(seed + i * .7) * 2 - 1); out.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  return out;
}
function arcPts(cx, cy, rx, ry, a0, a1, n = 24) { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }

// ---------- specimen generators (local coords, origin at the base, y up = negative) ----------
function genPot(sc = 1) {
  const S = [];
  for (let i = 0; i < 6; i++) { const y = -8 - i * 17, w = lerp(46, 62, i / 5) * sc; S.push(mk(qcurve(-w, y * sc, w, y * sc, rnd(-3, 3), 10), 21 * sc, i % 2 ? C.pot : C.potD, { prof: 'even', a: .8 })); }
  S.push(mk(qcurve(-70 * sc, -108 * sc, 70 * sc, -108 * sc, -2, 12), 14 * sc, C.potD, { prof: 'even', a: .9 }));
  S.push(mk(qcurve(-58 * sc, -2, 58 * sc, -2, 2, 10), 4 * sc, INK2, { prof: 'even', nb: 0, a: .55 }));
  return S;
}
function genWilted(sc = 1) {   // stems rise, then droop; leaves hang, olive-brown
  const S = genPot(sc), top = -112 * sc;
  for (let i = 0; i < 5; i++) {
    const x0 = (i - 2) * 12 * sc, dx = (i - 2) * 26 * sc + rnd(-8, 8), h = rnd(150, 200) * sc;
    const pts = qctrl(x0, top, x0 + dx * .6, top - h, x0 + dx * 2.1, top - h * .45, 16);
    S.push(mk(pts, 5 * sc, C.oliveD, { prof: 'tip', nb: 0, a: .85 }));
    for (let k = 4; k < 16; k += 3) {
      const [x, y] = pts[k], d = Math.PI / 2 + (dx > 0 ? -.4 : .4) + rnd(-.3, .3), L = rnd(30, 46) * sc;
      S.push(mk(qcurve(x, y, x + Math.cos(d) * L, y + Math.sin(d) * L, rnd(-6, 6), 6), rnd(12, 17) * sc, pick([C.olive, C.brownLeaf, C.oliveD]), { prof: 'leaf', nb: 2, a: .8, rough: .3 }));
    }
  }
  return S;
}
function genBloom(sc = 1) {   // upright stems, green leaves angled up, marigold and rose flowers
  const S = genPot(sc), top = -112 * sc, tips = [];
  for (let i = 0; i < 6; i++) {
    const x0 = (i - 2.5) * 10 * sc, dx = (i - 2.5) * 30 * sc + rnd(-10, 10), h = rnd(250, 330) * sc;
    const pts = qctrl(x0, top, x0 + dx * .3, top - h * .55, x0 + dx, top - h, 16);
    S.push(mk(pts, 6 * sc, C.g4, { prof: 'tip', nb: 0, a: .85 }));
    for (let k = 3; k < 16; k += 2) {
      const [x, y] = pts[k], side = k % 4 === 1 ? 1 : -1, d = -Math.PI / 2 + side * rnd(.6, 1.1), L = rnd(34, 52) * sc;
      S.push(mk(qcurve(x, y, x + Math.cos(d) * L, y + Math.sin(d) * L, side * rnd(2, 7), 6), rnd(14, 20) * sc, pick([C.g1, C.g2, C.g3]), { prof: 'leaf', nb: 2, a: .85, rough: .3 }));
    }
    tips.push(pts[16]);
  }
  for (const [x, y] of tips) {   // flowers last, so they paint in at the end
    const col = pick([C.accent, C.accent, C.rose]);
    for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2 + rnd(-.2, .2), L = rnd(14, 19) * sc; S.push(mk(qcurve(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, rnd(-2, 2), 5), rnd(10, 13) * sc, col, { prof: 'leaf', nb: 0, a: .88 })); }
    S.push(mk(qcurve(x - 3, y, x + 3, y + 1, 0, 3), 7 * sc, '#8a5a2b', { prof: 'even', nb: 0, a: .9 }));
  }
  return S;
}
function genCup() {
  const S = [];
  for (let i = 0; i < 5; i++) { const y = -10 - i * 12, w = lerp(30, 38, i / 4); S.push(mk(qcurve(-w, y, w, y, rnd(-2, 2), 8), 15, C.cup, { prof: 'even', a: .75 })); }
  S.push(mk(arcPts(0, -66, 39, 9, Math.PI, Math.PI * 3, 24), 3, INK2, { prof: 'even', nb: 0, a: .6 }));
  S.push(mk(arcPts(0, -66, 32, 6, 0, Math.PI * 2, 20), 6, C.coffee, { prof: 'even', nb: 0, a: .75 }));
  S.push(mk(arcPts(42, -38, 16, 18, -Math.PI / 2, Math.PI / 2, 12), 6, C.tiredB, { prof: 'even', nb: 0, a: .8 }));
  S.push(mk(qcurve(-62, 2, 62, 2, 4, 12), 10, C.tiredA, { prof: 'even', a: .7 }));
  for (const sx of [-10, 12]) { const pts = []; for (let i = 0; i <= 12; i++) pts.push([sx + Math.sin(i * .9) * 6, -80 - i * 5]); S.push(mk(pts, 3, C.tiredA, { prof: 'tip', nb: 0, a: .55 })); }
  return S;
}
function genMoon(r = 60, col = C.moon) {
  const S = [];
  for (let k = 0; k < 3; k++) S.push(mk(arcPts(0, 0, r - k * 7, r - k * 7, -2.25, 2.25, 26), r * .62 - k * 8, col, { prof: 'leaf', nb: 4, a: .7, rough: .25 }));
  return S;
}
function genGlass() {
  const S = [], h = 120, wt = 30, wb = 24;
  S.push(mk([[-wt, -h], [-(wt + wb) / 2, -h / 2], [-wb, 0]], 3.2, C.glass, { prof: 'even', nb: 0, a: .7 }));
  S.push(mk([[wt, -h], [(wt + wb) / 2, -h / 2], [wb, 0]], 3.2, C.glass, { prof: 'even', nb: 0, a: .7 }));
  S.push(mk(qcurve(-wb, 0, wb, 0, 2, 6), 4, C.glass, { prof: 'even', nb: 0, a: .7 }));
  S.push(mk(arcPts(0, -h, wt, 5, Math.PI, Math.PI * 3, 16), 2.4, C.glass, { prof: 'even', nb: 0, a: .55 }));
  return S;
}
function genWater() {   // the water body, drawn clipped to its level
  const c2 = document.createElement('canvas'); c2.width = 140; c2.height = 260; const c = c2.getContext('2d'); c.scale(2, 2); c.translate(35, 126);
  washPoly(c, [[-28, -112], [28, -112], [22, -2], [-22, -2]], C.water, .6, 3, 2);
  washPoly(c, [[-22, -40], [22, -40], [21, -2], [-21, -2]], C.waterD, .25, 2, 2);
  return c2;
}
function genThali() {
  const S = [];
  S.push(mk(arcPts(0, 0, 150, 92, 0, Math.PI * 2.06, 48), 16, C.plate, { prof: 'even', a: .7 }));
  S.push(mk(arcPts(0, 0, 128, 78, 0, Math.PI * 2.04, 44), 4, C.tiredB, { prof: 'even', nb: 0, a: .45 }));
  // dal bowl
  S.push(mk(arcPts(-62, -18, 40, 25, 0, Math.PI * 2.05, 24), 10, '#c7b9a2', { prof: 'even', a: .8 }));
  for (let i = 0; i < 4; i++) S.push(mk(qcurve(-90, -26 + i * 6, -34, -26 + i * 6, rnd(-3, 3), 6), 9, C.dal, { prof: 'even', a: .78 }));
  // rotis
  for (const [x, y] of [[40, -30], [66, -14]]) {
    for (let i = 0; i < 4; i++) S.push(mk(arcPts(x, y, 44 - i * 9, 26 - i * 5.5, 0, Math.PI * 2, 22), 11, C.roti, { prof: 'even', a: .6 }));
    for (let i = 0; i < 4; i++) { const a = rnd(0, 6.3), r = rnd(6, 28); S.push(mk(qcurve(x + Math.cos(a) * r, y + Math.sin(a) * r * .6, x + Math.cos(a) * r + 6, y + Math.sin(a) * r * .6 + 2, 0, 3), 5, C.rotiD, { prof: 'leaf', nb: 0, a: .7 })); }
  }
  // salad
  clump(S, 0, 42, 24, 12, [C.g2, C.g3, C.g1], { sx: 1.6, sy: .6, l0: 12, l1: 20, w0: 8, w1: 12 });
  for (let i = 0; i < 5; i++) { const x = rnd(-30, 30), y = rnd(34, 52); S.push(mk(qcurve(x, y, x + 5, y + 2, 0, 3), 9, C.red, { prof: 'leaf', nb: 0, a: .8 })); }
  return S;
}
function genFoot(col, left = true) {
  const S = [], m = left ? -1 : 1;
  S.push(mk(qcurve(0, 0, m * 6, -44, m * 4, 8), 21, col, { prof: 'leaf', nb: 3, a: .78 }));
  S.push(mk(qcurve(m * -1, 14, m * 1, 30, 0, 4), 18, col, { prof: 'leaf', nb: 2, a: .78 }));
  return S;
}
function genCard() {   // the daily log, painted as a small card
  const S = [];
  for (let i = 0; i < 12; i++) { const y = -170 + i * 31; S.push(mk(qcurve(-120, y, 120, y, rnd(-3, 3), 10), 34, '#c9d6bd', { prof: 'even', a: .45 })); }
  for (const [pts] of [[qcurve(-128, -188, 128, -188, 3, 12)], [qcurve(128, -188, 128, 196, -3, 12)], [qcurve(128, 196, -128, 196, 3, 12)], [qcurve(-128, 196, -128, -188, -3, 12)]]) S.push(mk(pts, 3, INK2, { prof: 'even', nb: 0, a: .55 }));
  const rows = [-100, -20, 60, 140];
  rows.forEach((y, i) => {
    S.push(mk(qcurve(-40, y, 80 - i * 18, y, rnd(-2, 2), 8), 5, C.tiredB, { prof: 'even', nb: 0, a: .55 }));
    const icon = [C.water, C.g2, C.accent, C.moon][i];
    S.push(mk(qcurve(-86, y - 9, -84, y + 9, 3, 6), 16, icon, { prof: 'leaf', nb: 0, a: .85 }));
  });
  return S;
}
function genTick() { return [mk([[-22, 2], [-8, 18], [26, -24]], 9, C.accent, { prof: 'tip', nb: 2, a: .92 })]; }
function genStrike(w) { return [mk(qcurve(-w / 2, 6, w / 2, -4, -6, 18), 10, INK2, { prof: 'brush', nb: 4, a: .85 })]; }
function genSprig(sc = 1) {
  const S = [], pts = qctrl(0, 0, -10 * sc, -60 * sc, 6 * sc, -130 * sc, 14);
  S.push(mk(pts, 6 * sc, C.g4, { prof: 'tip', nb: 0, a: .9 }));
  [[3, -1], [5, 1], [7, -1], [9, 1], [11, -1]].forEach(([k, side]) => { const [x, y] = pts[k], d = -Math.PI / 2 + side * 1.0, L = (46 - k * 2) * sc; S.push(mk(qcurve(x, y, x + Math.cos(d) * L, y + Math.sin(d) * L, side * 6, 6), 18 * sc, k % 4 === 1 ? C.g2 : C.g3, { prof: 'leaf', nb: 3, a: .9 })); });
  const [x, y] = pts[14]; S.push(mk(qcurve(x, y, x + 4, y - 26 * sc, 3, 6), 16 * sc, C.g1, { prof: 'leaf', nb: 2, a: .9 }));
  return S;
}
function genBar(w) { return [mk(qcurve(0, 0, w, 0, -2, 20), 18, C.tiredA, { prof: 'even', nb: 4, a: .35 })]; }

// ---------- annotations (world space) ----------
function hand(txt, x, y, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.font = `${o.w || 400} ${o.size || 34}px ${o.font || 'Kalam'}`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = (o.track || 0) + 'px';
  const w = ctx.measureText(txt).width, x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x, sz = o.size || 34;
  ctx.beginPath(); ctx.rect(x0 - 10, y - sz * 1.4, (w + 34) * eo(p), sz * 2.8); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 12; ctx.fillStyle = rgba(o.col || INK, o.a ?? .9);
  ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
  return w;
}
function leader(x0, y0, x1, y1, p, bend = 20, a = .75) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p)));
  ctx.beginPath(); for (let i = 0; i <= m; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(INK, a); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3.2, 0, 7); ctx.fillStyle = rgba(INK, a); ctx.fill(); }
}
// a note: leader from the label to its specimen, label written left to right; records its box for TEXTS
let TX = [];
function note(t, t0, t1, ax, ay, lx, ly, txt, o = {}) {
  const f = 1 - ss(seg(t, t1 - .5, t1)); if (t < t0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f;
  if (ax !== null) leader(lx + (o.lead ?? 0), ly + (o.leadY ?? 22), ax, ay, seg(t, t0, t0 + .6), o.bend ?? 18);
  const w = hand(txt, lx, ly, seg(t, t0 + .3, t0 + 1.2), o);
  ctx.restore();
  if (o.id && w) worldText(o.id, txt, o.align === 'right' ? lx - w : o.align === 'center' ? lx - w / 2 : lx, ly - (o.size || 34) * .7, w, (o.size || 34) * 1.4, t >= t0 + 1.2 && f >= 1, o.pass);
}
function worldText(id, text, x, y, w, h, full, pass) {
  if (!full) return;
  const m = ctx.getTransform(), a = m.transformPoint(new DOMPoint(x, y)), b = m.transformPoint(new DOMPoint(x + w, y + h));
  TX.push({ id, text, x0: a.x, y0: a.y, x1: b.x, y1: b.y, ...(pass ? { pass: true } : {}) });
}

