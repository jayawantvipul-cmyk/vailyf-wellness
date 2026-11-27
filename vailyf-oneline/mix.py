"""Mix: the pen on paper (synthesised from the pen-speed track), a tap at each pen-down, a wet swell at the blot,
voice, solo cello. Literal silence at the stop (music and room tone at zero). -> out/mix.wav"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, bp, lp, hp, t_, compress, limit, brown
from core.audio import sampler as Smp
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur'] + 1.0; N = int(DUR * SR)
R = np.random.default_rng(14); nz = lambda d: R.standard_normal(max(1, int(round(d * SR))))
track = np.array([[r[0], r[1], r[2], r[4]] for r in next(e for e in E['ev'] if e['type'] == 'track')['data']], float)
tt = np.arange(N) / SR
v = np.interp(tt, track[:, 0], track[:, 1]); px = np.interp(tt, track[:, 0], track[:, 2]); dry = np.interp(tt, track[:, 0], track[:, 3])
vs = np.convolve(v, np.ones(480) / 480, 'same')
amp = np.sqrt(np.clip(vs, 0, 2000) / 600)
noise = R.standard_normal(N)
bright = np.clip(vs / 700, 0, 1)
pen = bp(noise, 900, 3200) * (1 - bright) + bp(noise, 2200, 7000) * bright
ticks = (R.random(N) < np.clip(vs, 0, 2000) / 2000 * .004) * R.uniform(-1, 1, N); pen += bp(ticks, 1500, 7000) * 3
gate = 1 - np.clip(dry * 1.6, 0, .8) * (np.sin(2 * np.pi * 9 * tt) > .3)
pen *= amp * gate * .05
pan = np.clip(px * 2 - 1, -.8, .8); fx = np.stack([pen * np.sqrt((1 - pan) / 2), pen * np.sqrt((1 + pan) / 2)], 1).astype(np.float32)
for e in E['ev']:
    if e['type'] == 'tap':
        d = .12; x = bp(nz(d), 300, 2500)[:int(d * SR)] * np.exp(-np.arange(int(d * SR)) / (.015 * SR)) * .25; add(fx, x, e['t'], 1.0, 0)
    if e['type'] == 'blot':
        d = 1.4; x = lp(nz(d), 500)[:int(d * SR)] * np.sin(np.pi * np.arange(int(d * SR)) / int(d * SR)) * .05; add(fx, x, e['t'], 1.0, 0)
blot = next(e for e in E['ev'] if e['type'] == 'blot'); s0, s1 = blot['t'] + .05, blot['t'] + blot['dur']
room = lp(brown(DUR), 600)[:N]; room = room / (np.abs(room).max() + 1e-9) * .006
room[int(s0 * SR):int(s1 * SR)] = 0; fx[:, 0] += room; fx[:, 1] += room
mus, sr = sf.read(os.path.join(HERE, 'out', 'music.wav'), dtype='float32'); music = np.zeros((N, 2), np.float32); music[:min(N, len(mus))] = mus[:N]
voice = np.zeros(N, np.float32); speaking = np.zeros(N, np.float32)
for e in E['ev']:
    if e['type'] != 'vo': continue
    a, sr0 = sf.read(os.path.join(HERE, 'voice', 'out', e['id'] + '.wav'), dtype='float32'); a = hp(soxr.resample(a, sr0, SR), 90)
    s = int(e['t'] * SR); voice[s:s + len(a)] += a[:N - s]; speaking[s:s + len(a)] = 1
rms = lambda x, m: np.sqrt(np.mean(x[m] ** 2)) + 1e-9
voice = voice / rms(voice, speaking > 0) * .1; voice = limit(voice, ceil=.1 * 10 ** (11 / 20)); voice = compress(voice, thr=.12, ratio=3.0)
k = int(.3 * SR); envv = np.clip(np.convolve(speaking, np.ones(k) / k, 'same'), 0, 1)
music *= (1 - .44 * envv)[:, None]; fx *= (1 - .37 * envv)[:, None]           # music -5 dB, pen -4 dB under the voice
m_rms = np.sqrt(np.mean(mus[np.abs(mus).max(1) > .01] ** 2)) + 1e-9; voice *= (m_rms * 10 ** (7 / 20)) / rms(voice, speaking > 0)
mix = Smp.room(np.stack([voice, voice], 1), size=.2, mix=.06) + music + fx
mix = mix / (np.abs(mix).max() + 1e-9) * .89; sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR); print('mix', round(N / SR, 2))
