# Paymory 项目指令（每次会话自动生效）

## 项目
Paymory = pay + memory。记录消费与陪伴的记忆应用：记忆（原子事件）+ 档案（任意泛化主体：店/宠物/物品/人/订阅/事件，完全来自生活），金额是可选维度。路线：一期网页版 → 二期小程序 → 三期安卓支付感应（NotificationListenerService，参考开源 SmartLedger / jizhang / AutoBookKeepingBeta）。

一期的正式代码在 `web/`：原生 HTML/CSS/JS，无构建、无框架、无第三方运行时。`prototype/` 是第一轮的交互原型（三个变体），只作归档，不再改动；它那套 ECharts 图表没有带进正式版。

## web/ 怎么读
- `index.html` 依次加载 `css/tokens → base → parts → journal → night → motion`，`js/data → stickers → ui → motion → main`。classic script + 全局 `PM` 命名空间，分层是数据 → 模板 → 动效 → 路由。
- 桌面是"深色桌面上摆一台手机"的展台；≤560px 去掉展台，整屏就是本子。
- 字体：界面用霞鹜文楷（web font，97 个 unicode-range 切片，在 `fonts/lxgw/`），大数字用 Noto Serif SC 600 的拉丁切片。不引外部字体。
- 颜色只从 `tokens.css` 取：墨三档、朱砂 `--red #B5432F`、纸、墨夜的金与奶白。淡墨 `--ink-3 #86765F` 用在要读的小字上（时间戳、贴纸下的天数），纸上对比度约 3.9:1，不要再调淡。
- 全部是演示数据，在 `js/data.js` 的 `PM.store` 里，"今天"取当天，不落库。

## 转场与入场的硬规矩
都是确定性逐帧验证踩出来的，改动前先看 `tools/motion-web.cjs` 的产出。

1. **页面这一层命名在 `.app` 上**（看得见的那一屏），不在 `.page` 上（整张长纸，四千多像素高）。状态栏、灵动岛各自命名，浮在页面上面。命错了，每次转场标签栏和状态栏都会被盖住，结束了才弹回来。
2. **转场期间屏幕上只能是快照。** 快照底下是一张不透明底图，不是活页面。所以每一帧都得有一张不透明页面快照盖满 `.app`：淡出型转场里旧页保持不透明、只退后压暗（`vtSink`），新页从上面浮上来；只有"收回"是旧页在上面散开（给旧图 `z-index: 1`，同组里新图默认压在旧图上面）。
3. **入场分两段**（`main.js` 的 `enter()`）：DOM 换上去那一刻 `M.stage()`——数字归零、屏里待入场的元素先走到 240ms 停住——快照拍的就是这个样子；转场结束 `M.observe()` 让它们落定、数字滚上去。不这么做，动画会在快照底下偷跑，转场一结束画面就跳。`.reveal` 默认是藏着的；新增带入场的元素必须带 `.reveal`（或 `.rv-s` / `.rv-a`），并且所在的页面要经过 `enter()`。
4. **共享元素两头都要命名，而且名字要在拍旧画面之前就在。** 贴纸 ↔ 封面叫 `hero`，列表便签 ↔ 大卡卡面叫 `mcard`。展开结束后撤了名的（封面），收回前要重新命名。新画面里原位置那张要撤名并 `visibility: hidden`，不然快照里原地还留着一张。
5. **新旧两张图交叉不能有缝。** 旧的匀速退、新的减速进，全程 .44–.46s。只让旧图 160ms 淡出，中间会闪一下空白。
6. **sheet 判速按最近 100ms 的采样算平均速度**；最后一次移动已经过去 80ms 以上，按停住处理。只看最后一次移动的瞬时速度，"拖一下、停住、再松手"会被当成甩。

## 动效参数（当前值）
- **按下**：`.is-down` 由 pointerdown/up 事件委托管理，勿用 `:active`（触屏上手指一动就丢）。120ms `--ease-io`；便签和拍立得 scale .96 + 摆正 + `brightness(.94)` + 影子收到 .06，小件 scale .94。**松手** 350ms `--ease-spring` 回弹。这套写在悬停媒体查询外面——手指没有悬停，按下是触屏唯一能摸到纸的时刻。
- **悬停**（仅 `hover: hover` 且 `pointer: fine`）：摆正、上浮 3px、影子 .44 变大变软，240ms `--ease-out`。
- **入场**：`noteIn` 500ms `--ease-out`，stagger 34ms；拍立得照片 `develop` 1.05s；红笔圈 `draw` 延迟 .55s。
- **转场**（View Transitions，`<html data-vt>` 选类型，规则在 `motion.css`）：`tab` 240ms；`mood` 500ms，旧页虚化压暗再散开，新页晚 120ms 透出；`push` / `pop` 350ms `--ease-io`，新页从右盖入、左缘带投影，旧页左让 26% 并压暗；`open` / `close` 350ms，hero 组 .46s `--ease-sheet`；`card` / `card-out` mcard 组 .44s，帘子 350ms，卡下面那一栏延迟 200ms 升起。
- **sheet**：500ms `--ease-sheet` 弹出，300ms 加速收起；拖拽超过高度三成或甩得够快（> .5px/ms）就收起，遮罩透明度跟手。
- **数字滚动**：easeOutExpo，`min(900, 420 + 位数 × 110)` ms，每一位定宽 `.56em`。
- **触觉** `navigator.vibrate`：换标签 8ms，按压/打开 10ms，保存 `[15, 40, 25]`；iOS 静默跳过。
- 四档时长 `--t1..t4` = 120 / 240 / 350 / 500ms；曲线 `--ease-out / in / io / spring / sheet`。
- **降级**：`prefers-reduced-motion` 时全部动画 .001ms，不走 View Transition。
- 动的只有 transform 和 opacity，两处有意的例外：按下的 brightness、墨夜转场里快照的 blur，都作用在已经栅格化的图层上。低端安卓真机上 blur 的帧率没有测过。

