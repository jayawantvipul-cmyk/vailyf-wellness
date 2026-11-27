"""Mix one whiteboard reel: python mix.py <reel> -> out/mix_<reel>.wav. Marker strokes sound (felt on gloss),
props, room tone, a wall-clock tick that owns the silence, voice on top, music ducked under speech."""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, bp, lp, hp, t_, compress, limit, brown
from core.audio import sampler as Smp
HERE = os.path.dirname(os.path.abspath(__file__)); REEL = int(sys.argv[1])
E = json.load(open(os.path.join(HERE, 'out', f'events_{REEL}.json'))); DUR = E['dur'] + 1.0; N = int(DUR * SR)
R = np.random.default_rng(30 + REEL); nz = lambda d: R.standard_normal(max(1, int(round(d * SR))))
fx = np.zeros((N, 2), np.float32)
def env_u(n): u = np.linspace(0, 1, n); return np.clip(1 - np.cos(2 * np.pi * u), 0, 2) / 2 * (1 - .8 * np.sin(2 * np.pi * u) / (2 * np.pi))
def stroke(d, pen, kind):
    d = max(.05, min(d, 2.5)); n = int(d * SR); x = nz(d)[:n]
    hiss = bp(x, 2000, 7500) * .5 + bp(x, 500, 1500) * .5
    grains = (R.random(n) < .002) * R.uniform(-1, 1, n); hiss += bp(grains, 1500, 6000) * 2
    sh = {'ink': 1.0, 'blue': 1.12, 'green': .9}.get(pen, 1.0)
    out = hiss * env_u(n) * .06 * sh
    tick = np.zeros(n); m = min(n, int(.01 * SR)); tick[:m] = R.uniform(-1, 1, m) * np.linspace(1, 0, m) * .1; out += bp(tick, 2000, 8000)
    if kind == 'stroke' and d > .45 and R.random() < .3:   # dry-erase squeak
        tt = t_(d)[:n]; f = R.uniform(1500, 2600) + 60 * np.sin(2 * np.pi * R.uniform(7, 13) * tt)
        out += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 3 * .012
    return out
def click(): d = .08; return bp(nz(d), 1500, 6000) * np.exp(-t_(d)[:int(d * SR)] / .01) * .25
def whoosh(): d = 1.2; tt = t_(d)[:int(d * SR)]; return bp(nz(d), 300, 2000)[:len(tt)] * np.sin(np.pi * tt / d) ** 2 * .18
cap = next(e['t'] for e in E['ev'] if e['type'] == 'cap'); cta = next(e['t'] for e in E['ev'] if e['type'] == 'vo' and e['id'] == 'cta')
for e in E['ev']:
    k = e['type']
    if k in ('stroke', 'write', 'tap', 'dash'): add(fx, stroke(e['dur'], e.get('pen'), k), e['t'], 1.0, np.clip((e.get('x', 600) - 600) / 700, -.7, .7))
    elif k == 'cap': add(fx, click(), e['t'], 1.0, .3)
    elif k == 'whoosh': add(fx, whoosh(), e['t'], 1.0, 0)
# room tone, and a wall clock ticking through the silence
room = lp(brown(DUR), 700); room = room / (np.abs(room).max() + 1e-9) * .01; fx[:, 0] += room[:N]; fx[:, 1] += room[:N]
t = cap + .15
while t < cta: add(fx, bp(nz(.03), 2500, 6000)[:int(.03 * SR)] * np.exp(-np.arange(int(.03 * SR)) / (.004 * SR)) * .12, t, 1.0, -.5); t += .5
mus, sr = sf.read(os.path.join(HERE, 'out', f'music_{REEL}.wav'), dtype='float32'); music = np.zeros((N, 2), np.float32); music[:min(N, len(mus))] = mus[:N]
voice = np.zeros(N, np.float32); speaking = np.zeros(N, np.float32)
for e in E['ev']:
    if e['type'] != 'vo': continue
    a, sr0 = sf.read(os.path.join(HERE, 'voice', 'out', e['id'] + '.wav'), dtype='float32'); a = hp(soxr.resample(a, sr0, SR), 90)
    s = int(e['t'] * SR); voice[s:s + len(a)] += a[:N - s]; speaking[s:s + len(a)] = 1
rms = lambda x, m: np.sqrt(np.mean(x[m] ** 2)) + 1e-9
voice = voice / rms(voice, speaking > 0) * .1; voice = limit(voice, ceil=.1 * 10 ** (11 / 20)); voice = compress(voice, thr=.12, ratio=3.0)
k = int(.3 * SR); envv = np.clip(np.convolve(speaking, np.ones(k) / k, 'same'), 0, 1); music *= (1 - .45 * envv)[:, None]
m_rms = np.sqrt(np.mean(mus[np.abs(mus).max(1) > .01] ** 2)) + 1e-9; voice *= (m_rms * 10 ** (7 / 20)) / rms(voice, speaking > 0)
v_rms = rms(voice, speaking > 0); f_rms = np.sqrt(np.mean(fx ** 2)) + 1e-9; fx *= min(1.0, v_rms * 10 ** (-11 / 20) / f_rms * 1.6)
mix = Smp.room(np.stack([voice, voice], 1), size=.2, mix=.06) + music + Smp.room(fx, size=.25, mix=.12)
mix = mix / (np.abs(mix).max() + 1e-9) * .89; sf.write(os.path.join(HERE, 'out', f'mix_{REEL}.wav'), mix.astype(np.float32), SR)
print('mix', REEL, round(N / SR, 2))
