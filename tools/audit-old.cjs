// 审计现有原型（prototype/index.html）的动效：桌面视口 + 手机外壳，逐交互抓帧拼图
// 用法: node tools/audit-old.cjs
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve(__dirname, 'out/old');
  fs.mkdirSync(out, { recursive: true });
  const s = await L.open('http://127.0.0.1:8377/prototype/index.html', { width: 640, height: 960, mobile: false, scale: 1 });
  const { page } = s;
  const clip = await L.rect(page.locator('.phone'));
  const optsSC = { cols: 6, cellW: 210, max: 12, viewport: page.viewportSize(), crop: [clip.x, clip.y, clip.width, clip.height] };
  const optsVT = { cols: 6, cellW: 210, max: 12, clipped: true, gamma: 1.8 };
  const rec = await L.recorder(page);

  // 1 首次加载：便签入场
  rec.start();
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1600);
  await L.sheet(rec.stop(), out + '/01-load.png', optsSC);

  // 2 悬停 + 按压：移入 → 停 → 按住 450ms → 拖到空白处再松手（这样不会触发点击跳转）
  const n1 = page.locator('.note').first();
  const c1 = await L.center(n1);
  const away = await L.center(page.locator('.h-hand'));
  rec.start();
  await page.mouse.move(c1.x - 60, c1.y - 60);
  await page.mouse.move(c1.x, c1.y);
  await page.waitForTimeout(500);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.move(away.x, away.y, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  await L.sheet(rec.stop(), out + '/02-press.png', optsSC);

  // 3 便签 → 档案详情（View Transition，用连拍）
  let fr = await L.burst(page, () => page.mouse.click(c1.x, c1.y), 900, clip);
  await L.sheet(fr, out + '/03-open-detail.png', optsVT);
  await L.shot(page, out + '/03b-detail.png');

  // 4 返回首页
  const t0 = await L.center(page.locator('.tab').nth(0));
  fr = await L.burst(page, () => page.mouse.click(t0.x, t0.y), 900, clip);
  await L.sheet(fr, out + '/04-back.png', optsVT);

  // 5 切到回望（深色页）
  const t2 = await L.center(page.locator('.tab').nth(2));
  fr = await L.burst(page, () => page.mouse.click(t2.x, t2.y), 1400, clip);
  await L.sheet(fr, out + '/05-tab-review.png', { ...optsVT, gamma: 1.3 });
  await L.shot(page, out + '/05b-review.png');

  console.log('errors:', JSON.stringify(s.errors));
  await s.browser.close();
})();
