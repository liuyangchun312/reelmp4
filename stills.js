// node stills.js 1.0 6.5 ...  -> stills/t_<sec>.jpg (contact check of key frames)
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => {
  const times = process.argv.slice(2).map(Number);
  fs.mkdirSync('stills', { recursive: true });
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/') + '?render');
  await p.evaluate(() => window.READY);
  for (const t of times) {
    const url = await p.evaluate(f => { renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', .85); }, Math.round(t * 30));
    fs.writeFileSync(`stills/t_${t.toFixed(2)}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  await b.close(); console.log('ok', times.length);
})();
