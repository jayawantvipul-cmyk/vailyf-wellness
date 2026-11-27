// Your First Week on VaiLyf — an isometric tower, one floor per part of the portal. 1080×1920, 30 s.
// The camera starts on the roof title, tilts down floor by floor (each floor's front walls cut away),
// then pulls back to the whole tower as a legend. Style engine: engine.js (Lemo-Opuscar, MIT).
import { Iso, PAL, tri, hex, mix, clamp, lerp, seg, ss, eo, eio, back, TAU, C30, S30, pin, inset, ring, cutLine, hatch, iconGrid, haloText, person, FONT } from './engine.js';
const VW = 1080, VH = 1920;
export const DUR = 30.0;
const B = 60 / 90;  // beat 0.667 s, bar 2.667 s

// ---------- script (durations from voice/out/dur.json) ----------
export const VO = [
  ['v1', 0.67, 3.052, "New to VaiLyf? Here's your portal, floor by floor."],
  ['v2', 4.4, 3.328, 'Every day, log your water, meals, steps, sleep and mood.'],
  ['v3', 8.7, 3.148, 'Each log earns 20 points and keeps your streak going.'],
  ['v4', 12.9, 4.16, 'Join team challenges and climb the leaderboard for monthly prizes.'],
  ['v5', 17.6, 3.066, 'Your coach sends you a plan. Book a one-to-one any time.'],
  ['v6', 21.9, 2.359, 'Watch your progress grow, week by week.'],
  ['v7', 26.4, 2.765, 'VaiLyf Wellness. Log your first day today.'],
];

// ---------- palette: one meaning per hue ----------
const HUE = {
  you: '#1a7a4a', water: '#3e8fd0', food: '#e8833a', move: '#2a9d8f', sleep: '#7c5cc4', mood: '#e06666', gold: '#f2c230',
  stone: '#d8cfc0', steel: '#8a96a3', cream: '#f4efe4', coach: '#5b6b7a', ink: '#24303a', bg: '#efe8da',
};
const T = Object.fromEntries(Object.entries(HUE).map(([k, v]) => [k, tri(v)]));
const GREYS = ['#b9b0a4', '#a8a097', '#c5bdb1'].map(c => tri(c));

// ---------- the tower ----------
const S = 6, FH = 7;                                 // half-width, floor height
const Z1 = 28, GAP0 = 7, GAP1 = 15;                 // floor 1 stays put; the floors below spread apart (exploded view)
let GAP = GAP0;
const ZF = i => Z1 - (i - 1) * GAP;                 // slab top of floor i (1 = top floor) at the current spread
const ZFF = i => Z1 - (i - 1) * GAP1;               // ... once fully spread (for camera keys)
const EXPLODE = [3.0, 4.4];
const FLOORS = [
  { n: 1, title: 'DAILY LOG' }, { n: 2, title: 'POINTS & STREAK' }, { n: 3, title: 'CHALLENGES' }, { n: 4, title: 'YOUR PLAN' }, { n: 5, title: 'BODY TRACKER' }];
// when each floor is visited: tilt start, cut start
// cuts land on beats: 6, 13, 19, 26, 32 (beat = 2/3 s); the pull-out on beats 37 → 39
const VISIT = { 1: [3.4, 6 * B], 2: [13 * B - .6, 13 * B], 3: [19 * B - .6, 19 * B], 4: [26 * B - .6, 26 * B], 5: [32 * B - .6, 32 * B] };
const OUT0 = 37 * B, OUT1 = 39 * B;

// ---------- camera: log-interpolated zoom ----------
const KEYS = [
  [0, 0, 0, 37.0, 44], [3.4, 0, 0, 36.5, 50],
  ...[1, 2, 3, 4, 5].flatMap(i => [[VISIT[i][0], 0, 0, i === 1 ? 36.5 : ZFF(i - 1) + 3.2, i === 1 ? 50 : 44], [VISIT[i][0] + .8, 0, 0, ZFF(i) + 3.2, 44]]),
  [OUT0, 0, 0, ZFF(5) + 3.2, 44], [OUT1, 0, 0, -20.3, 11.6], [DUR, 0, 0, -20.3, 11.4]];
