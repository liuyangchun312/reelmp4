// S7 PRACTICE 45-53: eight one-second cards on the dot grid, each a motion principle
const CARDS = ['RHYTHM', 'GEOMETRY', 'TYPOGRAPHY', 'SOUND', 'SPACE', 'TIMING', 'COLOR', 'STORY'];
const CARD_BG = [C.ink, C.ink, C.red, C.ink, C.deep, C.paper, C.ink, C.red];
function dotGrid(t, col, f) { // f(x,y,i) -> [dx,dy,scale]
  ctx.fillStyle = col;
  for (let i = 0; i < GX * GY; i++) {
    const [x, y] = gridPt(i); const [dx, dy, s] = f ? f(x, y, i) : [0, 0, 1];
    ctx.fillRect(x + dx - 1.25 * s, y + dy - 1.25 * s, 2.5 * s, 2.5 * s);
  }
}
const CARD_FX = [
  (p, t, fg) => { // RHYTHM: ripple through grid on each beat
    dotGrid(t, fg, (x, y) => { const d = Math.hypot(x - W / 2, y - H / 2), w = Math.sin(d * .02 - p * 18); return [0, -w * 14, 1 + Math.max(0, w) * 2.2]; });
  },
  (p, t, fg) => { // GEOMETRY: concentric rings + rotating square
    dotGrid(t, rgba(fg, .35));
    ctx.strokeStyle = fg; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const r = ((p * 2 + i / 6) % 1) * 600; ctx.globalAlpha = 1 - r / 600; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(E.inOutExpo(p) * Math.PI / 2);
    ctx.fillStyle = C.red; const s = 160 * E.outBack(clamp(p * 3)); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
  },
  (p, t, fg) => { // TYPOGRAPHY: stretched bars of type sliding
    for (let i = 0; i < 7; i++) {
      const dir = i % 2 ? 1 : -1, x = W / 2 + dir * (E.inOutCubic(p) - .5) * 900;
      ctx.save(); ctx.translate(x, 120 + i * 122); ctx.scale(1 + i * .25, 1);
      text('MOTION', 0, 45, { w: 700, size: 130, fam: 'Bahn', col: i === 3 ? C.paper : C.ink, alpha: i === 3 ? 1 : .9 });
      ctx.restore();
    }
  },
  (p, t, fg) => { // SOUND: oscilloscope
    dotGrid(t, rgba(fg, .25));
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = k ? rgba(C.red, .5) : fg; ctx.lineWidth = k ? 2 : 3; ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const env = Math.sin(Math.PI * x / W), y = H / 2 + env * 220 * Math.sin(x * .02 + p * 30 + k) * Math.sin(x * .003 + p * 6) * bump(clamp(p * 1.4));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  },
  (p, t, fg) => { // SPACE: wireframe cube + perspective grid floor
    const a = p * 2.2 + .6, b = .5 + p * .8, pts = [];
    for (let i = 0; i < 8; i++) {
      let x = i & 1 ? 1 : -1, y = i & 2 ? 1 : -1, z = i & 4 ? 1 : -1;
      [x, z] = [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
      [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
      const f = 900 / (z + 4.2); pts.push([W / 2 + x * f * .9, H / 2 + y * f * .9]);
    }
    ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 8; i++) for (const m of [1, 2, 4]) if (!(i & m)) { ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i | m]); }
    ctx.stroke(); ctx.fillStyle = C.red; pts.forEach(q => circle(q[0], q[1], 5));
    ctx.strokeStyle = rgba(fg, .25); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -10; i <= 10; i++) { ctx.moveTo(W / 2 + i * 40, H * .62); ctx.lineTo(W / 2 + i * 260, H + 20); }
    for (let j = 0; j < 8; j++) { const y = H * .62 + Math.pow((j + (p * 4) % 1) / 8, 2) * H * .4; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  },
  (p, t, fg) => { // TIMING: easing curve plotted, ball rides it, linear ghost for contrast
    const x0 = W / 2 - 380, y0 = H / 2 + 260, s = 520;
    ctx.strokeStyle = rgba(C.ink, .2); ctx.lineWidth = 1; ctx.strokeRect(x0, y0 - s, s * 1.46, s);
    const q = clamp(p * 1.25);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 60 * q; i++) { const u = i / 60; ctx.lineTo(x0 + u * s * 1.46, y0 - E.inOutExpo(u) * s); }
    ctx.stroke();
    ctx.fillStyle = C.red; circle(x0 + q * s * 1.46, y0 - E.inOutExpo(q) * s, 12);
    ctx.fillStyle = rgba(C.ink, .3); circle(x0 + s * 1.46 + 90, y0 - q * s, 10);
    ctx.fillStyle = C.red; circle(x0 + s * 1.46 + 150, y0 - E.inOutExpo(q) * s, 14);
    hud('ease-in-out-expo', x0, y0 + 40, { col: C.ink, size: 16 });
    hud('linear', x0 + s * 1.46 + 90, y0 + 40, { col: C.grey, size: 14, align: 'center' });
  },
  (p, t, fg) => { // COLOR: the film's palette slides in as chips with hex codes
    const pal = [['INK', C.ink], ['PAPER', C.paper], ['VERMILION', C.red], ['BLOSSOM', C.pink], ['MIST', C.mist]];
    pal.forEach(([n, c], i) => {
      const k = E.outExpo(seg(p, i * .08, i * .08 + .45)), w = W / 5;
      const y = lerp(H, 0, k);
      ctx.fillStyle = c; ctx.fillRect(i * w, y, w + 1, H);
      const tc = i === 1 || i === 3 || i === 4 ? C.ink : C.paper;
      hud(n, i * w + 40, y + H - 120, { col: tc, size: 18 });
      hud(c.toUpperCase(), i * w + 40, y + H - 88, { col: tc, size: 14, alpha: .7 });
    });
  },
  (p, t, fg) => { // STORY: frame counter races, dot returns at center
    dotGrid(t, rgba(C.ink, .3), (x, y) => { const d = Math.hypot(x - W / 2, y - H / 2); const k = E.inExpo(clamp(p * 1.3)); return [(W / 2 - x) * k, (H / 2 - y) * k, 1]; });
    const n = Math.floor(E.inOutCubic(clamp(p * 1.15)) * 60);
    text(String(n).padStart(2, '0'), W / 2, H / 2 + 120, { w: 700, size: 340, fam: 'Bahn', col: C.ink, alpha: 1 - seg(p, .8, .95) });
    hud('SECONDS · ONE NAME · ONE STORY', W / 2, H / 2 + 200, { col: C.ink, size: 16, align: 'center', alpha: .75 * (1 - seg(p, .8, .95)) });
  },
];
scene(45, 53.05, (l, t) => {
  const i = clamp(Math.floor(t - 45), 0, 7), p = clamp(t - 45 - i);
  const bgc = CARD_BG[i], fg = bgc === C.paper ? C.ink : C.paper;
  HUDCOL = bgc === C.paper ? C.ink : C.paper;
  if (bgc === C.paper) drawPaper(); else bg(bgc);
  // incoming card wipes in from right during first 0.12s
  const wp = E.outExpo(seg(p, 0, 0.14));
  ctx.save();
  if (wp < 1) { ctx.translate((1 - wp) * 260, 0); }
  CARD_FX[i](p, t, fg);
  ctx.restore();
  if (wp < 1 && i > 0) { // previous card's color as a closing panel
    ctx.fillStyle = CARD_BG[i - 1] === C.paper ? C.paper : CARD_BG[i - 1];
    ctx.fillRect(0, 0, (1 - wp) * W * .4, H);
  }
  // label block
  const lc = i === 2 || i === 7 ? C.ink : HUDCOL;
  if (i !== 6) {
    hud(`0${i + 1} / 08`, 120, H - 150, { col: C.red === bgc ? C.paper : C.red, size: 16 });
    hud(scramble(CARDS[i], clamp(p * 3), i * 7), 120, H - 110, { col: lc, size: 34, track: 10 });
  }
  FX.shake = 8 * Math.pow(1 - clamp(p * 6), 2);
});
