"""Mix: voice + score + procedural foley from events.json -> out/mix.wav (48 kHz stereo).
Run with the library's Python: $LIB/.venv/bin/python <project>/mix.py"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, bp, lp, hp, t_, env_exp, compress, limit, brown

HERE = os.path.dirname(os.path.abspath(__file__))
R = np.random.default_rng(5)
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur'] + 1.0
N = int(DUR * SR)
fx = np.zeros((N, 2), np.float32)
nz = lambda d: R.standard_normal(int(round(d * SR)))
def fade(x, a=.01, b=.05):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    x = x.copy(); x[:ia] *= np.linspace(0, 1, ia); x[n - ib:] *= np.linspace(1, 0, ib); return x

# ---------- foley, made from the scene's matter ----------
def pen(d):        # nib on paper: bright scratch with stroke-shaped bursts
    x = bp(nz(d), 2500, 7000); m = np.abs(np.sin(np.cumsum(R.uniform(10, 22, len(x))) / SR * np.pi))
    return fade(x * (.35 + .65 * m) * .22, .02, .12)
def brush(d):      # wet brush on cotton paper: band-passed noise, 9 Hz tremolo
    tt = t_(d); x = bp(nz(d), 600, 3200) * (.7 + .3 * np.sin(2 * np.pi * 9 * tt))
    return fade(x * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** .6 * .3, .05, .2)
def clink(v=1):    # small ceramic cup on a saucer
    tt = t_(.6); x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / k) for f, a, k in [(2150, .5, .09), (3480, .3, .06), (5320, .18, .04)])
    return (x + bp(nz(.6), 3000, 8000) * np.exp(-tt / .006) * .4) * .35 * v
def flip():        # page turn: a soft whoosh and a paper crackle
    d = .7; tt = t_(d); w = bp(nz(d), 300, 2400) * np.sin(np.pi * tt / d) ** 2 * .35
    c = bp(nz(d), 2500, 9000) * (R.random(len(tt)) < .004) * 2.5 * np.sin(np.pi * tt / d)
    return lp(w + c, 9000)
def tick():        # pencil tick mark
    return fade(bp(nz(.18), 1800, 6000) * np.exp(-t_(.18) / .05) * .5)
def fill(i):       # water poured into a glass, pitch rising as it fills
    d = .65; tt = t_(d); f = 380 + 420 * tt / d + i * 25
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (R.random(len(tt)) < .03) * 0 + bp(nz(d), 500, 2400) * .25
    bub = np.zeros(len(tt))
    for k in range(9):
        at = int(R.uniform(0, d * .9) * SR); fr = R.uniform(600, 1400) + 500 * at / len(tt); n = int(.04 * SR)
        if at + n < len(bub): bub[at:at + n] += np.sin(2 * np.pi * np.linspace(fr, fr * 1.6, n) * np.arange(n) / SR) * np.exp(-np.arange(n) / (.012 * SR)) * .3
    return fade((x + bub) * .55, .03, .15)
def step(soft):    # a footstep on paper: a soft low tap and a dry brush
    tt = t_(.25); th = np.sin(2 * np.pi * 95 * tt) * np.exp(-tt / .04) * .45
    return (th + bp(nz(.25), 900, 4000) * np.exp(-tt / .03) * .18) * (1 - .35 * soft)
def rain(d):       # rain on a window: hiss plus sparse plinks, swelling in and out
    tt = t_(d); bed = lp(hp(nz(d), 1200), 7000) * .06
    pl = np.zeros(len(tt))
    for _ in range(int(d * 22)):
        at = int(R.uniform(0, d - .1) * SR); fr = R.uniform(1800, 4200); n = int(.05 * SR)
        pl[at:at + n] += np.sin(2 * np.pi * fr * np.arange(n) / SR) * np.exp(-np.arange(n) / (.008 * SR)) * R.uniform(.05, .15)
    env = np.clip(tt / .8, 0, 1) * np.clip((d - tt) / 1.8, 0, 1)
    return (bed + pl) * env
def birds(d):      # a few small birds outside, sparse
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 1.3)):
        at = R.uniform(0, d - .5); n = int(R.uniform(.06, .14) * SR); f0 = R.uniform(2800, 4200); f1 = f0 * R.uniform(1.1, 1.5)
        for rep in range(R.integers(1, 4)):
            s = int((at + rep * .13) * SR)
            if s + n >= len(out): break
            k = np.arange(n); fr = np.linspace(f0, f1, n) if rep % 2 == 0 else np.linspace(f1, f0, n)
            out[s:s + n] += np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * k / n) * .06
    env = np.clip(t_(d) / 1.5, 0, 1) * np.clip((d - t_(d)) / 3, 0, 1)
    return out * env
def sweep(d):      # the green wash spreading: a long brush swell
    tt = t_(d); return bp(nz(d), 400, 2600) * np.sin(np.pi * tt / d) ** 1.5 * .22
def burst():       # the plant bursts into bloom: a quick flurry of brush dabs
    out = np.zeros(int(1.2 * SR))
    for k in range(14):
        s = int(k * .07 * SR + R.uniform(0, .02) * SR); x = brush(.18) * .9
        out[s:s + len(x)] += x[:len(out) - s]
    return out
def strike():      # one fast brush stroke across the old question
    return brush(.45) * 1.4
def mist(d):       # the page washes back to paper
    tt = t_(d); return lp(nz(d), 1400) * np.sin(np.pi * tt / d) ** 2 * .16

for e in ev['ev']:
    k, t, pn = e['type'], e['t'], e.get('pan', 0) * .8
    if k == 'pen': add(fx, pen(e['dur']), t, 1.0, pn)
    elif k == 'brush': add(fx, brush(e['dur']), t, 1.0, pn)
    elif k == 'clink': add(fx, clink(), t, 1.0, pn)
    elif k == 'flip': add(fx, flip(), t, 1.0, pn)
    elif k == 'tick': add(fx, tick(), t, 1.0, pn)
    elif k == 'fill': add(fx, fill(e['i']), t, .8, max(-.8, min(.8, pn)))
    elif k == 'step': add(fx, step(e.get('soft', 0)), t, 1.0, pn)
    elif k == 'rain': add(fx, rain(e['dur']), t, 1.0, 0)
    elif k == 'birds': add(fx, birds(e['dur']), t, .9, .3)
    elif k == 'sweep': add(fx, sweep(e['dur']), t, 1.0, 0)
    elif k == 'burst': add(fx, burst(), t, 1.0, pn)
    elif k == 'strike': add(fx, strike(), t, 1.0, 0)
    elif k == 'mist': add(fx, mist(e['dur']), t, 1.0, 0)
# room tone under everything (quiet; it is what remains in the silence)
room = lp(brown(DUR), 900); room = room / (np.abs(room).max() + 1e-9) * .012
fx[:, 0] += room[:N]; fx[:, 1] += room[::-1][:N] if len(room) >= N else 0

# ---------- music ----------
mus, sr = sf.read(os.path.join(HERE, 'out', 'music.wav'), dtype='float32'); assert sr == SR
music = np.zeros((N, 2), np.float32); music[:min(N, len(mus))] = mus[:N]

# ---------- voice: 24k -> 48k, high-pass, limit the peaks first, then compress ----------
vdir = os.path.join(HERE, 'voice', 'out'); starts = {e['id']: e['t'] for e in ev['ev'] if e['type'] == 'vo'}
voice = np.zeros(N, np.float32); speaking = np.zeros(N, np.float32)
for vid, t in starts.items():
    a, sr0 = sf.read(os.path.join(vdir, vid + '.wav'), dtype='float32')
    a = soxr.resample(a, sr0, SR); a = hp(a, 90)
    s = int(t * SR); voice[s:s + len(a)] += a[:N - s]; speaking[s:s + len(a)] = 1
rms_v = np.sqrt(np.mean(voice[speaking > 0] ** 2)) + 1e-9
voice = limit(voice / rms_v * .1, ceil=.1 * 10 ** (11 / 20))                  # limit to speech RMS + 11 dB
voice = compress(voice, thr=.12, ratio=3.0)
# duck the music ~4 dB under the voice with a smoothed envelope
k = int(.3 * SR); env = np.convolve(speaking, np.ones(k) / k, 'same'); duck = 1 - .38 * np.clip(env, 0, 1)
music *= duck[:, None]
# level: voice RMS = music RMS (unducked, where it plays) + 8 dB during speech
m_rms = np.sqrt(np.mean(mus[np.abs(mus).max(1) > .01] ** 2)) + 1e-9
v_rms = np.sqrt(np.mean(voice[speaking > 0] ** 2)) + 1e-9
voice *= (m_rms * 10 ** (8 / 20)) / v_rms
vst = np.stack([voice, voice], 1)
# short soft room on voice and foley
from core.audio import sampler as S
vst = S.room(vst, size=.25, mix=.08); fxr = S.room(fx, size=.35, mix=.15)
mix = vst + music + fxr * 1.0
mix = mix / (np.abs(mix).max() + 1e-9) * .89
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix', round(N / SR, 2), 's')
