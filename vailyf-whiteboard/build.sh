#!/bin/sh
# One command for the whole series: voice -> check -> per reel: events, reading check, picture, score, mix, master, subtitles.
#   sh build.sh            (set LIB if the library is not at ~/lemo-opuscar; SKIP_VOICE=1 reuses voice/out)
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
if [ -z "$SKIP_VOICE" ]; then "$PY" "$HERE/voice/tts_hi.py" "$HERE/voice/lines.json" "$HERE/voice/out"; fi
HF_HUB_DISABLE_XET=1 "$PY" "$HERE/voice/asr_hi.py" "$HERE/voice/lines.json" "$HERE/voice/out" 0.8
mkdir -p "$HERE/out"
for R in 1 2 3; do
  node core/render/events.mjs "$HERE" --size 1080x1920 --q "reel=$R" --out "$HERE/out/events_$R.json"
  node core/render/readcheck.mjs "$HERE" --size 1080x1920 --q "reel=$R"
  "$PY" core/audio/sampler.py --need "$HERE/score.py"
  "$PY" "$HERE/score.py" $R
  node core/render/video.mjs "$HERE" --size 1080x1920 --q "reel=$R" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video_$R.mp4"
  "$PY" "$HERE/mix.py" $R
  sh core/render/mux.sh "$HERE/out/video_$R.mp4" "$HERE/out/mix_$R.wav" "$HERE/vailyf-whiteboard-$R.mp4" 24 0
done
"$PY" "$HERE/tools/subs.py" "$HERE"
echo "✓ $HERE/vailyf-whiteboard-1.mp4 · -2.mp4 · -3.mp4"
