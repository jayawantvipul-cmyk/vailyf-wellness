// Keep Going — one line that climbs, falls, stops, and keeps going. 1080×1920.
import { buildPath, headAt, posAt } from './geom.js';
import { SEGS, VALLEY } from './drawing.js';
import { prepare, drawLine, drawBlots } from './ink.js';
import { makePaper, drawPaper, vignette, makeTooth, drawTooth } from './paper.js';
import { camAt, worldToScreen } from './cam.js';
import { penShadow } from './hands.js';
import { clamp, lerp, ss } from '/core/lib.js';

const q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
for (const f of ['400 46px Kalam', '500 40px Caveat', '80px Sacramento']) await document.fonts.load(f, 'Aaगिरना');

export const DUR = 31.0;
// voice (durations from voice/out/dur.json); sub = subtitle window; v5 is written on the paper instead
const VO = [
  { id: 'v1', t0: 0.4, dur: 1.954, hi: 'हार मानने का मन कर रहा है?', en: 'Feel like giving up?' },
  { id: 'v2', t0: 4.5, dur: 1.317, hi: 'हर कोई गिरता है।', en: 'Everyone falls.' },
  { id: 'v3', t0: 8.9, dur: 3.029, hi: 'पर गिरने के बाद जो फिर से उठता है…', en: 'But the one who gets up again after falling…' },
  { id: 'v4', t0: 13.3, dur: 1.564, hi: 'वही आगे बढ़ता है।', en: 'is the one who moves ahead.' },
  { id: 'v5', t0: 19.6, dur: 6.293, hi: null, en: null },
  { id: 'v6', t0: 26.3, dur: 3.718, hi: 'किसी ऐसे को भेजिए जिसे आज ये सुनना ज़रूरी है।', en: 'Send this to someone who needs to hear it today.' },
];
// the key line, written on the paper below the range as it is spoken (word timings from whisper)
const WRITE = [
  { text: 'गिरना हार नहीं है,', font: '400 80px Kalam', y: 1150, t0: 21.8, t1: 23.3 },
  { text: 'रुक जाना हार है।', font: '400 80px Kalam', y: 1260, t0: 24.5, t1: 25.8 },
  { text: "Falling isn't failing. Stopping is.", font: '500 46px Caveat', y: 1345, t0: 26.0, t1: 26.9 },
  { text: 'VaiLyf Wellness', font: '72px Sacramento', y: 1455, t0: 27.1, t1: 28.3, col: [29, 26, 23] },
];
// camera: x, y = composition centre (paper units), z = zoom, r = roll (deg), f = follow weight
const CAM = [
  { t: 0.0, x: -520, y: 220, z: 2.3, r: 0, f: .85 },
  { t: 4.2, x: -230, y: -90, z: 2.05, r: 0, f: .85 },
  { t: 5.0, x: -150, y: 140, z: 1.9, r: -6, f: .9 },              // the fall: roll with the line
  { t: 5.8, x: -146, y: 400, z: 3.0, r: 0, f: .15 },              // the stop: hold close on the blot
  { t: 8.5, x: -146, y: 410, z: 3.7, r: 0, f: .08 },              // very slow push-in during the silence
  { t: 9.3, x: -120, y: 390, z: 3.2, r: 0, f: .55 },              // the trembling restart
  { t: 12.9, x: 30, y: 280, z: 2.6, r: 0, f: .7 },
  { t: 13.6, x: 100, y: 150, z: 2.0, r: 0, f: .85 },              // momentum
  { t: 17.0, x: 270, y: -300, z: 2.0, r: 0, f: .55 },
  { t: 17.6, x: 280, y: -470, z: 2.25, r: 0, f: .12 },            // the sun
  { t: 19.2, x: 280, y: -460, z: 2.25, r: 0, f: .1 },
  { t: 21.6, x: 130, y: 370, z: .7, r: 0, f: 0 },                 // continuous pull-back: it was one mountain range
  { t: DUR, x: 130, y: 380, z: .7, r: 0, f: 0 },
];

const P = prepare(buildPath(SEGS));
const paper = makePaper(), tooth = makeTooth();
const fallSeg = P.segs.findIndex(s => s.id === 'fall'), hold = SEGS[fallSeg].holds[0];
const camFor = t => camAt(P, CAM, t, W, H);
const NOSUB = q.has('nosub') || q.has('clean');

