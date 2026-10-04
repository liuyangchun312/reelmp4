// S2 NAME 6-13s: red field, kinetic Latin name, slices, ink-drop wipe to paper
scene(6, 13.05, (l, t) => {
  bg(C.red);
  const cx = W / 2, cy = H / 2;
  HUDCOL = C.ink;
  // background giant scrolling outline text
  ctx.save();
  ctx.globalAlpha = 0.18;
  setFont(700, 260, 'Bahn'); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  for (let row = -1; row < 4; row++) {
    const dir = row % 2 ? 1 : -1;
    const off = ((l * 220 * dir) % 2400 + 2400) % 2400;
    for (let k = -1; k < 2; k++) ctx.strokeText('LIU YANG CHUN · ', -off + k * 2400, row * 280 + 120);
  }
  ctx.restore();

  // three name parts slam in on beats 6.5, 7.0, 7.5
  const parts = [['LIU', 6.5], ['YANG', 7.0], ['CHUN', 7.5]];
  const stackOut = E.inOutExpo(seg(t, 9.5, 10.0)); // collapse to single line
  parts.forEach(([w, a], i) => {
    const p = E.outExpo(seg(t, a, a + 0.35));
    if (p <= 0) return;
    const ys = [-250, 0, 250][i];
    const y = cy + lerp(ys, 0, stackOut) + 100;
    const x = cx + (1 - p) * (i % 2 ? 1 : -1) * 1400 + lerp(0, (i - 1) * 520, stackOut);
    const size = lerp(300, 170, stackOut);
    ctx.save(); ctx.translate(x, y);
    // slice effect: draw word in 6 horizontal strips with offset jitter
    const jit = (1 - p) * 120 + bump(seg(t, 8.5, 8.8)) * 60 + bump(seg(t, 11.0, 11.25)) * 40;
    for (let s = 0; s < 6; s++) {
      const h = size / 6;
      ctx.save();
      ctx.beginPath(); ctx.rect(-1200, -size * .78 + s * h * 0.95, 2400, h * 0.95 + 1); ctx.clip();
      ctx.translate((hash(s * 7 + i * 3 + Math.floor(t * 15)) - .5) * jit, 0);
      text(w, 0, 0, { w: 700, size, fam: 'Bahn', col: C.ink, track: -4 });
      ctx.restore();
    }
    ctx.restore();
  });
  // pinyin tone guide + labels
  if (t > 8 && t < 9.7) {
    const a = seg(t, 8.0, 8.3) * (1 - seg(t, 9.4, 9.6));
    ['liú', 'yáng', 'chūn'].forEach((s, i) => {
      text(s, cx + 560, cy + 100 + (i - 1) * 250 - 90, { w: 400, size: 44, fam: 'NSerif', col: C.paper, align: 'left', alpha: a * seg(t, 8 + i * .15, 8.3 + i * .15) });
    });
    hud('NAME / 姓名', 120, 140, { col: C.ink, alpha: a });
    hud('3 SYLLABLES  ·  3 CHARACTERS  ·  22 STROKES', 120, 172, { col: C.ink, alpha: a * .7, size: 16 });
  }
  // bars that sweep across on 10.0 / 10.5
  for (let i = 0; i < 5; i++) {
    const p = E.inOutQuart(seg(t, 10.0 + i * 0.06, 10.6 + i * 0.06));
    if (p <= 0 || p >= 1) continue;
    const y = cy - 300 + i * 150;
    ctx.fillStyle = i % 2 ? C.ink : C.paper;
    const x0 = lerp(-W, W, p);
    ctx.fillRect(x0, y, W * .9, 18);
  }
  // definition card 10.5 - 12.0
  if (t > 10.5 && t < 12.2) {
    const a = seg(t, 10.5, 10.8) * (1 - seg(t, 11.9, 12.1));
    hud(scramble('MOTION DESIGNER', seg(t, 10.5, 11.1), 5), cx, cy - 120, { col: C.paper, align: 'center', size: 30, track: 14, alpha: a });
    hud('/ˈmoʊʃən dɪˈzaɪnər/  n.  one who makes things move with intent', cx, cy + 300, { col: C.ink, align: 'center', size: 18, alpha: a * .8, track: 2 });
  }
  // ink drop: falls 12.0, splashes 12.5 into expanding ink -> paper reveal by 13
  if (t > 11.9) {
    const fall = E.inCubic(seg(t, 11.9, 12.4));
    const dy = lerp(-80, cy, fall);
    ctx.fillStyle = C.ink;
    if (t < 12.4) {
      ctx.beginPath(); ctx.ellipse(cx, dy, 22, 22 + fall * 20, 0, 0, TAU); ctx.fill();
    } else {
      // organic ink bloom
      const p = E.outExpo(seg(t, 12.4, 13.0));
      const R = p * 1300;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = i / 120 * TAU;
        const n = 1 + 0.12 * Math.sin(a * 5 + 1) + 0.07 * Math.sin(a * 11 + 2) + 0.05 * Math.sin(a * 17);
        const x = cx + Math.cos(a) * R * n, y = cy + Math.sin(a) * R * n;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.fill();
      // splatter dots
      const r = rng(99);
      for (let i = 0; i < 40; i++) {
        const a = r() * TAU, d = (0.6 + r() * 0.9) * R + 30, s = (4 + r() * 18) * (1 - p * .3);
        circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s);
      }
      // paper revealed from center in the ink (hole) at 12.75+
      const hp = E.inOutCubic(seg(t, 12.7, 13.05));
      if (hp > 0) {
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, hp * 1200, 0, TAU); ctx.clip();
        drawPaper(); ctx.restore();
      }
    }
  }
});
