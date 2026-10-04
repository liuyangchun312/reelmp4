// S8 SIGNATURE 53-60: dot returns, name lockup, seal, fade to the dot, out
scene(53, 60.05, (l, t) => {
  bg(C.ink); HUDCOL = C.paper;
  const cx = W / 2, cy = H / 2 - 40;
  const out = E.inOutCubic(seg(t, 58.4, 59.2)); // everything but the dot fades
  // red flood collapses into the dot (mirror of S1)
  const col = E.inOutExpo(seg(t, 53.0, 53.5));
  const dotY = lerp(cy - 150, H / 2, E.inOutCubic(seg(t, 58.6, 59.3)));
  let dr = lerp(Math.hypot(W, H) * .62, 14, col);
  if (t > 59.4) dr = 14 * (1 - E.inCubic(seg(t, 59.4, 59.85)));
  ctx.globalAlpha = 1 - out;
  // name: mask-reveal rising per char on beats
  CH3.forEach((c, i) => {
    const a = 53.5 + i * 0.25, p = E.outExpo(seg(t, a, a + 0.6));
    if (p <= 0) return;
    const x = cx + (i - 1) * 300;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 160, cy - 120, 320, 340); ctx.clip();
    text(c, x, cy + 180 + (1 - p) * 320, { w: 900, size: 280, fam: 'SHS', col: C.paper });
    ctx.restore();
  });
  // underline draws out, Latin name tracks open
  const ul = E.inOutExpo(seg(t, 54.5, 55.2));
  ctx.fillStyle = C.red; ctx.fillRect(cx - 450 * ul, cy + 250, 900 * ul, 3);
  const lt = E.outExpo(seg(t, 54.8, 56.0));
  if (lt > 0) text('LIU YANGCHUN', cx, cy + 335, { w: 600, size: 64, fam: 'Bahn', col: C.paper, track: lerp(0, 34, lt), alpha: clamp(lt * 2) });
  const ta = seg(t, 55.5, 56.0);
  if (ta > 0) {
    hud(scramble('MOTION DESIGNER', seg(t, 55.5, 56.2), 41), cx, cy + 392, { align: 'center', size: 20, track: 12, alpha: ta * .85 });
    hud('PORTFOLIO · 2026', cx, cy + 428, { align: 'center', size: 15, track: 8, alpha: ta * .5, col: C.mist });
  }
  // tagline types on with the bell
  const tg = seg(t, 57.0, 57.6);
  if (tg > 0) text(typeOn('一个帅气的美男子', tg), cx, cy + 492, { w: 400, size: 36, fam: 'Kai', col: C.paper, track: 10, alpha: clamp(tg * 3) * .9 });
  // blade / poplar / spring recap row
  const ra = seg(t, 56.4, 56.9);
  if (ra > 0) ['刘 · BLADE', '杨 · POPLAR', '春 · SPRING'].forEach((s, i) => {
    hud(s, 120 + i * 230, H - 110, { size: 15, alpha: ra * .6 * seg(t, 56.4 + i * .12, 56.7 + i * .12) });
  });
  // seal slam
  seal(cx + 560, cy + 120, 120, seg(t, 56.5, 56.75), -0.08);
  if (t > 56.5) { FX.shake = 18 * Math.pow(1 - seg(t, 56.5, 56.9), 2); FX.flash = .3 * (1 - seg(t, 56.5, 56.7)); FX.flashCol = C.red; }
  ctx.globalAlpha = 1;
  // the dot (on top), sits above the name like a sun over the horizon
  ctx.fillStyle = C.red;
  circle(lerp(cx, cx, col), col < 1 ? lerp(H / 2, cy - 150, col) : dotY, dr);
  // final credit line under fade
  const fa = seg(t, 59.0, 59.3) * (1 - seg(t, 59.7, 60));
  if (fa > 0) hud('THANK YOU · 谢谢观看', W / 2, H / 2 + 80, { align: 'center', size: 16, track: 8, alpha: fa * .6 });
});
