// VaiLyf Whiteboard Tips — three vertical reels on one tall whiteboard (?reel=1|2|3).
// Region r (water, sleep, movement) is drawn in reel r; earlier regions are already on the board.
// Each reel: hook drawing + question, three numbered tips, pull back to the series so far, push into the end card.
import * as W from './engine/wb.js';
const VW = 1080, VH = 1920; W.setView(VW, VH);
const Q = new URLSearchParams(location.search), REEL = +(Q.get('reel') || 1);

const C = { ink: '#1f2a44', blue: '#2a5cb3', green: '#1a7a4a' };
const RH = 2300, RW = 1200;                       // region height and board width
const TOP = 420, Y0 = r => TOP + r * RH;         // top of region r (0-based), below a margin of board
const DUR_V = { h1: 4.597, h2: 2.733, h3: 3.135, h4: 3.126, s1: 4.527, s2: 3.735, s3: 3.971, s4: 3.111, m1: 2.214, m2: 3.301, m3: 3.299, m4: 2.789, cta: 3.2 };
const REELS = [
  { key: 'h', title: 'पानी', q: 'दोपहर तक थकान?', tips: ['उठते ही एक गिलास', 'डेस्क पर बोतल', 'हर खाने के साथ'],
    subs: { h1: ['दोपहर तक थकान? हो सकता है पानी कम पिया हो।', 'Tired by afternoon? You may not be drinking enough water.'], h2: ['पहला: उठते ही एक गिलास पानी।', 'One: a glass of water as soon as you wake up.'], h3: ['दूसरा: अपनी बोतल डेस्क पर रखें।', 'Two: keep your bottle on your desk.'], h4: ['तीसरा: हर खाने के साथ एक गिलास।', 'Three: a glass with every meal.'] } },
  { key: 's', title: 'नींद', q: 'उठते ही थकान?', tips: ['रोज़ एक ही समय', 'एक घंटा पहले स्क्रीन बंद', '7–9 घंटे की नींद'],
    subs: { s1: ['सुबह उठते ही थकान? ये तीन आदतें अपनाएँ।', 'Tired the moment you wake up? Try these three habits.'], s2: ['पहला: रोज़ एक ही समय पर सोएँ और उठें।', 'One: sleep and wake at the same time every day.'], s3: ['दूसरा: सोने से एक घंटा पहले स्क्रीन बंद।', 'Two: screens off an hour before bed.'], s4: ['तीसरा: 7 से 9 घंटे की नींद।', 'Three: seven to nine hours of sleep.'] } },
  { key: 'm', title: 'हलचल', q: 'दिन भर बैठे?', tips: ['हर घंटे स्ट्रेच', 'लंच के बाद 10 मिनट', 'लिफ्ट नहीं, सीढ़ियाँ'],
    subs: { m1: ['दिन भर कुर्सी पर बैठे रहते हैं?', 'Sitting in a chair all day?'], m2: ['पहला: हर घंटे उठें और स्ट्रेच करें।', 'One: stand up and stretch every hour.'], m3: ['दूसरा: लंच के बाद 10 मिनट की सैर।', 'Two: a ten-minute walk after lunch.'], m4: ['तीसरा: लिफ्ट नहीं, सीढ़ियाँ।', 'Three: take the stairs, not the lift.'] } },
];
const CTA_SUB = ['सेशन बुक करने के लिए कमेंट करें: BOOK', 'Comment BOOK to book your session.'];

