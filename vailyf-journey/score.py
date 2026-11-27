"""Original score for "Meera's Journal" (80 bpm, 4/4, D major, 16 bars + tail) -> out/music.wav (48 kHz stereo).
Follows the cue map in TREATMENT.md: solo piano (tired) -> pad (first log) -> kalimba eighths (habits) ->
silence (dip) -> nylon guitar (team) -> full with flute (bloom) -> breath -> piano + flute resolve (end).
Run from the library root: $LIB/.venv/bin/python <project>/score.py"""
import os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
BEAT = 60 / 80; BAR = 4 * BEAT; DUR = 50.0
b = lambda bar, beat=0: bar * BAR + beat * BEAT      # time of a bar (0-based) and beat
S.seed(7)
ev = []
def pno(t, notes, dur, vel=.42, pan=0, strum=.03):
    for i, n in enumerate(notes): ev.append((t + i * strum, 'piano', n, dur, vel * (1 - .06 * i), pan + (i - len(notes) / 2) * .05))

# bars 1-3 (3-12 s): tired. Sparse piano, low and open
pno(b(1), ['B2', 'F#3', 'A3', 'D4'], 2.8, .36)
pno(b(1, 2.5), ['C#4'], 1.2, .26, .2, 0)
pno(b(2), ['G2', 'D3', 'F#3', 'B3'], 2.8, .34)
pno(b(3), ['E2', 'B2', 'G3', 'D4'], 1.4, .33)
pno(b(3, 2), ['A2', 'E3', 'G3', 'C#4'], 1.4, .33)
# bars 4-5 (12-18): the first log. D major opens, a soft viola pad
pno(b(4), ['D2', 'A2', 'F#3', 'E4'], 2.8, .4)
pno(b(4, 2), ['A4'], 1.0, .28, .25, 0)
pno(b(5), ['A2', 'E3', 'B3', 'E4'], 1.4, .38)
pno(b(5, 2), ['A2', 'E3', 'A3', 'C#4'], 1.4, .38)
ev += [dict(t=b(4) - .2, inst='violas', pitch=p, dur=6.0, vel=.32, pan=pn, attack=1.2, release=1.2) for p, pn in [('D3', -.3), ('A3', .3)]]
# bars 6-8 (18-27): habits. Kalimba eighths over D - Bm - G/A, piano on downbeats
ARP = {6: ['D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'E4', 'A4'], 7: ['B3', 'D4', 'F#4', 'B4', 'F#4', 'D4', 'C#4', 'F#4'],
       8: ['G3', 'B3', 'D4', 'G4', 'A3', 'C#4', 'E4', 'A4']}
KAL = []
for bar, notes in ARP.items():
    for i, n in enumerate(notes): KAL.append((b(bar, i * .5), n, .5 if i % 2 else .62, -.35 + .1 * (i % 4)))
pno(b(6), ['D2', 'A2', 'F#3'], 2.8, .36)
pno(b(7), ['B1', 'F#2', 'D3'], 2.8, .36)
pno(b(8), ['G2', 'D3', 'B3'], 1.4, .36)
pno(b(8, 2), ['A2', 'E3', 'C#4'], 1.2, .34)
ev += [dict(t=b(6), inst='violas', pitch=p, dur=8.6, vel=.26, pan=pn, attack=1.0, release=.8) for p, pn in [('F#3', -.3), ('A3', .3)]]
# bar 9 (27-28.5): silence. From 28.5 the team: nylon guitar fingerpicking, Em7 -> G -> A
GTR = []
pat = lambda root, notes: [root] + notes + notes[::-1][1:]
for t0, root, notes in [(b(9, 2), 'E2', ['B2', 'G3', 'D4']), (b(10), 'G2', ['D3', 'B3', 'D4']), (b(10, 2), 'A2', ['E3', 'A3', 'C#4'])]:
    for i, n in enumerate(pat(root, notes)[:4]): GTR.append((t0 + i * .375, n, .55 if i else .65, .25))
pno(b(10), ['G3', 'B3'], 1.4, .26, .1, .05)
pno(b(10, 2), ['A3', 'C#4'], 1.4, .26, .1, .05)
# bars 11-12 (33-37.5): bloom. Full: piano, kalimba, guitar, flute melody, pad
pno(b(11), ['D2', 'A2', 'F#3', 'A3', 'D4'], 2.9, .5)
pno(b(12), ['B1', 'F#2', 'D3', 'F#3', 'B3'], 1.4, .45)
pno(b(12, 2), ['G2', 'D3', 'B3', 'D4'], 1.2, .45)
for bar, notes in [(11, ['D5', 'A4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'A4']), (12, ['B4', 'F#4', 'D4', 'F#4', 'G4', 'D4', 'B3', 'D4'])]:
    for i, n in enumerate(notes[:8 if bar == 11 else 6]): KAL.append((b(bar, i * .5), n, .55, .35 - .1 * (i % 4)))
for i, (n, root) in enumerate([('A3', 'D2'), ('F#3', None), ('D4', None), ('A3', None), ('F#3', 'B1'), ('D3', None)]):
    GTR.append((b(11, i * .5), (root or n), .5, -.3))
FL = [(b(11), 'F#5', BEAT * .95, .5), (b(11, 1), 'A5', BEAT * .95, .55), (b(11, 2), 'B5', BEAT * 1.9, .6), (b(12), 'A5', BEAT * .95, .5),
      (b(12, 1), 'F#5', BEAT * .95, .48), (b(12, 2), 'E5', BEAT * 1.3, .45)]
ev += [dict(t=b(11) - .1, inst='violas', pitch=p, dur=4.4, vel=.3, pan=pn, attack=.6, release=.6) for p, pn in [('D3', -.3), ('A3', .3), ('F#4', 0)]]
# 37.5-38: breath. Bars 13-15 (38-48): resolve. Piano + flute: G - A - D, last chord rings out
pno(b(13) - .2, ['G2', 'D3', 'B3'], 2.8, .38)
pno(b(14) - .2, ['A2', 'E3', 'C#4'], 2.8, .36)
pno(b(15) - .2, ['D2', 'A2', 'F#3', 'A3', 'D4'], 4.4, .4)
pno(b(15, 3), ['F#5'], 3.5, .2, .3, 0)
FL += [(b(13) - .2, 'D5', BEAT * 3.6, .42), (b(14) - .2, 'E5', BEAT * 1.8, .4), (b(14, 2) - .2, 'C#5', BEAT * 1.8, .38), (b(15) - .2, 'D5', BEAT * 5, .38)]
for t, n, d, v in FL: ev.append(dict(t=t, inst='flute', pitch=n, dur=d, vel=v, pan=.18, release=.5))

if __name__ == '__main__':
    mus = S.render(ev, dur=DUR, master=False)
    for t, n, v, pn in KAL: add(mus, P.pluck('kalimba', n, None, vel=v) * .5, t, 1.0, pn)
    for t, n, v, pn in GTR: add(mus, P.pluck('nylon_guitar', n, None, vel=v) * .55, t, 1.0, pn)
    mus = S.room(mus, size=.42, mix=.2)
    mus *= .8 / max(1e-9, np.abs(mus).max())
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    sf.write(os.path.join(HERE, 'out', 'music.wav'), mus.astype(np.float32), SR)
    print('music', mus.shape[0] / SR, 's  peak', np.abs(mus).max())
