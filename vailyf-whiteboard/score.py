"""Score for one whiteboard reel: python score.py <reel 1|2|3> -> out/music_<reel>.wav (48 kHz stereo).
96 bpm. A kalimba motif that rises a step per reel (D, E, F#), one instrument added per tip
(pizzicato bass, shaker, glockenspiel), a full stop into silence before the end card, then a resolve."""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR
HERE = os.path.dirname(os.path.abspath(__file__)); REEL = int(sys.argv[1])
E = json.load(open(os.path.join(HERE, 'out', f'events_{REEL}.json'))); DUR = E['dur'] + 1.0
ev = {e['type'] + str(e.get('n', '')): e['t'] for e in E['ev'] if e['type'] in ('num', 'cap', 'whoosh', 'book')}
CTA = [e['t'] for e in E['ev'] if e['type'] == 'vo' and e['id'] == 'cta'][0]
B = 60 / 96; KEY = [0, 2, 4][REEL - 1]
def n(name): return S.midi(name) + KEY
MOT = ['D5', 'F#5', 'A5', 'F#5', 'B4', 'D5', 'E5', 'A4']
CH = [['D3', 'F#3', 'A3'], ['B2', 'D3', 'F#3'], ['G2', 'B2', 'D3'], ['A2', 'C#3', 'E3']]
S.seed(20 + REEL); out = []
stop = ev['cap']; T1, T2, T3 = ev['num0'], ev['num1'], ev['num2']
t = 0.0; i = 0
while t < stop - .05:
    bar = int(t // (4 * B)); ch = CH[bar % 4]
    out.append((t, 'kalimba', n(MOT[i % 8]), B, .5 if i % 2 == 0 else .4, .25))
    if t >= T1 - .01 and i % 2 == 0: out.append((t, 'violins_pizz', n(ch[(i // 2) % 3]) - 12, B, .5, -.25))
    if t >= T2 - .01: out.append((t, 'shaker', None, None, .2, -.35)); out.append((t + B / 4, 'shaker', None, None, .14, -.35))
    if t >= T3 - .01 and i % 4 == 0: out.append((t, 'glockenspiel', n(ch[2]) + 24, B * 2, .28, .35))
    t += B / 2; i += 1
# resolve on the end card (after the silence): a held chord and the motif's first notes
for k, nm in enumerate(['D3', 'A3', 'D4', 'F#4']): out.append(dict(t=CTA, inst='violas', pitch=n(nm), dur=DUR - CTA - .4, vel=.3, pan=[-.3, .3, 0, .1][k], attack=.5, release=1.0))
for k, nm in enumerate(['D5', 'F#5', 'A5', 'D6']): out.append((CTA + k * B, 'kalimba', n(nm), B * 2, .5, .25))
out.append((CTA + 4 * B, 'glockenspiel', n('D6') + 12, 2.5, .3, .35))
mus = S.render(out, dur=DUR, master=False); mus = S.room(mus, size=.3, mix=.14)
fo = int(1.0 * SR); mus[-fo:] *= np.linspace(1, 0, fo)[:, None]; mus *= .8 / max(1e-9, np.abs(mus).max())
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); sf.write(os.path.join(HERE, 'out', f'music_{REEL}.wav'), mus.astype(np.float32), SR)
print('music', REEL, round(len(mus) / SR, 2))
