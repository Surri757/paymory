// Paymory · 示例数据与内存 store（原型不落库，刷新即还原）
window.PM = window.PM || {};
PM.store = (function () {
  const DAY = 86400000;
  const real = new Date();
  // 把"今天"固定在 15:20，示例里的时间先后才稳定
  const today = new Date(real.getFullYear(), real.getMonth(), real.getDate(), 15, 20);
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysSince = (d) => Math.max(0, Math.round((startOf(today) - startOf(d)) / DAY));
  const at = (daysAgo, h, m) => { const d = new Date(today); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d; };

  const archives = [
    { id: 'wangcai', name: '旺财', kind: '宠物', since: at(487, 10, 0), total: 12600, count: 68, img: 'img/wangcai.jpg', tape: '#EFA9B4',
      first: '把它接回家', verb: '陪你的日子', quote: '它花掉你 ¥12,600，<br>换回 487 天的摇尾巴。',
      menu: [['洗澡', 22], ['狗粮', 14], ['疫苗', 6]], marks: [1, 2, 3, 6, 9, 13, 16, 20, 23] },
    { id: 'laowang', name: '老王麻辣烫', kind: '食堂', since: at(1096, 13, 10), total: 3870, count: 143, img: 'img/laowang.jpg', tape: '#A9C89A',
      first: '第一次走进这家店', verb: '认识你的日子', quote: '三年，143 顿。<br>你是这家店最熟的一张脸。',
      menu: [['微辣加蛋', 41], ['加牛肉', 38], ['不要香菜', 27], ['多放豆皮', 19]], marks: [1, 2, 4, 6, 8, 9, 12, 14, 17, 19, 21, 22] },
    { id: 'guitar', name: '那把吉他', kind: '物品', since: at(1090, 16, 0), total: 2780, count: 17, img: 'img/guitar.jpg', tape: '#F2D488',
      first: '从琴行抱回来', verb: '拥有它的日子', quote: '¥2,780 和六套弦，<br>教会你四个和弦。',
      menu: [['换弦', 6], ['拨片', 4], ['变调夹', 1]], marks: [23] },
    { id: 'music', name: '音乐会员', kind: '订阅', since: at(1362, 9, 0), total: 1092, count: 36, img: 'img/music.jpg', tape: '#C3B3DE',
      first: '开了第一个月', verb: '陪着你的日子', quote: '每月 ¥30，<br>买断通勤路上的三小时。',
      menu: [['自动续费', 36]], marks: [18] },
    { id: 'shows', name: '2026 演唱会', kind: '事件', since: at(250, 19, 0), total: 2880, count: 3, img: 'img/shows.jpg', tape: '#F09C82',
      first: '第一场', verb: '开演以来的日子', quote: '三场，¥2,880。<br>荧光棒还留在抽屉里。',
      menu: [['五月天', 1], ['告五人', 1], ['陈绮贞', 1]], marks: [] },
    { id: 'ta', name: '林同学', kind: '朋友', since: at(809, 18, 30), total: 3204, count: 27, img: 'img/ta.jpg', tape: '#EFA9B4',
      first: '第一顿饭', verb: '认识她的日子', quote: '27 顿饭，¥3,204。<br>她说下次她请。',
      menu: [['酸菜鱼', 9], ['奶茶', 7], ['电影', 5]], marks: [4, 11, 20] },
    { id: 'milk', name: '一点点', kind: '奶茶', since: at(926, 15, 40), total: 2140, count: 96, img: 'img/milk.jpg', tape: '#9FC3DF',
      first: '第一杯', verb: '喝过来的日子', quote: '96 杯，¥2,140。<br>第 97 杯已经在路上了。',
      menu: [['四季奶青', 36], ['波霸奶茶', 31], ['红茶玛奇朵', 17]], marks: [1, 3, 5, 9, 12, 15, 18, 21] },
    { id: 'barber', name: '阿强理发', kind: '服务', since: at(1012, 11, 0), total: 1080, count: 18, img: 'img/barber.jpg', tape: '#9FD3C4',
      first: '第一次剪', verb: '找他剪头发的日子', quote: '18 次，¥1,080。<br>每次都说：稍微剪短一点。',
      menu: [['稍微剪短一点', 18]], marks: [5, 19] },
  ];
  const byId = Object.fromEntries(archives.map((a) => [a.id, a]));

  let seq = 0;
  const mem = (archive, what, amount, when, note, extra) => Object.assign(
    { id: 'm' + (++seq), archive, what, amount, note: note || '', when }, extra || {});
  const memories = [
    mem('wangcai', '宠物店洗澡', 120, at(0, 14, 20), '洗完香香的，在楼下疯狂甩毛', { kind: 'receipt', nth: 68, photo: 'img/bath.jpg' }),
    mem('laowang', '微辣加蛋', 23, at(1, 12, 40), '降温第一碗', { kind: 'receipt', nth: 143 }),
    mem('milk', '四季奶青 去冰三分糖', 16, at(2, 16, 5), '第 96 杯', { kind: 'polaroid', nth: 96, photo: 'img/milk.jpg' }),
    mem('music', '黑胶会员续费', 30, at(5, 8, 0), '第 36 个月，自动扣的', { kind: 'stamp' }),
    mem('wangcai', '江边跑步', 0, at(6, 17, 30), '没花钱，它很开心', { kind: 'polaroid', photo: 'img/run.jpg' }),
    mem('barber', '剪短', 60, at(8, 11, 15), '夏天剩下的最后一点', { kind: 'receipt', nth: 18 }),
    mem('ta', '太二酸菜鱼，我请', 158, at(11, 18, 50), '她说下次她请', { kind: 'polaroid', nth: 27, photo: 'img/fish.jpg' }),
    mem('shows', '五月天', 960, at(16, 19, 30), '第三排，荧光棒还留着',
      { kind: 'ticket', nth: 2, photo: 'img/shows.jpg', seat: '内场 C 区 · 3 排 11 号' }),
    mem('laowang', '加牛肉', 28, at(19, 13, 5), '这次多要了一勺蒜泥', { kind: 'receipt', nth: 142 }),
    mem('guitar', '换第 6 套弦', 45, at(23, 20, 10), '011 的手感果然亮', { kind: 'receipt', nth: 17 }),
  ];

  // 2026 年每月花在各档案上的钱（回望页用）
  const months = {
    wangcai: [420, 380, 420, 280, 420, 380, 340, 300, 420, 380, 260, 0],
    laowang: [86, 92, 105, 92, 64, 98, 51, 86, 105, 92, 74, 0],
    guitar: [0, 0, 45, 0, 0, 85, 0, 0, 0, 45, 0, 0],
    music: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 0],
    shows: [0, 0, 960, 0, 0, 0, 0, 0, 0, 0, 960, 0],
    ta: [0, 86, 158, 0, 64, 0, 129, 0, 86, 0, 158, 0],
    milk: [64, 48, 80, 48, 64, 96, 48, 64, 80, 48, 64, 0],
    barber: [0, 60, 0, 60, 0, 0, 60, 0, 0, 60, 0, 0],
  };

  const list = () => memories.slice().sort((a, b) => b.when - a.when);
  const getArchive = (id) => byId[id];
  const getMemory = (id) => memories.find((m) => m.id === id);
  const ofArchive = (id) => list().filter((m) => m.archive === id);
  const addMemory = (m) => { m.id = 'm' + (++seq); m.when = m.when || new Date(today); memories.push(m); return m; };

  function stats(id) {
    const a = byId[id];
    const ms = ofArchive(id);
    return {
      days: daysSince(a.since), total: a.total, count: a.count, avg: Math.round(a.total / a.count),
      first: a.since, last: ms.length ? ms[0].when : a.since,
    };
  }
  function statsAll() {
    const first = archives.reduce((min, a) => (a.since < min ? a.since : min), archives[0].since);
    return {
      days: daysSince(first), total: archives.reduce((s, a) => s + a.total, 0),
      count: archives.reduce((s, a) => s + a.count, 0),
    };
  }
  function groups() {
    const out = [];
    const key = (d) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
    for (const m of list()) {
      const k = key(m.when);
      const last = out[out.length - 1];
      if (last && last.key === k) last.list.push(m); else out.push({ key: k, when: m.when, list: [m] });
    }
    return out;
  }
  function monthTotal(id) { return (months[id] || []).reduce((s, v) => s + v, 0); }
  function allMonthTotal() {
    return Array.from({ length: 12 }, (_, i) => archives.reduce((s, a) => s + months[a.id][i], 0));
  }

  /* ---------- 日期与数字的写法 ---------- */
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const CN = '〇一二三四五六七八九';
  const money = (n) => '¥' + Math.round(n).toLocaleString('zh-CN');
  const relDay = (d) => { const n = daysSince(d); return n === 0 ? '今天' : n === 1 ? '昨天' : n + ' 天前'; };
  const md = (d) => String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');   // 月和日都补零，"03.03" 和 "11.22" 一样宽
  const ymd = (d) => d.getFullYear() + '.' + md(d);
  const weekday = (d) => WEEK[d.getDay()];
  const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const cnYear = (y) => String(y).split('').map((c) => CN[Number(c)]).join('');
  const cnNum = (n) => (n <= 10 ? '〇一二三四五六七八九十'[n] : String(n));

  // 稳定的伪随机：同一个种子每次得到同一个结果
  function rng(seed) {
    let s = 2166136261 ^ seed;
    for (const ch of String(seed)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619);
    return () => { s = Math.imul(s ^ (s >>> 15), 2246822519); s = Math.imul(s ^ (s >>> 13), 3266489917); return ((s ^= s >>> 16) >>> 0) / 4294967296; };
  }

  return {
    archives, today, daysSince, list, getArchive, getMemory, ofArchive, addMemory,
    stats, statsAll, groups, months, monthTotal, allMonthTotal, rng,
    money, relDay, md, ymd, weekday, hm, cnYear, cnNum,
  };
})();
