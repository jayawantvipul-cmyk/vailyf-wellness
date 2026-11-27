"""Score for the 30 s vertical cut of "Meera's Journal" (80 bpm, D major) -> out/music.wav (48 kHz stereo).
Same instruments and harmony as vailyf-journey/score.py, re-cut to this timeline:
0 tired piano · 3.75 page turn, D + pad · 7.5 kalimba habits · 12.0 silence · 13.5 guitar (team) ·
18.0 bloom with flute · 22.5 breath · 23.25 resolve G - A - D, rings out to the end."""
import os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
BEAT = 60 / 80; DUR = 31.0
S.seed(7)
ev, KAL, GTR = [], [], []
def pno(t, notes, dur, vel=.42, pan=0, strum=.03):
    for i, n in enumerate(notes): ev.append((t + i * strum, 'piano', n, dur, vel * (1 - .06 * i), pan + (i - len(notes) / 2) * .05))
def pad(t, notes, dur, vel=.3):
    ev.extend(dict(t=t, inst='violas', pitch=p, dur=dur, vel=vel, pan=(-.3 if i % 2 == 0 else .3), attack=.8, release=.8) for i, p in enumerate(notes))
def kal(t0, notes, vel=.58, pan0=-.35):
    for i, n in enumerate(notes): KAL.append((t0 + i * BEAT / 2, n, vel if i % 2 == 0 else vel - .1, pan0 + .1 * (i % 4)))

# 0-3.75 tired
pno(0.0, ['B2', 'F#3', 'A3', 'D4'], 1.5, .36)
pno(1.5, ['G2', 'D3', 'F#3', 'B3'], 1.5, .34)
pno(3.0, ['A2', 'E3', 'G3', 'C#4'], .9, .32)
# 3.75-7.5 the first log
pno(3.75, ['D2', 'A2', 'F#3', 'E4'], 2.2, .4); pno(5.25, ['A4'], .9, .26, .25, 0)
pno(6.0, ['A2', 'E3', 'B3', 'E4'], .75, .36); pno(6.75, ['A2', 'E3', 'A3', 'C#4'], .75, .36)
pad(3.6, ['D3', 'A3'], 4.0, .3)
# 7.5-12 habits: kalimba eighths
kal(7.5, ['D4', 'F#4', 'A4', 'D5']); kal(9.0, ['B3', 'D4', 'F#4', 'B4']); kal(10.5, ['G3', 'B3']); kal(11.25, ['A3', 'C#4'])
pno(7.5, ['D2', 'A2', 'F#3'], 1.4, .36); pno(9.0, ['B1', 'F#2', 'D3'], 1.4, .36)
pno(10.5, ['G2', 'D3', 'B3'], .7, .36); pno(11.25, ['A2', 'E3', 'C#4'], .6, .34)
pad(7.4, ['F#3', 'A3'], 4.4, .25)
# 12-13.5 silence. 13.5-18 the team: nylon guitar
for t0, root, notes in [(13.5, 'E2', ['B2', 'G3', 'D4']), (15.0, 'G2', ['D3', 'B3', 'D4']), (16.5, 'A2', ['E3', 'A3', 'C#4'])]:
    for i, n in enumerate([root] + notes): GTR.append((t0 + i * .375, n, .65 if i == 0 else .55, .25))
pno(15.0, ['G3', 'B3'], 1.4, .26, .1, .05); pno(16.5, ['A3', 'C#4'], 1.4, .26, .1, .05)
# 18-22.5 bloom
pno(18.0, ['D2', 'A2', 'F#3', 'A3', 'D4'], 2.9, .5)
pno(21.0, ['B1', 'F#2', 'D3', 'F#3', 'B3'], .75, .45); pno(21.75, ['G2', 'D3', 'B3', 'D4'], .7, .45)
kal(18.0, ['D5', 'A4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'A4'], .55, .05); kal(21.0, ['B4', 'F#4', 'G4', 'D4'], .5, .05)
for i, n in enumerate(['D2', 'A3', 'F#3', 'D4', 'B1', 'F#3']): GTR.append((18.0 + i * .375 * 2, n, .5, -.3))
pad(17.9, ['D3', 'A3', 'F#4'], 4.4, .3)
FL = [(18.0, 'F#5', BEAT * .95, .5), (18.75, 'A5', BEAT * .95, .55), (19.5, 'B5', BEAT * 1.9, .6), (21.0, 'A5', BEAT * .95, .5), (21.75, 'F#5', BEAT * .9, .46)]
# 22.5-23.25 breath. 23.25 resolve: G - A - D, last chord rings out
pno(23.25, ['G2', 'D3', 'B3'], 1.4, .38)
pno(24.75, ['A2', 'E3', 'C#4'], 1.4, .36)
pno(26.25, ['D2', 'A2', 'F#3', 'A3', 'D4'], 4.4, .4)
pno(28.5, ['F#5'], 2.4, .2, .3, 0)
FL += [(23.25, 'D5', BEAT * 1.9, .42), (24.75, 'E5', BEAT * .9, .4), (25.5, 'C#5', BEAT * .9, .38), (26.25, 'D5', BEAT * 5, .38)]
for t, n, d, v in FL: ev.append(dict(t=t, inst='flute', pitch=n, dur=d, vel=v, pan=.18, release=.5))

if __name__ == '__main__':
    mus = S.render(ev, dur=DUR, master=False)
    for t, n, v, pn in KAL: add(mus, P.pluck('kalimba', n, None, vel=v) * .5, t, 1.0, pn)
    for t, n, v, pn in GTR: add(mus, P.pluck('nylon_guitar', n, None, vel=v) * .55, t, 1.0, pn)
    mus = S.room(mus, size=.42, mix=.2)
    n = int(DUR * SR); fo = int(1.2 * SR); mus[n - fo:n] *= np.linspace(1, 0, fo)[:, None]
    mus *= .8 / max(1e-9, np.abs(mus).max())
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    sf.write(os.path.join(HERE, 'out', 'music.wav'), mus.astype(np.float32), SR)
    print('music', mus.shape[0] / SR, 's  peak', np.abs(mus).max())
