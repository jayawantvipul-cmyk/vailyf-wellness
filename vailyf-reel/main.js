// Meera's Journal, 30 s vertical cut (1080×1920) for Instagram Reels.
// Same specimens and voice as vailyf-journey; the layout is a tall journal page the camera tilts down.
// Instagram covers roughly the top 250 px and bottom 300 px: text stays between y 250 and 1650.
const VW = 1080, VH = 1920, CX = VW / 2, CY = VH / 2;
window.DUR = 30.0;
const BPM = 80, BEAT = 60 / BPM;   // 0.75 s; bar = 3 s

const VO = [
  ['v1', 0.4, 2.719, 'मीरा के दिन थकान से शुरू होते थे।', "Meera's days began with tiredness."],
  ['v3', 4.55, 3.92, 'फिर उसने VaiLyf पर रोज़ का छोटा-सा लॉग शुरू किया।', 'Then she started a small daily log on VaiLyf.'],
  ['v4a', 8.6, 3.556, 'आठ गिलास पानी। घर का खाना।', 'Eight glasses of water. Home-cooked food.'],
  ['v5', 13.6, 3.43, 'जिस दिन मन नहीं किया, उस दिन टीम साथ थी।', "On the days she didn't feel like it, her team was there."],
  ['v6', 18.1, 4.176, 'चार हफ़्ते। छोटी आदतें, बड़ा फ़र्क़।', 'Four weeks. Small habits, a big difference.'],
  ['v8', 23.6, 4.04, 'VaiLyf Wellness: आपकी टीम की सेहत का साथी।', "VaiLyf Wellness: your team's partner in health."],
];
window.VO = VO;

