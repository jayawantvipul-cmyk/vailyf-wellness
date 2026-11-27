// Meera's Journal: a VaiLyf Wellness film in the Watercolor Brush style.
// Everything is a pure function of t. Strokes are built once in build() under fixed seeds;
// anything made inside render(t) goes through withSeed.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = 49.0;
const BPM = 80, BEAT = 60 / BPM;          // 0.75 s; bar = 3 s

// ---------- script (start times from TREATMENT.md; durations from voice/out/dur.json) ----------
const VO = [
  ['v1', 0.8, 2.719, 'मीरा के दिन थकान से शुरू होते थे।', "Meera's days began with tiredness."],
  ['v2', 6.4, 3.652, 'कम नींद, तीसरी कॉफ़ी, और मुरझाया मन।', 'Too little sleep, a third coffee, a wilted mood.'],
  ['v3', 12.4, 3.92, 'फिर उसने VaiLyf पर रोज़ का छोटा-सा लॉग शुरू किया।', 'Then she started a small daily log on VaiLyf.'],
  ['v4a', 18.4, 3.556, 'आठ गिलास पानी। घर का खाना।', 'Eight glasses of water. Home-cooked food.'],
  ['v4b', 22.6, 4.042, '6,000 क़दम। सात घंटे की नींद।', '6,000 steps. Seven hours of sleep.'],
  ['v5', 28.8, 3.43, 'जिस दिन मन नहीं किया, उस दिन टीम साथ थी।', "On the days she didn't feel like it, her team was there."],
  ['v6', 33.4, 4.176, 'चार हफ़्ते। छोटी आदतें, बड़ा फ़र्क़।', 'Four weeks. Small habits, a big difference.'],
  ['v7', 38.8, 2.961, 'अब मीरा पूछती है, आज क्या नया करूँ?', 'Now Meera asks: what new thing shall I try today?'],
  ['v8', 43.0, 4.04, 'VaiLyf Wellness: आपकी टीम की सेहत का साथी।', "VaiLyf Wellness: your team's partner in health."],
];
window.VO = VO;

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

// ---------- the world ----------
let PAPER_IMG, O = {}, WATER, WASH = {};
function build() {
  withSeed(11, () => { O.wilted = obj(genWilted(1.15)); O.bloom = obj(genBloom(1.15)); });
  withSeed(12, () => { O.wiltedB = obj(genWilted(1.5)); O.bloomB = obj(genBloom(1.5)); });
  withSeed(13, () => { O.cup = [obj(genCup()), obj(genCup()), obj(genCup())]; });
  withSeed(14, () => { O.moon = obj(genMoon(58)); O.moonB = obj(genMoon(64, '#c9b98a')); });
  withSeed(15, () => { O.glass = []; for (let i = 0; i < 8; i++) O.glass.push(obj(genGlass())); });
  WATER = genWater();
  withSeed(16, () => { O.thali = obj(genThali()); });
  withSeed(17, () => {
    O.footM = [obj(genFoot('#7a8a6a', true)), obj(genFoot('#7a8a6a', false))];
    O.footGrey = obj(genFoot('#5e5a55', true));
    O.footT = C.team.map(c => [obj(genFoot(c, true)), obj(genFoot(c, false))]);
  });
  withSeed(18, () => { O.card = obj(genCard()); O.tick = obj(genTick()); O.tick2 = obj(genTick()); O.sprig = obj(genSprig(1.3)); O.bar = obj(genBar(620)); });
  withSeed(19, () => { O.strike = obj(genStrike(620)); });
  // tally marks for the three coffees
  withSeed(20, () => { O.tally = [0, 1, 2].map(i => obj([mk(qcurve(i * 16, 0, i * 16 + 4, -40, 2, 6), 6, INK2, { prof: 'tip', nb: 0, a: .8 })])); });
  // page washes: a quiet ochre ground, the grey rain wash, and the green that spreads at the bloom
  const mkWash = (col, a, x0, y0, x1, y1, seed) => withSeed(seed, () => {
    const c2 = document.createElement('canvas'); c2.width = (x1 - x0) / 2; c2.height = (y1 - y0) / 2; const c = c2.getContext('2d'); c.scale(.5, .5); c.translate(-x0, -y0);
    for (let k = 0; k < 4; k++) { const pts = []; const yt = y0 + 40 + k * 30; for (let x = x0; x <= x1; x += 60) pts.push([x, yt + (fbm(x * .002 + k * 9) - .5) * 160]); pts.push([x1, y1], [x0, y1]); washPoly(c, pts, col, a / 2, 3, 8); }
    return { cv: c2, x0, y0, w: x1 - x0, h: y1 - y0 };
  });
  WASH.ochre = mkWash(C.ochreWash, .32, -900, 160, 4700, 1700, 31);
  WASH.green = mkWash(C.greenWash, .5, -900, 140, 4700, 1700, 32);
  WASH.grey = mkWash(C.greyWash, .45, 1300, 760, 4700, 1800, 33);
  WASH.ochreA = mkWash(C.ochreWash, .26, -200, 560, 2200, 1300, 34);
  WASH.greenA = mkWash(C.greenWash, .42, -200, 540, 2200, 1300, 35);
}
const drawWash = (w, a = 1) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(w.cv, w.x0, w.y0, w.w, w.h); ctx.restore(); };

