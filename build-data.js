// Precompute deterministic data shared by visuals (js/data.js) and audio (data.json)
const fs = require('fs');

// ---------- calligraphy stroke schedule ----------
const CHARS = [
  { ch: '刘', a: 13.0, b: 15.2 },
  { ch: '杨', a: 15.2, b: 17.6 },
  { ch: '春', a: 17.6, b: 20.0 },
];
const hz = {};
const strokes = []; // audio events
for (const c of CHARS) {
  const d = JSON.parse(fs.readFileSync(`node_modules/hanzi-writer-data/${c.ch}.json`, 'utf8'));
  const lens = d.medians.map(m => {
    let L = 0; for (let i = 1; i < m.length; i++) L += Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]);
    return L;
  });
  const gap = 0.07;
  const wts = lens.map(L => Math.pow(L, 0.6));
  const avail = (c.b - c.a) - gap * d.medians.length;
  const sum = wts.reduce((x, y) => x + y, 0);
  let t = c.a; const sched = [];
  wts.forEach((w, i) => {
    const dur = avail * w / sum;
    sched.push([+t.toFixed(4), +(t + dur).toFixed(4), lens[i]]);
    strokes.push({ t, dur, len: lens[i] });
    t += dur + gap;
  });
  hz[c.ch] = { strokes: d.strokes, medians: d.medians, sched };
}

// ---------- generative poplar tree ----------
let seed = 20260404;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const branches = [];
function grow(x, y, ang, len, wid, depth, birth) {
  const bend = (rnd() - .5) * 0.35;
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
  const cx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * len * bend * .5;
  const cy = (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * len * bend * .5;
  const dur = 0.25 + len / 420;
  const b = { x, y, cx, cy, ex, ey, w0: wid, w1: wid * 0.68, depth, t0: birth, t1: birth + dur };
  branches.push(b);
  if (depth >= 7 || len < 14) { b.leaf = true; return; }
  // poplar: mostly upward, narrow spread
  const n = depth < 2 ? 2 : (rnd() < .35 ? 3 : 2);
  for (let i = 0; i < n; i++) {
    const side = n === 1 ? 0 : (i / (n - 1) - .5) * 2;
    const spread = (0.28 + rnd() * 0.32) * (depth === 0 ? .9 : 1);
    let na = ang + side * spread + (rnd() - .5) * 0.2;
    na = na * 0.82 + (-Math.PI / 2) * 0.18; // pull toward vertical
    const nl = len * (0.7 + rnd() * 0.14);
    grow(ex, ey, na, nl, wid * 0.66, depth + 1, b.t0 + dur * (0.8 + rnd() * .15));
  }
  // occasional side twig mid-branch
  if (depth >= 2 && depth < 6 && rnd() < .5) {
    const k = .4 + rnd() * .3;
    const mx = x + (ex - x) * k, my = y + (ey - y) * k;
    grow(mx, my, ang + (rnd() < .5 ? -1 : 1) * (0.6 + rnd() * .4), len * .45, wid * .45, depth + 2, b.t0 + dur * k);
  }
}
grow(0, 0, -Math.PI / 2, 230, 34, 0, 0);
// normalize growth into [22.4, 27.2]
const tMax = Math.max(...branches.map(b => b.t1));
for (const b of branches) { b.t0 = 29.3 + b.t0 / tMax * 4.4; b.t1 = 29.3 + b.t1 / tMax * 4.4; }
// blossoms at leaves + some ends
const blossoms = [];
for (const b of branches) {
  if (b.leaf || (b.depth >= 4 && rnd() < .45)) {
    const k = b.leaf ? 1 : .55 + rnd() * .4;
    // point on quad bezier
    const u = k, iu = 1 - u;
    const px = iu * iu * b.x + 2 * iu * u * b.cx + u * u * b.ex;
    const py = iu * iu * b.y + 2 * iu * u * b.cy + u * u * b.ey;
    blossoms.push({ x: px, y: py, r: 7 + rnd() * 9, rot: rnd() * 6.283, hue: rnd(), dist: Math.hypot(px, py) + rnd() * 80 });
  }
}
// bloom order: from bottom/near to tips, quantized to 16ths (0.125s) in [25.6, 29.0]
const dMin = Math.min(...blossoms.map(b => b.dist)), dMax = Math.max(...blossoms.map(b => b.dist));
for (const bl of blossoms) {
  const raw = 33.5 + (bl.dist - dMin) / (dMax - dMin) * 3.0;
  bl.t = Math.round(raw / 0.125) * 0.125;
  bl.drift = rnd(); // petal detach param
}
const round = o => JSON.parse(JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v));
const TREE = round({ branches, blossoms });

fs.writeFileSync('js/data.js', 'const HZ=' + JSON.stringify(hz) + ';\nconst TREE=' + JSON.stringify(TREE) + ';\n');
fs.writeFileSync('data.json', JSON.stringify({ strokes, blossoms: TREE.blossoms.map(b => b.t) }));
console.log('strokes', strokes.length, 'branches', branches.length, 'blossoms', blossoms.length,
  'bloom slots', new Set(TREE.blossoms.map(b => b.t)).size);