## 技能自动触发表（按阶段自动调用，无需用户指示）

| 触发时机 | 自动调用的 skill | 做什么 |
|---|---|---|
| 任何新建或修改界面/页面的任务，开始前 | `unslop`（视觉版） | 先写五行方向（Product/Character/World/Moments/Signature），按它定色板与排版 |
| 任何界面交付前 | `unslop`（视觉版） | 过一遍检查单，并跑 `node tools/grid-audit.cjs` 看间距；但色彩温度遵循手帐双轨制，unslop 的"克制单 accent"让位于票根/胶带/金墨世界，"去掉悬停位移和回弹"让位于上面的动效参数表（那是用户给定的） |
| 写 README / 文案 / 文档时 | `unslop`（写作版） | 去 AI 文风（无感叹号、无空洞词、无套话结论） |
| 真正的带坐标轴图表（建/改/调试） | `echarts` | 回望页目前不用它：数据图形是 CSS/SVG 手画的（墨迹条、100 点阵、12 月墨柱、时间线），一屏一件事。只有要上带坐标轴的图才引入；本地库在 `prototype/echarts.min.js`，勿走 CDN；容器非零尺寸再 init、一容器一实例、重渲染先 dispose |
| 任何界面/动效设计 | `animation-vocabulary` + `animation-performance` | ease-out、短时长、stagger 交错、只动 transform/opacity；与上面的参数表冲突时以参数表为准 |
| 网页版正式编码阶段 | `frontend-design` | 每次新建页面先过它的"AI 味特征清单"自检（奶油底 + 陶土橘、英文装饰眉注、同质卡片、全套 fade-slide 入场都是雷区）；红笔色用朱砂 #B5432F，勿回退陶土橘 #C76F5C |
| 动效/转场设计任务 | `ios-hig-design` + `animation-vocabulary` | 44pt 触控目标、返回按钮写上一页名、sheet 可下滑关闭、安全区 `env(safe-area-inset-*)`。`design-mobile-apps` 是付费 API 的封装，用不上，不要调 |
| 任何网页界面做完，交付或提交前 | `tools/` 的自检脚本（见下节） | 截图 → 用 Read 看图 → 修 → 重跑。动效只认步进器的帧，不认连拍 |
| 部署上线阶段 | `zcode-site:site-deploy` | 网页版发布 |

## 自检工具（`tools/`，开发用，不参与站点运行）
先起本地服务：`npx http-server . -p 8377 -s -c-1`（`-c-1` 关缓存，否则改了看不到），站点在 `http://127.0.0.1:8377/web/index.html`。

| 命令 | 做什么 | 产出 |
|---|---|---|
| `node tools/shots-web.cjs` | 23 张整页截图 | `tools/out/web/*.png`、`grid-1..3.jpg` |
| `node tools/motion-web.cjs` | 13 个转场与动效的确定性逐帧：转场内按毫秒步进，转场后再拍 560ms 的入场 | `tools/out/web-motion/*.png` |
| `node tools/shots-mobile.cjs` | 手机全屏形态 6 张 | `tools/out/web-mobile/grid.jpg` |
| `node tools/poster-test.cjs` | "存成一张卡片"全流程，并导出总览、单档案两张海报原图 | `tools/out/web/poster-*.png` |
| `node tools/grid-audit.cjs`（加 `--plan` 给改法） | 列出不在 4px 网格上的 padding / margin / gap | 终端输出 |
| `node tools/genimg.cjs [name…]` | 用 Pollinations 生成示例照片，每张间隔 50 秒（它限每 IP 每 45 秒一张） | `web/img/*.jpg` |

- **动效验收只用步进器**（`tools/lib.cjs` 的 `installStepper`）：转场一开始就暂停页面上所有动画，再按毫秒拨 `currentTime`，拨一下截一帧。连拍截图和 CDP screencast 在 View Transition 期间都不可靠——前者会给出"看起来没问题"的假帧，后者干脆不出帧。2026-11-23 那轮用连拍"验证通过"的便签展开，实际上大卡根本没参与转场，是一天后换步进器才看出来的。
- `tools/lib.cjs` 把全局 npm 里的 playwright、sharp 加进模块路径，浏览器用 playwright-cli 装的 chromium。`playwright-cli` 仍可临时查看页面，注意它的 `eval` 只接受单个表达式。

## 约定
- 金额、日期、时间一律 `tabular-nums`；月和日都补零（`03.03`）。
- 间距走 4px 网格；小控件内部允许 2px 微调，恰好居中的奇数值保留。新写的间距先过 `grid-audit`。
- 界面禁止 emoji 当图标（贴纸是 SVG 插画，不是 emoji）；日常页一个红笔色朱砂 #B5432F，夜页用金 #E6C684。
- 源码一律用 Write / Edit 写，Bash 写源码会被 Mimosa 钩子拦。
- 账单 CSV 解析参考开源：KeepAccounts_v2.0、alipay2moneywiz（微信/支付宝账单格式与解析规则）。
- 提交、推送只在用户要求时做。
