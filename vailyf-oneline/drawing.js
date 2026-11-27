// THE drawing: one line, designed backwards from the final picture — a mountain range with a deep valley
// (the fall) and a higher second peak under a gold sun. Paper units, y down.
//   climb    the first ascent to peak 1
//   fall     over the cliff edge, straight down into the valley; the pen stops there (hold → blot, silence)
//   weak     the first stroke after the stop: small trembling steps up the far side
//   strong   momentum returns: a confident zig-zag ridge to peak 2, higher than peak 1
//   sun      up from the peak, once round the sun (gold, the only accent), and back down the same ray
//   descend  down the far slope and off the edge of the paper: the line keeps going
const pts = (arr) => {   // Catmull-Rom through points → SVG cubic path
  let d = `M ${arr[0][0]},${arr[0][1]}`;
  for (let i = 0; i < arr.length - 1; i++) {
    const p0 = arr[Math.max(0, i - 1)], p1 = arr[i], p2 = arr[i + 1], p3 = arr[Math.min(arr.length - 1, i + 2)];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
};
export const PEAK1 = [-250, -120], VALLEY = [-146, 430], PEAK2 = [280, -330], SUN = [280, -520], SUN_R = 62;
const CLIMB = pts([[-640, 330], [-560, 300], [-470, 210], [-430, 150], [-400, 170], [-340, 40], [-300, -40], [-270, -90], PEAK1, [-210, -128], [-172, -114]]);
const FALL = pts([[-172, -114], [-158, -100], [-151, -60], [-149, 80], [-148, 260], VALLEY]);
const WEAK = pts([VALLEY, [-122, 425], [-110, 404], [-92, 400], [-80, 376], [-60, 372], [-50, 346], [-28, 340], [-16, 310], [8, 304], [20, 272], [46, 262]]);
const STRONG = pts([[46, 262], [92, 176], [80, 150], [150, 30], [136, 2], [212, -150], [200, -176], [262, -300], PEAK2]);
const SUN_D = (() => {   // ray up from the peak, once round the sun clockwise from its bottom, back down the ray
  const [x, y] = SUN, r = SUN_R, k = r * .5523, b = y + r;
  return `M ${PEAK2[0]},${PEAK2[1]} L ${x},${b} C ${x + k},${b} ${x + r},${y + k} ${x + r},${y} C ${x + r},${y - k} ${x + k},${y - r} ${x},${y - r}
    C ${x - k},${y - r} ${x - r},${y - k} ${x - r},${y} C ${x - r},${y + k} ${x - k},${b} ${x},${b} L ${PEAK2[0]},${PEAK2[1]}`;
})();
const DESCEND = pts([PEAK2, [320, -250], [345, -190], [400, -90], [390, -60], [470, 90], [520, 200], [600, 300], [720, 335], [900, 340], [1120, 340]]);

// t: [start, end] seconds; holds: pen stops (f = fraction along the segment)
export const SEGS = [
  { id: 'climb', style: 'climb', t: [0.0, 4.3], parts: [{ d: CLIMB }], slowK: 1.6 },
  { id: 'fall', style: 'fall', t: [4.3, 8.6], parts: [{ d: FALL }], marks: [{ f: .985, t: 5.7 }], holds: [{ f: .992, t: 5.75, dur: 2.75 }], slowK: .4 },
  { id: 'weak', style: 'weak', t: [8.6, 13.0], parts: [{ d: WEAK }], slowK: 3.2 },
  { id: 'strong', style: 'strong', t: [13.0, 17.1], parts: [{ d: STRONG }], slowK: 1.4 },
  { id: 'sun', style: 'sun', t: [17.1, 19.2], parts: [{ d: SUN_D }], slowK: 1.0 },
  { id: 'descend', style: 'descend', t: [19.2, 25.5], parts: [{ d: DESCEND }], slowK: 1.2 },
];

// Pace: the whole reel runs SPEED× faster than the timings written above (picture, stop and camera scale together).
export const SPEED = 1.35;
for (const sg of SEGS) {
  sg.t = sg.t.map(x => x / SPEED);
  (sg.marks || []).forEach(m => { m.t /= SPEED; });
  (sg.holds || []).forEach(h => { h.t /= SPEED; h.dur /= SPEED; });
}