let PAPER_IMG, O = {}, WATER, WASH = {};
function build() {
  withSeed(11, () => { O.wilted = obj(genWilted(1.2)); });
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
  withSeed(18, () => { O.card = obj(genCard()); O.tick = obj(genTick()); O.sprig = obj(genSprig(1.3)); O.bar = obj(genBar(600)); });
  withSeed(20, () => { O.tally = [0, 1, 2].map(i => obj([mk(qcurve(i * 16, 0, i * 16 + 4, -40, 2, 6), 6, INK2, { prof: 'tip', nb: 0, a: .8 })])); });
  const mkWash = (col, a, x0, y0, x1, y1, seed) => withSeed(seed, () => {
    const c2 = document.createElement('canvas'); c2.width = (x1 - x0) / 2; c2.height = (y1 - y0) / 2; const c = c2.getContext('2d'); c.scale(.5, .5); c.translate(-x0, -y0);
    for (let k = 0; k < 4; k++) { const pts = []; const yt = y0 + 40 + k * 30; for (let x = x0; x <= x1; x += 60) pts.push([x, yt + (fbm(x * .003 + k * 9) - .5) * 140]); pts.push([x1, y1], [x0, y1]); washPoly(c, pts, col, a / 2, 3, 8); }
    return { cv: c2, x0, y0, w: x1 - x0, h: y1 - y0 };
  });
  WASH.ochre = mkWash(C.ochreWash, .32, -1300, 500, 2400, 4400, 31);
  WASH.green = mkWash(C.greenWash, .5, -1300, 480, 2400, 4400, 32);
  WASH.grey = mkWash(C.greyWash, .45, -600, 2500, 1700, 4000, 33);
  WASH.ochreA = mkWash(C.ochreWash, .26, -300, 1000, 1400, 2000, 34);
}
const drawWash = (w, a = 1) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(w.cv, w.x0, w.y0, w.w, w.h); ctx.restore(); };
function camTrack(keys) {
  return t => {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t <= b[0]) { const u = eio(seg(t, a[0], b[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } }
    return keys[keys.length - 1].slice(1);
  };
}
const setCam = ([x, y, z]) => ctx.setTransform(z, 0, 0, z, CX - x * z, CY - y * z);
// page A: hold close on the question, then pull back to reveal why
const camA = camTrack([[0, 540, 620, 1.35], [0.9, 540, 640, 1.38], [2.6, 540, 930, 1.0]]);
// page B: hold on the log, tilt down through the habits on the beats, down into the rain, pull back, push to the plant
const camB = camTrack([[4.5, 540, 880, 1.0], [7.5, 540, 880, 1.0], [9.0, 540, 1330, 1.0], [10.5, 540, 1850, 1.0], [11.7, 540, 2250, 1.0],
  [12.0, 540, 2250, 1.0], [13.1, 540, 2950, 1.0], [17.4, 540, 2950, 1.0], [18.5, 540, 2280, .5], [19.2, 540, 2280, .5], [22.5, 530, 2760, .95]]);

// ---------- page A ----------
const QUESTION = 'मैं इतनी थकी क्यों हूँ?';
function pageA(t) {
  setCam(camA(t));
  drawWash(WASH.ochreA, ss(seg(t, 1.2, 2.6)));
  note(t, 1.0, 99, null, 0, 90, 330, 'मीरा की डायरी', { size: 40, id: 'title', pass: true });
  note(t, -0.4, 99, null, 0, 540, 560, QUESTION, { size: 64, align: 'center', id: 'q', a: .92 });
  put(O.wilted, 320, 1440, seg(t, 0.9, 2.4));
  note(t, 1.6, 99, 300, 1210, 110, 1090, 'मुरझाया मन', { id: 'n_wilt', bend: -14, pass: true });
  const cupT = [1.5, 1.875, 2.25], cupX = [650, 790, 930];
  cupT.forEach((c, i) => { put(O.cup[i], cupX[i], 1400, seg(t, c - .1, c + .4)); put(O.tally[i], 760 + i * 16, 1250, seg(t, c, c + .2)); });
  note(t, 2.0, 99, null, 0, 820, 1230, 'कॉफ़ी', { id: 'n_cof', pass: true });
  put(O.moon, 860, 800, seg(t, 1.2, 1.9));
  note(t, 1.6, 99, 830, 860, 560, 930, '5 घंटे नींद', { id: 'n_moon5', bend: 14, lead: 230, leadY: -24, pass: true });
}

// ---------- page B: one tall sheet ----------
const GL = i => [300 + i * 70, 1250], GL_T = i => i === 0 ? 6.0 : 7.5 + (i - 1) * .1875;
const STEPS = [[260, 1900], [330, 1940], [400, 1975], [475, 2000], [550, 2020], [630, 2035], [710, 2045], [790, 2050]];
const LONE = [560, 3150];
const TEAM = [[[70, 3050], [400, 3100], 0], [[90, 3250], [430, 3210], 1], [[1010, 3060], [720, 3100], 2], [[990, 3260], [690, 3215], 3]];
const PLANT = [300, 2900], MOONB = [860, 2280], SCORE = [600, 2650];
function pageB(t) {
  setCam(camB(t));
  drawWash(WASH.ochre, ss(seg(t, 4.6, 5.8)));
  const gp = eio(seg(t, 18.0, 21.0));
  if (gp > 0) {   // the green spreads left to right across the sheet (palette as data)
    ctx.save(); ctx.beginPath(); const ex = lerp(-560, 1640, gp);
    ctx.moveTo(-1400, 0); for (let y = 0; y <= 4400; y += 40) ctx.lineTo(ex + (vnoise(y * .004 + 3) - .5) * 260, y); ctx.lineTo(-1400, 4400); ctx.closePath(); ctx.clip();
    drawWash(WASH.green); ctx.restore();
  }
  note(t, 4.55, 99, null, 0, 90, 360, 'सप्ताह 1', { size: 46, id: 'wk1' });
  hand('WEEK 1', 92, 420, seg(t, 5.0, 5.6), { font: '"IBM Plex Mono"', size: 18, track: 4, a: .7 });
  put(O.card, 330, 800, seg(t, 4.75, 5.6));
  put(O.tick, 420, 660, seg(t, 5.35, 5.65));
  note(t, 5.5, 99, 460, 640, 520, 560, 'VaiLyf · रोज़ का लॉग', { id: 'n_log', bend: -10 });
  for (let i = 0; i < 8; i++) {
    const t0 = GL_T(i), [x, y] = GL(i);
    put(O.glass[i], x, y, seg(t, t0, t0 + .45));
    const lv = eo(seg(t, t0 + .25, t0 + .9));
    if (lv > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - 40, y - 112 * lv, 80, 112 * lv + 2); ctx.clip(); ctx.drawImage(WATER, x - 35, y - 126, 70, 130); ctx.restore(); }
  }
  note(t, 6.1, 8.0, 300, 1120, 380, 1040, '1 गिलास', { id: 'n_g1', bend: 10, lead: -10, pass: true });
  note(t, 8.3, 99, 560, 1120, 560, 1040, '8 गिलास पानी', { id: 'n_g8', bend: 10, pass: true });
  hand('8 × 250 ML', 562, 1340, seg(t, 8.8, 9.3), { font: '"IBM Plex Mono"', size: 20, track: 3, a: .7 });
  put(O.thali, 560, 1660, seg(t, 9.0, 9.9));
  note(t, 9.6, 99, 640, 1560, 700, 1460, 'घर का खाना', { id: 'n_food', bend: -12, pass: true });
  STEPS.forEach(([x, y], i) => put(O.footM[i % 2], x + (i % 2 ? 12 : -12), y, seg(t, 10.5 + i * BEAT / 4, 10.5 + i * BEAT / 4 + .25)));
  hand('6,000', 150, 2150, seg(t, 10.9, 11.4), { font: '"IBM Plex Mono"', size: 30, track: 3, a: .8 });
  note(t, 11.1, 99, null, 0, 300, 2150, 'क़दम', { id: 'n_steps', pass: true });
  put(O.moonB, MOONB[0], MOONB[1], seg(t, 11.25, 11.9));
  note(t, 11.5, 99, MOONB[0] - 30, MOONB[1] + 30, 560, 2400, '7 घंटे नींद', { id: 'n_moon', bend: 12, lead: 250, leadY: -24, pass: true });
  put(O.wiltedB, PLANT[0], PLANT[1], seg(t, 12.1, 12.9), 1 - ss(seg(t, 18.6, 19.3)));
  if (t > 18.6) put(O.bloomB, PLANT[0], PLANT[1], seg(t, 19.0, 20.2));
  // the grey day
  const rise = eio(seg(t, 12.0, 12.9)), clear = ss(seg(t, 16.0, 18.0));
  if (rise > 0 && clear < 1) {
    ctx.save(); ctx.beginPath(); const top = lerp(4100, 2700, rise);
    ctx.moveTo(-700, 4200); for (let x = -700; x <= 1800; x += 30) ctx.lineTo(x, top + (fbm(x * .0035 + 7) - .5) * 70 + Math.sin(x * .013) * 6); ctx.lineTo(1800, 4200); ctx.closePath(); ctx.clip();
    drawWash(WASH.grey, (1 - clear) * (.35 + .65 * rise)); ctx.restore();
  }
  put(O.footGrey, LONE[0], LONE[1], seg(t, 12.75, 13.05), 1, 1.5);
  note(t, 13.0, 17.4, LONE[0] - 10, LONE[1] + 40, 150, 3380, 'आज मन नहीं…', { id: 'n_dip', bend: -12, lead: 200, leadY: -24 });
  TEAM.forEach(([a, b, ci], k) => {
    for (let i = 0; i < 4; i++) {
      const u = i / 3, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) + (i % 2 ? 12 : -12), t0 = 13.5 + i * BEAT + k * .09;
      put(O.footT[ci][i % 2], x, y, seg(t, t0, t0 + .28));
    }
  });
  note(t, 13.8, 17.7, 740, 3050, 660, 2930, 'टीम चैलेंज', { id: 'n_team', bend: -12 });
  const sp = ss(seg(t, 18.6, 20.6)), score = Math.round(lerp(42, 78, sp));
  if (t > 18.2) {
    note(t, 18.2, 99, null, 0, SCORE[0], SCORE[1] - 160, 'सप्ताह 4', { id: 'n_wk4', size: 48 });
    note(t, 18.5, 99, null, 0, SCORE[0], SCORE[1] - 85, 'वेलनेस स्कोर', { id: 'n_score', size: 44 });
    put(O.bar, SCORE[0], SCORE[1], seg(t, 18.4, 18.9), 1, .64);
    if (sp > 0) withSeed(41 + Math.round(sp * 24), () => { const s = mk(qcurve(0, 0, 384 * score / 100, 0, -2, 20), 18, mixc(C.ochre, C.g3, sp), { prof: 'even', nb: 4, a: .85 }); ctx.save(); ctx.translate(SCORE[0], SCORE[1]); drawS(ctx, s, 1); ctx.restore(); });
    hand(String(score), SCORE[0] + 384 * score / 100 + 18, SCORE[1], seg(t, 18.7, 19.0), { font: '"IBM Plex Mono"', size: 36, a: .85 });
    if (sp >= 1) worldText('score', '78', SCORE[0] + 384 * .78 + 18, SCORE[1] - 22, 60, 44, true);
  }
}