// ---------- drawings (world coords, centred on (x, y)) ----------
const stick = (x, y, s, pose) => {   // a stick figure standing at (x, y) = feet; pose: stand | slump | stretch | walk | climb
  const h = 180 * s, hy = y - h, o = { w: 8 };
  const out = [W.circle(x, hy + 22 * s, 22 * s, o)];
  if (pose === 'slump') {
    out.push(W.curve([[x, hy + 46 * s], [x + 18 * s, hy + 90 * s], [x + 6 * s, y - 70 * s]], o));
    out.push(W.line(x + 8 * s, y - 70 * s, x + 60 * s, y - 70 * s, o), W.line(x + 60 * s, y - 70 * s, x + 64 * s, y, o));
    out.push(W.line(x + 10 * s, hy + 80 * s, x + 50 * s, hy + 110 * s, o));
  } else {
    out.push(W.line(x, hy + 46 * s, x, y - 70 * s, o));
    if (pose === 'stretch') out.push(W.line(x, hy + 60 * s, x - 40 * s, hy - 10 * s, o), W.line(x, hy + 60 * s, x + 40 * s, hy - 10 * s, o));
    else if (pose === 'walk' || pose === 'climb') out.push(W.line(x, hy + 62 * s, x + 38 * s, hy + 104 * s, o), W.line(x, hy + 62 * s, x - 34 * s, hy + 108 * s, o));
    else out.push(W.line(x, hy + 62 * s, x - 30 * s, hy + 110 * s, o), W.line(x, hy + 62 * s, x + 30 * s, hy + 110 * s, o));
    if (pose === 'walk') out.push(W.line(x, y - 70 * s, x + 36 * s, y, o), W.line(x, y - 70 * s, x - 30 * s, y, o));
    else if (pose === 'climb') out.push(W.line(x, y - 70 * s, x + 30 * s, y - 40 * s, o), W.line(x + 30 * s, y - 40 * s, x + 34 * s, y - 10 * s, o), W.line(x, y - 70 * s, x - 18 * s, y, o));
    else out.push(W.line(x, y - 70 * s, x - 26 * s, y, o), W.line(x, y - 70 * s, x + 26 * s, y, o));
  }
  return out;
};
const glass = (x, y, s = 1, fill = true) => {   // y = bottom
  const w = 56 * s, h = 110 * s, out = [W.poly([[x - w, y - h], [x - w * .78, y], [x + w * .78, y], [x + w, y - h]], { w: 8 })];
  if (fill) { out.push(W.line(x - w * .9, y - h * .62, x + w * .9, y - h * .62, { w: 7, color: C.blue })); out.push(W.hatch([[x - w * .88, y - h * .6], [x + w * .88, y - h * .6], [x + w * .74, y - 6], [x - w * .74, y - 6]], { color: C.blue, spacing: 18, w: 6, alpha: .5 })); }
  return out;
};
const clock = (x, y, r, hh = -1.6, mm = -.2) => [W.circle(x, y, r, { w: 8 }), W.line(x, y, x + Math.cos(hh) * r * .5, y + Math.sin(hh) * r * .5, { w: 8 }), W.line(x, y, x + Math.cos(mm) * r * .78, y + Math.sin(mm) * r * .78, { w: 7, color: C.blue })];
const DRAW = {
  h: {
    hook: (x, y) => [W.rect(x - 150, y - 70, 280, 140, { w: 9 }), W.rect(x + 130, y - 28, 26, 56, { w: 8 }), W.hatch([[x - 136, y - 56], [x - 90, y - 56], [x - 90, y + 56], [x - 136, y + 56]], { color: C.green, spacing: 16, w: 7, alpha: .7 }),
      W.curve([[x + 260, y - 90], [x + 220, y - 10], [x + 230, y + 40], [x + 260, y + 60], [x + 290, y + 40], [x + 300, y - 10], [x + 260, y - 90]], { w: 9, color: C.blue })],
    t: [(x, y) => [W.line(x - 150, y + 60, x + 30, y + 60, { w: 8 }), W.arc(x - 60, y + 60, 60, Math.PI, TAU0, { w: 8 }), ...[-2.6, -2.0, -1.57, -1.1, -.5].map(a => W.line(x - 60 + Math.cos(a) * 80, y + 60 + Math.sin(a) * 80, x - 60 + Math.cos(a) * 110, y + 60 + Math.sin(a) * 110, { w: 7 })), ...glass(x + 110, y + 70, .9)],
      (x, y) => [W.line(x - 160, y + 20, x + 150, y + 20, { w: 9 }), W.line(x - 140, y + 20, x - 140, y + 110, { w: 8 }), W.line(x + 130, y + 20, x + 130, y + 110, { w: 8 }), W.roundRect(x - 10, y - 110, 70, 130, 22, { w: 8, color: C.blue }), W.rect(x + 8, y - 140, 34, 30, { w: 7, color: C.blue })],
      (x, y) => [W.circle(x - 50, y + 20, 95, { w: 8, ry: 50 }), W.circle(x - 50, y + 20, 58, { w: 6, ry: 30 }), ...glass(x + 120, y + 70, .8)]],
  },
  s: {
    hook: (x, y) => [...clock(x - 40, y + 10, 95, -2.2, -1.57), W.arc(x - 115, y - 85, 40, Math.PI * 1.05, Math.PI * 1.75, { w: 9 }), W.arc(x + 35, y - 85, 40, Math.PI * 1.25, Math.PI * 1.95, { w: 9 }),
      W.line(x - 100, y + 95, x - 120, y + 130, { w: 8 }), W.line(x + 20, y + 95, x + 40, y + 130, { w: 8 }), ...W.text('Zzz', x + 150, y - 60, { h: 70, color: C.blue })],
    t: [(x, y) => [...clock(x - 90, y + 10, 70, -2.4, -1.57), ...W.text('=', x + 5, y + 30, { h: 60 }), ...clock(x + 110, y + 10, 70, -2.4, -1.57)],
      (x, y) => [W.roundRect(x - 150, y - 90, 100, 180, 18, { w: 8 }), W.line(x - 120, y + 60, x - 80, y + 60, { w: 6 }), W.line(x - 175, y - 105, x - 25, y + 105, { w: 10, color: C.green }), W.line(x - 25, y - 105, x - 175, y + 105, { w: 10, color: C.green }),
        W.arc(x + 100, y, 70, Math.PI * .55, Math.PI * 1.45, { w: 9, color: C.blue }), W.arc(x + 135, y, 55, Math.PI * .62, Math.PI * 1.38, { w: 8, color: C.blue })],
      (x, y) => [W.line(x - 170, y + 60, x + 170, y + 60, { w: 9 }), W.line(x - 170, y - 50, x - 170, y + 100, { w: 9 }), W.line(x + 170, y + 10, x + 170, y + 100, { w: 9 }), W.roundRect(x - 155, y - 10, 90, 50, 18, { w: 7 }), W.curve([[x - 60, y + 10], [x + 40, y - 30], [x + 165, y + 10]], { w: 8, color: C.blue })]],
  },
  m: {
    hook: (x, y) => [W.line(x - 60, y + 40, x + 70, y + 40, { w: 9 }), W.line(x + 70, y + 40, x + 70, y - 120, { w: 9 }), W.line(x - 50, y + 40, x - 50, y + 120, { w: 8 }), W.line(x + 60, y + 40, x + 60, y + 120, { w: 8 }), ...stick(x - 20, y + 120, 1.1, 'slump'), ...W.text('...', x + 140, y - 60, { h: 60, color: C.blue })],
    t: [(x, y) => [...stick(x - 70, y + 110, 1, 'stretch'), ...clock(x + 110, y - 10, 62, -1.57, -1.57)],
      (x, y) => [...stick(x - 60, y + 110, 1, 'walk'), W.arrow(x + 20, y + 80, x + 170, y + 80, { w: 8, color: C.blue })],
      (x, y) => [W.poly([[x - 170, y + 110], [x - 100, y + 110], [x - 100, y + 60], [x - 30, y + 60], [x - 30, y + 10], [x + 40, y + 10], [x + 40, y - 40], [x + 110, y - 40]], { w: 9 }), ...stick(x - 5, y + 10, .75, 'climb'),
        W.rect(x + 135, y - 30, 70, 120, { w: 7 }), W.line(x + 125, y - 40, x + 215, y + 100, { w: 9, color: C.green })]],
  },
};
const TAU0 = Math.PI * 2;

