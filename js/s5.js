// S5 POPLAR 29.3-37.5: generative ink tree grows, blossoms pop on 16ths, wind
function wind(x, y, t) { // horizontal sway, stronger higher up (y negative = up)
  const h = clamp(-y / 840);
  return (Math.sin(t * 1.3 + y * 0.004) * 6 + Math.sin(t * 2.9 + x * 0.01) * 2.5) * h * h;
}
// tree-space -> screen
function tpt(x, y, t, k) { return [W / 2 + (x * TREE_SX + wind(x, y, t)) * k, ROOT_Y + y * k]; }
function drawTree(t, k, alpha = 1) {
  ctx.lineCap = 'round';
  for (const b of TREE.branches) {
    if (t < b.t0) continue;
    const p = E.outCubic(seg(t, b.t0, b.t1));
    // sample quad bezier up to p, tapering
    const N = 8; let prev = tpt(b.x, b.y, t, k);
    for (let i = 1; i <= N; i++) {
      const u = p * i / N, iu = 1 - u;
      const x = iu * iu * b.x + 2 * iu * u * b.cx + u * u * b.ex;
      const y = iu * iu * b.y + 2 * iu * u * b.cy + u * u * b.ey;
      const q = tpt(x, y, t, k);
      ctx.strokeStyle = rgba(C.ink, alpha * (0.88 + 0.12 * hash(b.depth * 9 + i)));
      ctx.lineWidth = Math.max(0.8, lerp(b.w0, b.w1, u) * k);
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      prev = q;
    }
  }
}
function flower(x, y, r, rot, hue, alpha) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= alpha;
  ctx.fillStyle = mixHex(C.blush, C.pink, hue);
  for (let i = 0; i < 5; i++) {
    ctx.rotate(TAU / 5);
    ctx.beginPath(); ctx.ellipse(r * .55, 0, r * .55, r * .38, 0, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = hue > .75 ? C.red : mixHex(C.pink, C.red, .6); circle(0, 0, r * .22);
  ctx.restore();
}
// petal state after detaching: shared with S6 (petals become particles)
function petalPos(bl, t, k) {
  const td = 36.4 + bl.drift * 1.6; // detach time
  const [bx, by] = tpt(bl.x, bl.y, Math.min(t, td), k);
  if (t <= td) return [bx, by, 0];
  const u = t - td;
  return [bx + u * u * 90 * (0.6 + bl.drift) + Math.sin(u * 3 + bl.rot) * 30 * u,
    by + u * 60 - u * u * 18 * bl.hue + Math.cos(u * 2.3 + bl.rot) * 14, u];
}
function drawBlossoms(t, k, alpha = 1) {
  for (const bl of TREE.blossoms) {
    const p = E.outBack(seg(t, bl.t, bl.t + 0.35));
    if (p <= 0) continue;
    const [x, y, u] = petalPos(bl, t, k);
    flower(x, y, bl.r * k * p * (1 - clamp(u / 4) * .4), bl.rot + u * 2, bl.hue, alpha);
  }
}
scene(29.3, 37.55, (l, t) => {
  drawPaper(); HUDCOL = C.ink;
  // ground line + shadow
  ctx.fillStyle = rgba(C.ink, .7); ctx.fillRect(W / 2 - 260, ROOT_Y, 520, 2);
  // camera: slight push after growth
  const push = 1 + 0.05 * E.inOutCubic(seg(t, 33.0, 37.5));
  ctx.save(); ctx.translate(W / 2, H * .55); ctx.scale(push, push); ctx.translate(-W / 2, -H * .55);
  ctx.save(); ctx.shadowColor = 'rgba(11,11,13,.25)'; ctx.shadowBlur = 4;
  drawTree(t, TREE_K); ctx.restore();
  drawBlossoms(t, TREE_K);
  ctx.restore();
  // left: chapter 02 poplar; right: chapter 03 spring (enters as blossoms open)
  const a1 = seg(t, 29.8, 30.3) * (1 - seg(t, 37.0, 37.4));
  const a2 = seg(t, 33.6, 34.1) * (1 - seg(t, 37.0, 37.4));
  if (a1 > 0) {
    hud('CH.02', 120, 140, { col: C.red, alpha: a1 });
    hud(scramble('杨 YÁNG — THE POPLAR', seg(t, 29.8, 30.6), 13), 220, 140, { col: C.ink, alpha: a1 });
    hud('GROWS STRAIGHT. GROWS TALL.', 120, 172, { col: C.ink, alpha: a1 * .6, size: 15 });
    vtext('名字里有一棵树', 300, 330, 56, seg(t, 30.4, 31.8), a1, C.ink);
  }
  if (a2 > 0) {
    hud('CH.03', W - 120, 140, { col: C.red, alpha: a2, align: 'right' });
    hud(scramble('春 CHŪN — THE SPRING', seg(t, 33.6, 34.4), 17), W - 220, 140, { col: C.ink, alpha: a2, align: 'right' });
    const n = TREE.blossoms.filter(b => t >= b.t).length;
    hud(`BLOSSOMS ${String(n).padStart(3, '0')} / ${TREE.blossoms.length}`, W - 120, 172, { col: C.ink, alpha: a2 * .6, size: 15, align: 'right' });
    vtext('和一个春天', W - 300, 330, 56, seg(t, 34.4, 35.6), a2, C.red);
  }
  // growth meter along the ground
  const gm = seg(t, 29.3, 33.7), ga = seg(t, 29.4, 29.7) * (1 - seg(t, 36.8, 37.2));
  hud(`GROWTH ${Math.round(gm * 100).toString().padStart(3, '0')}%  ·  ${TREE.branches.filter(b => t >= b.t0).length} BRANCHES`, W / 2, ROOT_Y + 50, { col: C.ink, align: 'center', size: 14, alpha: ga * .6 });
  // gust at 36.4: paper darkens toward pink haze for S6
  const haze = seg(t, 36.6, 37.55);
  if (haze > 0) { ctx.fillStyle = rgba(C.deep, E.inCubic(haze)); ctx.fillRect(0, 0, W, H); }
});
// vertical CJK text, revealed char by char
function vtext(str, x, y, size, p, alpha, col) {
  const chars = [...str];
  chars.forEach((c, i) => {
    const k = E.outCubic(clamp(p * chars.length - i));
    if (k <= 0) return;
    text(c, x, y + i * size * 1.25 + (1 - k) * 20, { w: 400, size, fam: 'Kai', col, alpha: alpha * k });
  });
}