// ---------- page turn, mist, subtitles, end card ----------
function edgePath(e, side) {
  ctx.beginPath(); const far = side > 0 ? VW + 80 : -80;
  ctx.moveTo(far, -20); for (let y = -20; y <= VH + 40; y += 30) ctx.lineTo(e + (vnoise(y * .008 + 5) - .5) * 26, y); ctx.lineTo(far, VH + 40); ctx.closePath();
}
function edgeShadow(e, dir) {
  const g = ctx.createLinearGradient(e, 0, e + dir * 50, 0); g.addColorStop(0, 'rgba(60,45,30,.20)'); g.addColorStop(1, 'rgba(60,45,30,0)');
  ctx.fillStyle = g; ctx.fillRect(Math.min(e, e + dir * 50), 0, 50, VH);
}
function drawMist(t, t0, t1) {
  const c = eio(seg(t, t0, t1)); if (c <= 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [lift, a] of [[160, .55], [0, 1]]) {
    const top = VH + 100 - c * (VH + 400) - lift;
    ctx.save(); ctx.beginPath(); ctx.moveTo(-10, VH + 20);
    for (let x = -10; x <= VW + 40; x += 30) ctx.lineTo(x, top + (vnoise(x * .008 + lift) - .5) * 180 + Math.sin(x * .012 + t) * 12);
    ctx.lineTo(VW + 10, VH + 20); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(PAPER_IMG, 0, 0); ctx.restore();
  }
}
function wrap(txt, maxW) {
  const words = txt.split(' '), lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (ctx.measureText(nx).width > maxW && cur) { lines.push(cur); cur = w; } else cur = nx; }
  lines.push(cur);
  if (lines.length === 2) {   // balance two lines
    const all = txt.split(' '); let best = null;
    for (let k = 1; k < all.length; k++) { const a = all.slice(0, k).join(' '), b = all.slice(k).join(' '), d = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width); if (Math.max(ctx.measureText(a).width, ctx.measureText(b).width) <= maxW && (!best || d < best[0])) best = [d, [a, b]]; }
    if (best) return best[1];
  }
  return lines;
}
const SUB_Y = 1560;
function drawSubs(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [, s, d, hi, en] of VO) {
    const f = fade2(t, s - .15, s + d + .5, .2, .3); if (f <= 0) continue;
    ctx.save(); ctx.globalAlpha = f; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = rgba(PAPER, 1); ctx.shadowBlur = 18;
    ctx.font = '400 42px "Tiro Devanagari Hindi"'; const hl = wrap(hi, 920);
    ctx.font = 'italic 500 30px "Cormorant Garamond"'; const el = wrap(en, 920);
    let y = SUB_Y - (hl.length - 1) * 52 - (el.length - 1) * 34;
    ctx.font = '400 42px "Tiro Devanagari Hindi"'; ctx.fillStyle = rgba(INK, .9);
    for (const ln of hl) { for (let k = 0; k < 2; k++) ctx.fillText(ln, CX, y); y += 52; }
    ctx.font = 'italic 500 30px "Cormorant Garamond"'; ctx.fillStyle = rgba(INK, .78); y -= 8;
    for (const ln of el) { for (let k = 0; k < 2; k++) ctx.fillText(ln, CX, y); y += 34; }
    ctx.restore();
  }
}
const WA = '“Hi” लिखकर भेजें · 7710874111';
function drawEnd(t) {
  if (t < 22.9) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  put(O.sprig, CX, 760, seg(t, 23.0, 23.9));
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = '500 108px "Cormorant Garamond"'; const tw = ctx.measureText('VaiLyf Wellness').width;
  ctx.save(); ctx.beginPath(); ctx.rect(CX - tw / 2 - 20, 780, (tw + 40) * eio(seg(t, 23.5, 24.6)), 150); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .9); ctx.shadowBlur = 10; ctx.fillStyle = rgba(INK, .92); ctx.fillText('VaiLyf Wellness', CX, 890); ctx.restore();
  ctx.restore();
  hand('WWW.VAILYFAI.COM', CX, 980, seg(t, 24.4, 25.1), { font: '"IBM Plex Mono"', size: 30, track: 6, align: 'center', a: .82 });
  hand(WA, CX, 1070, seg(t, 24.8, 25.7), { size: 44, align: 'center', a: .88 });
  if (t >= 24.6) TX.push({ id: 'end_title', text: 'VaiLyf Wellness', x0: CX - tw / 2, y0: 800, x1: CX + tw / 2, y1: 910 });
  if (t >= 25.1) TX.push({ id: 'end_web', text: 'WWW.VAILYFAI.COM', x0: 230, y0: 960, x1: 850, y1: 1000 });
  if (t >= 25.7) TX.push({ id: 'end_wa', text: WA, x0: 200, y0: 1035, x1: 880, y1: 1105 });
}