// ---------- Hindi handwriting: a pen-led left-to-right reveal of a handwriting face ----------
// (no single-line Devanagari font exists; the pen still travels, and the ink sits in the board's ink layer)
const HW = [];                                   // {txt, x, y, size, color, guide(Stroke), align, w}
function measure(txt, size) { const c = new OffscreenCanvas(10, 10).getContext('2d'); c.font = `400 ${size}px Kalam`; return c.measureText(txt).width; }
function hindi(tl, pen, txt, x, y, size, t, by, o = {}) {
  const w = measure(txt, size), x0 = o.align === 'center' ? x - w / 2 : x, pts = [];
  for (let u = 0, i = 0; u <= w; u += size * .32, i++) pts.push(x0 + u, y - size * (.32 + .22 * ((i % 2) ? 1 : -1)));
  pts.push(x0 + w, y - size * .3);
  const g = new W.Stroke(pts, { w: 4, jitter: 0, kind: 'text', smooth: 0 }); g.hide = () => true;
  tl.draw(pen, [g], t, { by });
  HW.push({ txt, x0, y, size, w, color: o.color || pen.color, g, id: o.id, pass: o.pass || o.old });
  return w;
}
function drawHindi(ctx, t, c) {
  W.applyCam(ctx, c); ctx.globalCompositeOperation = 'multiply';
  for (const h of HW) {
    const p = h.g.prog(t); if (p <= 0) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(h.x0 - 10, h.y - h.size * 1.3, (h.w + 20) * p, h.size * 1.9); ctx.clip();
    ctx.font = `400 ${h.size}px Kalam`; ctx.fillStyle = h.color; ctx.globalAlpha = .93; ctx.textBaseline = 'alphabetic';
    ctx.fillText(h.txt, h.x0, h.y); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- build one reel ----------
export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  await Promise.all(['400 60px Kalam', '400 42px "Tiro Devanagari Hindi"', '30px AD'].map(f => document.fonts.load(f, 'Aaपानी')));
  const tl = new W.Timeline();
  const pens = { ink: new W.Pen('ink', C.ink), blue: new W.Pen('blue', C.blue), green: new W.Pen('green', C.green) };
  const TX = [], subs = [], ev = [];
  let reelTimes = null, DUR = 20;

  for (let r = 0; r < REEL; r++) {
    const R = REELS[r], y0 = Y0(r), live = r === REEL - 1, keys = ['1', '2', '3', '4'].map(n => R.key + n);
    // timing from the voice: live region uses real times; earlier regions are drawn long before t = 0
    const T = {}; let t = .35;
    for (const k of keys) { T[k] = t; t += DUR_V[k] + .28; }
    const off = live ? 0 : -200 + r * 40;
    const at = x => x + off;
    // region title "1/3 · पानी"
    tl.draw(pens.green, W.text(`${r + 1}/3`, 170, y0 + 170, { h: 58 }), at(T[keys[0]] - .3), { by: at(T[keys[0]] + .2) });
    hindi(tl, pens.green, R.title, 335, y0 + 172, 66, at(T[keys[0]] + .2), at(T[keys[0]] + .8), { id: 'title' + r, pass: true });
    // hook: drawing + question
    const hk = T[keys[0]], hd = DUR_V[keys[0]];
    tl.draw(pens.ink, DRAW[R.key].hook(560, y0 + 470), at(hk - .1), { by: at(hk + hd * .4) });
    hindi(tl, pens.ink, R.q, 600, y0 + 790, 96, at(hk + hd * .44), at(hk + hd * .95), { align: 'center', id: 'q' + r, old: !live });
    // three tips
    const TY = [1060, 1400, 1740];
    for (let i = 0; i < 3; i++) {
      const k = keys[i + 1], ts = T[k], d = DUR_V[k], y = y0 + TY[i];
      tl.draw(pens.green, [...W.text(String(i + 1), 128, y + 30, { h: 70 }), W.circle(128, y, 56, { w: 8 })], at(ts - .1), { by: at(ts + .55) });
      tl.draw(pens.ink, DRAW[R.key].t[i](390, y), at(ts + .3), { by: at(ts + d * .62) });
      const size = Math.min(62, 520 / measure(R.tips[i], 62) * 62);
      hindi(tl, pens.blue, R.tips[i], 620, y + 22, size, at(ts + d * .38), at(ts + d * .76), { id: `tip${r}${i}`, old: !live });
    }
    // end card box (drawn in every region; the live one is written during the CTA)
    const endT = T[keys[3]] + DUR_V[keys[3]] + 1.6;
    const cardY = y0 + 2040, stop = endT, pull0 = stop + .15, pull1 = pull0 + 1.3, push0 = pull1 + .35, push1 = push0 + .8, ctaT = push0 + .35;
    tl.draw(pens.ink, W.roundRect(90, cardY - 120, 1020, 250, 30, { w: 8 }), at(ctaT - .3), { by: at(ctaT + .5) });
    const book = W.text('BOOK', 150, cardY + 10, { h: 92 }); tl.draw(pens.green, book, at(ctaT + .5), { by: at(ctaT + 1.4) });
    hindi(tl, pens.ink, 'कमेंट करें', 150 + book.width + 40, cardY + 10, 80, at(ctaT + 1.4), at(ctaT + 2.2), { id: 'cta' + r, old: !live });
    tl.draw(pens.blue, W.text('VaiLyf Wellness - vailyfai.com', 600, cardY + 95, { h: 38, align: 'center' }), at(ctaT + 2.2), { by: at(ctaT + 3.3) });
    if (live) {
      reelTimes = { T, stop, pull0, pull1, push0, push1, ctaT, cardY, y0 };
      DUR = +(ctaT + DUR_V.cta + 1.8).toFixed(2);
      for (const k of keys) subs.push({ id: k, t0: T[k], t1: T[k] + DUR_V[k], hi: R.subs[k][0], en: R.subs[k][1] });
      subs.push({ id: 'cta', t0: ctaT, t1: ctaT + DUR_V.cta, hi: CTA_SUB[0], en: CTA_SUB[1] });
      for (const k of keys) ev.push({ t: T[k], type: 'vo', id: k });
      ev.push({ t: ctaT, type: 'vo', id: 'cta' });
      ev.push({ t: stop, type: 'cap' }, { t: pull0, type: 'whoosh' }, { t: ctaT + .5, type: 'book' });
      for (let i = 0; i < 3; i++) ev.push({ t: T[keys[i + 1]] - .1, type: 'num', n: i });
    }
  }
  tl.end();
  // camera: hook close, ride down the tips, pull back to the series so far, push into the end card
  const { T, stop, pull0, pull1, push0, push1, cardY, y0 } = reelTimes, keys = ['1', '2', '3', '4'].map(n => REELS[REEL - 1].key + n);
  const fitZ = Math.min(.92, 1500 / (REEL * RH)), midY = TOP + REEL * RH / 2;
  const cam = new W.Camera([
    [0, 600, y0 + 560, 1.18], [T[keys[1]] - .4, 600, y0 + 620, 1.1],
    [T[keys[1]] + .1, 600, y0 + 1040, 1.0], [T[keys[2]] - .25, 600, y0 + 1060, 1.0],
    [T[keys[2]] + .2, 600, y0 + 1390, 1.0], [T[keys[3]] - .25, 600, y0 + 1410, 1.0],
    [T[keys[3]] + .2, 600, y0 + 1700, 1.0], [stop, 600, y0 + 1720, 1.0],
    [pull1, 600, midY, fitZ], [push0, 600, midY, fitZ], [push1, 600, cardY + 30, .95], [DUR, 600, cardY + 30, .97]]);
  const board = new W.Board(tl, { W: RW, H: TOP + REELS.length * RH + 1100 });
  board.objs.push({ draw: (ctx, t, c) => drawHindi(ctx, t, c) });
  for (const p of Object.values(pens)) board.objs.push({ draw: (ctx, t, c) => W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t) });
  board.overlays.push({ draw: (ctx, t) => subtitle(ctx, t, subs) });
  // texts for the reading check: every handwritten Hindi label once fully written and on screen
  const texts = t => {
    const c = cam.at(t), out = [];
    for (const h of HW) {
      if (h.g.prog(t) < 1) continue;
      const [x0, y0s] = W.toScreen(c, h.x0, h.y - h.size), [x1, y1s] = W.toScreen(c, h.x0 + h.w, h.y + h.size * .3);
      out.push({ id: h.id, text: h.txt, x0, y0: y0s, x1, y1: y1s, ...(h.pass || c.z < .6 ? { pass: true } : {}) });
    }
    return out;
  };
  const sounds = tl.ev.filter(e => e.t >= -1).map(e => ({ ...e }));
  return { dur: DUR, ev: [...sounds, ...ev], subs, render: (ctx, t) => board.render(ctx, t, cam), texts, cam };
}

