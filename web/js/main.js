// Paymory · 应用骨架：状态、导航、事件、启动、分享卡片
(function () {
  const doc = document;
  const S = PM.store;
  const U = PM.ui;
  const M = PM.motion;
  const $ = (id) => doc.getElementById(id);
  const app = $('app');
  const tabbar = $('tabbar');
  const screen = $('screen');

  PM.state = { tab: 'home', from: 'home', detail: null, opened: 'slide', paper: 'dot', who: 'all' };
  // 每个标签页的 DOM 留在内存里：切回来不重画、图片不重新加载、滚动位置还在
  const cache = {};
  let detailEl = null;

  const MAKE = { home: U.pageHome, archives: U.pageArchives, review: () => U.pageReview(PM.state.who), me: U.pageMe };

  PM.main = {
    state: PM.state,
    findCard: (id) => app.querySelector('.card[data-id="' + id + '"]'),
    openArchive, back, openMemory, toast: (m) => M.toast(m),
  };

  /* ================= 页面切换 ================= */
  function get(tab) {
    if (!cache[tab]) {
      const box = doc.createElement('div');
      box.innerHTML = MAKE[tab]().trim();
      const el = box.firstElementChild;
      el.dataset.tab = tab;
      cache[tab] = { el, top: 0 };
    }
    return cache[tab];
  }
  function show(el) {
    [...app.children].forEach((c) => { if (c !== el) c.remove(); });
    if (el.parentNode !== app) app.appendChild(el);
  }
  function dropDetail() {
    if (detailEl) { detailEl.remove(); detailEl = null; }
    PM.state.detail = null;
  }
  function rememberScroll() {
    const cur = app.firstElementChild;
    if (cur && cur.dataset.tab && cache[cur.dataset.tab]) cache[cur.dataset.tab].top = app.scrollTop;
  }
  function syncChrome() {
    const active = PM.state.detail ? PM.state.from : PM.state.tab;
    tabbar.innerHTML = U.tabs(active);
    const night = active === 'review';
    screen.dataset.mood = night ? 'night' : 'day';
  }

  /* 入场分两段，围着转场走。转场期间屏幕上是静止的快照：
     DOM 换上去的那一刻先 M.stage()——数字归零，屏里的便签走到入场的中途停住——快照拍的就是这个样子；
     转场结束再 M.observe()，让便签落定、数字滚上去、屏外的照旧等滚动。
     不这么做的话，动画会在快照底下偷跑，转场一结束画面就跳 */
  const noop = () => {};
  function enter(el) {
    if (M.isLive()) { M.stage(el); return () => M.observe(el); }
    M.prime(el);
    return () => M.observe(el);
  }

  function goTab(t) {
    if (!PM.state.detail && t === PM.state.tab) { app.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    M.hap(8);
    const was = PM.state.detail ? PM.state.from : PM.state.tab;
    const type = PM.state.detail ? (PM.state.opened === 'hero' ? 'close' : 'pop') : (was === 'review' || t === 'review' ? 'mood' : 'tab');
    let after = noop;
    M.vt(type, () => {
      if (!PM.state.detail) rememberScroll();
      dropDetail();
      PM.state.tab = t;
      PM.state.from = t;
      const c = get(t);
      show(c.el);
      app.scrollTop = c.top;
      syncChrome();
      after = enter(c.el);
    }).then(() => {
      after();
      // 选中的标签图标等转场结束再弹：转场期间标签栏是一张静止的快照，提前播了也看不见
      const b = tabbar.querySelector('.tab.is-active');
      if (b) b.classList.add('is-pop');
    });
  }

  /** 打开一个档案。src.kind 为 'hero' 时从贴纸展开（贴纸和封面是同一个元素），否则从右滑入 */
  function openArchive(id, src) {
    src = src || {};
    const kind = src.kind === 'hero' && src.el ? 'hero' : 'slide';
    M.hap(10);
    const from = PM.state.detail ? PM.state.from : PM.state.tab;
    M.name(src.el, 'hero');
    let after = noop;
    M.vt(kind === 'hero' ? 'open' : 'push', () => {
      if (!$('mcard').hidden) { $('mcard').hidden = true; $('veil').hidden = true; }
      M.resetMemory();                         // 记忆卡还开着时直接翻档案：归还藏起来的那张便签
      if (!PM.state.detail) rememberScroll();
      dropDetail();
      PM.state.from = from;
      PM.state.detail = id;
      PM.state.opened = kind;
      const box = doc.createElement('div');
      box.innerHTML = U.pageDetail(id).trim();
      detailEl = box.firstElementChild;
      show(detailEl);
      app.scrollTop = 0;
      syncChrome();
      if (kind === 'hero') M.name(detailEl.querySelector('.cover__paper'), 'hero');
      after = enter(detailEl);
    }).then(() => {
      M.unname(src.el);
      if (detailEl) M.unname(detailEl.querySelector('.cover__paper'));
      if (PM.state.detail === id) after();
    });
  }

  function back() {
    if (!PM.state.detail) return;
    M.hap(10);
    const hero = PM.state.opened === 'hero';
    const id = PM.state.detail;
    let target = null;
    let after = noop;
    // 封面在展开结束时撤过名。收回前先把它重新命名，旧画面里才有它，封面才缩得回贴纸
    const cover = detailEl ? detailEl.querySelector('.cover__paper') : null;
    if (hero) M.name(cover, 'hero');
    M.vt(hero ? 'close' : 'pop', () => {
      dropDetail();
      const c = get(PM.state.from);
      show(c.el);
      app.scrollTop = c.top;
      syncChrome();
      if (hero) {
        target = c.el.querySelector('.astick[data-id="' + id + '"] .astick__paper');
        M.name(target, 'hero');
      }
      after = enter(c.el);
    }).then(() => {
      M.unname(target);
      M.unname(cover);
      if (!PM.state.detail) after();
    });
  }

  function openMemory(id, el) { M.openMemory(id, el); }

  function setWho(id) {
    if (id === PM.state.who) return;
    M.hap(8);
    let after = noop;
    M.vt('tab', () => {
      PM.state.who = id;
      delete cache.review;
      const c = get('review');
      show(c.el);
      app.scrollTop = 0;
      syncChrome();
      after = enter(c.el);
    }).then(() => { if (PM.state.who === id) after(); });
  }

  function setPaper(p) {
    PM.state.paper = p;
    screen.dataset.paper = p;
    M.hap(8);
    app.querySelectorAll('.pp').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.paper === p)));
  }

  /* ================= 贴一张 ================= */
  function save() {
    const amount = Number(($('fAmt').value || '').replace(/[^\d.]/g, '')) || 0;
    const what = $('fWhat').value.trim() || '记了一笔';
    const note = $('fNote').value.trim();
    const on = $('fArc').querySelector('.chip.is-on');
    const archive = on ? on.dataset.arc : S.archives[1].id;
    S.addMemory({ archive, what, amount, note, when: new Date(S.today), kind: amount ? 'receipt' : 'line' });
    delete cache.home;                          // 首页重画，新便签从最上面落下来
    if (PM.state.tab === 'home' && !PM.state.detail) {
      const c = get('home');
      show(c.el);
      app.scrollTop = 0;
      M.observe(c.el);
    }
    M.closeSheet();
    M.hap([15, 40, 25]);
    M.toast('贴好了。这是演示数据，刷新后还原');
    $('fAmt').value = ''; $('fWhat').value = ''; $('fNote').value = '';
  }

  /* ================= 分享卡片 ================= */
  const loadImage = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  function cover(x, im, dx, dy, dw, dh, r) {
    const k = Math.max(dw / im.naturalWidth, dh / im.naturalHeight);
    const w = im.naturalWidth * k;
    const h = im.naturalHeight * k;
    x.save();
    x.beginPath();
    x.roundRect ? x.roundRect(dx, dy, dw, dh, r) : x.rect(dx, dy, dw, dh);
    x.clip();
    x.drawImage(im, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
    x.restore();
  }

  /** 生成 1080×1440 的分享图。尺寸固定、不乘设备像素比：iOS 上单张画布太大会导出空白 */
  async function makePoster(who) {
    const a = who === 'all' ? null : S.getArchive(who);
    const st = a ? S.stats(who) : S.statsAll();
    const k = 1080 / 390;
    const px = (v) => Math.round(v * k);
    const c = doc.createElement('canvas');
    c.width = 1080;
    c.height = 1440;
    const x = c.getContext('2d');
    const num = `600 ${px(84)}px "Noto Serif SC", serif`;
    const hand = (v) => `400 ${px(v)}px "LXGW WenKai", "Kaiti SC", serif`;
    const quote = (a ? a.quote : '钱花掉了，<br>日子留下来了').split('<br>');
    const first = S.archives.reduce((min, o) => (o.since < min ? o.since : min), S.archives[0].since);
    const caption = a ? S.ymd(a.since) + ' · ' + a.first : S.ymd(first) + ' — ' + S.ymd(S.today);
    const words = 'Paymory 账忘录' + caption + (a ? a.name + a.kind + a.verb : '回望天每一笔都不白花段陪伴一本子的日子都记着条记忆') + quote.join('') + '〇一二三四五六七八九年月';
    try { await Promise.all([doc.fonts.load(num, '0123456789,'), doc.fonts.load(hand(40), words), doc.fonts.load(hand(18), words)]); } catch (e) { /* 字体没加载到就用系统字体 */ }
    const photo = await loadImage(a ? a.img : S.archives[0].img);

    x.fillStyle = '#1A1511';
    x.fillRect(0, 0, 1080, 1440);
    const vg = x.createRadialGradient(540, 620, 200, 540, 720, 1100);
    vg.addColorStop(0, 'rgba(230,198,132,.07)');
    vg.addColorStop(1, 'rgba(0,0,0,.28)');
    x.fillStyle = vg;
    x.fillRect(0, 0, 1080, 1440);

    /* 版式按 390×520 的设计稿排，px() 把设计稿尺寸换算到画布。所有坐标都写设计稿尺寸，不混用画布像素。
       从上到下：抬头（Paymory / 年月）→ 拍立得 → 名字 → 大数字 → 引文 */
    x.textBaseline = 'alphabetic';
    const t = new Date(S.today);
    const CNM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const when = [...String(t.getFullYear())].map((d) => '〇一二三四五六七八九'[+d]).join('') + '年 · ' + CNM[t.getMonth()] + '月';

    x.fillStyle = '#E6C684';
    x.font = hand(22);
    x.fillText('Paymory', px(32), px(44));
    x.fillStyle = '#B7A482';
    x.font = hand(13);
    x.textAlign = 'right';
    x.fillText(when, px(358), px(43));
    x.textAlign = 'left';
    x.fillText('账忘录 · 每一笔，都不白花', px(32), px(66));

    // 拍立得：白框 250 宽，照片 226×150，下边留一条手写日期
    x.save();
    x.translate(540, px(96));
    x.rotate(-0.022);
    x.shadowColor = 'rgba(0,0,0,.45)';
    x.shadowBlur = 70;
    x.shadowOffsetY = px(9);
    x.fillStyle = '#FFFCF4';
    x.fillRect(-px(125), 0, px(250), px(202));
    x.shadowColor = 'transparent';
    cover(x, photo, -px(113), px(12), px(226), px(150), 2);
    x.fillStyle = '#3B3228';
    x.font = hand(11);
    x.textAlign = 'center';
    x.fillText(caption, 0, px(181));
    x.textAlign = 'left';
    x.restore();

    x.fillStyle = '#EFE4CE';
    x.font = hand(27);
    x.fillText(a ? a.name : S.archives.length + ' 段陪伴，一本子的日子', px(32), px(338));
    x.fillStyle = '#B7A482';
    x.font = hand(13);
    x.fillText(a ? a.kind + ' · 一共 ' + S.money(st.total) : '一共 ' + S.money(st.total) + ' · ' + st.count + ' 条记忆', px(32), px(361));

    // 大数字用宋体，单位用手写体。先用数字字体量宽度，再换字体画单位——单位从数字右边缘起排
    const days = st.days.toLocaleString('zh-CN');
    x.fillStyle = '#E6C684';
    x.font = num;
    x.fillText(days, px(30), px(436));
    const nw = x.measureText(days).width;
    x.fillStyle = '#EFE4CE';
    x.font = hand(18);
    x.fillText(a ? '天，' + a.verb : '天，都记着', px(30) + nw + px(10), px(436));

    x.fillStyle = '#EFE4CE';
    x.font = hand(17);
    x.lineJoin = 'round';
    quote.forEach((line, i) => x.fillText(line, px(32), px(470 + i * 22)));
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    c.width = c.height = 0;
    if (!blob) throw new Error('canvas too large');
    return blob;
  }

  async function showPoster(who) {
    const btn = app.querySelector('[data-poster="' + who + '"]');
    if (btn) btn.disabled = true;
    M.hap(10);
    try {
      const blob = await makePoster(who);
      const url = URL.createObjectURL(blob);
      const pv = $('pveil');
      $('posterImg').src = url;
      $('posterDl').href = url;
      pv.hidden = false;
      void pv.offsetWidth;
      pv.classList.add('is-on');
    } catch (e) {
      M.toast('卡片没生成出来，再试一次');
    }
    if (btn) btn.disabled = false;
  }
  function hidePoster() { const pv = $('pveil'); pv.classList.remove('is-on'); setTimeout(() => { pv.hidden = true; }, 260); }

  /* ================= 事件 ================= */
  app.addEventListener('click', (e) => {
    const q = (s) => e.target.closest(s);
    let n;
    if ((n = q('[data-back]'))) return back();
    if ((n = q('[data-who]'))) return setWho(n.dataset.who);
    if ((n = q('.astick'))) return openArchive(n.dataset.id, { el: n.querySelector('.astick__paper'), kind: 'hero' });
    if ((n = q('.flash'))) return openArchive(n.dataset.archive, { kind: 'slide' });
    if ((n = q('.mini'))) return openMemory(n.dataset.id, null);
    if ((n = q('.card.note[data-id]'))) return openMemory(n.dataset.id, n);
    if ((n = q('.pp'))) return setPaper(n.dataset.paper);
    if ((n = q('.lines__r[data-id], .dl[data-id], .dot[data-id]'))) return openArchive(n.dataset.id, { kind: 'slide' });
    if ((n = q('[data-poster]'))) return showPoster(n.dataset.poster);
    if ((n = q('[data-toast]'))) return M.toast(n.dataset.toast);
  });
  // article / figure 这些带 role=button 的元素，键盘也要能按
  app.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.click(); }
  });
  tabbar.addEventListener('click', (e) => {
    if (e.target.closest('[data-compose]')) return M.openSheet();
    const b = e.target.closest('[data-tab]');
    if (b) goTab(b.dataset.tab);
  });

  $('scrim').addEventListener('click', () => M.closeSheet());
  $('veil').addEventListener('click', () => M.closeMemory());
  $('mcard').addEventListener('click', (e) => {
    const b = e.target.closest('[data-archive]');
    if (b) return openArchive(b.dataset.archive, { kind: 'slide' });
    // 记忆卡的容器铺满整屏：点在卡片和下面那一栏以外的地方，就是"轻点旁边"
    if (!e.target.closest('.mcard__note, .mcard__meta')) M.closeMemory();
  });
  $('pveil').addEventListener('click', (e) => { if (!e.target.closest('.poster') && !e.target.closest('.poster__bar')) hidePoster(); });
  $('posterX').addEventListener('click', hidePoster);
  doc.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('pveil').hidden) return hidePoster();
    if (!$('mcard').hidden) return M.closeMemory();
    if (M.sheetOpen()) return M.closeSheet();
  });

  const sheet = $('sheet');
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return M.closeSheet();
    const chip = e.target.closest('.chip[data-arc]');
    if (chip) {
      sheet.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === chip));
      return M.hap(8);
    }
    if (e.target.closest('[data-sense]')) {
      M.hap(10);
      $('fAmt').value = '12.5';
      $('fWhat').value = '拌面 扁肉';
      const b = e.target.closest('[data-sense]');
      b.classList.add('is-hit');
      b.innerHTML = U.icon('sense') + '<span>感应到了：沙县小吃 · ¥12.50</span><i>补一句吃了什么就行</i>';
      return M.toast('感应到了一笔支付');
    }
    if (e.target.closest('[data-save]')) return save();
  });

  /* ================= 启动 ================= */
  function fitStage() {
    if (innerWidth <= 560) { doc.documentElement.style.removeProperty('--fit'); return; }
    // 桌面窗口不够高时，整机等比缩小，保证整台手机都在视野里
    const k = Math.min(1, (innerHeight - 40) / 812, (innerWidth - 80) / 390);
    doc.documentElement.style.setProperty('--fit', Math.max(.6, k).toFixed(3));
  }
  function tick() {
    const n = new Date();
    $('clock').textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  (async function boot() {
    M.initPress();
    M.initObservers(app);
    M.initSheet();
    M.initParallax(app);
    sheet.innerHTML = U.sheet();
    syncChrome();
    const c = get('home');
    show(c.el);
    // 先把首屏用到的字体切片拉下来再显形，否则会先闪一下系统楷体
    if (doc.fonts && doc.fonts.load) {
      const sample = (c.el.textContent || '').replace(/\s+/g, '').slice(0, 500);
      await Promise.race([
        Promise.all([doc.fonts.load('16px "LXGW WenKai"', sample), doc.fonts.load('600 64px "Noto Serif SC"', '0123456789,')]).catch(() => {}),
        sleep(1500),
      ]);
    }
    M.observe(c.el);
    doc.documentElement.classList.add('is-ready');
    tick();
    setInterval(tick, 20000);
    addEventListener('resize', fitStage);
    fitStage();
  })();
})();
