"""Score for "Your First Week on VaiLyf" (90 bpm, 4/4, F major) -> out/music.wav (48 kHz stereo).
Accumulation: one instrument joins per floor (kalimba motif -> marimba bass -> glockenspiel -> nylon guitar
and claps -> pizzicato), a hush before the pull-out, then everything together on the reveal."""
import os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

HERE = os.path.dirname(os.path.abspath(__file__))
B = 60 / 90; BAR = 4 * B; DUR = 31.0
CUT = [6 * B, 13 * B, 19 * B, 26 * B, 32 * B]          # floor cuts (on beats)
HUSH0, OUT0, OUT1 = 37 * B - .4, 37 * B, 39 * B
S.seed(11)
CH = [('F', ['F3', 'A3', 'C4'], 'F2'), ('Dm', ['D3', 'F3', 'A3'], 'D2'), ('Bb', ['D3', 'F3', 'Bb3'], 'Bb1'), ('C', ['E3', 'G3', 'C4'], 'C2')]
MOTIF = ['C5', 'F5', 'A5', 'G5', 'F5', 'C5', 'D5', 'F5']          # the "you" motif, eighths over one bar
ev = []
def on(t): return t < HUSH0 or t >= OUT0
for bar in range(12):
    t0 = bar * BAR; name, tri, root = CH[bar % 4]
    for i in range(8):                                             # kalimba motif throughout (the subject's sound)
        t = t0 + i * B / 2
        if t < DUR - 1.6 and on(t): ev.append((t, 'kalimba', MOTIF[i] if bar % 2 == 0 else MOTIF[(i + 3) % 8], B, .5 if i % 2 == 0 else .42, .25))
    for i in range(16):                                            # soft shaker sixteenths
        t = t0 + i * B / 4
        if t < OUT1 + 2 and on(t): ev.append((t, 'shaker', None, None, .22 if i % 4 else .3, -.3))
    if t0 + 2 * B >= CUT[0]:                                       # floor 1: marimba bass on quarters
        for i in range(4):
            t = t0 + i * B
            if t >= CUT[0] and on(t): ev.append((t, 'marimba', root.replace('1', '2') if i % 2 == 0 else tri[0].replace('3', '2'), B, .62, -.2))
    if t0 + BAR > CUT[1]:                                          # floor 2: glockenspiel on beats 1 and 3
        for i in (0, 2):
            t = t0 + i * B
            if t >= CUT[1] and on(t): ev.append((t, 'glockenspiel', tri[2].replace('4', '6').replace('3', '6'), B * 1.5, .32, .35))
    if t0 + BAR > CUT[2]:                                          # floor 3: nylon guitar strums + claps on 2 and 4
        for i in range(4):
            t = t0 + i * B
            if t >= CUT[2] and on(t):
                for k, n in enumerate(tri): ev.append((t + k * .018, 'guitar_nylon', n, B * .9, .5, -.15))
                if i in (1, 3): ev.append((t, 'claps', None, None, .3, .2))
    if t0 + BAR > CUT[3]:                                          # floor 4: pizzicato eighths
        for i in range(8):
            t = t0 + i * B / 2
            if t >= CUT[3] and on(t): ev.append((t, 'violins_pizz', tri[i % 3].replace('3', '4'), B / 2, .42, .3))
# the reveal: a held F major chord in pads and a last motif note
for n, pn in [('F3', -.3), ('A3', .3), ('C4', 0), ('F4', .1)]: ev.append(dict(t=OUT1, inst='violas', pitch=n, dur=3.8, vel=.32, pan=pn, attack=.4, release=1.2))
ev.append((OUT1, 'kalimba', 'F5', 3.0, .55, .25)); ev.append((OUT1, 'glockenspiel', 'C6', 3.0, .3, .35)); ev.append((OUT1, 'marimba', 'F2', 2.0, .6, -.2))

if __name__ == '__main__':
    mus = S.render(ev, dur=DUR, master=False)
    mus = S.room(mus, size=.3, mix=.14)
    n = int(DUR * SR); fo = int(1.0 * SR); mus[n - fo:n] *= np.linspace(1, 0, fo)[:, None]
    mus *= .8 / max(1e-9, np.abs(mus).max())
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    sf.write(os.path.join(HERE, 'out', 'music.wav'), mus.astype(np.float32), SR)
    print('music', mus.shape[0] / SR, 's  peak', np.abs(mus).max())