// ---------- cameras: [t, x, y, zoom] keys per page, eased per segment ----------
function camTrack(keys) {
  return t => {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b[0]) { const u = eio(seg(t, a[0], b[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; }
    }
    return keys[keys.length - 1].slice(1);
  };
}
const camA = camTrack([[0, 960, 330, 1.6], [6, 960, 345, 1.78], [11.2, 960, 560, 1.0], [38.4, 960, 400, 1.3], [40.6, 960, 410, 1.32], [42.2, 960, 540, 1.0]]);
// page B: lateral track along the habits with stops on the beats, a tilt into the rainy day, pull-back, push to the plant
const trackX = monotone([[12, 960], [18, 960], [20.25, 1500], [22.5, 2050], [24.75, 2500], [26, 2700]]);
const camB0 = camTrack([[26.2, 2700, 540, 1.0], [27.6, 2700, 860, 1.0], [32.2, 2700, 860, 1.0], [33.4, 2450, 660, .6], [34.5, 2450, 660, .6], [37.6, 3120, 650, .92]]);
const camB = t => t < 26.2 ? [trackX(t), 540, 1.0] : camB0(t);
const setCam = ([x, y, z]) => ctx.setTransform(z, 0, 0, z, 960 - x * z, 540 - y * z);

// ---------- page A: the question ----------
const QUESTION = 'मैं इतनी थकी क्यों हूँ?', ANSWER = 'आज क्या नया करूँ?';
function pageA(t, after) {
  setCam(camA(t));
  // ground wash: ochre while tired, green after
  drawWash(WASH.ochreA, after ? 0 : ss(seg(t, 6.2, 8)));
  drawWash(WASH.greenA, after ? 1 : 0);
  // title
  note(t, after ? 0 : 1.2, 99, null, 0, 120, 110, 'मीरा की डायरी', { size: 40, id: 'title' });
  // the question, written left to right
  ctx.save(); ctx.font = '400 66px Kalam'; const qw = ctx.measureText(QUESTION).width; ctx.restore();
  note(t, after ? -9 : 0.15, 99, null, 0, 960, 330, QUESTION, { size: 66, align: 'center', id: 'q', a: .92 });
  if (after) {
    put(O.strike, 960, 336, seg(t, 38.6, 39.1));
    note(t, 39.2, 99, null, 0, 960, 470, ANSWER, { size: 66, align: 'center', id: 'a', col: '#3b5a2e' });
  }
  // the plant: wilted, then (after) in bloom
  if (!after) put(O.wilted, 520, 900, seg(t, 6.3, 8.3));
  else put(O.bloom, 520, 900, 1);
  if (!after) note(t, 7.0, 99, 470, 690, 230, 600, 'मुरझाया मन', { id: 'n_wilt', bend: -14 });
  // three coffees, one per beat, with tally marks
  const cupT = [7.5, 8.25, 9.0], cupX = [1150, 1300, 1450];
  cupT.forEach((c, i) => {
    put(O.cup[i], cupX[i], 860, seg(t, c - .1, c + .5), after ? .22 : 1);
    if (!after) put(O.tally[i], 1260 + i * 16, 700, seg(t, c, c + .2));
  });
  if (!after) note(t, 8.5, 99, null, 0, 1320, 680, 'कॉफ़ी', { id: 'n_cof' });
  // the moon: 5 hours, later 7
  put(O.moon, 1560, 300, seg(t, 8.0, 8.8));
  if (!after) { note(t, 8.4, 99, 1610, 330, 1660, 420, '5 घंटे नींद', { id: 'n_moon5', bend: 12, lead: 20, leadY: -26 }); }
  else note(t, -9, 99, 1610, 330, 1660, 420, '7 घंटे नींद', { id: 'n_moon7', bend: 12, lead: 20, leadY: -26, col: '#3b5a2e', pass: true });
}

// ---------- page B: the weeks ----------
const GL_X = i => 1180 + i * 70, GL_T = i => i === 0 ? 15.0 : 18.0 + (i - 1) * .1875;
const STEPS = [[2380, 770], [2450, 742], [2525, 716], [2600, 694], [2680, 672], [2760, 654], [2845, 640], [2930, 630]];
const LONE = [2700, 1000];
const TEAM = [  // four colleagues: start, end, colour index; four steps each, on the beat from 28.6
  [[1980, 960], [2560, 975], 0], [[2050, 1080], [2600, 1045], 1], [[3420, 950], [2840, 975], 2], [[3360, 1085], [2800, 1050], 3]];
function pageB(t) {
  const cam = camB(t); setCam(cam);
  drawWash(WASH.ochre, ss(seg(t, 12.6, 14)));
  // the green spreads left to right across the whole page at the bloom (palette as data)
  const gp = eio(seg(t, 33.0, 36.0));
  if (gp > 0) {
    ctx.save(); ctx.beginPath(); const ex = lerp(600, 4500, gp);
    ctx.moveTo(-1000, 0); for (let y = 0; y <= 1800; y += 40) ctx.lineTo(ex + (vnoise(y * .006 + 3) - .5) * 260, y); ctx.lineTo(-1000, 1800); ctx.closePath(); ctx.clip();
    drawWash(WASH.green); ctx.restore();
  }
  // header
  note(t, 12.5, 99, null, 0, 120, 130, 'सप्ताह 1', { size: 44, id: 'wk1' });
  hand('WEEK 1', 122, 190, seg(t, 13, 13.8), { font: '"IBM Plex Mono"', size: 18, track: 4, a: .7 });
  // the log card and its tick
  put(O.card, 560, 610, seg(t, 12.9, 13.9));
  put(O.tick, 650, 470, seg(t, 13.6, 13.9));
  note(t, 14.0, 99, 600, 400, 700, 330, 'VaiLyf · रोज़ का लॉग', { id: 'n_log', bend: -10, leadY: 24 });
  // glasses: the first at 15, then seven more on sixteenths from 18
  for (let i = 0; i < 8; i++) {
    const t0 = GL_T(i), x = GL_X(i);
    put(O.glass[i], x, 700, seg(t, t0, t0 + .45));
    const lv = eo(seg(t, t0 + .25, t0 + .9));
    if (lv > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - 40, 700 - 112 * lv, 80, 112 * lv + 2); ctx.clip(); ctx.drawImage(WATER, x - 35, 700 - 126, 70, 130); ctx.restore(); }
  }
  note(t, 15.05, 18.9, 1180, 570, 1080, 470, '1 गिलास', { id: 'n_g1', bend: 10 });
  note(t, 19.2, 99, 1420, 570, 1330, 470, '8 गिलास पानी', { id: 'n_g8', bend: 10 });
  hand('8 × 250 ML', 1332, 520, seg(t, 19.8, 20.4), { font: '"IBM Plex Mono"', size: 18, track: 3, a: .7 });
  // thali
  put(O.thali, 2150, 650, seg(t, 20.25, 21.3));
  note(t, 21.0, 99, 2150, 548, 2030, 450, 'घर का खाना', { id: 'n_food', bend: -12 });
  // footsteps, one per beat from 22.5
  STEPS.forEach(([x, y], i) => put(O.footM[i % 2], x + (i % 2 ? 14 : -14), y, seg(t, 22.5 + i * BEAT / 2, 22.5 + i * BEAT / 2 + .3)));
  hand('6,000', 2560, 860, seg(t, 23.6, 24.2), { font: '"IBM Plex Mono"', size: 30, track: 3, a: .8 });
  note(t, 23.9, 99, null, 0, 2730, 860, 'क़दम', { id: 'n_steps' });
  // the moon, seven hours
  put(O.moonB, 3050, 380, seg(t, 24.75, 25.6));
  note(t, 25.2, 99, 3100, 410, 3150, 500, '7 घंटे नींद', { id: 'n_moon', bend: 12, leadY: -26 });
  hand('7 H', 3152, 550, seg(t, 25.7, 26.2), { font: '"IBM Plex Mono"', size: 18, track: 4, a: .7 });
  // the plant on this page: wilted until the bloom
  const bp = seg(t, 34.3, 35.5);
  put(O.wiltedB, 3350, 960, seg(t, 25.4, 26.6), 1 - ss(seg(t, 33.8, 34.6)));
  if (t > 33.8) put(O.bloomB, 3350, 960, bp);
  // the grey day: rain wash rises, one lone footprint
  const rise = eio(seg(t, 26.5, 27.6)), clear = ss(seg(t, 30.4, 32.6));
  if (rise > 0 && clear < 1) {
    ctx.save(); ctx.beginPath(); const top = lerp(1720, 760, rise);
    ctx.moveTo(1300, 1800); for (let x = 1300; x <= 4800; x += 30) ctx.lineTo(x, top + (fbm(x * .0035 + 7) - .5) * 70 + Math.sin(x * .013) * 6); ctx.lineTo(4800, 1800); ctx.closePath(); ctx.clip();
    drawWash(WASH.grey, (1 - clear) * (.35 + .65 * rise)); ctx.restore();
  }
  put(O.footGrey, LONE[0], LONE[1], seg(t, 27.6, 27.9), 1, 1.5);
  note(t, 27.9, 32.4, LONE[0] - 30, LONE[1] + 20, 2330, 1130, 'आज मन नहीं…', { id: 'n_dip', bend: -12, lead: 150, leadY: -24 });
  // team footprints walk in, on the beat
  TEAM.forEach(([a, b, ci], k) => {
    for (let i = 0; i < 4; i++) {
      const u = i / 3, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) + (i % 2 ? 12 : -12), t0 = 28.6 + i * BEAT + k * .09;
      put(O.footT[ci][i % 2], x, y, seg(t, t0, t0 + .28));
    }
  });
  note(t, 29.6, 33.6, 2930, 960, 3020, 850, 'टीम चैलेंज', { id: 'n_team', bend: -12 });
  // score: week 4, wellness score 42 → 78
  const sp = ss(seg(t, 33.6, 35.8)), score = Math.round(lerp(42, 78, sp));
  if (t > 33.2) {
    note(t, 33.2, 99, null, 0, 2700, 170, 'सप्ताह 4 · वेलनेस स्कोर', { id: 'n_score', size: 50 });
    put(O.bar, 2700, 250, seg(t, 33.4, 33.9));
    if (sp > 0) withSeed(41 + Math.round(sp * 24), () => { const s = mk(qcurve(0, 0, 620 * score / 100, 0, -2, 20), 18, mixc(C.ochre, C.g3, sp), { prof: 'even', nb: 4, a: .85 }); ctx.save(); ctx.translate(2700, 250); drawS(ctx, s, 1); ctx.restore(); });
    hand(String(score), 2700 + 620 * score / 100 + 18, 250, seg(t, 33.7, 34.0), { font: '"IBM Plex Mono"', size: 34, a: .85 });
    if (t > 34.0 && sp >= 1) worldText('score', '78', 2700 + 620 * .78 + 18, 228, 60, 44, true);
  }
}

