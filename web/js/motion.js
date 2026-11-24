// Paymory · 动效层：按压与抬起、页面转场（View Transitions）、便签展开、sheet 拖拽、滚动入场、数字滚动
// 原则：只动 transform 和 opacity；过渡用 CSS（不占主线程）；拖拽时直接写 transform，不走会继承的 CSS 变量
window.PM = window.PM || {};
PM.motion = (function () {
  const doc = document;
  const M = {};
  const $ = (id) => doc.getElementById(id);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeVT = null;
  let io = null;
  let cio = null;
  let hideTimer = 0;
  let toastTimer = 0;

  /** 触觉：切换 8ms，按压 10ms，成功 [15,40,25]。iOS Safari 没有 vibrate，静默跳过 */
  M.hap = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* 不支持就算了 */ } };

  /* ================= 按压：按下快、松手弹 =================
     用事件委托加 is-down，不用 :active —— 触屏上手指一动 :active 就丢了，按住会闪 */
  M.initPress = function () {
    doc.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      const el = e.target.closest('.pressable');
      if (el) el.classList.add('is-down');
    });
    const up = () => doc.querySelectorAll('.pressable.is-down').forEach((el) => el.classList.remove('is-down'));
    ['pointerup', 'pointercancel'].forEach((ev) => doc.addEventListener(ev, up, true));
    window.addEventListener('blur', up);
  };

  /* ================= View Transitions ================= */
  M.name = (el, n) => { if (el) el.style.viewTransitionName = n; };
  M.unname = (el) => { if (el) el.style.viewTransitionName = ''; };

  /** 把一次 DOM 更新包进 View Transition。type 写到 <html data-vt>，CSS 按它挑转场 */
  let live = false;   // 最近一次 vt 是不是真的走了转场（不支持或系统设了"减少动态效果"时直接更新）
  M.vt = function (type, update) {
    doc.documentElement.dataset.vt = type;
    live = !!doc.startViewTransition && !reduced();
    if (!live) { update(); return Promise.resolve(); }
    if (activeVT) { try { activeVT.skipTransition(); } catch (e) { /* 已经结束 */ } }
    const t = doc.startViewTransition(update);
    activeVT = t;
    return t.finished.catch(() => {}).then(() => { if (activeVT === t) activeVT = null; });
  };
  M.isLive = () => live;

  /* ================= 滚动入场与数字 ================= */
  M.initObservers = function (root) {
    io = new IntersectionObserver((list) => {
      for (const en of list) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { root, rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    cio = new IntersectionObserver((list) => {
      for (const en of list) if (en.isIntersecting) { M.countUp(en.target); cio.unobserve(en.target); }
    }, { root, threshold: 0.5 });
    // 一次性动画播完后把终态钉进内联样式，再撤掉动画本身。
    // 页面被摘下再挂回来（切标签）时 CSS 动画会从头重播，这样做就不会。
    // 便签自己的位移不能钉：它的终态就是基础样式，钉死就没法按压和抬起
    root.addEventListener('animationend', (e) => {
      const el = e.target;
      const cs = getComputedStyle(el);
      if (e.animationName !== 'noteIn') {
        el.style.opacity = cs.opacity;
        el.style.strokeDashoffset = cs.strokeDashoffset;
        if (!el.closest('.pressable')) { el.style.transform = cs.transform; el.style.filter = cs.filter; }
      }
      el.classList.add('anim-done');
      el.classList.remove('reveal');
    });
  };

  /** 页面挂上来之后调用：还没入场的元素开始观察，还没起滚的数字开始观察。转场里停在中途的入场从这里接着播 */
  M.observe = function (scope) {
    scope.querySelectorAll('[data-staged]').forEach((el) => {
      delete el.dataset.staged;
      el.getAnimations({ subtree: true }).forEach((a) => { if (a.playState === 'paused') a.play(); });
    });
    scope.querySelectorAll('.reveal:not(.in), .rv-s:not(.in), .rv-a:not(.in)').forEach((el) => io.observe(el));
    M.prime(scope);
    scope.querySelectorAll('.cnt[data-count]:not([data-done])').forEach((el) => cio.observe(el));
    scope.querySelectorAll('.rv-key').forEach(splitKeyword);
  };

  /** 转场用。新页面是一张静止的快照，拍到什么、转场期间就一直是什么：
      拍"还没入场"的话，页面上会先空一阵；拍"已经入场"的话，转场结束后又没得动。
      所以把屏里看得见的待入场元素先走到入场的中途（八成左右）停住，拍下来；
      转场结束后 M.observe() 让它们把剩下那一点落定。屏外的照旧等滚动 */
  const STAGE_MS = 240;
  M.stage = function (scope) {
    if (!io) return;
    M.prime(scope);
    const box = io.root.getBoundingClientRect();
    const limit = box.bottom - box.height * 0.06;
    scope.querySelectorAll('.reveal:not(.in), .rv-s:not(.in), .rv-a:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= box.top || r.top >= limit) return;
      el.classList.add('in');
      el.dataset.staged = '1';
    });
    // getAnimations 会先算一遍样式，入场动画这时才真的建出来；建出来就停在中途
    scope.querySelectorAll('[data-staged]').forEach((el) => {
      el.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = STAGE_MS; });
    });
  };

  /** 把还没起滚的数字先归零。
      推页型转场里新页面是一张不透明的静止快照：快照拍到 0、转场结束后数字从 0 滚上去，两段才接得上；
      拍到终值的话，转场一结束数字会先跳回 0 再滚 */
  M.prime = function (scope) {
    scope.querySelectorAll('.cnt[data-count]:not([data-done])').forEach((el) => {
      if (el.dataset.prime) return;
      el.dataset.prime = '1';
      const target = Number(el.dataset.count) || 0;
      el.innerHTML = ((el.dataset.prefix || '') + target.toLocaleString('zh-CN')).replace(/\d/g, '<i>0</i>');
    });
  };

  /** 数字滚动：easeOutExpo，600–900ms。每一位数字占一个定宽小格，滚动时不抖 */
  M.countUp = function (el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    const target = Number(el.dataset.count) || 0;
    const text = (el.dataset.prefix || '') + target.toLocaleString('zh-CN');
    if (!el.querySelector('i')) el.innerHTML = text.replace(/\d/g, '<i>0</i>');
    const cells = [...el.querySelectorAll('i')];
    const n = cells.length;
    const dur = reduced() ? 0 : Math.min(900, 420 + n * 110);
    const paint = (v) => {
      const s = String(v).padStart(n, ' ');
      for (let i = 0; i < n; i++) cells[i].textContent = s[i].trim();
    };
    if (!dur) { paint(target); return; }
    const t0 = performance.now();
    paint(0);
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      paint(Math.round(target * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))));
      if (p < 1) requestAnimationFrame(step);
      else el.classList.add('is-set');
    };
    requestAnimationFrame(step);
  };

  /** 关键词逐字出现：一个字一个 span，CSS 按 --i 错开 */
  function splitKeyword(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    el.innerHTML = [...el.textContent].map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  }

  /* ================= 便签展开成记忆卡 =================
     转场里各自命名的是：列表里那张便签（旧）→ 大卡的卡面（新），名字都叫 mcard，所以是同一张纸长出来的。
     新画面里列表那张便签要让位：撤名并先藏起来。不藏的话快照里原地还留着一张，看起来像是复制了一张拿走。
     卡下面那一栏（mcardfoot）和帘子（veil）在 CSS 里命名，它们浮在页面上面 */
  let stash = null;   // 被藏起来的那张列表便签

  /** 记忆卡没经过 closeMemory 就被关掉时（比如点"翻开档案"）调用：归还藏起来的便签、撤掉卡面的名字 */
  M.resetMemory = function () {
    const card = $('mcard');
    M.unname(card.querySelector('.mcard__note'));
    if (stash) { stash.style.visibility = ''; M.unname(stash); stash = null; }
  };

  M.openMemory = function (id, el) {
    const card = $('mcard');
    if (!card.hidden) return;
    M.hap(10);
    M.resetMemory();
    card.innerHTML = PM.ui.memoryCard(PM.store.getMemory(id));
    if (el) {
      // 转场前先把便签摆正（关掉过渡，立即生效），快照才不会带着倾斜去变形
      el.style.transition = 'none';
      el.style.setProperty('--r', '0deg');
      M.name(el, 'mcard');
      void el.offsetWidth;
    }
    M.vt('card', () => {
      $('veil').hidden = false;
      card.hidden = false;
      M.name(card.querySelector('.mcard__note'), 'mcard');
      if (el) { M.unname(el); el.style.visibility = 'hidden'; stash = el; }
    }).then(() => {
      if (!el) return;
      el.style.transition = '';
      void el.offsetWidth;
      el.style.removeProperty('--r');
    });
  };

  M.closeMemory = function () {
    const card = $('mcard');
    if (card.hidden) return;
    M.hap(8);
    const holder = card.querySelector('[data-id]');
    const id = holder ? holder.dataset.id : '';
    let target = null;
    M.vt('card-out', () => {
      M.unname(card.querySelector('.mcard__note'));
      $('veil').hidden = true;
      card.hidden = true;
      if (stash) { stash.style.visibility = ''; M.unname(stash); stash = null; }
      target = PM.main.findCard(id);
      if (target) {
        target.style.transition = 'none';
        target.style.setProperty('--r', '0deg');
        M.name(target, 'mcard');
        void target.offsetWidth;
      }
    }).then(() => {
      if (!target) return;
      M.unname(target);
      target.style.transition = '';
      void target.offsetWidth;
      target.style.removeProperty('--r');        // 带着回弹曲线歪回去，像被放回原处后自己落定
    });
  };

  /* ================= 底部 sheet（贴一张） ================= */
  M.sheetOpen = () => $('screen').classList.contains('is-sheet');

  M.openSheet = function () {
    const el = $('sheet');
    M.hap(10);
    clearTimeout(hideTimer);
    el.scrollTop = 0;
    el.hidden = false;
    void el.offsetWidth;                      // 先按"在屏幕外"的样式排一帧，接下来的位移才有起点
    $('screen').classList.add('is-sheet');
  };

  M.closeSheet = function () {
    const el = $('sheet');
    const screen = $('screen');
    if (!screen.classList.contains('is-sheet')) return;
    screen.classList.remove('is-sheet');      // 类一移除，transition 换成 300ms 加速曲线，从当前位置滑出
    el.style.transform = '';
    hideTimer = setTimeout(() => { if (!screen.classList.contains('is-sheet')) el.hidden = true; }, 360);
  };

  M.initSheet = function () {
    const el = $('sheet');
    const scrim = $('scrim');
    // trail 是最近 100ms 内的几个采样点，甩动速度按这段位移算。只看最后一次移动的瞬时速度不行：
    // 手指停住时不会再有移动事件，速度就一直是停下之前的那个值，"拖一下、停住、再松手"会被当成甩
    const drag = { on: false, y0: 0, dy: 0, t: 0, trail: [] };
    const interactive = (t) => !!t.closest('input, textarea, button, select, a, label');

    const begin = (y) => {
      drag.on = true; drag.y0 = y; drag.dy = 0; drag.t = performance.now();
      drag.trail = [{ y, t: drag.t }];
      el.style.transition = 'none';
      scrim.style.transition = 'none';
    };
    const move = (y) => {
      if (!drag.on) return;
      drag.dy = y - drag.y0;
      if (drag.dy < 0) drag.dy *= .12;        // 往上拽过头顶：橡皮筋阻尼
      const now = performance.now();
      drag.trail.push({ y, t: now });
      while (drag.trail.length > 2 && now - drag.trail[0].t > 100) drag.trail.shift();
      el.style.transform = 'translate3d(0,' + drag.dy.toFixed(1) + 'px,0)';
      scrim.style.opacity = String(Math.max(0, 1 - drag.dy / (el.offsetHeight * .7)));
    };
    const end = () => {
      if (!drag.on) return;
      drag.on = false;
      const tr = drag.trail;
      const a = tr[0], b = tr[tr.length - 1];
      // 最后一次移动已经过去 80ms 以上，说明手指是停住了才松开的，不算甩
      const vel = b.t - a.t > 0 && performance.now() - b.t < 80 ? (b.y - a.y) / (b.t - a.t) : 0;
      const close = drag.dy > el.offsetHeight * .3 || vel > .5;   // 拉过三成，或者甩得够快
      el.style.transition = '';
      scrim.style.transition = '';
      scrim.style.opacity = '';
      drag.dy = 0; drag.trail = [];
      if (close) M.closeSheet();
      else {
        el.style.transition = 'transform .44s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
        el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
      }
    };

    // 鼠标和触控笔：走 pointer 事件
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || interactive(e.target) || el.scrollTop > 0 || !M.sheetOpen()) return;
      begin(e.clientY);
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') move(e.clientY); });
    const pointerEnd = (e) => { if (e.pointerType !== 'touch') end(); };
    el.addEventListener('pointerup', pointerEnd);
    el.addEventListener('pointercancel', pointerEnd);

    // 手指：原生滚动会抢走 pointer 事件，所以用可以 preventDefault 的 touch 事件
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || interactive(e.target) || el.scrollTop > 0 || !M.sheetOpen()) return;
      begin(e.touches[0].clientY);
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (!drag.on) return;
      const y = e.touches[0].clientY;
      if (y - drag.y0 < -6) { drag.on = false; el.style.transition = ''; scrim.style.transition = ''; return; }   // 往上：交给内容滚动
      if (y - drag.y0 > 4) e.preventDefault();
      move(y);
    }, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
  };

  /* ================= 其它 ================= */
  M.toast = function (msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2400);
  };

  /** 首屏拍立得随滚动慢一点移动（视差），rAF 节流，直接写 transform */
  M.initParallax = function (root) {
    let raf = 0;
    root.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const p = root.querySelector('.parallax');
        if (p && !reduced()) p.style.transform = 'translate3d(0,' + Math.min(44, root.scrollTop * .16).toFixed(1) + 'px,0)';
      });
    }, { passive: true });
  };

  return M;
})();
