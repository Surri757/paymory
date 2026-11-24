// Paymory 动效审计工具（开发用，不参与站点运行）
// 用法: node tools/<scenario>.cjs
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Module = require('module');

// playwright 与 sharp 都装在全局 npm 目录里，手动加入模块搜索路径
(function ensureModulePaths() {
  const root = execSync('npm root -g').toString().trim();
  process.env.NODE_PATH = [path.join(root, '@playwright', 'cli', 'node_modules'), root].join(path.delimiter);
  Module._initPaths();
})();
const { chromium } = require('playwright');
const sharp = require('sharp');

/** 找 playwright-cli 已安装的 Chromium（全局 playwright 库自带的版本号对不上） */
function findChrome() {
  if (process.env.PM_CHROME) return process.env.PM_CHROME;
  const root = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!fs.existsSync(root)) return undefined;
  const dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe']) {
      const p = path.join(root, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

/** 打开页面并收集控制台错误 */
async function open(url, opts = {}) {
  const { width = 390, height = 844, mobile = true, scale = 2 } = opts;
  const browser = await chromium.launch({ executablePath: findChrome() });
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    hasTouch: mobile,
    isMobile: mobile,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  return { browser, ctx, page, errors };
}

/** 用 CDP screencast 抓合成器真实输出帧（带时间戳）。注意：View Transition 进行期间它不出帧 */
async function recorder(page) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  let on = false;
  cdp.on('Page.screencastFrame', async (ev) => {
    if (on) frames.push({ t: ev.metadata.timestamp, data: ev.data });
    await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1 });
  return {
    start() { frames.length = 0; on = true; },
    stop() { on = false; return frames.slice(); },
  };
}

/** 连拍截图抓帧。过渡动画一律用它；每帧只截 clip 区域（视口坐标），速度够快 */
async function burst(page, action, ms = 900, clip = null) {
  const at = () => Date.now();
  const snap = async () => ({ at: at(), data: (await page.screenshot({ type: 'jpeg', quality: 82, clip: clip || undefined })).toString('base64') });
  const frames = [await snap()];
  await action();
  const t0 = frames[0].at;
  for (;;) {
    frames.push(await snap());
    if (frames[frames.length - 1].at - t0 >= ms) break;
  }
  return frames.map((f) => ({ t: (f.at - t0) / 1000, data: f.data }));
}

/** 从帧序列里抽 max 帧。gamma 大于 1 时向开头集中，适合过渡动画（前 400ms 最关键） */
function pick(frames, max, gamma = 1) {
  const n = Math.min(max, frames.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = n === 1 ? 0 : Math.pow(i / (n - 1), gamma);
    out.push(frames[Math.round(p * (frames.length - 1))]);
  }
  return out;
}

async function labelSvg(text) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="18">' +
    '<rect width="76" height="18" fill="#000" fill-opacity="0.78"/>' +
    '<text x="4" y="13" font-size="12" font-family="Consolas, Courier New, monospace" fill="#7CFC00">' + text + '</text></svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 把帧序列拼成一张带相对时间标注的对比图（contact sheet），用 sharp 合成，不经过浏览器。
 * clipped 为 true：帧本身就是 crop 区域的截图；false：帧是整视口截图，按 crop [x,y,w,h]（视口坐标）裁切。
 */
async function sheet(frames, out, opts = {}) {
  const { cols = 6, cellW = 210, crop = null, max = 12, clipped = false, gamma = 1, viewport = null } = opts;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!frames.length) { console.log('no frames for ' + out); return; }
  const chosen = pick(frames, max, gamma);
  const t0 = chosen[0].t;
  const gap = 4;
  const pad = 4;
  let comps = [];
  let cellH = 0;
  for (let i = 0; i < chosen.length; i++) {
    const src = Buffer.from(chosen[i].data, 'base64');
    let img = sharp(src);
    if (!clipped) {
      const meta = await img.metadata();
      const r = meta.width / viewport.width;
      const [cx, cy, cw, ch] = crop || [0, 0, viewport.width, viewport.height];
      img = img.extract({ left: Math.round(cx * r), top: Math.round(cy * r), width: Math.round(cw * r), height: Math.round(ch * r) });
    }
    const meta = await img.metadata();
    cellH = Math.round((cellW * meta.height) / meta.width);
    const x = pad + (i % cols) * (cellW + gap);
    const y = pad + Math.floor(i / cols) * (cellH + gap);
    comps.push({ input: await img.resize(cellW, cellH, { fit: 'fill' }).jpeg({ quality: 90 }).toBuffer(), left: x, top: y });
    try { comps.push({ input: await labelSvg('+' + Math.round((chosen[i].t - t0) * 1000) + 'ms'), left: x + 2, top: y + 2 }); } catch (e) { /* 无字体时省略标注 */ }
  }
  const rows = Math.ceil(chosen.length / cols);
  const W = pad * 2 + cols * cellW + (cols - 1) * gap;
  const H = pad * 2 + rows * cellH + (rows - 1) * gap;
  await sharp({ create: { width: W, height: H, channels: 3, background: '#111111' } }).composite(comps).png().toFile(out);
}

