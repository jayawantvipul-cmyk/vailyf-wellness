"""Mix: voice + score + procedural foley from events.json -> out/mix.wav (48 kHz stereo).
Run with the library's Python: $LIB/.venv/bin/python <project>/mix.py"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, bp, lp, hp, t_, compress, limit, brown
from core.audio import sampler as Smp

HERE = os.path.dirname(os.path.abspath(__file__))
R = np.random.default_rng(9)
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur'] + 1.0; N = int(DUR * SR)
fx = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
nz = lambda d: R.standard_normal(int(round(d * SR)))
def mix_(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def env(d, a=.003, tau=.08): tt = t_(d); return np.minimum(1, tt / a) * np.exp(-tt / tau)
def tone(f, d, tau, partials=((1, 1),)):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * k * tt) for k, a in partials) * env(d, .002, tau)
SCALE = [349.2, 392.0, 440.0, 466.2, 523.3, 587.3, 659.3, 698.5, 784.0]           # F major from F4

def thud(i=0): d = .35; tt = t_(d); return mix_(np.sin(2 * np.pi * (85 - 20 * tt / d) * tt) * env(d, .002, .07) * .7, bp(nz(d), 300, 1500) * env(d, .001, .02) * .3)
def land():
    x = thud() * .8; c = bp(nz(.2), 600, 3000) * env(.2, .001, .03) * .2; x[:len(c)] += c; return x
def whoosh(d=.6, v=.25): tt = t_(d); return bp(nz(d), 400, 2600) * np.sin(np.pi * tt / d) ** 2 * v
def zip_(): d = .3; tt = t_(d); return bp(nz(d), 2500, 7000) * (np.sin(2 * np.pi * 38 * tt) > 0) * np.sin(np.pi * tt / d) * .14
def slide(): d = .4; tt = t_(d); return mix_(lp(nz(d), 1200) * np.sin(np.pi * tt / d) * .22, thud() * .25)
def pop(n): return mix_(tone(SCALE[min(n, 8)] * 2, .18, .05, ((1, .6), (2, .25))) * .5, bp(nz(.05), 1500, 5000) * env(.05, .001, .01) * .2)
def pour(): d = .6; tt = t_(d); f = 500 + 600 * tt / d; return mix_(bp(nz(d), 500, 2200) * .12, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .05, .4) * .03)
def coin(n): return tone(2200 + n * 180, .4, .12, ((1, .5), (2.76, .3), (5.4, .15))) * .45
def tick(n): return mix_(tone(SCALE[n % 9] * 3, .08, .02, ((1, .5),)) * .45, bp(nz(.03), 3000, 8000) * env(.03, .001, .006) * .15)
def flame(): d = .6; tt = t_(d); return bp(nz(d), 300, 1800) * np.sin(np.pi * tt / d) * .2
def cheer():
    d = 1.2; tt = t_(d); x = np.zeros(len(tt))
    for _ in range(14): f0 = R.uniform(250, 600); x += np.sin(2 * np.pi * f0 * tt * (1 + .05 * np.sin(2 * np.pi * R.uniform(3, 6) * tt))) * R.uniform(.2, .5)
    return bp(mix_(x, nz(d) * .3)[:len(tt)], 300, 3000) * np.sin(np.pi * tt / d) * .05
def steps():
    out = np.zeros(int(.8 * SR)); n = int(.15 * SR)
    for i in range(4): s = int(i * .2 * SR); out[s:s + n] += thud()[:n] * .35
    return out
def paper(): d = .35; tt = t_(d); return bp(nz(d), 1500, 6000) * np.sin(np.pi * tt / d) * .12
def check(n): return tone(SCALE[2 + n * 2] * 2, .25, .08, ((1, .5), (2, .2))) * .5
def boing(): d = .5; tt = t_(d); return np.sin(2 * np.pi * np.cumsum(180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt / .15)) / SR) * env(d, .003, .18) * .35
def chime(): return sum(tone(f, 2.5, .9, ((1, .4), (2.01, .15))) for f in (698.5, 880.0, 1046.5)) * .25
def bed(i, d=4.8):    # ambience per floor: office hum, crowd murmur, quiet room
    tt = t_(d); e = np.clip(tt / .5, 0, 1) * np.clip((d - tt) / .8, 0, 1)
    if i in (1, 2): x = mix_(lp(brown(d), 400) * 3, np.sin(2 * np.pi * 120 * tt) * .02)[:len(tt)]
    elif i == 3: x = bp(nz(d), 250, 1200)[:len(tt)] * .5
    else: x = lp(brown(d), 300)[:len(tt)] * 2
    x = x / (np.abs(x).max() + 1e-9) * .05; return x * e

for e in ev['ev']:
    k, t, pn = e['type'], e['t'], e.get('pan', 0) * .7
    f = {'thud': lambda: thud(), 'land': land, 'whoosh': lambda: whoosh(), 'zip': zip_, 'slide': slide, 'pop': lambda: pop(e.get('n', 0)),
         'pour': pour, 'coin': lambda: coin(e.get('n', 0)), 'tick': lambda: tick(e.get('n', 0)), 'flame': flame, 'cheer': cheer, 'steps': steps,
         'paper': paper, 'check': lambda: check(e.get('n', 0)), 'boing': boing, 'whooshbig': lambda: whoosh(1.0, .35), 'chime': chime}.get(k)
    if f: add(fx, f(), t, 1.0, pn)
    if k == 'amb': add(amb, bed(e['i']), t, 1.0, 0)
# light wind on the roof and again for the pull-out (J-cut from the roof)
for t0, d in [(0.0, 3.8), (24.2, 6.5)]:
    tt = t_(d); w = bp(nz(d), 200, 900) * (.6 + .4 * np.sin(2 * np.pi * .3 * tt)); w *= np.clip(tt / .6, 0, 1) * np.clip((d - tt) / 1.0, 0, 1)
    add(amb, w * .05, t0, 1.0, 0)

mus, sr = sf.read(os.path.join(HERE, 'out', 'music.wav'), dtype='float32'); assert sr == SR
music = np.zeros((N, 2), np.float32); music[:min(N, len(mus))] = mus[:N]
vdir = os.path.join(HERE, 'voice', 'out'); starts = {e['id']: e['t'] for e in ev['ev'] if e['type'] == 'vo'}
voice = np.zeros(N, np.float32); speaking = np.zeros(N, np.float32)
for vid, t in starts.items():
    a, sr0 = sf.read(os.path.join(vdir, vid + '.wav'), dtype='float32'); a = hp(soxr.resample(a, sr0, SR), 90)
    s = int(t * SR); voice[s:s + len(a)] += a[:N - s]; speaking[s:s + len(a)] = 1
rms = lambda x, m: np.sqrt(np.mean(x[m] ** 2)) + 1e-9
voice = voice / rms(voice, speaking > 0) * .1
voice = limit(voice, ceil=.1 * 10 ** (11 / 20)); voice = compress(voice, thr=.12, ratio=3.0)   # Kokoro is peaky: limit, then compress
k = int(.25 * SR); envv = np.clip(np.convolve(speaking, np.ones(k) / k, 'same'), 0, 1)
music *= (1 - .6 * envv)[:, None]                                  # ~8 dB under the voice
amb *= (1 - .55 * envv)[:, None]                                   # ~7 dB
m_rms = np.sqrt(np.mean(mus[np.abs(mus).max(1) > .01] ** 2)) + 1e-9
voice *= (m_rms * 10 ** (4 / 20)) / rms(voice, speaking > 0)
vst = Smp.room(np.stack([voice, voice], 1), size=.2, mix=.06)
mix = vst + music + Smp.room(fx, size=.25, mix=.1) + amb
mix = mix / (np.abs(mix).max() + 1e-9) * .89
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix', round(N / SR, 2), 's')
