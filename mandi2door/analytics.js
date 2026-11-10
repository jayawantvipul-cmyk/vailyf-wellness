/* Mandi2Door visitor tracking: link source, anonymous visitor counts and shopping steps.
   No name or phone is ever sent here. Events are batched and saved to the Events tab of your Sheet. */
(function () {
  const { C, LS } = M2D;
  const EVENTS = ["open", "cat", "search", "add", "remove", "cart", "checkout", "order", "order_fail", "sub", "lang", "upi", "wa"];
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);

  // Anonymous visitor id (kept on this phone) and session id (this visit only).
  let vid = LS.get("vid", null), isNew = false;
  if (!vid) { vid = rid(); LS.set("vid", vid); isNew = true; }
  let sid;
  try { sid = sessionStorage.getItem("m2d_sid"); if (!sid) { sid = rid(); sessionStorage.setItem("m2d_sid", sid); } } catch (e) { sid = rid(); }

  // Where this visit came from: ?src=lift-poster in the link, else the referring site, else "direct".
  let src = slug(new URLSearchParams(location.search).get("src"));
  try {
    if (src) sessionStorage.setItem("m2d_src", src);
    else src = sessionStorage.getItem("m2d_src") || "";
  } catch (e) {}
  if (!src) {
    let host = "";
    try { host = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
    src = host && host !== location.hostname ? slug("ref-" + host.replace(/^www\./, "").split(".")[0]) : "direct";
  }
  if (!LS.get("src1", "")) LS.set("src1", src); // first source that ever brought this visitor

  let queue = [];
  function track(ev, a = "", n = 0) {
    if (!EVENTS.includes(ev)) return;
    queue.push({ t: Date.now(), v: vid, s: sid, e: ev, src, lang: LS.get("lang", "en"), a: String(a).slice(0, 60), n: Number(n) || 0 });
    if (queue.length >= 20) flush();
  }
  function flush() {
    if (!queue.length) return;
    const batch = queue.splice(0, 50);
    if (M2D.demo) { LS.set("events", LS.get("events", []).concat(batch).slice(-5000)); return; }
    const body = JSON.stringify({ action: "track", events: batch });
    let sent = false;
    try { sent = navigator.sendBeacon && navigator.sendBeacon(C.SHEETS_URL, new Blob([body], { type: "text/plain;charset=utf-8" })); } catch (e) {}
    if (!sent) {
      try { fetch(C.SHEETS_URL, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body }); } catch (e) {}
    }
  }
  setInterval(flush, 15000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  addEventListener("pagehide", flush);

  // Microsoft Clarity (heatmaps and recordings). It hides typed text by default.
  if (C.CLARITY_ID && /^[a-z0-9]{6,20}$/i.test(C.CLARITY_ID)) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", C.CLARITY_ID);
    window.clarity("set", "src", src);
    window.clarity("set", "visitor", isNew ? "new" : "returning");
  }

  M2D.track = track;
  M2D.flushTracking = flush;
  M2D.trackInfo = { vid, sid, src, isNew };
})();
