#!/bin/sh
# One command: voice -> check -> events -> reading check -> picture (1080x1920, 24 fps) -> score -> mix -> master -> subtitles.
#   sh build.sh   (set LIB if the library is not at ~/lemo-opuscar; SKIP_VOICE=1 reuses voice/out)
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/score.py"
if [ -z "$SKIP_VOICE" ]; then "$PY" "$HERE/voice/tts_hi.py" "$HERE/voice/lines.json" "$HERE/voice/out"; fi
HF_HUB_DISABLE_XET=1 "$PY" "$HERE/voice/asr_hi.py" "$HERE/voice/lines.json" "$HERE/voice/out" 0.8
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
"$PY" "$HERE/score.py"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/vailyf-keep-going.mp4" 24 0
"$PY" -c "
import json; E=json.load(open('$HERE/events.json'))
S=sorted([e for e in E['ev'] if e['type']=='sub'], key=lambda e: e['t'])
ts=lambda x: '%02d:%02d:%02d,%03d' % (int(x//3600), int(x%3600//60), int(x%60), int(round(x%1*1000)))
open('$HERE/subtitles_hi-en.srt','w',encoding='utf-8').write(''.join(f\"{i}\n{ts(s['t'])} --> {ts(s['t1'])}\n{s['hi']}\n{s['en']}\n\n\" for i, s in enumerate(S, 1)))"
ffmpeg -v error -y -ss 23.0 -i "$HERE/vailyf-keep-going.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "✓ $HERE/vailyf-keep-going.mp4"
