// 实测"存成一张卡片"：从回望页底部的按钮点进去，截一张界面，再把海报原图存下来。总览和单个档案各一张
// 用法: node tools/poster-test.cjs
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:8377/web/index.html';
const out = path.resolve(__dirname, 'out/web');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const s = await L.open(URL, { width: 1280, height: 900, mobile: false, scale: 1 });
  const { page } = s;
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const C = (sel) => L.center(page.locator(sel).first());

  const c = await C('[data-tab="review"]');
  await page.mouse.click(c.x, c.y);
  await page.waitForTimeout(1400);

  async function grab(who) {
    if (who !== 'all') {
      const w = await C('[data-who="' + who + '"]');
      await page.mouse.click(w.x, w.y);
      await page.waitForTimeout(1400);
    }
    await page.evaluate(() => { const a = document.getElementById('app'); a.scrollTop = a.scrollHeight; });
    await page.waitForTimeout(1200);
    const b = await C('[data-poster]');
    await page.mouse.click(b.x, b.y);
    await page.waitForFunction(() => !document.getElementById('pveil').hidden && document.getElementById('posterImg').naturalWidth > 0, null, { timeout: 8000 });
    await page.waitForTimeout(900);
    if (who === 'all') await L.shot(page, out + '/16-poster-veil.png');
    const data = await page.evaluate(async () => {
      const bl = await (await fetch(document.getElementById('posterImg').src)).blob();
      return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(bl); });
    });
    fs.writeFileSync(out + '/poster-' + who + '.png', Buffer.from(data.split(',')[1], 'base64'));
    await page.click('#posterX');
    await page.waitForTimeout(700);
  }
  await grab('all');
  await grab('laowang');

  const ok = await page.evaluate(() => ({
    pveilHidden: document.getElementById('pveil').hidden, tab: PM.state.tab, who: PM.state.who, detail: PM.state.detail,
    scroll: document.getElementById('app').scrollTop,
  }));
  console.log('after close:', JSON.stringify(ok));
  console.log('errors:', JSON.stringify(s.errors));
  await s.browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