// ---------- subtitles: off-white label, Hindi line + English line, green marker dash ----------
function subtitle(ctx, t, subs) {
  const s = subs.find(s => t >= s.t0 - .1 && t < s.t1 + .6); if (!s) return;
  const a = Math.min(1, (t - s.t0 + .1) / .2, (s.t1 + .6 - t) / .25);
  ctx.save(); ctx.globalAlpha = Math.max(0, a);
  ctx.font = '400 42px "Tiro Devanagari Hindi"'; const hl = wrap(ctx, s.hi, 900); const wh = Math.max(...hl.map(l => ctx.measureText(l).width));
  ctx.font = '30px AD'; const el = wrap(ctx, s.en, 900); const we = Math.max(...el.map(l => ctx.measureText(l).width));
  const w = Math.max(wh, we) + 80, h = 30 + hl.length * 54 + el.length * 38, x = VW / 2 - w / 2, y = 1610 - h;
  ctx.fillStyle = 'rgba(250,249,245,.92)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = C.green; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 22, y + 26); ctx.lineTo(x + 22, y + h - 26); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  let yy = y + 56; ctx.font = '400 42px "Tiro Devanagari Hindi"'; for (const l of hl) { ctx.fillText(l, VW / 2 + 10, yy); yy += 54; }
  ctx.font = '30px AD'; ctx.fillStyle = '#3d465c'; yy -= 8; for (const l of el) { ctx.fillText(l, VW / 2 + 10, yy); yy += 38; }
  ctx.restore();
}
function wrap(ctx, s, maxW) { const w = s.split(' '), L = []; let c = ''; for (const x of w) { const n = c ? c + ' ' + x : x; if (ctx.measureText(n).width > maxW && c) { L.push(c); c = x; } else c = n; } L.push(c); return L; }