function render(t) {
  TX = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(PAPER_IMG, 0, 0);
  const T1 = [3.75, 4.5];
  if (t < T1[0]) pageA(t);
  else if (t < T1[1]) {
    pageA(t);
    const e = lerp(VW + 60, -60, eio(seg(t, T1[0], T1[1])));
    ctx.setTransform(1, 0, 0, 1, 0, 0); edgeShadow(e, -1);
    ctx.save(); edgePath(e, 1); ctx.clip(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAPER_IMG, 0, 0); pageB(t); ctx.restore(); ctx.restore();
    TX = [];
  } else if (t < 23.6) pageB(t);
  if (t > 22.6) { drawMist(t, 22.6, 23.5); if (t > 23.5) TX = TX.filter(x => x.id.startsWith('end')); }
  drawEnd(t);
  drawSubs(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
window.render = render;
window.TEXTS = t => { render(t); return TX; };

const EV = [];
EV.push({ t: 0.05, type: 'pen', dur: 1.1, pan: 0 }, { t: 0.9, type: 'brush', dur: 1.5, pan: -.4 }, { t: 1.2, type: 'brush', dur: .7, pan: .5 });
[1.5, 1.875, 2.25].forEach((c, i) => EV.push({ t: c, type: 'clink', pan: .2 + i * .15 }));
EV.push({ t: 3.75, type: 'flip', pan: .3 });
EV.push({ t: 4.75, type: 'brush', dur: .85, pan: -.4 }, { t: 5.35, type: 'tick', pan: -.2 }, { t: 5.8, type: 'pen', dur: .9, pan: .1 });
for (let i = 0; i < 8; i++) EV.push({ t: GL_T(i) + .25, type: 'fill', i, pan: (GL(i)[0] - 540) / 540 * .6 });
EV.push({ t: 9.0, type: 'brush', dur: .9, pan: .1 }, { t: 9.9, type: 'pen', dur: .8, pan: .3 });
STEPS.forEach((s, i) => EV.push({ t: 10.5 + i * BEAT / 4, type: 'step', soft: 0, pan: (s[0] - 540) / 540 * .6 }));
EV.push({ t: 11.25, type: 'brush', dur: .65, pan: .5 }, { t: 12.1, type: 'brush', dur: .8, pan: -.4 });
EV.push({ t: 12.0, type: 'rain', dur: 5.6 });
EV.push({ t: 12.75, type: 'step', soft: 1, pan: 0 });
TEAM.forEach(([a], k) => { for (let i = 0; i < 4; i++) EV.push({ t: 13.5 + i * BEAT + k * .09, type: 'step', soft: .5, pan: (a[0] < 540 ? -1 : 1) * (.7 - i * .15) }); });
EV.push({ t: 17.6, type: 'birds', dur: 11 });
EV.push({ t: 18.0, type: 'sweep', dur: 3.0 }, { t: 19.0, type: 'burst', pan: -.3 }, { t: 18.2, type: 'brush', dur: .5, pan: -.3 });
EV.push({ t: 22.6, type: 'mist', dur: 1.2 }, { t: 23.0, type: 'brush', dur: .9, pan: 0 }, { t: 24.8, type: 'pen', dur: .9, pan: 0 });
VO.forEach(([id, s]) => EV.push({ t: s, type: 'vo', id }));
window.EV = EV;

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['400 40px Kalam', '400 42px "Tiro Devanagari Hindi"', 'italic 500 30px "Cormorant Garamond"', '500 108px "Cormorant Garamond"', '400 18px "IBM Plex Mono"']
    .map(f => document.fonts.load(f, 'Aaमीरा')));
  build();
  window.READY = true;
})();
