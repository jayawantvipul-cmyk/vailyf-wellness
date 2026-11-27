"""Hindi narration with edge-tts (Microsoft neural voice), through HTTPS_PROXY when set.
usage: python voice/tts_hi.py voice/lines.json voice/out   -> <id>.wav (24 kHz mono, trimmed) + dur.json"""
import asyncio, json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
import edge_tts
VOICE = os.environ.get("VOICE", "hi-IN-SwaraNeural"); RATE = os.environ.get("RATE", "-6%")
lines, out = json.load(open(sys.argv[1], encoding="utf-8")), sys.argv[2]
os.makedirs(out, exist_ok=True)
proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
async def one(L):
    with tempfile.TemporaryDirectory() as d:
        mp3 = os.path.join(d, "a.mp3")
        await edge_tts.Communicate(L.get("say", L["text"]), L.get("voice", VOICE), rate=L.get("rate", RATE), proxy=proxy).save(mp3)
        wav = os.path.join(d, "a.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ac", "1", "-ar", "24000", wav], check=True)
        a, sr = sf.read(wav, dtype="float32")
    thr = np.abs(a).max() * 0.01; idx = np.where(np.abs(a) > thr)[0]
    a = a[max(0, idx[0] - int(.01 * sr)): min(len(a), idx[-1] + int(.1 * sr))]
    sf.write(os.path.join(out, L["id"] + ".wav"), a, sr)
    return L["id"], round(len(a) / sr, 3)
async def main():
    dur = {}
    for L in lines:
        k, v = await one(L); dur[k] = v; print(k, v)
    json.dump(dur, open(os.path.join(out, "dur.json"), "w"), indent=1)
asyncio.run(main())
