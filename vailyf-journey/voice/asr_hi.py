"""Speech check: transcribe every <id>.wav with faster-whisper (Hindi) and compare with the spoken text.
usage: python voice/asr_hi.py voice/lines.json voice/out [threshold]   -> exit 0 if every line passes; writes words.json"""
import difflib, json, os, re, sys, unicodedata
from faster_whisper import WhisperModel
lines, d = json.load(open(sys.argv[1], encoding="utf-8")), sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 0.85
# Whisper's Hindi spelling is loose: compare by sound, not spelling. Digits count as their words; nukta,
# aspiration, vowel length, nasal marks and punctuation are ignored.
NUM = {"6,000": "छहहज़ार", "6000": "छहहज़ार", "8": "आठ", "7": "सात", "4": "चार", "3": "तीन"}
FOLD = str.maketrans({"ख": "क", "घ": "ग", "छ": "च", "झ": "ज", "ठ": "ट", "ढ": "ड", "थ": "त", "ध": "द", "फ": "प", "भ": "ब",
                      "ी": "ि", "ू": "ु", "ई": "इ", "ऊ": "उ", "ं": "", "ँ": "", "्": "", "ॉ": "ो", "ै": "े", "ौ": "ो", "़": "", "व": "ब"})
def norm(s):
    s = unicodedata.normalize("NFC", s)
    for k, v in NUM.items(): s = s.replace(k, v)
    return re.sub(r"[\s\W_]+", "", unicodedata.normalize("NFC", s).translate(FOLD))
m = WhisperModel(os.environ.get("WHISPER_MODEL", "medium"), device="cpu", compute_type="int8")
ok, words = True, {}
for L in lines:
    segs, _ = m.transcribe(os.path.join(d, L["id"] + ".wav"), language="hi", word_timestamps=True, beam_size=5)
    segs = list(segs); heard = "".join(s.text for s in segs)
    words[L["id"]] = [[w.word, round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    want = L.get("asr", L.get("say", L["text"]))
    r = difflib.SequenceMatcher(None, norm(want), norm(heard)).ratio()
    print(f"{'✓' if r >= thr else '✗'} {L['id']} {r:.2f}  heard: {heard.strip()}")
    ok &= r >= thr
json.dump(words, open(os.path.join(d, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sys.exit(0 if ok else 1)
