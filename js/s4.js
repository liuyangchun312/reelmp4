// S4 BLADE 21-29.3: 刘 = blade. giant glyph sliced by a red diagonal, halves part,
// light-blade lines radiate, then converge into one vertical line -> the poplar trunk
const S4_ANG = -0.42; // slash angle (radians)
function s4Glyph(t, col) {
  // 刘 big, as left by the S3 zoom (center ~ cx-470*2.2 offscreen -> re-centered here)
  drawHanzi('刘', W / 2, H / 2 - 20, 880, t, { full: true, col });
}
scene(21, 29.35, (l, t) => {
  const cx = W / 2, cy = H / 2;
  HUDCOL = C.paper;
  // background: paper -> ink as slash happens
  const dark = E.inOutCubic(seg(t, 21.45, 21.7));
  bg(C.ink);
  if (dark < 1) drawPaper(1 - dark);
  // slash progress
  const sp = E.outExpo(seg(t, 21.3, 21.55));
  const part = E.outCubic(seg(t, 21.5, 22.6)) * 70 + E.inOutExpo(seg(t, 25.4, 26.0)) * 900;
  const nx = Math.cos(S4_ANG + Math.PI / 2), ny = Math.sin(S4_ANG + Math.PI / 2);
  const ga = 1 - seg(t, 25.6, 26.0);
  if (ga > 0) {
    ctx.save(); ctx.globalAlpha = ga;
    // entry: glyph scales from zoomed-in state
    const zin = E.outExpo(seg(t, 21.0, 21.35));
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(nx * part * side, ny * part * side);
      ctx.beginPath();
      // half-plane clip along slash line through center
      const dx = Math.cos(S4_ANG) * 3000, dy = Math.sin(S4_ANG) * 3000;
      ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy);
      ctx.lineTo(cx + dx + nx * side * 3000, cy + dy + ny * side * 3000);
      ctx.lineTo(cx - dx + nx * side * 3000, cy - dy + ny * side * 3000);
      ctx.closePath(); ctx.clip();
      ctx.translate(cx, cy); ctx.scale(lerp(1.35, 1, zin), lerp(1.35, 1, zin)); ctx.translate(-cx, -cy);
      s4Glyph(t, mixHex(C.ink, C.paper, dark));
      ctx.restore();
    }
    ctx.restore();
  }
  // the red slash line itself
  if (sp > 0 && t < 22.4) {
    const fade = 1 - seg(t, 21.8, 22.4);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(S4_ANG);
    ctx.fillStyle = rgba(C.red, fade);
    const L = 2400;
    ctx.fillRect(-L / 2, -3 - 6 * (1 - sp), L * sp, 6 + 12 * (1 - sp));
    ctx.restore();
  }
  FX.shake = 26 * Math.pow(1 - seg(t, 21.5, 21.9), 2) * (t > 21.5 ? 1 : 0);
  FX.flash = 0.6 * (1 - seg(t, 21.5, 21.75)) * (t > 21.5 ? 1 : 0); FX.flashCol = C.red;
  FX.chroma = 10 * (1 - seg(t, 21.5, 22.0)) * (t > 21.5 ? 1 : 0);
  // words riding the cut line, one per beat
  const CUTW = [['EVERY', 22.5], ['CUT', 23.0], ['IS A', 23.5], ['DECISION', 24.0]];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(S4_ANG);
  ctx.beginPath(); ctx.rect(-1400, -62, 2800, 124); ctx.clip();
  CUTW.forEach(([w, a], i) => {
    const pin = E.outExpo(seg(t, a, a + 0.3)), pout = E.inExpo(seg(t, 25.2, 25.5));
    if (pin <= 0 || pout >= 1) return;
    const x = (i - 1.5) * 330 + (1 - pin) * 200;
    const y = (1 - pin) * 120 - pout * 120;
    text(w, x, y + 34, { w: 700, size: 92, fam: 'Bahn', col: i === 3 ? C.red : C.paper, track: 2, alpha: ga });
  });
  ctx.restore();
  // chapter HUD + definition
  const ha = seg(t, 22.2, 22.6) * (1 - seg(t, 25.3, 25.6));
  if (ha > 0) {
    hud('CH.01', 120, 140, { alpha: ha, col: C.red });
    hud(scramble('刘 LIÚ — THE BLADE', seg(t, 22.2, 22.9), 11), 220, 140, { alpha: ha });
    text('《说文》：刘，杀也。', W - 120, 150, { w: 400, size: 34, fam: 'NSerif', col: C.paper, align: 'right', alpha: ha * .85 });
    hud('A BLADE THAT DECIDES WHAT STAYS', W - 120, 186, { alpha: ha * .6, align: 'right', size: 15 });
  }
  // edit timeline: playhead sweeps, red cut marks drop on every beat
  if (ha > 0) {
    const x0 = cx - 600, y0 = H - 170, tw = 1200;
    ctx.globalAlpha = ha;
    ctx.fillStyle = rgba(C.paper, .12); ctx.fillRect(x0, y0, tw, 44);
    const ph = seg(t, 22.4, 25.4);
    const r = rng(31); let x = x0;
    while (x < x0 + tw) { // clips
      const cw = 60 + r() * 140, vis = clamp((ph * tw - (x - x0)) / 80);
      ctx.fillStyle = rgba(r() < .2 ? C.red : C.mist, .55 * vis);
      ctx.fillRect(x + 2, y0 + 6, Math.min(cw, x0 + tw - x) - 4, 32); x += cw;
    }
    for (let k = 0; k < 6; k++) { // cut marks
      const bt = 22.5 + k * 0.5, mx = x0 + seg(bt, 22.4, 25.4) * tw, p = E.outBack(seg(t, bt, bt + 0.2));
      if (p <= 0) continue;
      ctx.fillStyle = C.red; ctx.fillRect(mx - 1.5, y0 - 14 * p, 3, 44 + 28 * p);
    }
    ctx.fillStyle = C.paper; ctx.fillRect(x0 + ph * tw - 1, y0 - 22, 2, 88);
    ctx.globalAlpha = 1;
    hud(timecode(t - 22.4 > 0 ? t - 22.4 : 0), x0, y0 - 34, { alpha: ha * .7, size: 15 });
    hud('CUT ' + String(clamp(Math.floor((t - 22.5) / .5) + 1, 0, 6)).padStart(2, '0'), x0 + tw, y0 - 34, { alpha: ha * .7, size: 15, align: 'right', col: C.red });
  }
  // light blades: thin lines shooting from center on beats 25.5-27.5
  const conv = E.inOutExpo(seg(t, 27.4, 28.0)); // all lines rotate to vertical
  for (let i = 0; i < 24; i++) {
    const born = 25.5 + Math.floor(i / 6) * 0.5 + (i % 6) * 0.03;
    const p = E.outExpo(seg(t, born, born + 0.4));
    if (p <= 0) continue;
    const a0 = hash(i * 3.1) * TAU, a = lerp(a0 + (t - born) * 0.4 * (hash(i) - .5), -Math.PI / 2, conv);
    const len = lerp((0.3 + hash(i * 7) * 0.7) * 1100 * p, H, conv);
    const off = lerp(60 + hash(i * 5) * 200, 0, conv);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = rgba(i % 5 === 0 ? C.red : C.paper, lerp(0.85, 1 / 6, conv) * (1 - seg(t, 28.0, 28.1)));
    ctx.fillRect(off - len * .5 * conv, -1, len, 2);
    ctx.restore();
  }
  if (t > 25.5 && t < 27.5) hud(scramble('ONE LINE. MANY DIRECTIONS.', seg(t, 25.6, 26.4), 21), cx, H - 120, { align: 'center', size: 18, track: 8, alpha: .8 * (1 - seg(t, 27.1, 27.4)) });
  // the single vertical line; paper opens from it like a door; line retracts to root
  if (t >= 28.0) {
    const open = E.inOutExpo(seg(t, 28.3, 28.85));
    if (open > 0) {
      const hw = open * W / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(cx - hw, -50, hw * 2, H + 100); ctx.clip(); drawPaper(); ctx.restore();
    }
    const ret = E.inOutCubic(seg(t, 28.7, 29.3));
    const top = lerp(0, ROOT_Y, ret), col = open > .5 ? C.ink : C.paper;
    ctx.fillStyle = col;
    ctx.fillRect(cx - 1.5 - 1.5 * ret, top, 3 + 3 * ret, Math.max(0, ROOT_Y - top));
    // ground line spreads
    const gl = E.outExpo(seg(t, 28.9, 29.35));
    ctx.fillStyle = rgba(C.ink, .7); ctx.fillRect(cx - gl * 260, ROOT_Y, gl * 520, 2);
    FX.flash = 0.25 * (1 - seg(t, 28.0, 28.25)); FX.flashCol = C.paper;
  }
});
const ROOT_Y = H - 92, TREE_K = 0.96, TREE_SX = 0.78; // SX narrows the crown toward a columnar poplar
