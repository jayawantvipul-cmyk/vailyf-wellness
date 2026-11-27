#!/bin/sh
# One command: voice -> check -> score -> events -> picture (1080x1920) -> mix -> master, plus subtitles.
#   sh build.sh            (set LIB if the library is not at ~/lemo-opuscar)
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/score.py"
if [ -z "$SKIP_VOICE" ]; then "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"; fi
HF_HUB_DISABLE_XET=1 "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en --model small.en
"$PY" "$HERE/score.py"
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/vailyf-portal.mp4" 24 0
node -e "
const fs=require('fs'),src=fs.readFileSync('$HERE/film.js','utf8');
const rows=[...src.matchAll(/\['(v\d)', ([\d.]+), ([\d.]+), [\"']((?:[^\"\\\\]|\\\\.)+?)[\"']\]/g)];
fs.writeFileSync('$HERE/out/cues.json',JSON.stringify(rows.map(r=>({t0:+r[2],t1:+r[2]+ +r[3]+.6,text:r[4]}))));"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_en.srt"
ffmpeg -v error -y -ss 28.5 -i "$HERE/vailyf-portal.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "✓ $HERE/vailyf-portal.mp4"
