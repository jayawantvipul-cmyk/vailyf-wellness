#!/bin/sh
# One command: voice -> check -> score -> events -> picture -> mix -> master, plus subtitles.
#   sh build.sh            (set LIB if the library is not at ~/lemo-opuscar)
#   SKIP_VOICE=1 sh build.sh   reuse voice/out (the Hindi voice needs speech.platform.bing.com)
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
"$PY" "$HERE/score.py"
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 60 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/vailyf-journey.mp4" 60 1
node -e "
const fs=require('fs'),src=fs.readFileSync('$HERE/main.js','utf8');
const rows=[...src.matchAll(/\['(v\w+)', ([\d.]+), ([\d.]+), '([^']+)', [\"']((?:[^\"\\\\]|\\\\.)+?)[\"']\]/g)];
fs.writeFileSync('$HERE/out/cues.json',JSON.stringify(rows.map(r=>({t0:+r[2]-.15,t1:+r[2]+ +r[3]+.6,text:r[4]+'\n'+r[5]}))));"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_hi-en.srt"
ffmpeg -v error -y -ss 36.8 -i "$HERE/vailyf-journey.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "✓ $HERE/vailyf-journey.mp4"
