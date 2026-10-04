// S1 ORIGIN 0-6s: dot -> horizon -> kinetic words -> shapes -> red flood
let HUDCOL = C.paper;
scene(0, 6.05, (l, t) => {
  bg(C.ink);
  HUDCOL = C.paper;
  const cx = W / 2, cy = H / 2 + 60;
  // horizon line
  const lp = E.inOutExpo(seg(t, 1.0, 2.0));
  const lineFade = 1 - seg(t, 4.0, 4.4);
  if (lp > 0 && lineFade > 0) {
    ctx.fillStyle = rgba(C.paper, 0.85 * lineFade);
    const hw = lp * W * 0.5;
    ctx.fillRect(cx - hw, cy - 1, hw * 2, 2);
    // tick marks spawn along line
    for (let i = -12; i <= 12; i++) {
      const x = cx + i * 72; if (Math.abs(x - cx) > hw) continue;
      const k = seg(t, 1.6 + Math.abs(i) * 0.02, 1.9 + Math.abs(i) * 0.02);
      ctx.fillRect(x - .5, cy + 8, 1, 10 * E.outCubic(k) * (i % 4 === 0 ? 2 : 1));
    }
  }
  // kinetic words rising from horizon (clipped above line)
  const WORDS = [['EVERY', 2.0], ['NAME', 2.5], ['IS A', 3.0], ['SHAPE', 3.5]];
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, cy - 6); ctx.clip();
  WORDS.forEach(([w, a], i) => {
    const b = a + 0.5;
    if (t < a || t > b + 0.12 + (i === 3 ? 0.35 : 0)) return;
    const pin = E.outExpo(seg(t, a, a + 0.22));
    const pout = E.inExpo(seg(t, b - 0.08 + (i === 3 ? .35 : 0), b + 0.12 + (i === 3 ? .35 : 0)));
    const y = cy - 30 + (1 - pin) * 300 - pout * 320;
    ctx.save(); ctx.translate(cx, y); ctx.scale(1 + (1 - pin) * .2, 1);
    text(w, 0, 0, { w: 700, size: 300, fam: 'Bahn', col: i === 3 ? C.red : C.paper, track: -6 });
    ctx.restore();
  });
  ctx.restore();
  // small caption under line
  if (t > 2 && t < 4.2) {
    const s = scramble('A STUDY IN MOTION — 刘杨春', seg(t, 2.0, 2.9), 3);
    hud(s, cx, cy + 62, { align: 'center', alpha: 0.7 * (1 - seg(t, 3.9, 4.2)), size: 18, track: 6 });
  }
  // the dot
  let dr = 14 * E.outBack(seg(t, 0.5, 0.85));
  dr *= 1 + 0.25 * bump(seg(t, 1.0, 1.25)) + 0.15 * bump(seg(t, 1.5, 1.7));
  // shapes 4.0-5.0
  const shapes = [
    { k: 'c', x: cx - 380, a: 4.0, col: C.paper },
    { k: 's', x: cx, a: 4.5, col: C.red },
    { k: 't', x: cx + 380, a: 5.0 - 0.25, col: C.paper },
  ];
  const coll = E.inOutExpo(seg(t, 5.1, 5.55));
  for (const s of shapes) {
    const p = E.outElastic(seg(t, s.a, s.a + 0.6));
    if (p <= 0) continue;
    const x = lerp(s.x, cx, coll), y = cy - 40 * (1 - coll);
    const r = 130 * p * (1 - coll * .9);
    ctx.save(); ctx.translate(x, y);
    ctx.rotate((t - s.a) * (s.k === 't' ? 1.2 : 0.6) + coll * 3);
    ctx.lineWidth = 4; ctx.strokeStyle = s.col; ctx.fillStyle = s.col;
    ctx.beginPath();
    if (s.k === 'c') ctx.arc(0, 0, r, 0, TAU);
    else if (s.k === 's') ctx.rect(-r * .85, -r * .85, r * 1.7, r * 1.7);
    else { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }
    s.k === 's' ? ctx.fill() : ctx.stroke();
    ctx.restore();
  }
  // shape labels
  if (t > 4 && t < 5.2) {
    ['CIRCLE / 01', 'SQUARE / 02', 'TRIANGLE / 03'].forEach((s, i) => {
      const a = shapes[i].a;
      hud(typeOn(s, seg(t, a, a + .3)), shapes[i].x, cy + 150, { align: 'center', size: 16, alpha: .7 * (1 - seg(t, 5.0, 5.2)) });
    });
  }
  // dot -> flood red
  const flood = E.inExpo(seg(t, 5.5, 6.0));
  if (t > 5.45) dr = lerp(14, Math.hypot(W, H) * .62, flood);
  ctx.fillStyle = C.red;
  circle(cx, t > 5.45 ? lerp(cy - 40, H / 2, flood) : cy, dr);
  if (t < 0.9) { // initial glow
    ctx.fillStyle = rgba(C.red, 0.25 * seg(t, 0.5, 0.9));
    circle(cx, cy, dr * 3);
  }
});
