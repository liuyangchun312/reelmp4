// core: constants, easing, rng, helpers
const W = 1920, H = 1080, FPS = 30, DUR = 60, TAU = Math.PI * 2;
const C = {
  ink: '#0b0b0d', paper: '#efe8dc', red: '#e03a24', pink: '#f4abb9',
  blush: '#f8d6d6', grey: '#8a857c', mist: '#c9c1b4', deep: '#16161a'
};
const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const bump = (x) => Math.sin(Math.PI * clamp(x));
const E = {
  lin: x => x,
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outQuart: x => 1 - Math.pow(1 - x, 4),
  inOutQuart: x => x < .5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2,
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
  inOutExpo: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outElastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * TAU / 3) + 1,
};
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function setFont(w, size, fam) { ctx.font = `${w} ${size}px ${fam}`; }
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
function mixHex(h1, h2, k) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = Math.round(lerp(a >> 16 & 255, b >> 16 & 255, k));
  const g = Math.round(lerp(a >> 8 & 255, b >> 8 & 255, k));
  const bl = Math.round(lerp(a & 255, b & 255, k));
  return `rgb(${r},${g},${bl})`;
}
function bg(col) { ctx.fillStyle = col; ctx.fillRect(-50, -50, W + 100, H + 100); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.fill(); }
// text with tracking; align: 'left'|'center'|'right'
function text(str, x, y, { w = 400, size = 40, fam = 'Bahn', col = C.paper, align = 'center', track = 0, base = 'alphabetic', alpha = 1 } = {}) {
  setFont(w, size, fam);
  ctx.letterSpacing = track + 'px';
  ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillStyle = col; const ga = ctx.globalAlpha; ctx.globalAlpha = ga * alpha;
  // letterSpacing adds trailing space; compensate for centered text
  ctx.fillText(str, align === 'center' ? x + track / 2 : x, y);
  ctx.globalAlpha = ga; ctx.letterSpacing = '0px';
}
const SCENES = [];
function scene(a, b, draw) { SCENES.push({ a, b, draw }); }
