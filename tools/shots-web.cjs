// 给新版站点批量截图：手机视口（390×844）逐页截，再拼成总览图
// 用法: node tools/shots-web.cjs [base]
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:8377/web/index.html';
const out = path.resolve(__dirname, 'out/web');

async function ready(page) {
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
async function tap(page, sel) {
  const c = await L.center(page.locator(sel).first());
  await page.mouse.click(c.x, c.y);
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const s = await L.open(URL, { width: 390, height: 844, mobile: true, scale: 2 });
  const { page } = s;
  const shots = [];
  const snap = async (name) => { await L.shot(page, out + '/' + name + '.png'); shots.push(out + '/' + name + '.png'); };

  await ready(page);
  await snap('01-home');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 560; });
  await page.waitForTimeout(1100);
  await snap('02-home-scroll');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 1500; });
  await page.waitForTimeout(1100);
  await snap('03-home-scroll2');

  // 便签展开
  await page.evaluate(() => { document.getElementById('app').scrollTop = 0; });
  await page.waitForTimeout(300);
  await tap(page, '.card.note[data-id]');
  await page.waitForTimeout(1300);
  await snap('04-memory-card');
  await page.mouse.click(20, 120);                 // 轻点旁边收起
  await page.waitForTimeout(900);

  // 档案夹 → 详情
  await tap(page, '[data-tab="archives"]');
  await page.waitForTimeout(900);
  await snap('05-archives');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 500; });
  await page.waitForTimeout(900);
  await snap('06-archives-scroll');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 0; });
  await page.waitForTimeout(300);
  await tap(page, '.astick');
  await page.waitForTimeout(1700);
  await snap('07-detail');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 430; });
  await page.waitForTimeout(1500);
  await snap('08-detail-scroll');
  await page.evaluate(() => { document.getElementById('app').scrollTop = 900; });
  await page.waitForTimeout(900);
  await snap('09-detail-scroll2');
  await tap(page, '[data-back]');
  await page.waitForTimeout(900);

  // 贴一张
  await tap(page, '[data-compose]');
  await page.waitForTimeout(900);
  await snap('10-sheet');
  await page.evaluate(() => PM.motion.closeSheet());
  await page.waitForTimeout(600);

  // 回望：总览
  await tap(page, '[data-tab="review"]');
  await page.waitForTimeout(1900);
  await snap('11-review-cover');
  for (let i = 1; i <= 6; i++) {
    await page.evaluate(() => { const a = document.getElementById('app'); const el = document.querySelectorAll('.rv-s')[0]; a.scrollTop += el ? Math.round(el.offsetHeight * .98) : 700; });
    await page.waitForTimeout(1500);
    await snap('12-review-' + i);
  }
  // 回望：单个档案
  await page.evaluate(() => { document.getElementById('app').scrollTop = 0; });
  await page.waitForTimeout(400);
  await tap(page, '[data-who="laowang"]');
  await page.waitForTimeout(1700);
  await snap('13-who-laowang');
  for (let i = 1; i <= 4; i++) {
    await page.evaluate(() => { const a = document.getElementById('app'); const el = document.querySelectorAll('.rv-s')[0]; a.scrollTop += el ? Math.round(el.offsetHeight * .98) : 700; });
    await page.waitForTimeout(1500);
    await snap('14-who-' + i);
  }

  // 扉页
  await tap(page, '[data-tab="me"]');
  await page.waitForTimeout(900);
  await snap('15-me');

  console.log('errors:', JSON.stringify(s.errors));
  await s.browser.close();

  for (let i = 0; i < shots.length; i += 8) {
    await L.grid(shots.slice(i, i + 8), out + '/grid-' + (i / 8 + 1) + '.jpg');
  }
  console.log('shots:', shots.length);
})();
