// S3 STROKE 13-21: the three characters written stroke-by-stroke on rice paper
const CH3 = ['刘', '杨', '春'];
const CH_META = [
  ['liú', 'BLADE'], ['yáng', 'POPLAR'], ['chūn', 'SPRING']
];
// hanzi-writer coords: 1024 box, y up with baseline offset 900
function hzPath(d) { // SVG path string -> Path2D in flipped space
  return new Path2D(d);
}
const HZP = {};
for (const ch of CH3) HZP[ch] = HZ[ch].strokes.map(hzPath);

// draw a character at (x,y) center with box size s; t = global time
// opts.full forces fully-written; opts.col ink color
function drawHanzi(ch, x, y, s, t, opts = {}) {
  const d = HZ[ch], k = s / 1024, col = opts.col || C.ink;
  ctx.save();
  ctx.translate(x - s / 2, y - s / 2);
  ctx.scale(k, -k); ctx.translate(0, -900);
  d.medians.forEach((m, i) => {
    const [a, b] = d.sched[i];
    let p = opts.full ? 1 : clamp((t - a) / (b - a));
    if (p <= 0) return;
    p = E.inOutCubic(p) * 0.85 + p * 0.15;
    ctx.save();
    ctx.clip(HZP[ch][i]);
    if (p >= 1) { ctx.fillStyle = col; ctx.fill(HZP[ch][i]); ctx.restore(); return; }
    // walk median to progress length
    const L = d.sched[i][2] * p;
    ctx.strokeStyle = col; ctx.lineWidth = 200; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(m[0][0], m[0][1]);
    let acc = 0;
    for (let j = 1; j < m.length; j++) {
      const sl = Math.hypot(m[j][0] - m[j - 1][0], m[j][1] - m[j - 1][1]);
      if (acc + sl >= L) {
        const u = (L - acc) / sl;
        ctx.lineTo(lerp(m[j - 1][0], m[j][0], u), lerp(m[j - 1][1], m[j][1], u));
        break;
      }
      ctx.lineTo(m[j][0], m[j][1]); acc += sl;
    }
    ctx.stroke(); ctx.restore();
  });
  ctx.restore();
}
// current brush tip position (for the red cursor), in screen coords
function brushTip(ch, x, y, s, t) {
  const d = HZ[ch], k = s / 1024;
  for (let i = 0; i < d.medians.length; i++) {
    const [a, b] = d.sched[i];
    if (t >= a && t <= b) {
      const p = E.inOutCubic((t - a) / (b - a)) * .85 + (t - a) / (b - a) * .15, m = d.medians[i];
      const L = d.sched[i][2] * p; let acc = 0;
      for (let j = 1; j < m.length; j++) {
        const sl = Math.hypot(m[j][0] - m[j - 1][0], m[j][1] - m[j - 1][1]);
        if (acc + sl >= L || j === m.length - 1) {
          const u = clamp((L - acc) / sl);
          const px = lerp(m[j - 1][0], m[j][0], u), py = lerp(m[j - 1][1], m[j][1], u);
          return [x - s / 2 + px * k, y - s / 2 + (900 - py) * k, i];
        }
        acc += sl;
      }
    }
  }
  return null;
}
function strokeCount(t) {
  let n = 0;
  for (const ch of CH3) for (const s of HZ[ch].sched) if (t >= s[1]) n++;
  return n;
}
// seal stamp: 2x2 grid 刘杨/春印, read right column first
function seal(x, y, s, p, rot = -0.06) {
  if (p <= 0) return;
  const sc = lerp(1.6, 1, E.outExpo(p));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(p * 3);
  ctx.fillStyle = C.red;
  ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.06); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = s * 0.03; ctx.strokeStyle = '#000';
  ctx.strokeRect(-s / 2 + s * .07, -s / 2 + s * .07, s * .86, s * .86);
  const q = s * 0.36;
  [['刘', 1, 0], ['杨', 1, 1], ['春', 0, 0], ['印', 0, 1]].forEach(([c, cx, cy]) => {
    text(c, (cx - .5) * q * 1.12, (cy - .5) * q * 1.12 + q * .36, { w: 400, size: q, fam: 'Kai', col: '#000' });
  });
  // speckle wear
  const r = rng(5);
  for (let i = 0; i < 60; i++) circle((r() - .5) * s, (r() - .5) * s, r() * s * 0.012);
  ctx.restore();
}

