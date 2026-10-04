// fx: precomputed textures + post-processing
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// film grain tiles
const GRAIN = [];
(function () {
  const r = rng(7);
  for (let k = 0; k < 4; k++) {
    const c = mkCanvas(512, 512), g = c.getContext('2d');
    const im = g.createImageData(512, 512);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (r() * 255) | 0;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0); GRAIN.push(c);
  }
})();

// rice paper texture
const PAPER = (function () {
  const c = mkCanvas(W, H), g = c.getContext('2d'), r = rng(42);
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { // soft blotches
    const x = r() * W, y = r() * H, rad = 80 + r() * 380;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const a = 0.025 + r() * 0.035, dark = r() < .55;
    gr.addColorStop(0, dark ? `rgba(120,100,70,${a})` : `rgba(255,252,245,${a * 1.6})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) { // fibers
    const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 40;
    g.strokeStyle = `rgba(${r() < .5 ? '110,90,60' : '255,255,250'},${0.05 + r() * 0.08})`;
    g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 1) * l * .5, y + Math.sin(a + 1) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c;
})();

function drawPaper(alpha = 1) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha; ctx.drawImage(PAPER, 0, 0); ctx.restore();
}

// vignette overlay
const VIG = (function () {
  const c = mkCanvas(W, H), g = c.getContext('2d');
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); return c;
})();

// final composite onto the visible canvas
const out = document.getElementById('c');
const octx = out.getContext('2d');
const FX = { shake: 0, flash: 0, flashCol: '#fff', chroma: 0, vig: 1, grain: 0.07 };
function post(t, frame) {
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.globalCompositeOperation = 'source-over'; octx.globalAlpha = 1;
  octx.fillStyle = '#000'; octx.fillRect(0, 0, W, H);
  const sx = FX.shake ? (hash(frame * 1.3) - .5) * FX.shake : 0;
  const sy = FX.shake ? (hash(frame * 2.7 + 9) - .5) * FX.shake : 0;
  if (FX.chroma > 0.5) { // cheap chromatic split: tint copies offset
    octx.drawImage(cv, sx, sy);
    octx.globalCompositeOperation = 'screen'; octx.globalAlpha = 0.5;
    octx.drawImage(cv, sx - FX.chroma, sy);
    octx.drawImage(cv, sx + FX.chroma, sy);
    octx.globalAlpha = 1; octx.globalCompositeOperation = 'source-over';
  } else octx.drawImage(cv, sx, sy);
  if (FX.vig > 0) { octx.globalAlpha = FX.vig; octx.drawImage(VIG, 0, 0); octx.globalAlpha = 1; }
  if (FX.flash > 0) { octx.globalAlpha = clamp(FX.flash); octx.fillStyle = FX.flashCol; octx.fillRect(0, 0, W, H); octx.globalAlpha = 1; }
  // grain
  const tile = GRAIN[frame % 4], ox = -((hash(frame) * 512) | 0), oy = -((hash(frame + 77) * 512) | 0);
  octx.globalCompositeOperation = 'overlay'; octx.globalAlpha = FX.grain;
  for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) octx.drawImage(tile, x, y);
  octx.globalCompositeOperation = 'source-over'; octx.globalAlpha = 1;
}

// HUD-style mono label used across chapters
function hud(str, x, y, { col = C.paper, alpha = 1, size = 20, align = 'left', track = 3 } = {}) {
  text(str, x, y, { w: 400, size, fam: 'Mono', col, align, track, alpha });
}
// typewriter reveal of a string
function typeOn(str, p) { const n = Math.floor(str.length * clamp(p)); return str.slice(0, n); }
// scramble reveal: random glyphs settling into the string
const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+*';
function scramble(str, p, seed = 1) {
  let o = '';
  for (let i = 0; i < str.length; i++) {
    const k = clamp(p * 1.6 - i / str.length * 0.6);
    if (k >= 1 || str[i] === ' ') o += str[i];
    else if (k <= 0) o += '';
    else o += SCR[Math.floor(hash(i * 13 + seed + Math.floor(p * 30)) * SCR.length)];
  }
  return o;
}
function timecode(t) {
  const f = Math.floor(t * FPS) % FPS, s = Math.floor(t) % 60, m = Math.floor(t / 60);
  const p = n => String(n).padStart(2, '0');
  return `00:${p(m)}:${p(s)}:${p(f)}`;
}
