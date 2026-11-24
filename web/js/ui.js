// Paymory · 页面与组件模板。纯字符串模板，凡是从数据来的文字都过 esc()
window.PM = window.PM || {};
PM.ui = (function () {
  const S = PM.store;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  // 稳定的"手歪"角度：同一个种子每次得到同一个角度
  const rot = (seed, amp = 1.7) => (((hash(seed) % 33) - 16) / 16) * amp;

  const CN_MONTH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const KEYWORD = { wangcai: '摇尾巴', laowang: '微辣', guitar: '四个和弦', music: '通勤路上', shows: '第三排', ta: '下次我请', milk: '第 97 杯', barber: '稍微剪短一点' };
  const BREAKDOWN = {
    wangcai: [['把它接回家', 1500], ['狗粮 14 袋', 5880], ['疫苗 6 针', 1680], ['洗澡 22 次', 2640], ['玩具和零碎', 900]],
    laowang: [['微辣加蛋 41 次', 943], ['加牛肉 38 次', 1064], ['不要香菜 27 次', 621], ['多放豆皮 19 次', 532], ['其它 18 顿', 710]],
    guitar: [['琴 1 把', 2300], ['弦 6 套', 270], ['拨片和变调夹', 210]],
    music: [['每月 30 元，36 个月', 1092]],
    shows: [['五月天', 960], ['告五人', 960], ['陈绮贞', 960]],
    ta: [['酸菜鱼 9 顿', 1485], ['奶茶 7 杯', 119], ['电影 5 场', 350], ['其它 6 顿', 1250]],
    milk: [['四季奶青 36 杯', 576], ['波霸奶茶 31 杯', 527], ['红茶玛奇朵 17 杯', 323], ['加料和升杯', 714]],
    barber: [['剪发 18 次', 1080]],
  };

  /* ---------- 图标 ---------- */
  const IC = {
    book: '<path d="M7 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M9.6 3.5v17M13.2 8.2h3.4M13.2 11.6h3.4"/>',
    album: '<rect x="4.2" y="7.4" width="11" height="12" rx="2.2" transform="rotate(-8 9.7 13.4)"/><rect x="9.4" y="4.8" width="11" height="12" rx="2.2" transform="rotate(7 14.9 10.8)"/>',
    moon: '<path d="M15.4 4.3a8.3 8.3 0 1 0 4.7 13.8A8.6 8.6 0 0 1 15.4 4.3Z"/><circle cx="19" cy="6.2" r="1.2" fill="currentColor" stroke="none"/>',
    me: '<circle cx="12" cy="8.7" r="3.6"/><path d="M5.3 20c1.3-3.5 3.7-5.2 6.7-5.2s5.4 1.7 6.7 5.2"/>',
    back: '<path d="M14.6 5.6 8.2 12l6.4 6.4"/>',
    x: '<path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4"/>',
    chev: '<path d="M9.6 6.6 15 12l-5.4 5.4"/>',
    sense: '<path d="M4.8 9.4a10 10 0 0 1 14.4 0M7.9 12.6a5.6 5.6 0 0 1 8.2 0"/><circle cx="12" cy="16.8" r="1.3" fill="currentColor" stroke="none"/>',
    stack: '<rect x="4.6" y="9.2" width="12.2" height="11" rx="1.8"/><path d="M8.4 6.6 18.2 5a1.8 1.8 0 0 1 2 1.5l1.2 9.4"/>',
    dl: '<path d="M12 4.5v10M8.2 11 12 14.8 15.8 11M5.5 18.5h13"/>',
  };
  const icon = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;

  /* ---------- 小零件 ---------- */
  function tape(key, i, extra) {
    const a = S.getArchive(key);
    const h = hash(key + ':' + i);
    const left = 8 + (h % 48);
    const angle = ((h >> 3) % 9) - 4;
    return `<span class="tape" data-pat="${h % 4}" style="--tp:${a ? a.tape : '#F2D488'};left:${left}%;--a:${angle}deg;${extra || ''}"></span>`;
  }
  const pstick = (a, size) => `<span class="pstick" style="--ps:${size || 24}px"><img src="${a.img}" alt="" loading="lazy" decoding="async"></span>`;
  const img = (src, alt, lazy) => `<img src="${src}" alt="${esc(alt || '')}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
  // 等宽数字容器：JS 会把每一位数字套进定宽小格，滚动计数不抖
  const count = (n, extra) => `<span class="cnt" data-count="${n}"${extra || ''}>${n.toLocaleString('zh-CN')}</span>`;
  const head = (m, a) => `<header class="note__head">${pstick(a, 24)}<span class="note__where">${esc(a.name)}</span><span class="note__when">${S.relDay(m.when)} ${S.hm(m.when)}</span></header>`;
  const amt = (m) => (m.amount ? `<span class="note__amt">${S.money(m.amount)}</span>` : `<span class="note__amt is-zero">没花钱</span>`);
  const memo = (m) => (m.note ? `<p class="note__memo">${esc(m.note)}</p>` : '');
  const badge = (m) => (m.nth ? `<span class="badge">第 ${m.nth} 次</span>` : '');

  /* ---------- 便签的几种形态 ---------- */
  function noteBody(m, a) {
    const k = m.kind || (m.amount ? 'receipt' : 'line');
    if (k === 'polaroid') {
      return `<figure class="ph">${img(m.photo || a.img, m.what, true)}</figure>
        <div class="ph-cap"><span class="ph-cap__t">${esc(m.what)}</span>${amt(m)}</div>
        ${head(m, a)}${m.nth ? `<div class="ph-foot">${badge(m)}</div>` : ''}${memo(m)}`;
    }
    if (k === 'ticket') {
      return `<figure class="ph ph--wide">${img(m.photo || a.img, m.what, true)}</figure>
        <div class="tk__main"><h3 class="note__what note__what--lg">${esc(m.what)}</h3>
          <p class="tk__sub">${esc(a.name)} · 第 ${m.nth || 1} 场</p>${memo(m)}</div>
        <div class="tk__div" aria-hidden="true"></div>
        <div class="tk__stub"><span class="tk__seat">${esc(m.seat || '')}</span>${amt(m)}</div>
        ${head(m, a)}`;
    }
    if (k === 'stamp') {
      return `${head(m, a)}
        <div class="st-row"><div class="st-txt"><h3 class="note__what">${esc(m.what)}</h3><p class="tk__sub">${esc(a.kind)} · 每月自动</p></div>
          <span class="stamp"><i>已续</i></span></div>
        <div class="note__total"><span class="note__tl">合计</span>${amt(m)}</div>${memo(m)}`;
    }
    if (k === 'line') {
      return `${head(m, a)}<h3 class="note__what">${esc(m.what)}</h3>
        <div class="note__total"><span class="note__tl">这次</span>${amt(m)}</div>${memo(m)}
        ${m.nth ? `<footer class="note__foot">${badge(m)}</footer>` : ''}`;
    }
    return `${head(m, a)}<h3 class="note__what">${esc(m.what)}</h3>
      <div class="note__total"><span class="note__tl">合计</span>${amt(m)}</div>${memo(m)}
      ${m.nth ? `<footer class="note__foot">${badge(m)}</footer>` : ''}`;
  }

  function note(m, i) {
    const a = S.getArchive(m.archive);
    const kind = m.kind || (m.amount ? 'receipt' : 'line');
    const stag = i < 7 ? `;--i:${i}` : '';
    return `<article class="card note note--${kind} pressable reveal" data-id="${m.id}" role="button" tabindex="0"
        aria-label="${esc(m.what)}${m.amount ? '，' + S.money(m.amount) : ''}" style="--r:${rot(m.id).toFixed(2)}deg${stag}">
      ${tape(m.archive, hash(m.id) % 3)}
      <span class="card__sh"></span>
      <div class="card__paper">${noteBody(m, a)}</div>
    </article>`;
  }

  /* ---------- 本子 ---------- */
  function paperPick(paper) {
    const names = ['点阵纸', '横线纸', '牛皮纸'];
    return '<div class="ppick" role="radiogroup" aria-label="纸的颜色">' + ['dot', 'line', 'kraft'].map((p, i) =>
      `<button class="pp pressable" role="radio" aria-checked="${paper === p}" aria-label="${names[i]}" data-paper="${p}" style="--r:${(i - 1) * 4}deg"></button>`).join('') + '</div>';
  }

  function flashback() {
    const t = S.today;
    // 哪个档案是"几年前的今天"开始的
    const a = S.archives.find((x) => x.since.getMonth() === t.getMonth() && x.since.getDate() === t.getDate() && t.getFullYear() - x.since.getFullYear() >= 1);
    if (!a) return '';
    const years = t.getFullYear() - a.since.getFullYear();
    return `<figure class="card flash pressable reveal" data-archive="${a.id}" role="button" tabindex="0" style="--r:-1.3deg;--i:0" aria-label="${years} 年前的今天，${esc(a.first)}">
      ${tape(a.id, 9, 'left:38%;--a:-3deg;')}
      <span class="card__sh"></span>
      <div class="card__paper polaroid">
        <figure class="ph">${img(a.img, a.name)}<span class="datestamp">${S.ymd(a.since).replace(/\./g, '')}</span></figure>
        <figcaption class="flash__cap">
          <span class="ring-target">${S.cnNum(years)}年前的今天<svg class="ring" viewBox="0 0 132 38" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M9 21C12 7 104 3 121 15c8 6-6 16-44 19C39 37 12 33 10 25c-2-6 8-11 20-13"/></svg></span>，${esc(a.first)}。<br>后来又去了 ${count(a.count - 1)} 次。
        </figcaption>
      </div>
    </figure>`;
  }

  function pageHome() {
    const t = S.today;
    const groups = S.groups();
    const mCount = S.list().filter((m) => m.when.getMonth() === t.getMonth() && m.when.getFullYear() === t.getFullYear());
    const mSum = mCount.reduce((s, m) => s + m.amount, 0);
    let idx = 0;
    return `<div class="page page--home">
      <header class="j-head">
        <div class="j-title"><span class="j-title__y">${t.getFullYear()}</span><h1 class="j-title__m">${CN_MONTH[t.getMonth()]}月</h1><span class="j-title__tail">的本子</span></div>
        ${paperPick(PM.state.paper)}
      </header>
      <p class="j-sum">这个月贴了 ${count(mCount.length)} 张，一共 <span class="redpen">${count(mSum, ' data-prefix="¥"')}</span></p>
      <div class="parallax">${flashback()}</div>
      ${groups.map((g, gi) => {
        const sum = g.list.reduce((s, m) => s + m.amount, 0);
        const first = gi === 0;
        return `<section class="day" style="--z:${20 + gi}">
          <h2 class="day__label"><span class="day__d">${S.relDay(g.when)}</span>
            <span class="day__meta">${first ? '' : S.md(g.when) + ' ' + S.weekday(g.when) + ' · '}${g.list.length} 张 · ${S.money(sum)}</span></h2>
          ${g.list.map((m) => note(m, idx++)).join('')}
        </section>`;
      }).join('')}
      <p class="j-end">翻到这一页的底了</p>
    </div>`;
  }

  /* ---------- 记忆卡（便签展开后的大卡） ---------- */
  function memoryCard(m) {
    const a = S.getArchive(m.archive);
    const st = S.stats(a.id);
    const photo = m.photo ? `<figure class="ph ph--card">${img(m.photo, m.what)}</figure>` : '';
    return `<div class="mcard__note card note note--card note--${m.kind}" data-id="${m.id}">
        <span class="card__sh"></span>
        <div class="card__paper">
          ${photo}
          ${head(m, a)}
          <h3 class="note__what note__what--xl">${esc(m.what)}</h3>
          <div class="note__row"><span class="note__rel">${S.ymd(m.when)} ${S.weekday(m.when)} ${S.hm(m.when)}<br>距离今天 ${S.daysSince(m.when)} 天</span>${amt(m)}</div>
          ${m.nth ? `<div class="ph-foot">${badge(m)}</div>` : ''}${memo(m)}
        </div>
      </div>
      <div class="mcard__foot">
        <div class="mcard__meta">
          <button class="mcard__arc pressable" data-archive="${a.id}" aria-label="翻开 ${esc(a.name)} 的档案">
            ${pstick(a, 34)}<span class="mcard__an">${esc(a.name)}</span><span class="mcard__ak">${esc(a.kind)} · ${st.days.toLocaleString('zh-CN')} 天</span>${icon('chev')}
          </button>
        </div>
        <p class="mcard__hint">轻点旁边，把它放回去</p>
      </div>`;
  }

  /* ---------- 档案夹 ---------- */
  function pageArchives() {
    return `<div class="page page--albums">
      <header class="j-head">
        <div class="j-title"><h1 class="j-title__m">档案夹</h1><span class="j-title__tail">贴满了</span></div>
        <span class="j-count">${count(S.archives.length)} 个</span>
      </header>
      <div class="album">
        ${S.archives.map((a, i) => {
          const st = S.stats(a.id);
          return `<button class="card astick pressable reveal" data-id="${a.id}" style="--r:${rot(a.id, 2.4).toFixed(2)}deg;--i:${i % 4};${i % 2 ? '--dy:24px' : ''}" aria-label="${esc(a.name)}，陪伴 ${st.days} 天">
            ${tape(a.id, i + 2)}
            <span class="card__sh"></span>
            <span class="astick__paper">
              <span class="astick__photo">${img(a.img, a.name, true)}</span>
              <span class="astick__name">${esc(a.name)}</span>
              <span class="astick__days">${count(st.days)}<span class="astick__u">天</span></span>
              <span class="astick__sub">${esc(a.kind)} · ${S.money(st.total)}</span>
            </span>
          </button>`;
        }).join('')}
      </div>
      <p class="j-end">想加一页，从"贴一张"开始</p>
    </div>`;
  }

  /* ---------- 档案详情 ---------- */
  function calendar(a, night) {
    const t = S.today;
    const lead = (new Date(t.getFullYear(), t.getMonth(), 1).getDay() + 6) % 7;
    const days = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    const marks = new Set(a.marks);
    let out = '<div class="cal' + (night ? ' cal--night' : '') + '">';
    out += ['一', '二', '三', '四', '五', '六', '日'].map((d) => `<span class="cal__dow">${d}</span>`).join('');
    out += '<span class="cal__pad"></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const marked = marks.has(d);
      out += `<span class="cal__d${d === t.getDate() ? ' is-today' : ''}${marked ? ' is-mark' : ''}${d > t.getDate() ? ' is-future' : ''}"><span class="num">${d}</span>` +
        (marked ? `<svg class="cal__ring" viewBox="0 0 40 40" aria-hidden="true" style="--rd:${(d * 37) % 14 - 7}deg;--i:${[...marks].indexOf(d)}"><path pathLength="1" d="M6.5 20c0-8 7.5-13 14-13s13.5 5 13.5 12-7 14-14.5 14S6.5 28 6.5 20.5c0-3.2 2.4-6.4 5.6-8.4"/></svg>` : '') + '</span>';
    }
    return out + '</div>';
  }

  function pageDetail(id) {
    const a = S.getArchive(id);
    const st = S.stats(id);
    const ms = S.ofArchive(id);
    const prev = PM.state.from === 'home' ? '本子' : '档案夹';
    return `<div class="page page--detail">
      <div class="navrow"><button class="back pressable" data-back>${icon('back')}${prev}</button></div>
      <figure class="card cover" style="--r:-.5deg">
        ${tape(a.id, 5, 'left:62%;--a:5deg;')}
        <span class="card__sh"></span>
        <div class="cover__paper">
          ${img(a.img, a.name)}
          <figcaption class="cover__cap"><h1>${esc(a.name)}</h1><p>${esc(a.kind)} · 始于 ${S.ymd(a.since)}</p></figcaption>
        </div>
      </figure>
      <section class="daycount">
        <div class="daycount__row">${count(st.days, ' class="cnt daycount__n"')}<span class="daycount__u">天</span></div>
        <p class="daycount__l">${esc(a.verb)}</p>
      </section>
      <div class="trio">
        <div class="trio__i" style="--r:-1.4deg"><span class="trio__v">${S.money(st.total)}</span><span class="trio__l">一共花了</span></div>
        <div class="trio__i" style="--r:.9deg"><span class="trio__v">${count(st.count)}</span><span class="trio__l">条记忆</span></div>
        <div class="trio__i" style="--r:-.6deg"><span class="trio__v">${S.money(st.avg)}</span><span class="trio__l">平均每条</span></div>
      </div>
      <section class="block reveal"><h2 class="bh">这个月的脚印</h2>${calendar(a)}<p class="block__cap">圈起来的日子，来过 ${a.marks.length} 次</p></section>
      <section class="block reveal"><h2 class="bh">本子上关于它</h2>
        ${ms.map((m) => `<button class="mini pressable" data-id="${m.id}">
          <span class="mini__d">${S.md(m.when)} ${S.weekday(m.when)}</span>
          <span class="mini__w">${esc(m.what)}${m.note ? `<i>${esc(m.note)}</i>` : ''}</span>
          <span class="mini__a">${m.amount ? S.money(m.amount) : ''}</span></button>`).join('')}
      </section>
      <p class="quote">${a.quote}</p>
    </div>`;
  }

  /* ---------- 扉页（我的） ---------- */
  function pageMe() {
    const all = S.statsAll();
    return `<div class="page page--me">
      <header class="j-head"><div class="j-title"><h1 class="j-title__m">扉页</h1><span class="j-title__tail">这本本子是谁的</span></div></header>
      <div class="card bookplate reveal" style="--r:-.8deg;--i:0">
        <span class="card__sh"></span>
        <div class="card__paper bookplate__paper">
          <p class="bookplate__k">这本子属于</p>
          <p class="bookplate__n">正在过大学时光的你</p>
          <p class="bookplate__s">${count(all.count)} 条记忆 · ${count(S.archives.length)} 个档案 · ${count(all.days)} 天</p>
        </div>
      </div>
      <div class="set">
        <button class="card set__row pressable" data-toast="账单导入会在网页版正式阶段做：把微信、支付宝的账单粘进来，金额和商家自动填好"><span class="card__paper">粘一叠账单进来<i>微信 / 支付宝账单</i></span></button>
        <button class="card set__row pressable" data-toast="导出会在网页版正式阶段做"><span class="card__paper">把本子另存一份<i>JSON</i></span></button>
        <button class="card set__row pressable" data-toast="支付感应规划在安卓版：读到支付通知后弹一张卡片，你只补一句吃了什么"><span class="card__paper">支付感应<i>安卓版</i></span></button>
      </div>
      <p class="me__note">Paymory 记的不只是钱。一家吃了很多年的店、一只陪着长大的狗、一把换过六次弦的琴，都值得一条一条写进本子里。</p>
    </div>`;
  }

  /* ---------- 回望（墨夜） ---------- */
  function film(who) {
    return `<nav class="film" aria-label="回望谁">
      <button class="film__it pressable${who === 'all' ? ' is-on' : ''}" data-who="all" aria-pressed="${who === 'all'}">${icon('stack')}<span>总览</span></button>
      ${S.archives.map((a) => `<button class="film__it pressable${who === a.id ? ' is-on' : ''}" data-who="${a.id}" aria-pressed="${who === a.id}"><img src="${a.img}" alt="" loading="lazy" decoding="async"><span>${esc(a.name)}</span></button>`).join('')}
    </nav>`;
  }

  function bigNumber(n, unit, opts) {
    const o = opts || {};
    const len = n.toLocaleString('zh-CN').length;
    const size = Math.min(o.max || 148, Math.floor((o.width || 296) / (len * 0.56)));
    return `<div class="rv-big" style="--size:${size}px">
      <span class="rv-big__n">${o.prefix ? `<span class="rv-big__p">${o.prefix}</span>` : ''}${count(n, o.cls || '')}</span>
      ${unit ? `<span class="rv-big__u">${unit}</span>` : ''}
    </div>`;
  }

  function receipt(a) {
    const rows = (a ? BREAKDOWN[a.id] : S.archives.slice().sort((x, y) => y.total - x.total).map((x) => [x.name, x.total]));
    const total = rows.reduce((s, r) => s + r[1], 0);
    const foot = a ? `平均每条 ${S.money(Math.round(total / a.count))} · 一天 ${S.money(Math.round(total / S.stats(a.id).days))}`
                   : `平均一天 ${S.money(Math.round(total / S.statsAll().days))}`;
    return `<div class="rv-ticket">
      <p class="rv-ticket__h">${a ? esc(a.name) : 'Paymory · 账忘录'}<span>${a ? S.cnYear(a.since.getFullYear()) + ' — ' + S.cnYear(S.today.getFullYear()) : '2023 — ' + S.cnYear(S.today.getFullYear())}</span></p>
      ${rows.map((r, i) => `<p class="rv-ticket__r" style="--i:${i}"><span>${esc(r[0])}</span><span>${S.money(r[1])}</span></p>`).join('')}
      <p class="rv-ticket__t"><span>合计</span><span>${count(total, ' data-prefix="¥"')}</span></p>
      <p class="rv-ticket__f">${foot}</p>
    </div>`;
  }

  function tally(items) {
    // 用"正"字计数：一个正字 5 次，剩下的用笔画补
    const strokes = ['一', '二', '三', '四'];
    return `<div class="tally">${items.map(([name, n], i) => `<div class="tally__r" style="--i:${i}">
        <span class="tally__n">${esc(name)}</span>
        <span class="tally__z">${'正'.repeat(Math.floor(n / 5))}${n % 5 ? `<i>${strokes[n % 5 - 1]}</i>` : ''}</span>
        <span class="tally__c">${n}</span></div>`).join('')}</div>`;
  }

  function overview() {
    const all = S.statsAll();
    const sorted = S.archives.slice().sort((x, y) => y.total - x.total);
    const top = sorted[0];
    const share = Math.round((top.total / all.total) * 100);
    const month = S.allMonthTotal();
    const peak = month.indexOf(Math.max(...month));
    const firsts = S.archives.slice().sort((x, y) => x.since - y.since);
    const byDays = S.archives.slice().sort((x, y) => S.stats(y.id).days - S.stats(x.id).days);
    // "几段陪伴加在一起是多少年"：把每一段的天数加起来再换算
    const years = Math.round(byDays.reduce((s, a) => s + S.stats(a.id).days, 0) / 365);
    const maxDays = S.stats(byDays[0].id).days;
    // 100 点阵：每个点 = 总花费的 1%，按档案从多到少分组
    const dots = [];
    let left = 100;
    sorted.forEach((a, i) => { const n = i === sorted.length - 1 ? left : Math.round((a.total / all.total) * 100); left -= n; for (let k = 0; k < n; k++) dots.push(a.id); });
    return `
      <section class="rv-s rv-cover">
        <p class="rv-eyebrow">二〇二三 — 二〇二六</p>
        ${bigNumber(all.days, '天', { max: 128 })}
        <p class="rv-line">从${firsts[0].name}开始</p>
        <div class="scatter">${[3, 1, 2].map((k, i) => `<figure class="mini-pol" style="--r:${rot('sc' + k, 14)}deg;--i:${i}"><img src="${sorted[k].img}" alt="" loading="lazy" decoding="async"></figure>`).join('')}<figure class="mini-pol is-top" style="--r:-3deg;--i:3"><img src="${sorted[0].img}" alt="" loading="lazy" decoding="async"></figure></div>
      </section>
      <section class="rv-s">
        ${bigNumber(years, '年', { max: 148 })}
        <p class="rv-line">${S.archives.length} 段陪伴加在一起</p>
        <div class="lines">${byDays.map((a, i) => `<button class="lines__r pressable" data-id="${a.id}" style="--i:${i}">
          <span class="lines__n">${esc(a.name)}</span><span class="lines__b" style="--w:${(S.stats(a.id).days / maxDays * 100).toFixed(1)}%"></span><span class="lines__d">${S.stats(a.id).days.toLocaleString('zh-CN')}</span></button>`).join('')}</div>
      </section>
      <section class="rv-s">
        ${bigNumber(all.total, '', { prefix: '¥', max: 112, width: 300 })}
        <p class="rv-line">平均一天 ${S.money(Math.round(all.total / all.days))}</p>
        ${receipt(null)}
      </section>
      <section class="rv-s">
        <p class="rv-say">每 100 块，<b>${share}</b> 块给了${esc(top.name)}</p>
        <div class="dots100" role="group" aria-label="钱去了哪儿">${dots.map((id, i) => `<i class="dot" data-id="${id}" style="--c:${S.getArchive(id).tape};--i:${i}"></i>`).join('')}</div>
        <div class="dots-legend">${sorted.map((a) => `<button class="dl pressable" data-id="${a.id}"><img src="${a.img}" alt="" loading="lazy" decoding="async"><span>${esc(a.name)}</span><b>${S.money(a.total)}</b></button>`).join('')}</div>
      </section>
      <section class="rv-s">
        <p class="rv-say">${CN_MONTH[peak]}月，墨最重</p>
        <p class="rv-line">${S.money(month[peak])}，五月天来的那个月</p>
        <div class="ink12">${[2024, 2025, 2026].map((y, r) => `<div class="ink12__row"><span class="ink12__y">${y}</span><div class="ink12__cells">${Array.from({ length: 12 }, (_, m) => {
          const v = r === 2 ? month[m] : Math.round(month[m] * (r === 0 ? .42 : .66));
          return `<i style="--h:${Math.max(.06, v / 1800).toFixed(3)};--i:${m}" class="${r === 2 && m === peak ? 'is-peak' : ''}"></i>`;
        }).join('')}</div></div>`).join('')}</div>
      </section>
      <section class="rv-s">
        <p class="rv-say">第一次们</p>
        <ol class="tl">${firsts.map((a, i) => `<li class="tl__i" style="--i:${i}"><span class="tl__d">${S.ymd(a.since)}</span><figure class="mini-pol" style="--r:${rot(a.id, 5)}deg"><img src="${a.img}" alt="" loading="lazy" decoding="async"></figure><span class="tl__t"><b>${esc(a.name)}</b>${esc(a.first)}</span></li>`).join('')}</ol>
      </section>
      <section class="rv-s rv-end">
        <p class="rv-key" data-keyword="每一笔">每一笔</p>
        <p class="rv-quote">钱花掉了，<br>日子留下来了</p>
        <button class="rv-post pressable" data-poster="all">${icon('dl')} 存成一张卡片</button>
      </section>`;
  }

  function archive(a) {
    const st = S.stats(a.id);
    const ms = S.ofArchive(a.id);
    const noted = ms.filter((m) => m.note);
    // "最特别的一条"：优先挑没花钱的那条，其次挑带批注但不最新的那条
    const special = ms.find((m) => m.amount === 0) || noted[1] || noted[0] || ms[0];
    const last = ms[0];
    const month = S.months[a.id];
    const topVal = Math.max(...month);
    const peaks = month.map((v, i) => (v === topVal ? i : -1)).filter((i) => i >= 0);
    const peakTxt = peaks.length > 1
      ? peaks.slice(0, 2).map((m) => CN_MONTH[m] + '月').join('和') + '，各花了 ' + S.money(topVal)
      : CN_MONTH[peaks[0]] + '月，花了 ' + S.money(topVal);
    const perDay = st.total / st.days;
    // 一天多少钱，换算成一根冰棍或一杯奶茶，数字才有着落
    const cmp = perDay >= 15 ? '差不多一杯奶茶的钱' : perDay >= 4 ? '差不多一根冰棍的钱' : '比一根冰棍还便宜';
    return `
      <header class="rv-a" style="--img:url('${a.img}')">
        <img class="rv-a__bg" src="${a.img}" alt="" decoding="async">
        <div class="rv-a__fg">
          <p class="rv-eyebrow">${esc(a.kind)}</p>
          <h1 class="rv-a__n">${esc(a.name)}</h1>
          ${bigNumber(st.days, '天', { max: 120 })}
          <p class="rv-line">${esc(a.verb)}</p>
        </div>
      </header>
      <section class="rv-s">
        <p class="rv-say">第一次，和最近一次</p>
        <div class="two-pol">
          <figure class="mini-pol" style="--r:-4deg;--i:0"><img src="${a.img}" alt="" loading="lazy" decoding="async"><figcaption>${S.ymd(a.since)}<br>${esc(a.first)}</figcaption></figure>
          <span class="two-pol__arc" aria-hidden="true"><svg viewBox="0 0 60 60"><path pathLength="1" d="M4 48C14 12 46 12 56 48"/></svg></span>
          <figure class="mini-pol" style="--r:4deg;--i:1"><img src="${last.photo || a.img}" alt="" loading="lazy" decoding="async"><figcaption>${S.relDay(last.when)}<br>${esc(last.what)}</figcaption></figure>
        </div>
        <p class="rv-line">中间隔着 ${count(st.count)} 条记忆</p>
      </section>
      <section class="rv-s">
        ${bigNumber(st.total, '', { prefix: '¥', max: 112, width: 300 })}
        <p class="rv-line">一天 ${S.money(Math.round(perDay))}，${cmp}</p>
        ${receipt(a)}
      </section>
      <section class="rv-s">
        <p class="rv-say">最特别的一条</p>
        <div class="card note note--${special.amount ? 'receipt' : 'line'} note--lit reveal" style="--r:-1.6deg">
          ${tape(a.id, 7)}
          <div class="card__paper">${head(special, a)}<h3 class="note__what">${esc(special.what)}</h3>${amt(special)}${memo(special)}</div>
        </div>
      </section>
      <section class="rv-s">
        <p class="rv-say">${peakTxt}</p>
        <div class="ink12 ink12--one">
          <div class="ink12__cells ink12__tall">${Array.from({ length: 12 }, (_, m) => `<i style="--h:${Math.max(.06, month[m] / topVal).toFixed(3)};--i:${m}" class="${month[m] === topVal ? 'is-peak' : ''}"></i>`).join('')}</div>
          <div class="ink12__x" aria-hidden="true">${CN_MONTH.map((c, i) => `<span>${i + 1}</span>`).join('')}</div>
        </div>
      </section>
      ${a.menu.length > 1 ? `<section class="rv-s"><p class="rv-say">最常做的</p>${tally(a.menu)}</section>` : ''}
      <section class="rv-s"><p class="rv-say">这个月的脚印</p>${calendar(a, true)}</section>
      <section class="rv-s rv-end">
        <p class="rv-key" data-keyword="${esc(KEYWORD[a.id] || '')}">${esc(KEYWORD[a.id] || '')}</p>
        <p class="rv-quote">${a.quote}</p>
        <button class="rv-post pressable" data-poster="${a.id}">${icon('dl')} 存成一张卡片</button>
      </section>`;
  }

  function pageReview(who) {
    return `<div class="page page--night">${film(who)}${who === 'all' ? overview() : archive(S.getArchive(who))}</div>`;
  }

  /* ---------- 贴一张（sheet） ---------- */
  function sheet() {
    return `<div class="grip" aria-hidden="true"></div>
      <button class="sheet__x pressable" data-close aria-label="收起">${icon('x')}</button>
      <h2 class="sheet__h">贴一张便签</h2>
      <p class="sheet__s">付完款，十秒写进本子</p>
      <button class="sense pressable" data-sense>${icon('sense')}感应一笔支付</button>
      <label class="fld fld--amt"><span>花了</span><span class="fld__y">¥</span><input id="fAmt" class="num" inputmode="decimal" placeholder="0" autocomplete="off"></label>
      <div class="fld-row">
        <label class="fld"><span>做了什么</span><input id="fWhat" placeholder="比如 微辣加蛋" maxlength="30" autocomplete="off"></label>
        <label class="fld"><span>在哪儿</span><input id="fWhere" placeholder="比如 老王麻辣烫" maxlength="20" autocomplete="off"></label>
      </div>
      <div class="fld"><span>贴到哪一页</span><div class="chips" id="fArc">
        ${S.archives.map((a, i) => `<button class="chip pressable${i === 0 ? ' is-on' : ''}" data-arc="${a.id}">${pstick(a, 22)}<span>${esc(a.name)}</span></button>`).join('')}
      </div></div>
      <label class="fld"><span>想写的一句（可不填）</span><input id="fNote" placeholder="比如 降温第一碗" maxlength="40" autocomplete="off"></label>
      <button class="btn-primary pressable" data-save>贴进本子</button>`;
  }

  // 标签栏中间是"贴一张"：做成贴在标签栏上沿的一张小纸签，不悬浮、不挡内容
  const tabs = (tab) => [['home', 'book', '本子'], ['archives', 'album', '档案'], null, ['review', 'moon', '回望'], ['me', 'me', '我的']].map((t) => (t
    ? `<button class="tab pressable${tab === t[0] ? ' is-active' : ''}" data-tab="${t[0]}" aria-current="${tab === t[0] ? 'page' : 'false'}">${icon(t[1])}<span>${t[2]}</span><i class="tab__mark"></i></button>`
    : '<button class="compose pressable" data-compose aria-label="贴一张便签">贴一张</button>')).join('');

  return { esc, rot, icon, tape, pstick, img, note, pageHome, memoryCard, pageArchives, pageDetail, pageMe, pageReview, sheet, tabs };
})();
