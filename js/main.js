// main: dispatcher, global HUD frame, live preview + deterministic render hook
const CHAPTERS = [[0, 'ORIGIN'], [6, 'NAME'], [13, 'STROKE'], [21, 'BLADE'], [29.3, 'POPLAR'], [37.5, 'SPRING'], [45, 'PRACTICE'], [53, 'SIGNATURE']];
function globalHud(t) {
  const a = (seg(t, 0.3, 0.8)) * (1 - seg(t, 58.2, 58.8));
  if (a <= 0) return;
  const col = HUDCOL;
  let ch = 0; CHAPTERS.forEach((c, i) => { if (t >= c[0]) ch = i; });
  hud(timecode(t), W - 120, H - 60, { col, alpha: a * .55, size: 14, align: 'right' });
  hud(`${String(ch).padStart(2, '0')} ${CHAPTERS[ch][1]}`, 120, H - 60, { col, alpha: a * .55, size: 14 });
  hud('刘杨春 · MOTION REEL 2026', W / 2, 64, { col, alpha: a * .4, size: 13, align: 'center', track: 6 });
  // corner crop marks
  ctx.fillStyle = rgba(col === C.paper ? C.paper : C.ink, .35 * a);
  for (const [x, y, sx, sy] of [[60, 40, 1, 1], [W - 60, 40, -1, 1], [60, H - 40, 1, -1], [W - 60, H - 40, -1, -1]]) {
    ctx.fillRect(x, y, 22 * sx, 1.5 * sy); ctx.fillRect(x, y, 1.5 * sx, 22 * sy);
  }
  // progress hairline
  ctx.fillStyle = rgba(C.red, .8 * a); ctx.fillRect(0, H - 2, W * t / DUR, 2);
}
function renderFrame(frame) {
  const t = frame / FPS;
  Object.assign(FX, { shake: 0, flash: 0, chroma: 0, vig: 1, grain: 0.07 });
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let s = null; for (const sc of SCENES) if (t >= sc.a && t < sc.b) s = sc; // later scene wins overlap
  if (s) s.draw(t - s.a, t); else bg('#000');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  globalHud(t);
  if (t < 0.4) { ctx.fillStyle = rgba('#000000', 1 - t / 0.4); ctx.fillRect(0, 0, W, H); }
  if (t > 59.75) { ctx.fillStyle = rgba('#000000', seg(t, 59.75, 60)); ctx.fillRect(0, 0, W, H); }
  post(t, frame);
}
window.READY = document.fonts.load('900 100px SHS').then(() => Promise.all(
  ['400 40px NSerif', '400 40px Kai', '400 20px Mono', '700 40px Bahn', '400 40px Bahn'].map(f => document.fonts.load(f, '刘杨春ABC'))
)).then(() => { s6Init(); return true; });
window.renderFrame = renderFrame;
// live preview unless ?render; ?t=SECONDS to start there
const Q = new URLSearchParams(location.search);
if (!Q.has('render')) READY.then(() => {
  const t0 = performance.now(), off = +(Q.get('t') || 0);
  (function loop() {
    const f = Math.floor(((performance.now() - t0) / 1000 + off) * FPS) % (DUR * FPS);
    renderFrame(f); requestAnimationFrame(loop);
  })();
});
