# Paymory 项目指令（每次会话自动生效）

## 项目
Paymory = pay + memory。记录消费与陪伴的记忆应用：记忆（原子事件）+ 档案（任意泛化主体：店/宠物/物品/人/订阅/事件，完全来自生活），金额是可选维度。路线：一期网页版（原型 prototype/index.html 含 3 变体待选）→ 二期小程序 → 三期安卓支付感应（NotificationListenerService，参考开源 SmartLedger / jizhang / AutoBookKeepingBeta）。

## 技能自动触发表（按阶段自动调用，无需用户指示）

| 触发时机 | 自动调用的 skill | 做什么 |
|---|---|---|
| 任何新建或修改界面/页面的任务，开始前 | `unslop`（视觉版） | 先写五行方向（Product/Character/World/Moments/Signature），按它定色板与排版 |
| 任何界面交付前 | `unslop`（视觉版） | 过一遍 unslop 检查单（间距 4px 网格、tabular-nums 等）；但色彩温度遵循 paymory-visual-taste 的手帐双轨制，unslop 的"克制单 accent"让位于票根/胶带/金墨世界 |
| 写 README / 文案 / 文档时 | `unslop`（写作版） | 去 AI 文风（无感叹号、无空洞词、无套话结论） |
| 任何图表任务（建/改/调试） | `echarts` | 容器非零尺寸再 init、一容器一实例、重渲染先 dispose、动画中截图会半截；本地库 prototype/echarts.min.js（勿走 CDN） |
| 任何界面/动效设计 | `animation-vocabulary` | 动效原则：ease-out、短时长、stagger 交错、只动 transform/opacity |
| 任何网页界面做完，交付或提交前 | `playwright-cli` | 起本地服务（`npx http-server -p 8377 -s`）→ goto → 截图 → 用 analyze_image 审视布局/溢出/对比度 → 修复后重截验证。注意 `playwright-cli eval` 只接受单个表达式，多语句会静默失败 |
| 网页版正式编码阶段 | `anthropics frontend-design` | 已装（用户在辅助会话补装）。每次新建页面先过它的"AI 味特征清单"自检（奶油底+陶土橘、英文装饰眉注、同质卡片、全套 fade-slide 入场等都是雷区）；红笔色用朱砂 #b5432f（勿回退陶土橘 #c76f5c，与 AI 默认色撞车） |
| 动效/转场设计任务 | `ios-hig-design` + `design-mobile-apps` + `animation-vocabulary` | 已装。动效参数基线（2026-11-24 辅助对话《Apple 标准参数清单》v2，已全部落地）：**按下快（120ms standard scale .96/brightness .94，小件 .92）+ 松手弹（350ms 回弹 cubic-bezier(.34,1.56,.64,1)）**——is-down 类由 pointerdown/up 事件委托管理，勿用 :active；入场 ease-out 减速曲线 cubic-bezier(.22,1,.36,1)（240ms，stagger 24ms×10 项）；页面转场 350ms **带方向**（old 视差退场 ease-in / new 迎面 ease-out，--vtx 前进 24px 返回 -24px）；sheet 500ms 弹出 / 300ms 加速收起（closing 类）/ 拖拽判速（dy>H×0.3 或 vel>0.5px/ms）+ 遮罩 opacity 联动；count-up 用 easeOutExpo 600-900ms + 落值脉冲；FAB 打开时 rotate(39deg)；触觉 navigator.vibrate（tab 10ms/chip 8ms/保存 [15,40,25]，iOS 静默跳过）；四档时长制 120/240/350/500 |
| 部署上线阶段 | `zcode-site:site-deploy` | 网页版发布 |

## 约定
- prototype/index.html 是 throwaway：用户选定变体后，正式版另起目录（如 web/），把胜出方案重写为正式代码，原型按 prototype skill 规矩删除或归档
- 金额一律 tabular-nums 等宽数字；界面禁止 emoji 当图标；一个 accent 色（票根世界：朱砂红）
- 账单 CSV 解析参考开源：KeepAccounts_v2.0、alipay2moneywiz（微信/支付宝账单格式与解析规则）
