// 逐帧验证新版的动效（确定性版）
// 做法：转场一开始就把页面上所有动画暂停，再按毫秒拨动动画的 currentTime，拨一下截一帧。
// 每一帧的时间是准确的，不受截图快慢影响。步进器在 lib.cjs 的 installStepper 里。
// 用法: node tools/motion-web.cjs
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:8377/web/index.html';
const out = path.resolve(__dirname, 'out/web-motion');

const T350 = [0, 40, 90, 140, 200, 260, 310, 350, 480, 700];
const T440 = [0, 50, 100, 150, 200, 250, 300, 360, 440, 620];
const T500 = [0, 60, 120, 190, 260, 330, 400, 500, 640, 820];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const s = await L.open(URL, { width: 1280, height: 900, mobile: false, scale: 2 });
  const { page } = s;
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const st = await L.installStepper(page);

  const clip = await L.rect(page.locator('.screen'));
  const C = (sel) => L.center(page.locator(sel).first());
  const clickAt = (c) => page.mouse.click(c.x, c.y);
  const put = (name, fr, opts = {}) => L.sheet(fr, out + '/' + name + '.png', { cols: 5, cellW: 250, clipped: true, max: fr.length, ...opts });
  // 走 View Transition 的转场：转场内按毫秒步进；转场结束后再把入场的头 600ms 也步进一遍（标注从 +1000 起）
  const POST = [0, 90, 180, 280, 400, 560];
  async function vt(name, trigger, steps) {
    const n = await st.vt(trigger);
    const fr = await st.snap(steps, { clip });
    await page.evaluate(() => window.__release());
    await st.afterVt();
    fr.push(...(await st.snap(POST, { clip, t0: 1000 })));
    await st.release();
    await put(name, fr);
    console.log(name, '暂停的动画数:', n);
  }
  // 只靠 CSS 过渡的动效：action 之后立刻在页面里冻结
  async function css(name, trigger, steps, area) {
    await page.evaluate(() => { window.__anims = []; window.__frozen = false; });
    await trigger();
    await page.evaluate(() => window.__freeze());
    const fr = await st.snap(steps, { clip: area || clip });
    await st.release();
    await put(name, fr);
  }

  await L.shot(page, out + '/stage-desktop.png');

  await vt('01-push-open', async () => clickAt(await C('.flash')), T350);
  await page.waitForTimeout(400);
  await vt('02-pop-back', async () => clickAt(await C('[data-back]')), T350);
  await page.waitForTimeout(400);

  await vt('03-tab', async () => clickAt(await C('[data-tab="archives"]')), [0, 40, 80, 120, 180, 240, 320, 460]);
  await page.waitForTimeout(400);
  await vt('04-hero-open', async () => clickAt(await C('.astick')), T440);
  await page.waitForTimeout(500);
  await vt('05-hero-close', async () => clickAt(await C('[data-back]')), T440);
  await page.waitForTimeout(400);

  await clickAt(await C('[data-tab="home"]'));
  await page.waitForTimeout(800);
  await vt('06-mood', async () => clickAt(await C('[data-tab="review"]')), T500);
  await page.waitForTimeout(400);
  await vt('06b-mood-back', async () => clickAt(await C('[data-tab="home"]')), T500);
  await page.waitForTimeout(400);

  await vt('07-card-open', async () => clickAt(await C('.card.note[data-id]')), T440);
  await page.waitForTimeout(600);
  await L.shot(page, out + '/07b-card.png');
  const sc = await C('.screen');
  await vt('08-card-close', async () => page.mouse.click(sc.x - 150, sc.y - 330), T440);
  await page.waitForTimeout(400);

  // 贴一张：sheet 靠 CSS 过渡弹出
  await css('10-sheet-open', async () => clickAt(await C('[data-compose]')), T500);
  await page.waitForTimeout(300);
  // 拖住把手往下拉一点再松手：弹回去
  const g = await C('.grip');
  await page.mouse.move(g.x, g.y);
  await page.mouse.down();
  await page.mouse.move(g.x, g.y + 60, { steps: 8 });
  await page.waitForTimeout(200);
  await L.shot(page, out + '/11a-sheet-drag.png');
  await css('11-sheet-snapback', async () => page.mouse.up(), [0, 40, 90, 140, 200, 260, 330, 420, 520, 640]);
  // 弹回去之后 sheet 还开着，遮罩盖着标签栏——先收起，再重开
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  // 快速往下一甩：直接收起
  await clickAt(await C('[data-compose]'));
  await page.waitForTimeout(900);
  const g2 = await C('.grip');
  await page.mouse.move(g2.x, g2.y);
  await page.mouse.down();
  await page.mouse.move(g2.x, g2.y + 18, { steps: 2 });
  await css('12-sheet-dismiss', async () => { await page.mouse.move(g2.x, g2.y + 300, { steps: 3 }); await page.mouse.up(); }, [0, 50, 100, 150, 210, 270, 330, 400, 500, 620]);
  await page.waitForTimeout(300);

  // 按压手感：静止 → 悬停抬起 → 按住贴平 → 松手回弹。只截这张便签附近（2 倍像素）
  const note = page.locator('.card.note[data-id]').nth(1);
  await note.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const nb = await note.boundingBox();
  const near = { x: Math.floor(nb.x - 14), y: Math.floor(nb.y - 26), width: Math.ceil(nb.width + 28), height: Math.ceil(nb.height + 52) };
  const nc = { x: nb.x + nb.width / 2, y: nb.y + nb.height / 2 };
  await page.mouse.move(nc.x - 220, nc.y - 220);
  await page.waitForTimeout(200);
  const rest = (await page.screenshot({ type: 'jpeg', quality: 88, clip: near })).toString('base64');
  const fresh = () => page.evaluate(() => { window.__anims = []; window.__frozen = false; });
  const freeze = () => page.evaluate(() => window.__freeze());
  await fresh();
  await page.mouse.move(nc.x, nc.y, { steps: 2 });
  await freeze();
  const hov = await st.snap([40, 120, 240], { clip: near });                 // 标 +0 ~ +240
  await fresh();
  await page.mouse.down();
  await freeze();
  const dn = await st.snap([40, 120], { clip: near, t0: 400 });               // 标 +440 +520
  // 松手前把指针挪到空白处，免得触发点击打开记忆卡
  await fresh();
  await page.mouse.move(nc.x - 220, nc.y + 200);
  await page.mouse.up();
  await freeze();
  const up = await st.snap([60, 140, 220, 350, 500], { clip: near, t0: 1000 }); // 标 +1060 起
  await st.release();
  await put('09-press', [{ t: 0, data: rest }, ...hov, ...dn, ...up], { cols: 6, cellW: 300 });
  if (!(await page.evaluate(() => document.getElementById('mcard').hidden))) { await page.evaluate(() => PM.motion.closeMemory()); await page.waitForTimeout(700); }

  console.log('errors:', JSON.stringify(s.errors));
  await s.browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