// ---------- page turns ----------
function edgePath(e, side) {   // wavy vertical edge at screen x = e; side +1 = keep right of it, -1 = left
  ctx.beginPath(); const far = side > 0 ? W + 80 : -80;
  ctx.moveTo(far, -20); for (let y = -20; y <= H + 40; y += 30) ctx.lineTo(e + (vnoise(y * .008 + 5) - .5) * 26, y); ctx.lineTo(far, H + 40); ctx.closePath();
}
function edgeShadow(e, dir) {  // dir: which side the shadow falls on (+1 right, -1 left)
  const g = ctx.createLinearGradient(e, 0, e + dir * 60, 0); g.addColorStop(0, 'rgba(60,45,30,.20)'); g.addColorStop(1, 'rgba(60,45,30,0)');
  ctx.fillStyle = g; ctx.fillRect(Math.min(e, e + dir * 60), 0, 60, H);
}
function sheet(drawFn, t) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAPER_IMG, 0, 0); drawFn(t); ctx.restore(); }

// ---------- mist, subtitles, end card ----------
function drawMist(t, t0, t1) {
  const c = eio(seg(t, t0, t1)); if (c <= 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [lift, a] of [[120, .55], [0, 1]]) {
    const top = 1180 - c * 1400 - lift;
    ctx.save(); ctx.beginPath(); ctx.moveTo(-10, 1100);
    for (let x = -10; x <= W + 40; x += 40) ctx.lineTo(x, top + (vnoise(x * .006 + lift) - .5) * 160 + Math.sin(x * .01 + t) * 12);
    ctx.lineTo(W + 10, 1100); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(PAPER_IMG, 0, 0); ctx.restore();
  }
}
function drawSubs(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [, s, d, hi, en] of VO) {
    const f = fade2(t, s - .15, s + d + .6, .25, .35); if (f <= 0) continue;
    ctx.save(); ctx.globalAlpha = f; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = rgba(PAPER, 1); ctx.shadowBlur = 18;
    ctx.font = '400 40px "Tiro Devanagari Hindi"'; ctx.fillStyle = rgba(INK, .9);
    for (let k = 0; k < 2; k++) ctx.fillText(hi, 960, 1000);
    ctx.font = 'italic 500 28px "Cormorant Garamond"'; ctx.fillStyle = rgba(INK, .78);
    for (let k = 0; k < 2; k++) ctx.fillText(en, 960, 1042);
    ctx.restore();
  }
}
function drawEnd(t) {
  if (t < 42.6) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  put(O.sprig, 960, 360, seg(t, 42.8, 43.8));
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = '500 104px "Cormorant Garamond"'; const tw = ctx.measureText('VaiLyf Wellness').width;
  ctx.save(); ctx.beginPath(); ctx.rect(960 - tw / 2 - 20, 380, (tw + 40) * eio(seg(t, 43.4, 44.8)), 140); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .9); ctx.shadowBlur = 10; ctx.fillStyle = rgba(INK, .92); ctx.fillText('VaiLyf Wellness', 960, 486); ctx.restore();
  ctx.restore();
  hand('WWW.VAILYFAI.COM', 960, 572, seg(t, 44.2, 45.0), { font: '"IBM Plex Mono"', size: 26, track: 6, align: 'center', a: .82 });
  hand('“Hi” लिखकर भेजें · 7710874111', 960, 650, seg(t, 44.5, 45.5), { size: 40, align: 'center', a: .88 });
  if (t >= 45.0) worldTextScreen('end_web', 'WWW.VAILYFAI.COM', 700, 555, 520, 36, true);
  if (t >= 45.5) worldTextScreen('end_wa', '“Hi” लिखकर भेजें · 7710874111', 640, 620, 640, 60, true);
  if (t >= 44.8) worldTextScreen('end_title', 'VaiLyf Wellness', 960 - tw / 2, 400, tw, 110, true);
}
function worldTextScreen(id, text, x, y, w, h, full) { if (full) TX.push({ id, text, x0: x, y0: y, x1: x + w, y1: y + h }); }

