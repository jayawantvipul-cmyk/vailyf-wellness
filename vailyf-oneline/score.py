"""Solo cello score written to the drawing -> out/music.wav. Climb: a rising phrase; fall: a falling run;
the stop: literal silence; the restart: single tentative notes on each trembling step; momentum: the phrase
returns and climbs; the sun: the highest note plus one glockenspiel chime (the only second colour); resolve under the message."""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", os.path.expanduser("~/lemo-opuscar")); sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur'] + 1.0
seg = {e['id']: (e['t'], e['t1']) for e in E['ev'] if e['type'] == 'seg'}
blot = next(e for e in E['ev'] if e['type'] == 'blot'); chime = next(e['t'] for e in E['ev'] if e['type'] == 'chime')
S.seed(5); ev = []
K = 1 / 1.35   # the reel's pace (drawing.js SPEED): every written offset and length below scales with it
def c(t, p, d, v=.5, pan=0): ev.append(dict(t=t, inst='cellos', pitch=p, dur=d, vel=v, pan=pan, attack=.06, release=.5))
# climb 0-4.3: D minor, rising
for t, p, d in [(0.15, 'D3', .9), (1.0, 'F3', .8), (1.75, 'A3', .8), (2.5, 'C4', .7), (3.15, 'D4', 1.0)]: c(t * K, p, d * K, .5)
# fall: a falling run into the valley, ending just before the pen stops
a, _ = seg['fall']
for i, p in enumerate(['E4', 'D4', 'C4', 'A3', 'F3', 'D3', 'A2']): c(a + (.15 + i * .18) * K, p, .22 * K, .52 - i * .02)
# silence from the blot until the pen sets off again
s0, s1 = blot['t'], blot['t'] + blot['dur']
# the restart: one long, quiet note per step
for t, p in [(s1 + .1 * K, 'D3'), (s1 + 1.5 * K, 'E3'), (s1 + 2.9 * K, 'F3')]: c(t, p, 1.25 * K, .34)
# momentum: the phrase returns and climbs, faster
a, b = seg['strong']
for i, p in enumerate(['A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']): c(a + i * (b - a - .4) / 7, p, .55, .5 + i * .02)
# the sun: the highest note and one chime
c(chime - .6 * K, 'D5', 2.2 * K, .56)
ev.append((chime, 'glockenspiel', 'A6', 2.5, .3, .3))
# resolve under the message: D major
for t, p, d in [(.4, 'A4', 2.2), (2.6, 'F#4', 2.2), (4.8, 'E4', 1.6), (6.4, 'D4', 4.0), (6.4, 'D3', 4.0)]: c(seg['descend'][0] + t * K, p, d * K, .42)
mus = S.render(ev, dur=DUR, master=False); mus = S.room(mus, size=.45, mix=.2)
# literal silence at the stop, reverb tail included
i0, i1 = int(s0 * SR), int(s1 * SR); ramp = int(.12 * SR)
mus[i0:i0 + ramp] *= np.linspace(1, 0, ramp)[:, None]; mus[i0 + ramp:i1] = 0
fo = int(1.2 * SR); mus[-fo:] *= np.linspace(1, 0, fo)[:, None]; mus *= .8 / max(1e-9, np.abs(mus).max())
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); sf.write(os.path.join(HERE, 'out', 'music.wav'), mus.astype(np.float32), SR); print('music', round(len(mus) / SR, 2))