function writeOn(ctx, text, font, x, y, t, t0, t1, o = {}) {   // handwriting written on left to right behind a paper halo
  if (t < t0) return 0;
  const p = clamp((t - t0) / (t1 - t0)), fade = o.out ? 1 - clamp((t - o.out) / .45) : 1;
  if (fade <= 0) return 0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(text).width, x0 = x - w / 2;
  ctx.beginPath(); ctx.rect(x0 - 20, y - 140, (w + 40) * ss(p), 220); ctx.clip();
  ctx.globalAlpha = fade; ctx.shadowColor = 'rgba(244,239,228,1)'; ctx.shadowBlur = 16;
  const c = o.col || [29, 26, 23]; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${o.a ?? .86})`;
  ctx.fillText(text, x0, y); ctx.fillText(text, x0, y);
  ctx.restore();
  return w;
}
let TX = [];
function subtitles(ctx, t) {
  for (const v of VO) {
    if (!v.hi) continue;
    const t0 = v.t0 - .05, out = v.t0 + Math.max(1.8, v.dur + .6);
    if (t < t0 || t > out + .5) continue;
    const dur = .2 + .017 * v.hi.length;
    const wh = writeOn(ctx, v.hi, '400 46px Kalam', W / 2, 1555, t, t0, t0 + dur, { out });
    const we = writeOn(ctx, v.en, '500 38px Caveat', W / 2, 1610, t, t0 + .15, t0 + .15 + .2 + .017 * v.en.length, { out, a: .74 });
  }
}

function render(t) {
  TX = [];
  const cam = camFor(t), M = worldToScreen(cam, W, H);
  drawPaper(ctx, paper, cam, W, H);
  const head = q.has('all') ? P.N - 1 : headAt(P, t);
  if (t >= P.T[0] || q.has('all')) drawLine(ctx, P, head, M, cam.k);
  drawBlots(ctx, P, q.has('all') ? 999 : t, M, cam.k);
  drawTooth(ctx, tooth, cam, W, H);
  vignette(ctx, W, H);
  // the pen: only its shadow; it lifts away once the line has run off the paper
  const lift = clamp((t - SEGS.at(-1).t[1]) / .6);
  if (!q.has('nopen') && !q.has('all') && lift < 1) {
    const tip = M(...posAt(P, head)), dir = [0.56, 0.83];
    penShadow(ctx, tip, dir, Math.min(cam.k, 1.6), { lift, alpha: (1 - lift) * .7 });
  }
  if (!NOSUB) {
    subtitles(ctx, t);
    for (const w of WRITE) {
      const wd = writeOn(ctx, w.text, w.font, W / 2, w.y, t, w.t0, w.t1, { col: w.col });
      if (t >= w.t1) TX.push({ id: w.text, text: w.text, x0: W / 2 - wd / 2, y0: w.y - 70, x1: W / 2 + wd / 2, y1: w.y + 20 });
    }
  }
}

// events for the mix: pen-speed track, pen down, blot, voice
function events() {
  const ev = [], track = [];
  for (let t = 0; t <= DUR; t += 0.005) {
    const h = headAt(P, t), i = Math.floor(h), cam = camFor(t), Mx = worldToScreen(cam, W, H), p = Mx(...posAt(P, h));
    const moving = t >= P.T[0] && t < P.T[P.N - 1] && !(t > hold.t && t < hold.t + hold.dur);
    track.push([+t.toFixed(3), moving ? Math.round(P.V[i]) : 0, +(p[0] / W).toFixed(3), P.segs[P.SEG[i]].style, +(P.DRY[i] || 0).toFixed(2)]);
  }
  ev.push({ t: 0, type: 'track', data: track });
  ev.push({ t: 0, type: 'tap' }, { t: hold.t, type: 'blot', dur: hold.dur }, { t: hold.t + hold.dur, type: 'tap' });
  ev.push({ t: SEGS.find(s => s.id === 'sun').t[0] + 1.0, type: 'chime' });
  for (const s of SEGS) ev.push({ t: s.t[0], type: 'seg', id: s.id, t1: s.t[1] });
  for (const v of VO) ev.push({ t: v.t0, type: 'vo', id: v.id });
  for (const v of VO) if (v.hi) ev.push({ t: v.t0, type: 'sub', t1: v.t0 + Math.max(1.8, v.dur + .6), hi: v.hi, en: v.en });
  ev.push({ t: 21.8, type: 'sub', t1: 26.0, hi: 'याद रखिए: गिरना हार नहीं है, रुक जाना हार है।', en: "Remember: falling isn't failing. Stopping is." });
  return ev;
}

window.DUR = DUR;
window.EV = events();
window.render = render;
window.TEXTS = t => { render(t); return TX; };
window.PATH = P;
window.READY = true;
