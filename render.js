// node render.js [workers=4] -> reel.mp4  (parallel deterministic frame render -> ffmpeg)
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FPS = 30, TOTAL = 60 * FPS, WORKERS = +(process.argv[2] || 4);
const URL = 'file:///' + path.resolve('index.html').replace(/\\/g, '/') + '?render';

(async () => {
  fs.mkdirSync('frames', { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--allow-file-access-from-files', '--disable-gpu-vsync', '--disable-background-timer-throttling'],
  });
  let next = 0, done = 0; const t0 = Date.now(), errs = [];
  async function worker() {
    const p = await browser.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.evaluate(() => window.READY);
    while (true) {
      const f = next++; if (f >= TOTAL) break;
      const out = `frames/f_${String(f).padStart(4, '0')}.jpg`;
      if (!fs.existsSync(out)) {
        const url = await p.evaluate(f => { renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f);
        fs.writeFileSync(out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
      }
      if (++done % 60 === 0) {
        const s = (Date.now() - t0) / 1000;
        console.log(`${done}/${TOTAL}  ${s.toFixed(0)}s  eta ${(s / done * (TOTAL - done)).toFixed(0)}s`);
      }
    }
    await p.close();
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  await browser.close();
  if (errs.length) console.log('PAGE ERRORS:', [...new Set(errs)].join('\n'));
  console.log('frames done, encoding...');
  const args = ['-y', '-framerate', String(FPS), '-i', 'frames/f_%04d.jpg'];
  if (fs.existsSync('audio.wav')) args.push('-i', 'audio.wav');
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (fs.existsSync('audio.wav')) args.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  args.push('reel.mp4');
  const ff = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let log = ''; ff.stderr.on('data', d => log += d);
  ff.on('close', c => { console.log(c === 0 ? 'wrote reel.mp4' : 'ffmpeg failed\n' + log.slice(-2000)); });
})();