const S3_POS = [-470, 0, 470];
scene(13, 21.05, (l, t) => {
  drawPaper();
  HUDCOL = C.ink;
  const cx = W / 2, cy = H / 2 - 20, S = 400;
  // camera: slow push, then 20.4-21 zoom into 刘
  const zoom = E.inExpo(seg(t, 20.45, 21.05));
  const push = 1 + 0.04 * seg(t, 13, 20.4);
  ctx.save();
  const zx = lerp(cx, cx + S3_POS[0] * 0.0, zoom);
  ctx.translate(cx, cy);
  ctx.scale(push * lerp(1, 2.2, zoom), push * lerp(1, 2.2, zoom));
  ctx.translate(-lerp(cx, cx + S3_POS[0], zoom) , -cy);
  // guide grids (米字格) faint red
  CH3.forEach((ch, i) => {
    const x = cx + S3_POS[i];
    const g = seg(t, 13.0 + i * 0.12, 13.6 + i * 0.12) * (1 - seg(t, 20.0, 20.5));
    if (g > 0) {
      ctx.strokeStyle = rgba(C.red, 0.35 * g); ctx.lineWidth = 1.5;
      const h = S / 2 * E.outCubic(g);
      ctx.strokeRect(x - h, cy - h, h * 2, h * 2);
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(x - h, cy); ctx.lineTo(x + h, cy); ctx.moveTo(x, cy - h); ctx.lineTo(x, cy + h);
      ctx.moveTo(x - h, cy - h); ctx.lineTo(x + h, cy + h); ctx.moveTo(x + h, cy - h); ctx.lineTo(x - h, cy + h);
      ctx.stroke(); ctx.setLineDash([]);
    }
    // ink shadow bleed
    ctx.save(); ctx.shadowColor = 'rgba(11,11,13,0.35)'; ctx.shadowBlur = 6;
    drawHanzi(ch, x, cy, S, t);
    ctx.restore();
    // labels under each char after it completes
    const done = HZ[ch].sched[HZ[ch].sched.length - 1][1];
    const la = seg(t, done, done + 0.4) * (1 - zoom);
    if (la > 0) {
      text(CH_META[i][0], x, cy + S / 2 + 70, { w: 400, size: 40, fam: 'NSerif', col: C.ink, alpha: la });
      hud(CH_META[i][1], x, cy + S / 2 + 108, { col: C.red, align: 'center', size: 16, track: 8, alpha: la });
    }
  });
  // red brush cursor
  for (let i = 0; i < 3; i++) {
    const tip = brushTip(CH3[i], cx + S3_POS[i], cy, S, t);
    if (tip) {
      ctx.fillStyle = C.red; circle(tip[0], tip[1], 7);
      ctx.strokeStyle = rgba(C.red, .5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(tip[0], tip[1], 20 + 6 * Math.sin(t * 20), 0, TAU); ctx.stroke();
    }
  }
  ctx.restore();
  // stroke counter
  const n = strokeCount(t);
  const ca = seg(t, 13, 13.4) * (1 - seg(t, 20.3, 20.6));
  hud(`STROKE ${String(n).padStart(2, '0')} / 22`, 120, H - 120, { col: C.ink, alpha: ca, size: 18 });
  ctx.fillStyle = rgba(C.ink, .15 * ca); ctx.fillRect(120, H - 100, 360, 3);
  ctx.fillStyle = rgba(C.red, ca); ctx.fillRect(120, H - 100, 360 * n / 22, 3);
  hud('书 · CALLIGRAPHY AS KEYFRAMES', W - 120, H - 120, { col: C.ink, alpha: ca * .7, align: 'right', size: 16 });
  // seal stamp 20.1
  seal(cx + 760, cy + 250, 110, seg(t, 20.1, 20.35) * (1 - zoom));
});
