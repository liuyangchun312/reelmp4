// S6 SPRING 37.5-45: petals -> swirling swarm -> 春 glyph -> burst -> dot grid
const NP = 1800, GX = 24, GY = 14;
let S6P = null;
function gridPt(i) { const gx = i % GX, gy = Math.floor(i / GX) % GY; return [(gx + .5) * W / GX, (gy + .5) * H / GY]; }
function s6Init() { // lazy: needs fonts loaded
  const c = mkCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.font = '900 860px SHS'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('春', W / 2, H / 2 + 30);
  const d = g.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 7) for (let x = 0; x < W; x += 7) if (d[(y * W + x) * 4] > 128) pts.push([x, y]);
  const r = rng(77);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  S6P = [];
  for (let i = 0; i < NP; i++) {
    let sx, sy, col, sz;
    if (i < TREE.blossoms.length) { // real petals carry over from the tree
      const bl = TREE.blossoms[i]; [sx, sy] = petalPos(bl, 37.55, TREE_K);
      col = mixHex(C.blush, C.pink, bl.hue); sz = bl.r * .5;
    } else { // wind-borne petals entering from the left
      sx = -100 - r() * 900; sy = r() * H; col = mixHex(C.blush, C.pink, r()); sz = 3 + r() * 5;
    }
    S6P.push({ sx, sy, tx: pts[i % pts.length][0], ty: pts[i % pts.length][1], col, sz,
      ph: r() * TAU, w: 0.6 + r() * 1.2, rr: 200 + r() * 420, ba: r() * TAU, bs: 400 + r() * 1400, g: i % (GX * GY) });
  }
}
scene(37.5, 45.05, (l, t) => {
  if (!S6P) s6Init();
  HUDCOL = C.paper;
  const bgk = seg(t, 41.95, 42.05);
  bg(bgk > 0 && t < 42.6 ? C.red : C.deep);
  if (t > 42.6) bg(mixHex(C.red, C.ink, E.outCubic(seg(t, 42.6, 43.4))));
  const cx = W / 2, cy = H / 2;
  const conv = E.inOutExpo(seg(t, 39.2, 40.6));      // swarm -> glyph
  const burst = E.outExpo(seg(t, 42.0, 43.2));       // glyph -> explode
  const grid = E.inOutCubic(seg(t, 43.4, 44.6));     // explode -> grid
  const u = t - 37.5;
  for (const p of S6P) {
    // swarm: drift right on wind + orbit around center
    const dr = E.inOutCubic(seg(t, 37.5, 39.0));
    const ang = p.ba + u * p.w * 0.9, rad = p.rr * (1 + 0.15 * Math.sin(u * 2 + p.ph));
    const ox = lerp(p.sx + u * 260, cx + Math.cos(ang) * rad * 1.5, dr);
    const oy = lerp(p.sy + Math.sin(u * 2 + p.ph) * 40, cy + Math.sin(ang) * rad * .8, dr);
    let x = lerp(ox, p.tx, conv), y = lerp(oy, p.ty, conv);
    // shimmer while held
    if (conv >= 1 && t < 42) { x += Math.sin(t * 6 + p.ph) * 1.5; y += Math.cos(t * 5 + p.ph) * 1.5; }
    if (burst > 0) { const a = Math.atan2(p.ty - cy, p.tx - cx) + (hash(p.ph) - .5) * .6; x += Math.cos(a) * p.bs * burst; y += Math.sin(a) * p.bs * burst; }
    let sz = lerp(p.sz, 3.2, conv);
    if (grid > 0) { const [gx, gy] = gridPt(p.g); x = lerp(x, gx, grid); y = lerp(y, gy, grid); sz = lerp(sz, 2.5, grid); }
    ctx.fillStyle = burst > 0 && burst < 1 && t < 42.6 ? C.ink : (grid > .5 ? C.paper : p.col);
    ctx.globalAlpha = grid > 0 ? lerp(1, .35, grid) : 1;
    ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
  // shockwave rings at burst
  for (let i = 0; i < 3; i++) {
    const p = E.outCubic(seg(t, 42.0 + i * 0.08, 42.9 + i * 0.08));
    if (p <= 0 || p >= 1) continue;
    ctx.strokeStyle = rgba(i === 1 ? C.paper : C.ink, 1 - p); ctx.lineWidth = 30 * (1 - p) + 1;
    ctx.beginPath(); ctx.arc(cx, cy, p * 1300, 0, TAU); ctx.stroke();
  }
  FX.shake = t > 42 ? 30 * Math.pow(1 - seg(t, 42, 42.5), 2) : 0;
  FX.chroma = t > 42 ? 14 * (1 - seg(t, 42, 42.6)) : 0;
  FX.flash = t > 42 ? .7 * (1 - seg(t, 42, 42.2)) : 0; FX.flashCol = C.paper;
  // glyph labels while held
  const la = seg(t, 40.4, 40.8) * (1 - seg(t, 41.8, 42));
  if (la > 0) {
    hud('1,800 PETALS → 1 CHARACTER', 120, H - 120, { alpha: la * .8, size: 16 });
    hud('春 · SPRING · TO BEGIN AGAIN', W - 120, H - 120, { alpha: la * .8, size: 16, align: 'right', col: C.pink });
  }
  const pa = seg(t, 44.2, 44.6);
  if (pa > 0) hud(scramble('CH.04 — PRACTICE', seg(t, 44.2, 44.9), 29), W / 2, H / 2 + 12, { align: 'center', size: 26, track: 12, alpha: pa });
});