// ---------- frame ----------
function render(t) {
  TX = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(PAPER_IMG, 0, 0);
  const T1 = [11.9, 12.8], T2 = [37.6, 38.5];
  if (t < T1[0]) pageA(t, false);
  else if (t < T1[1]) {                       // sheet B slides in over A from the right
    pageA(t, false);
    const e = lerp(W + 60, -60, eio(seg(t, T1[0], T1[1])));
    ctx.setTransform(1, 0, 0, 1, 0, 0); edgeShadow(e, -1);
    ctx.save(); edgePath(e, 1); ctx.clip(); sheet(pageB, t); ctx.restore();
    TX = [];
  } else if (t < T2[0]) pageB(t);
  else if (t < T2[1]) {                       // sheet B slides off to the left, A (four weeks later) beneath
    pageA(t, true);
    const e = lerp(W + 60, -60, eio(seg(t, T2[0], T2[1])));
    ctx.setTransform(1, 0, 0, 1, 0, 0); edgeShadow(e, 1);
    ctx.save(); edgePath(e, -1); ctx.clip(); sheet(pageB, t); ctx.restore();
    TX = [];
  } else pageA(t, true);
  if (t > 42.0) { drawMist(t, 42.0, 43.3); if (t > 43.3) TX = TX.filter(x => x.id.startsWith('end')); }
  drawEnd(t);
  drawSubs(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
window.render = render;
window.TEXTS = t => { render(t); return TX; };

// ---------- sound and cue events (read by mix.py through events.mjs) ----------
const EV = [];
EV.push({ t: 0.15, type: 'pen', dur: 1.2, pan: 0 });
EV.push({ t: 1.2, type: 'pen', dur: .8, pan: -.6 });
EV.push({ t: 6.3, type: 'brush', dur: 2.0, pan: -.4 });
[7.5, 8.25, 9.0].forEach((c, i) => EV.push({ t: c, type: 'clink', pan: .2 + i * .15 }));
EV.push({ t: 7.3, type: 'pen', dur: .9, pan: -.5 }, { t: 8.0, type: 'brush', dur: .8, pan: .6 }, { t: 8.7, type: 'pen', dur: .9, pan: .6 }, { t: 8.8, type: 'pen', dur: .7, pan: .3 });
EV.push({ t: 11.9, type: 'flip', pan: .3 });
EV.push({ t: 12.9, type: 'brush', dur: 1.0, pan: -.4 }, { t: 13.6, type: 'tick', pan: -.3 }, { t: 14.3, type: 'pen', dur: .9, pan: -.2 });
for (let i = 0; i < 8; i++) EV.push({ t: GL_T(i) + .25, type: 'fill', i, pan: (GL_X(i) - (i ? trackX(GL_T(i)) : 960)) / 960 });
EV.push({ t: 20.25, type: 'brush', dur: 1.05, pan: .4 }, { t: 21.3, type: 'pen', dur: .9, pan: .2 });
STEPS.forEach((_, i) => EV.push({ t: 22.5 + i * BEAT / 2, type: 'step', soft: 0, pan: -.2 + i * .07 }));
EV.push({ t: 24.75, type: 'brush', dur: .85, pan: .5 }, { t: 25.4, type: 'brush', dur: 1.2, pan: .7 });
EV.push({ t: 26.5, type: 'rain', dur: 6.0 });
EV.push({ t: 27.6, type: 'step', soft: 1, pan: 0 });
TEAM.forEach(([a, , ], k) => { for (let i = 0; i < 4; i++) EV.push({ t: 28.6 + i * BEAT + k * .09, type: 'step', soft: .5, pan: (a[0] < 2700 ? -1 : 1) * (.7 - i * .15) }); });
EV.push({ t: 32.6, type: 'birds', dur: 13 });
EV.push({ t: 33.0, type: 'sweep', dur: 3.0 }, { t: 34.4, type: 'burst', pan: .3 }, { t: 33.4, type: 'brush', dur: .5, pan: .2 });
EV.push({ t: 37.6, type: 'flip', pan: -.3 });
EV.push({ t: 38.6, type: 'strike', pan: 0 }, { t: 39.3, type: 'pen', dur: 1.2, pan: 0 });
EV.push({ t: 42.0, type: 'mist', dur: 1.6 });
EV.push({ t: 42.8, type: 'brush', dur: 1.0, pan: 0 }, { t: 44.5, type: 'pen', dur: 1.0, pan: 0 });
VO.forEach(([id, s]) => EV.push({ t: s, type: 'vo', id }));
window.EV = EV;

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['400 40px Kalam', '400 40px "Tiro Devanagari Hindi"', 'italic 500 28px "Cormorant Garamond"', '500 104px "Cormorant Garamond"', '400 18px "IBM Plex Mono"']
    .map(f => document.fonts.load(f, 'Aaमीरा')));
  build();
  window.READY = true;
})();
