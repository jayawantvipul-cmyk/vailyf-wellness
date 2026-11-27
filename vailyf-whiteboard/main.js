const mod = await import('./film.js');
const F = await mod.build();
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = [...F.ev, ...F.subs.map(s => ({ ...s, t: s.t0, type: "sub" }))]; window.SUBS = F.subs;
window.render = t => F.render(ctx, t);
window.TEXTS = t => { F.render(ctx, t); return F.texts(t); };
window.READY = true;
