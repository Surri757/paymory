// 手机全屏形态（≤560px）的整页截图：去掉了展台和手机外壳，检查安全区、标签栏和各页面
// 用法: node tools/shots-mobile.cjs
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:8377/web/index.html';
const out = path.resolve(__dirname, 'out/web-mobile');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const s = await L.open(URL, { width: 390, height: 844, mobile: true, scale: 2 });
  const { page } = s;
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const C = (sel) => L.center(page.locator(sel).first());
  const clickAt = (c) => page.mouse.click(c.x, c.y);
  const shot = async (name) => { await page.waitForTimeout(1100); await L.shot(page, out + '/' + name + '.png'); };
  const files = [];
  const keep = (name) => files.push(out + '/' + name + '.png');

  await shot('01-home'); keep('01-home');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 520; });
  await shot('02-home-scroll'); keep('02-home-scroll');
  await clickAt(await C('[data-tab="archives"]')); await shot('03-archives'); keep('03-archives');
  await clickAt(await C('.astick')); await shot('04-detail'); keep('04-detail');
  await clickAt(await C('[data-tab="home"]')); await page.waitForTimeout(600);
  await clickAt(await C('[data-tab="review"]')); await shot('05-review'); keep('05-review');
  await clickAt(await C('[data-tab="home"]')); await page.waitForTimeout(600);
  await clickAt(await C('[data-compose]')); await shot('06-sheet'); keep('06-sheet');
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);

  await L.grid(files, out + '/grid.jpg', { cols: 6, cellW: 250 });
  console.log('errors:', JSON.stringify(s.errors));
  await s.browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