/**
 * 把"动画步进器"装进页面：接管 startViewTransition，等转场的伪元素动画建好后暂停页面上所有动画。
 * 之后用 step 拨到第几毫秒就截第几帧，帧上的时间是准确的。
 * 不走 View Transition 的过渡（sheet、按压）在动作之后马上调 freeze()。
 */
async function installStepper(page) {
  await page.evaluate(() => {
    if (window.__hooked) return;
    window.__hooked = true;
    // 冻结时记下每条动画的起点：正在走的从"此刻"起算（步进时在它上面加），早就停着的不动。
    // "早就停着"的是应用自己停在中途的入场（motion.js 的 M.stage），它在转场期间就该是那个样子
    const pause = () => {
      const list = [];
      for (const a of document.getAnimations()) {
        if (a.playState === 'finished' || a.playState === 'idle') continue;
        const held = a.playState === 'paused';
        if (!held) { try { a.pause(); } catch (e) { continue; } }
        list.push({ a, base: a.currentTime || 0, held });
      }
      window.__anims = list;
      window.__frozen = true;
    };
    const orig = Document.prototype.startViewTransition;
    // 只在"上膛"时冻结（__arm）。场景之间用来归位的切换不上膛，照常播完
    Document.prototype.startViewTransition = function (cb) {
      const t = orig.call(this, cb);
      if (window.__arm) {
        window.__arm = false;
        t.finished.finally(() => { window.__vtDone = true; });
        t.ready.then(() => requestAnimationFrame(pause)).catch((e) => { window.__vtError = String(e); });
      }
      return t;
    };
    // 先强制算一次样式，让刚触发的过渡立刻出现
    window.__freeze = () => { getComputedStyle(document.documentElement).opacity; pause(); };
    window.__step = (t) => { for (const x of window.__anims || []) { if (x.held) continue; try { x.a.currentTime = x.base + t; } catch (e) {} } };
    // 只放开冻结时正在走的那几条。已经拨到头的再 play() 会从头重播；应用自己停着的入场由应用自己接着播
    window.__release = () => {
      for (const x of window.__anims || []) { if (x.held) continue; try { if (x.a.playState === 'paused') x.a.play(); } catch (e) {} }
      window.__anims = []; window.__frozen = false;
    };
  });
  /** 触发一个 View Transition，等它的动画被暂停。返回被暂停的动画条数 */
  async function vt(trigger) {
    await page.evaluate(() => { window.__anims = []; window.__frozen = false; window.__vtError = null; window.__vtDone = false; window.__arm = true; });
    await trigger();
    await page.waitForFunction(() => window.__frozen === true || window.__vtError, null, { timeout: 3000 });
    const err = await page.evaluate(() => window.__vtError);
    if (err) throw new Error('view transition 没起来: ' + err);
    return page.evaluate(() => (window.__anims || []).length);
  }
  /** 等转场真正结束（finished），再把紧随其后的入场动画冻住。给入场帧当时间轴的起点 */
  async function afterVt() {
    await page.waitForFunction(() => window.__vtDone === true, null, { timeout: 4000 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.evaluate(() => { window.__anims = []; window.__freeze(); });
  }
  /** 每隔 step 毫秒截一帧（只截 clip 区域）。t0 是标注用的起点偏移 */
  async function snap(steps, { t0 = 0, clip = null } = {}) {
    const fr = [];
    for (const t of steps) {
      await page.evaluate((ms) => window.__step(ms), t);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      fr.push({ t: (t0 + t) / 1000, data: (await page.screenshot({ type: 'jpeg', quality: 88, clip: clip || undefined })).toString('base64') });
    }
    return fr;
  }
  /** 放开动画让它播完 */
  async function release() {
    await page.evaluate(() => window.__release());
    await page.waitForTimeout(900);
  }
  return { vt, snap, release, afterVt };
}

async function shot(page, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
}

/** 把若干张整页截图拼成一张总览图，方便一次看多个页面 */
async function grid(files, out, opts = {}) {
  const { cols = 4, cellW = 270 } = opts;
  const gap = 6;
  const comps = [];
  let cellH = 0;
  for (let i = 0; i < files.length; i++) {
    const meta = await sharp(files[i]).metadata();
    cellH = Math.round((cellW * meta.height) / meta.width);
    comps.push({ input: await sharp(files[i]).resize(cellW, cellH, { fit: 'fill', position: 'top' }).jpeg({ quality: 90 }).toBuffer(),
      left: gap + (i % cols) * (cellW + gap), top: gap + Math.floor(i / cols) * (cellH + gap) });
  }
  const rows = Math.ceil(files.length / cols);
  await sharp({ create: { width: gap + cols * (cellW + gap), height: gap + rows * (cellH + gap), channels: 3, background: '#0E0E0E' } })
    .composite(comps).jpeg({ quality: 88 }).toFile(out);
}

/** 返回元素中心点坐标 */
async function center(locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element not visible');
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** 返回元素的截图区域（整数化，避免截图边缘取整错位） */
async function rect(locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element not visible');
  return { x: Math.floor(b.x), y: Math.floor(b.y), width: Math.ceil(b.width), height: Math.ceil(b.height) };
}

module.exports = { open, recorder, burst, sheet, shot, grid, pick, center, rect, installStepper };
