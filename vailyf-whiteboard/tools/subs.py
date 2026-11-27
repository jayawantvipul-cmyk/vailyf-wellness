"""Write subtitles_hi-en_<reel>.srt for each reel from out/events_<reel>.json (sub events)."""
import json, os, sys
H = sys.argv[1]
def ts(x): h, r = divmod(max(0, x), 3600); m, s = divmod(r, 60); return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)):03}"
for R in (1, 2, 3):
    E = json.load(open(os.path.join(H, 'out', f'events_{R}.json')))
    S = sorted([e for e in E['ev'] if e['type'] == 'sub'], key=lambda e: e['t0'])
    with open(os.path.join(H, f'subtitles_hi-en_{R}.srt'), 'w', encoding='utf-8') as f:
        for i, s in enumerate(S, 1): f.write(f"{i}\n{ts(s['t0'] - .1)} --> {ts(s['t1'] + .6)}\n{s['hi']}\n{s['en']}\n\n")
    print('subtitles', R, len(S))
