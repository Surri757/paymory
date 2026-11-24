// 生成站点用的示例照片（Pollinations 免费生图），裁掉右下角水印并压缩成 jpg
// 用法: node tools/genimg.cjs            全部生成
//       node tools/genimg.cjs wangcai   只生成指定的
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Module = require('module');

process.env.NODE_PATH = execSync('npm root -g').toString().trim();
Module._initPaths();
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '../web/img');
const RAW = path.join(OUT, 'src');
const SHEET = path.resolve(__dirname, 'out/img-sheet.jpg');
const STYLE = ', candid everyday snapshot taken on a phone, warm natural light, soft film-like colors, ' +
  'shallow depth of field, realistic photograph, no text, no watermark';

const SHOTS = [
  ['wangcai', 'a fluffy corgi sitting on a riverside walking path, happy grin with tongue out, looking at the camera, green trees blurred behind'],
  ['laowang', 'overhead view of a steaming bowl of spicy malatang hot pot with red broth, glass noodles, leafy greens, quail egg, tofu puffs and thin beef slices, wooden chopsticks on the rim, on a worn wooden table in a small neighborhood Chinese eatery'],
  ['guitar', 'a natural spruce wood acoustic guitar lying on rumpled white bedsheets in a sunlit college dorm room, soft window light, paperback books at the edge of the frame'],
  ['music', 'a pair of white wired earbuds with a tangled cable lying on a dark walnut wooden desk, top-down close-up product photo, a smartphone beside them, warm desk lamp light'],
  ['shows', 'view from inside a concert crowd, people seen from behind raising hands with glowing light sticks, magenta and blue stage lights through haze, distant wide stage'],
  ['ta', 'two cups of bubble tea with pastel straws standing side by side on a small cafe table by a sunny window, little hand-drawn hearts doodled on one cup sleeve, no people'],
  ['milk', 'close-up of a hand holding a cream bubble tea cup full of dark tapiopi pearls with a pastel pink straw, sunny street softly blurred behind'],
  ['barber', 'interior of a small neighborhood barbershop, vintage leather barber chair, mirror framed with warm bulbs, red white and blue barber pole by the window, afternoon light'],
  ['bath', 'a wet corgi with large upright ears and orange and white fur wrapped in a soft beige towel after a bath, adorable slightly grumpy face, bright clean bathroom'],
  ['run', 'a fluffy orange and white corgi with big upright ears running happily toward the camera along a riverside path at golden hour, tongue out, background softly motion blurred'],
  ['fish', 'a large platter of Sichuan boiled fish with pickled mustard greens, dried red chilies and scallions in milky broth, bowls of rice around it on a busy table, shared dinner'],
];

const only = process.argv.slice(2);
// 免费额度：每个 IP 每 45 秒 1 张，所以请求之间至少隔 50 秒
const GAP = 50000;
let lastRequest = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const throttle = async () => { const wait = lastRequest + GAP - Date.now(); if (wait > 0) await sleep(wait); lastRequest = Date.now(); };

async function gen(name, prompt, seed) {
  const raw = path.join(RAW, name + '.jpg');
  if (!fs.existsSync(raw)) {
    const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt + STYLE) +
      '?width=1024&height=768&model=flux&nologo=true&seed=' + seed;
    let ok = false;
    for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
      await throttle();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 20000) throw new Error('too small: ' + buf.length);
        fs.writeFileSync(raw, buf);
        ok = true;
      } catch (e) {
        console.log('retry', name, attempt, e.message);
        await sleep(5000);
      }
    }
    if (!ok) { console.log('FAIL', name); return false; }
  }
  const meta = await sharp(raw).metadata();
  // 右下角有 pollinations 水印：先裁掉底部 5%，再按 4:3 裁切
  const w = meta.width;
  const th = Math.floor(meta.height * 0.95);
  const ch = Math.min(th, Math.round((w * 3) / 4));
  const dest = path.join(OUT, name + '.jpg');
  await sharp(raw)
    .extract({ left: 0, top: Math.floor((th - ch) / 2), width: w, height: ch })
    .resize(720, 540, { fit: 'cover' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(dest);
  console.log('ok', name, w + 'x' + meta.height, '->', fs.statSync(dest).size + 'B');
  return true;
}

async function reviewSheet(names) {
  const cellW = 300;
  const gap = 6;
  const thumbs = [];
  for (const n of names) {
    const p = path.join(OUT, n + '.jpg');
    if (!fs.existsSync(p)) continue;
    thumbs.push({ name: n, buf: await sharp(p).resize(cellW, Math.round(cellW * 0.75), { fit: 'cover' }).toBuffer() });
  }
  const cols = 4;
  const cellH = Math.round(cellW * 0.75);
  const rows = Math.ceil(thumbs.length / cols);
  const comps = thumbs.map((t, i) => ({ input: t.buf, left: gap + (i % cols) * (cellW + gap), top: gap + Math.floor(i / cols) * (cellH + gap + 18) }));
  await sharp({ create: { width: gap + cols * (cellW + gap), height: gap + rows * (cellH + gap + 18), channels: 3, background: '#222' } })
    .composite(comps).jpeg({ quality: 85 }).toFile(SHEET);
  console.log('sheet:', SHEET, thumbs.map((t) => t.name).join(' '));
}

(async () => {
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(path.dirname(SHEET), { recursive: true });
  const done = [];
  for (let i = 0; i < SHOTS.length; i++) {
    const [name, prompt] = SHOTS[i];
    if (only.length && !only.includes(name)) continue;
    if (await gen(name, prompt, 100 + i * 7)) done.push(name);
  }
  await reviewSheet(only.length ? only : SHOTS.map((s) => s[0]));
})();