KEYS.sort((a, b) => a[0] - b[0]);
function cam(t) {
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], u = eio(seg(t, a[0], b[0]));
  return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u), k: Math.exp(lerp(Math.log(a[4]), Math.log(b[4]), u)) };
}
const focusFloor = t => { let f = 0; for (const i of [1, 2, 3, 4, 5]) if (t >= VISIT[i][0] + .4) f = i; return t >= OUT0 ? 0 : f; };

// ---------- helpers ----------
const pop = (t, t0, d = .35) => back(seg(t, t0, t0 + d), 2.2);           // 0 → overshoot → 1
const drop = (t, t0, h = 6, d = .4) => { const u = seg(t, t0, t0 + d); return u < 1 ? h * (1 - u * u) : 0; };   // fall from h, lands at t0+d
const squash = (t, t0) => { const u = seg(t, t0, t0 + .25); return u <= 0 || u >= 1 ? 1 : 1 - .18 * Math.sin(u * Math.PI); };
function you(iso, x, y, z, o = {}) { iso.bill(x, y, z, g => person(g, { body: HUE.you, hair: '#2b2220', skin: '#b97c55', h: 3 * (o.sq || 1), arm: o.arm ?? .25, face: o.face || 1, tool: o.tool }), { bias: o.bias ?? 3 }); }
function walls(iso, i, slide) {   // back walls (cream inside), front walls (stone with windows) that slide away
  const z = ZF(i);
  iso.box(-S, -S, z - .6, 2 * S, 2 * S, .6, T.stone, { bias: -20 });                            // slab: always first
  iso.box(-S, -S, z, .4, 2 * S, FH - .6, T.cream, { bias: -14 });                               // back (−x): always behind the room
  iso.box(-S, -S, z, 2 * S, .4, FH - .6, T.cream, { bias: -14 });                               // back (−y)
  if (slide < 1) {
    const d = eo(slide) * 18, win = (I, b) => { };
    iso.box(-S, S - .4 + d, z, 2 * S, .4, FH - .6, T.stone, { decal: (I, b) => windows(I, b, 'y') });          // front (+y)
    iso.box(S - .4 + d, -S, z, .4, 2 * S, FH - .6, T.stone, { decal: (I, b) => windows(I, b, 'x') });          // front (+x)
  }
}
function windows(I, b, side) {
  const g = I.g; g.save(); g.fillStyle = I.col('#9fb8c8');
  for (let k = 0; k < 4; k++) {
    const u0 = 1.2 + k * 2.6, u1 = u0 + 1.8, z0 = b.z + 1.6, z1 = b.z + 4.6;
    const P = side === 'y' ? [[b.x + u0, b.y + b.d + .01, z0], [b.x + u1, b.y + b.d + .01, z0], [b.x + u1, b.y + b.d + .01, z1], [b.x + u0, b.y + b.d + .01, z1]]
      : [[b.x + b.w + .01, b.y + u0, z0], [b.x + b.w + .01, b.y + u1, z0], [b.x + b.w + .01, b.y + u1, z1], [b.x + b.w + .01, b.y + u0, z1]];
    g.beginPath(); P.forEach((p, j) => { const s = I.L(...p); j ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.closePath(); g.fill();
  }
  g.restore();
}
function floorTitle(iso, i, a) {   // floor number + title lying on the floor near the front edge
  if (a <= 0) return;
  const z = ZF(i) + .02, f = FLOORS[i - 1];
  iso.text3(`${f.n}  ${f.title}`, S - 1.4, S - 1.0, z, { plane: 'xy', size: 1.0, extrude: .1, tri: T.steel, a: ss(a), track: 6, weight: 600, bias: -6 });
}

// ---------- floor interiors ----------
function floor1(iso, t) {
  const z = ZF(1), t0 = VISIT[1][1];
  iso.box(-4.0, -3.4, z, 8.0, 2.6, 1.9, tri('#c9a77c'));                     // desk
  const items = [['water', -3.6], ['food', -2.0], ['move', -.4], ['sleep', 1.2], ['mood', 2.8]];
  items.forEach(([k, x], j) => {
    const p = pop(t, t0 + .67 + j * B / 2), zz = z + 1.9, y = -2.1, o = { bias: 2 };
    if (p <= 0) return;
    if (k === 'water') iso.cyl(x + .4, y, zz, .45 * p, 1.4 * p, T.water, o);
    if (k === 'food') { iso.cyl(x + .4, y, zz, .8 * p, .14, T.cream, o); iso.cyl(x + .4, y, zz + .14, .48 * p, .26 * p, T.food, { bias: 2.1 }); }
    if (k === 'move') iso.box(x - .2, y - .35, zz, 1.3 * p, .7 * p, .5 * p, T.move, o);
    if (k === 'sleep') iso.sphere(x + .4, y, zz + .6 * p, .58 * p, T.sleep, o);
    if (k === 'mood') iso.sphere(x + .4, y, zz + .6 * p, .58 * p, T.mood, o);
  });
  you(iso, -.2, 1.6, z, { arm: lerp(.25, 2.4, ss(seg(t, t0 + .6, t0 + 1.0))) });
  floorTitle(iso, 1, seg(t, t0 + .5, t0 + 1.2));
}
function floor2(iso, t) {
  const z = ZF(2), t0 = VISIT[2][1];
  for (let c = 0; c < 3; c++) {                                              // three logs → three coins, one per beat
    const tc = t0 + .6 + c * B, dz = drop(t, tc, 7, .35);
    if (t >= tc) iso.cyl(-2.6, -2.6, z + c * .42 + dz, 1.1, .38, T.gold);
  }
  for (let d = 0; d < 7; d++) {                                              // 7-day streak calendar (Isotype)
    const td = t0 + .93 + d * B / 2, p = pop(t, td), lit = t >= td;
    iso.box(-4.8 + d * 1.25, 2.6, z, 1.0, 1.0, .18 + .22 * clamp(p), lit ? T.you : GREYS[2]);
  }
  const fp = pop(t, t0 + 3.0, .4);
  if (fp > 0) { iso.cone(3.6, -1.6, z, .9 * fp, 2.2 * fp, T.food, { n: 12 }); iso.cone(3.6, -1.6, z, .5 * fp, 1.4 * fp, T.gold, { n: 12, bias: .1 }); }
  you(iso, 0.8, -1.2, z, { arm: 2.6 });
  floorTitle(iso, 2, seg(t, t0 + .5, t0 + 1.2));
}
function floor3(iso, t) {
  const z = ZF(3), t0 = VISIT[3][1];
  const pr = ss(seg(t, t0 + .5, t0 + .9));
  const POD = [[-1.2, 0, 2.4, GREYS[0]], [-3.4, 0, 1.6, GREYS[1]], [1.0, 0, 1.0, GREYS[2]]];   // 1st (centre), 2nd, 3rd
  POD.forEach(([x, y, h, c]) => iso.box(x, y - 1, z, 2.1, 2.1, h * pr, c));
  const who = [[2, t0 + .87, GREYS[2], 'b'], [1, t0 + 1.53, GREYS[1], 'b'], [0, t0 + 2.2, T.you, 'you']];
  for (const [k, tl, c] of who) {
    const [x, y, h] = POD[k], dz = drop(t, tl, 6, .35);
    if (t < tl) continue;
    if (k === 0) you(iso, x + 1.05, y, z + h + dz, { sq: squash(t, tl + .35), arm: 3.0 });
    else iso.bill(x + 1.05, y, z + h + dz, g => person(g, { body: hex(mix(c[1], '#000', 0)), hair: '#3a3030', skin: '#c48f68', h: 3 * squash(t, tl + .35), arm: .3 }), { bias: 3 });
  }
  const bars = [[3.6, GREYS[1]], [2.8, GREYS[0]], [4.6, T.you], [2.0, GREYS[2]]];  // leaderboard on the back wall
  bars.forEach(([h, c], j) => { const g = ss(seg(t, t0 + 1.2 + j * .15, t0 + 2.5 + j * .15)); iso.box(-5.4, -4.6 + j * 1.6, z, .7, 1.1, h * g + .05, c); });
  const gp = drop(t, t0 + 2.87, 5, .35);
  if (t >= t0 + 2.87) { iso.box(3.0, -4.6, z + gp, 1.6, 1.6, 1.4, T.mood); iso.box(3.65, -4.6, z + gp, .3, 1.6, 1.42, T.gold, { bias: .05 }); iso.box(3.0, -3.95, z + gp, 1.6, .3, 1.42, T.gold, { bias: .06 }); }
  floorTitle(iso, 3, seg(t, t0 + .5, t0 + 1.2));
}
function floor4(iso, t) {
  const z = ZF(4), t0 = VISIT[4][1];
  const cw = eio(seg(t, t0 + .4, t0 + 1.07)), cx = lerp(4.5, 1.6, cw);
  iso.bill(cx, -2.6, z, g => person(g, { body: HUE.coach, hat: 'cap', hatColor: '#3f4b56', skin: '#8a5a3c', h: 3.1, face: -1, arm: lerp(.3, 1.6, ss(seg(t, t0 + 1.0, t0 + 1.3))) }), { bias: 3 });
  you(iso, -1.6, -2.6, z, { arm: lerp(.25, 1.5, ss(seg(t, t0 + 1.1, t0 + 1.4))) });
  const bp = ss(seg(t, t0 + 1.0, t0 + 1.5));
  if (bp > 0) iso.box(lerp(1.0, -.6, bp), -2.9, z + 1.7, .9, .12, 1.1, T.cream, { bias: 2 });
  iso.box(-4.6, 1.6, z, 3.0, 2.4, 1.0, tri('#c9a77c'));                     // a small table
  floorTitle(iso, 4, seg(t, t0 + .5, t0 + 1.2));
}
function floor5(iso, t) {
  const z = ZF(5), t0 = VISIT[5][1];
  const sb = squash(t, t0 + .77), dz = drop(t, t0 + .42, 4, .35);
  if (t >= t0 + .42) { iso.box(-3.6, -1.0, z + dz, 2.2, 2.2, .35 * sb, T.steel, { bias: 2 }); iso.cyl(-2.5, .1, z + dz + .35 * sb, .5, .05, T.cream, { bias: 2.1 }); }
  you(iso, -2.5, .1, z + .4 + (t >= t0 + .42 ? dz : 0), { arm: .4 });
  // the chart on the back wall: steps rising week by week
  const pts = [[0, .2], [1, 1.4], [2, 1.3], [3, 2.9], [4, 4.0], [5, 5.4]];
  const n = t < t0 + .9 ? 0 : Math.min(pts.length, 1 + Math.floor((t - t0 - .9) / (B / 2)));
  if (n > 1) iso.line3(pts.slice(0, n).map(([u, v]) => [-4.4 + u * 1.2, -5.5, z + .5 + v]), HUE.you, 7, { bias: 30 });
  pts.slice(0, n).forEach(([u, v]) => iso.sphere(-4.4 + u * 1.2, -5.45, z + .5 + v, .32, T.you, { bias: 31 }));
  iso.box(2.0, 1.6, z, .5, .5, 2.6, T.gold);                                 // tape measure post
  floorTitle(iso, 5, seg(t, t0 + .5, t0 + 1.2));
}
const INTERIOR = { 1: floor1, 2: floor2, 3: floor3, 4: floor4, 5: floor5 };

// ---------- roof and board ----------
function roof(iso, t) {
  const z = ZF(1) + FH - .6 + (GAP - GAP0) * 1.1;   // the roof lifts with the explosion
  iso.box(-S - .3, -S - .3, z, 2 * S + .6, 2 * S + .6, .7, T.cream);
  iso.box(-S - .3, -S - .3, z + .7, 2 * S + .6, .4, .5, T.you); iso.box(-S - .3, -S - .3, z + .7, .4, 2 * S + .6, .5, T.you);
  const Z = z + .72;
  [['ON VAILYF', B, 0, 1.75], ['FIRST WEEK', B / 2, 2.05, 1.75], ['YOUR', 0, 4.1, 1.75]].forEach(([w, d, dzz, sz]) => {
    const dz = drop(t, d, 1.8, .3); if (t < d) return;
    iso.text3(w, -5.2, -1.2, Z + dzz + dz, { plane: 'xz', size: sz, extrude: .6, tri: w === 'ON VAILYF' ? T.you : T.steel, weight: 700, track: 3, bias: 12 + dzz });
  });
  const tl = B * 2, dz = drop(t, tl, 8, .4);
  if (t >= tl - .4 && t < VISIT[1][0] + .5) you(iso, 3.4, -3.4, Z + dz, { sq: squash(t, tl), arm: lerp(.25, 2.8, ss(seg(t, tl + .4, tl + .8))) });
}
function board(iso) {
  const z = ZF(5) - .6;
  iso.box(-10, -10, z - 1.2, 20, 20, 1.2, tri('#8fb37a'));
  iso.box(-10, -10, z - 2.4, 20, 20, 1.2, tri('#a77850'));
  iso.box(-10, -10, z - 3.4, 20, 20, 1.0, tri('#8a6a4a'));
  for (const [x, y] of [[-8.2, 6.6], [6.8, -8.4], [7.4, 7.0]]) { iso.cyl(x, y, z, .25, 1.2, tri('#8a5b3a')); iso.cone(x, y, z + 1.0, 1.1, 2.4, T.you, { n: 8 }); }
}

// ---------- overlays (screen space) ----------
function wrap(g, s, maxW) { const w = s.split(' '), L = []; let c = ''; for (const x of w) { const n = c ? c + ' ' + x : x; if (g.measureText(n).width > maxW && c) { L.push(c); c = x; } else c = n; } L.push(c); return L; }
function subtitle(g, text, a, fade) {
  if (a <= 0 || fade <= 0) return;
  g.save(); g.font = `500 40px ${FONT}`; const lines = wrap(g, text, 820), tw = Math.max(...lines.map(l => g.measureText(l).width));
  const pad = 26, icon = 44, w = tw + pad * 2 + icon, h = 26 + lines.length * 50, x = VW / 2 - w / 2, y = 1600 - h;
  g.globalAlpha = ss(fade); g.translate(0, (1 - ss(fade)) * 8);
  const bw = eo(seg(a, 0, .35));
  g.beginPath(); g.roundRect(x, y, w, h, 10); g.fillStyle = 'rgba(244,239,228,.96)'; g.fill();
  g.save(); g.beginPath(); g.rect(x - 4, y - 4, (w + 8) * bw, h + 8); g.clip(); g.beginPath(); g.roundRect(x, y, w, h, 10); g.strokeStyle = HUE.ink; g.lineWidth = 2; g.stroke(); g.restore();
  const ix = x + pad + 13, iy = y + h / 2 + 2, s = 12, P = (u, v, z) => [ix + (u - v) * C30 * s, iy + ((u + v) * .5 - z) * s];
  const f = (pts, c) => { g.beginPath(); pts.forEach((p, i) => { const q = P(...p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = c; g.fill(); };
  f([[-.5, .5, -.5], [.5, .5, -.5], [.5, .5, .5], [-.5, .5, .5]], T.you[1]); f([[.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5], [.5, -.5, .5]], T.you[2]); f([[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]], T.you[0]);
  g.save(); g.beginPath(); g.rect(x + pad + icon - 6, y, (tw + 12) * ss(seg(a, .2, .75)), h); g.clip();
  g.fillStyle = HUE.ink; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, x + pad + icon, y + 13 + 25 + i * 50)); g.restore();
  g.restore();
}
function plateLabel(g, iso, t, i) {   // a small floor tag that travels with the floor in focus (screen space, inside safe area)
}
// the plan inset on floor 4
function planInset(iso, g, t) {
  const t0 = VISIT[4][1] + 1.4, a = seg(t, t0, t0 + .9) * (1 - seg(t, VISIT[5][0], VISIT[5][0] + .3)); if (a <= 0) return;
  const [ax, ay] = iso.P(-.6, -2.9, ZF(4) + 2.3);
  inset(iso, ax, ay, 790, 560, 190, a, (g, cx, cy, R) => {
    g.fillStyle = '#fbf7ee'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    haloText(g, 'YOUR PLAN', cx - 120, cy - 112, { font: `600 26px ${FONT}`, track: 4, halo: false });
    const rows = [['HYDRATION', '3 L / DAY', HUE.water], ['MEALS', 'BALANCED', HUE.food], ['MOVEMENT', '5 × / WEEK', HUE.move]];
    rows.forEach(([k, v, c], j) => {
      const tj = t0 + .5 + j * B, on = t >= tj, y = cy - 58 + j * 54;
      g.beginPath(); g.roundRect(cx - 130, y - 16, 30, 30, 6); g.fillStyle = on ? c : '#d8cfc0'; g.fill();
      if (on) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 122, y); g.lineTo(cx - 116, y + 7); g.lineTo(cx - 105, y - 8); g.stroke(); }
      haloText(g, k, cx - 88, y - 2, { font: `600 22px ${FONT}`, track: 2.5, halo: false });
      haloText(g, v, cx - 88, y + 22, { font: `400 20px ${FONT}`, track: 1.5, halo: false, color: '#5a6670' });
    });
    const bk = pop(t, t0 + 2.4);
    if (bk > 0) { g.save(); g.translate(cx, cy + 118); g.scale(bk, bk); g.beginPath(); g.roundRect(-92, -24, 184, 48, 24); g.fillStyle = HUE.you; g.fill(); g.fillStyle = '#fff'; g.font = `600 24px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '3px'; g.fillText('BOOK 1:1', 0, 2); g.restore(); }
  });
}
let TX = [];
const txt = (id, text, x0, y0, x1, y1, pass) => TX.push({ id, text, x0, y0, x1, y1, ...(pass ? { pass: true } : {}) });

// ---------- frame ----------
export function render(g, t) {
  TX = [];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = HUE.bg; g.fillRect(0, 0, VW, VH);
  GAP = lerp(GAP0, GAP1, eio(seg(t, EXPLODE[0], EXPLODE[1])));
  const iso = new Iso(g, VW, VH); iso.cam = cam(t);
  // dot lattice
  g.save(); g.fillStyle = 'rgba(36,48,58,.10)'; const k = iso.cam.k, step = 2;
  for (let a = -40; a <= 40; a += step) for (let b = -40; b <= 40; b += step) { const [sx, sy] = iso.P(a, b, ZF(5) - 3.4); if (sx > -10 && sx < VW + 10 && sy > -10 && sy < VH + 10) g.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4); }
  g.restore();
  const ff = focusFloor(t), out = ss(seg(t, OUT0, OUT1));
  iso.desat = ff ? .62 : 0;
  // board, floors from the bottom up, roof
  iso.keep = false; board(iso);
  for (const i of [5, 4, 3, 2, 1]) {
    const cut = VISIT[i][1], open = t >= cut + .3 ? seg(t, cut + .3, cut + .65) : 0;
    iso.keep = (i === ff);
    walls(iso, i, open);
    if (t >= cut) INTERIOR[i](iso, t);
  }
  iso.keep = (ff === 0); roof(iso, t); iso.keep = false;
  iso.flush();
  // cut lines and hatched rims on the floor being opened
  for (const i of [1, 2, 3, 4, 5]) {
    const cut = VISIT[i][1], z = ZF(i), a = seg(t, cut, cut + .3);
    if (a > 0 && t < cut + .7) cutLine(g, [iso.P(-S, S, z + FH - .6), iso.P(S, S, z + FH - .6), iso.P(S, -S, z + FH - .6)], a);
    const rim = seg(t, cut + .5, cut + .7);
    if (rim > 0) { g.save(); g.globalAlpha = rim; hatch(g, [iso.P(-S, S, z), iso.P(S, S, z), iso.P(S, S, z - .6), iso.P(-S, S, z - .6)], { sp: 6 }); hatch(g, [iso.P(S, S, z), iso.P(S, -S, z), iso.P(S, -S, z - .6), iso.P(S, S, z - .6)], { sp: 6 }); g.restore(); }
  }
  // tracking ring on "you": roof, then each floor
  const ringAt = t < VISIT[1][0] ? [3.4, -3.4, ZF(1) + FH + .1 + 1.6 + (GAP - GAP0) * 1.1] : ff === 1 ? [-.2, 1.6, ZF(1) + 1.6] : ff === 2 ? [.8, -1.2, ZF(2) + 1.6] : ff === 3 ? [-.15, 0, ZF(3) + 2.4 + 1.6] : ff === 4 ? [-1.6, -2.6, ZF(4) + 1.6] : ff === 5 ? [-2.5, .1, ZF(5) + .4 + 1.6] : null;
  if (ringAt && t > B * 2 + .5) { const [sx, sy] = iso.P(...ringAt); ring(g, sx, sy, 2.4 * iso.cam.k, seg(t, B * 2 + .5, B * 2 + 1.1), t, t < 3.4 ? 'YOU' : null, { color: HUE.you, ts: 26 }); }
  // pins for numbers
  const t2 = VISIT[2][1];
  pin(iso, -2.6, -2.6, ZF(2) + 1.4, { title: 'EVERY LOG', num: '+20', unit: 'POINTS', dir: -1, up: 150, len: 40, a: seg(t, t2 + .2, t2 + 1.0) * (1 - seg(t, VISIT[3][0] + .45, VISIT[3][0] + .75)) });
  if (t > t2 + 1.0 && t < VISIT[3][0] + .45) { const [ax, ay] = iso.P(-2.6, -2.6, ZF(2) + 1.4); txt('p20', 'EVERY LOG +20 POINTS', ax - 300, ay - 210, ax - 40, ay - 90); }
  pin(iso, -.3, 3.1, ZF(2) + .4, { title: '7-DAY STREAK', dir: 1, up: 90, len: 50, a: seg(t, t2 + 3.2, t2 + 3.8) * (1 - seg(t, VISIT[3][0], VISIT[3][0] + .3)), ts: 24 });
  const t3 = VISIT[3][1];
  pin(iso, 3.8, -3.8, ZF(3) + 1.4, { title: 'MONTHLY PRIZES', dir: -1, up: 120, len: 40, a: seg(t, t3 + 3.1, t3 + 3.8) * (1 - seg(t, VISIT[4][0], VISIT[4][0] + .3)), ts: 24 });
  pin(iso, -5.0, -1.4, ZF(3) + 4.7, { title: 'LEADERBOARD', dir: 1, up: 70, len: 40, a: seg(t, t3 + 2.0, t3 + 2.6) * (1 - seg(t, VISIT[4][0], VISIT[4][0] + .3)), ts: 24 });
  const t5 = VISIT[5][1];
  pin(iso, -4.4, -5.45, ZF(5) + .7, { title: 'WEEK 1 → 4', dir: -1, up: 60, len: 30, a: seg(t, t5 + 1.6, t5 + 2.2) * (1 - seg(t, OUT0, OUT0 + .3)), ts: 24 });
  if (t > t5 + 2.2 && t < OUT0) { const [ax, ay] = iso.P(-4.4, -5.45, ZF(5) + .7); txt('wk', 'WEEK 1 → 4', ax - 250, ay - 80, ax - 40, ay - 40, true); }
  planInset(iso, g, t);
  // the legend: whole tower, every floor labelled
  if (t >= OUT1 - .2) {
    FLOORS.forEach((f, j) => {
      const i = f.n, d = j % 2 ? 1 : -1, a = seg(t, OUT1 - .2 + j * .2, OUT1 + .8 + j * .2);
      pin(iso, d > 0 ? S - .4 : -S + .4, d > 0 ? -S + .4 : S - .4, ZF(i) + 3.0, { title: `${i}  ${f.title}`, dir: d, up: 40, len: 60, a, ts: 24 });
    });
    const ba = seg(t, OUT1 + .4, OUT1 + 1.4);
    if (ba > 0) {
      g.save(); g.globalAlpha = ss(ba); g.textAlign = 'center';
      haloText(g, 'VAILYF WELLNESS', VW / 2, 1352, { font: `600 64px ${FONT}`, track: 8, align: 'center' });
      haloText(g, 'vailyfai.com', VW / 2, 1414, { font: `400 36px ${FONT}`, track: 2, align: 'center', color: '#3c4a55' });
      g.restore();
      if (ba >= 1) { txt('brand', 'VAILYF WELLNESS', 180, 1292, 900, 1362); txt('web', 'vailyfai.com', 420, 1383, 660, 1423); }
    }
    if (t > OUT1 + 2.0) FLOORS.forEach((f, j) => txt('legend' + j, `${f.n} ${f.title}`, 0, 0, 1, 1, true));
  }
  // subtitles
  const sub = VO.find(([, s, d]) => t >= s && t < s + d + .6);
  if (sub) subtitle(g, sub[3], seg(t, sub[1], sub[1] + .6), 1 - seg(t, sub[1] + sub[2] + .6, sub[1] + sub[2] + .9));
}
export const texts = () => TX;

// ---------- sound and cue events ----------
export function events() {
  const E = [], e = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  [0, B / 2, B].forEach((d, i) => e(d + .35, 'thud', { pan: -.3 + i * .3, i }));
  e(B * 2, 'land', { pan: .3 });
  for (const i of [1, 2, 3, 4, 5]) { e(VISIT[i][0] - .5, 'amb', { i }); e(VISIT[i][0], 'whoosh', { pan: 0 }); e(VISIT[i][1], 'zip', { pan: 0 }); e(VISIT[i][1] + .3, 'slide', { pan: .2 }); }
  for (let j = 0; j < 5; j++) e(VISIT[1][1] + .67 + j * B / 2, 'pop', { n: j });
  e(VISIT[1][1] + .67, 'pour', { pan: -.4 });
  for (let c = 0; c < 3; c++) e(VISIT[2][1] + .6 + c * B + .35, 'coin', { n: c, pan: -.3 });
  for (let d = 0; d < 7; d++) e(VISIT[2][1] + .93 + d * B / 2, 'tick', { n: d, pan: -.2 + d * .08 });
  e(VISIT[2][1] + 3.0, 'flame', { pan: .4 });
  const t3 = VISIT[3][1]; [t3 + .87, t3 + 1.53, t3 + 2.2].forEach((x, i) => e(x + .35, 'land', { pan: [.3, -.3, 0][i] }));
  e(t3 + 2.2 + .35, 'cheer', {}); e(t3 + 2.87 + .35, 'thud', { pan: .4, i: 3 });
  const t4 = VISIT[4][1]; e(t4 + .4, 'steps', { pan: .4 }); e(t4 + 1.0, 'paper', { pan: 0 });
  [0, 1, 2].forEach(j => e(t4 + 1.4 + .5 + j * B, 'check', { n: j, pan: .3 })); e(t4 + 1.4 + 2.4, 'pop', { n: 5 });
  const t5 = VISIT[5][1]; e(t5 + .77, 'boing', { pan: -.3 }); for (let j = 0; j < 6; j++) e(t5 + .9 + j * B / 2, 'tick', { n: j + 2, pan: -.4 + j * .1 });
  e(OUT0 - .33, 'hush', {}); e(OUT0, 'whooshbig', {}); e(OUT1 + .4, 'chime', {});
  for (const [id, s] of VO) e(s, 'vo', { id });
  return E;
}
