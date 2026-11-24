// 间距审计：列出没落在 4px 网格上的 padding / margin / gap（只看声明里的 px 值，calc、env、百分比不管）
// 用法: node tools/grid-audit.cjs          只报告
//       node tools/grid-audit.cjs --plan   另外给出"就近取整到 4 的倍数、恰好居中时取小"的改法，不写任何文件
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../web/css');
const plan = process.argv.includes('--plan');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.css')).sort();
const PROPS = ['padding', 'margin', 'gap', 'row-gap', 'column-gap'];
let total = 0;
const tally = {};

for (const f of files) {
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
  lines.forEach((text, i) => {
    // 一行里可能有几条声明，逐条找
    const re = /(padding|margin|row-gap|column-gap|gap)(-top|-right|-bottom|-left|-block|-inline)?\s*:\s*([^;}]+)/g;
    let m;
    while ((m = re.exec(text))) {
      const val = m[3];
      if (/calc\(|env\(/.test(val)) continue;
      const px = [...val.matchAll(/(-?)(\d+(?:\.\d+)?)px/g)].map((x) => ({ neg: x[1] === '-', v: Number(x[2]) }));
      const off = px.filter((p) => p.v >= 5 && p.v % 4 !== 0);
      if (!off.length) continue;
      total++;
      for (const p of off) tally[p.v] = (tally[p.v] || 0) + 1;
      if (!plan) continue;
      const next = val.replace(/(-?)(\d+(?:\.\d+)?)px/g, (all, neg, num) => {
        const v = Number(num);
        if (v < 5 || v % 4 === 0) return all;
        return neg + (Math.floor(v / 4 + 0.49) * 4) + 'px';   // 就近取整到 4 的倍数；恰好居中（余 2）时取小的那个
      });
      console.log(f + ':' + (i + 1) + '  ' + m[1] + (m[2] || '') + ': ' + val.trim() + '   →   ' + next.trim());
    }
  });
}
console.log('\noff-grid declarations:', total);
console.log('by value:', Object.keys(tally).sort((a, b) => tally[b] - tally[a]).map((k) => k + 'px×' + tally[k]).join('  '));
