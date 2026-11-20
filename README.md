# 小小仓库 · 推箱子

独立的中文 Web 推箱子。奶油纸面、松绿色仓库、原创 CSS 木箱与搬运员；没有账号、联网服务、外部字体或素材请求。

## 仓库与在线试玩

- GitHub：https://github.com/Raingor/sokoban
- GitHub Pages：https://raingor.github.io/sokoban/ （首次发布与线上验收进行中）
- main 推送自动测试全部关卡与规则，执行类型检查、构建并发布 Pages。

## 启动与验证

环境：Node 24（本次使用 v24.18.0），npm。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run test:browser
GAME_URL=http://localhost:4179 npm run test:browser
```

- 开发：`http://localhost:5179/`
- 生产预览：`http://localhost:4179/`
- 两个端口都启用 `strictPort`；被占用时明确报错，不自动换端口，也不终止其他服务。
- `build` 先执行严格 TypeScript 检查，再由 Vite 打包。
- `base: './'`，可部署到静态子路径；GitHub Pages 的 workflow 和正式发布由主 Agent 统一添加，此目录没有自行创建 workflow 或发布。
- 浏览器测试使用独立 Chrome 上下文，不接管日常浏览器登录态；需要本机安装 Google Chrome。
- `GAME_URL` 可指定开发、生产 preview 或已发布站点；测试不依赖 Vite `/src` 路径或产品作弊入口。

## 怎么玩

把全部木箱推到圆形目标泊位上。箱子归位后显示 ✓，木箱和泊位不只用颜色区分。

- 点棋盘后，用方向键或 WASD 移动；手机点方向按钮。
- 一次只走一格、只推一只相邻箱子，不能穿墙、拉箱或连推。
- 每次合法移动计 1 步；其中推箱动作另计次数。撞墙、被箱子挡住等无效输入不计步。
- 「撤销」或棋盘获得焦点时按 Z，可无限逐步退回，包括最后的通关一步。
- 「重置」重新开始当前关卡，已有步数时先确认；「选择关卡」可自由进入任意一关。
- 全部箱子归位才完成，之后可进入下一间；第 12 关提供全部关卡入口。
- 不限时、不惩罚，不实现完备死锁检测或在线求解器；推入死角时请撤销或重置。

12 个原创关卡从单箱起步，逐步增加双箱、三箱、柱子、窄门与绕行货架。难度是体验性编排，不声称严格的数学难度排序。后段不是全部一推即过的教学关；测试解包含多次换位与多箱规划。

## 本地记录

独立版本 key：`puzzle-sokoban-v1`。

只保存版本、所选关卡、每关最佳步数；最佳成绩存在即代表已完成。不保存中途局面或撤销历史，刷新从所选关卡起点开始。完成后撤销不会抹去已获得的完成记录。

JSON 解析、版本、关卡 id、最佳步数字段均校验；损坏数据、非法字段、不支持版本或存储异常安全降级。禁用存储时当次会话仍可完整游戏并显示提示，不保存任何账号或敏感信息。

## 结构

- `src/engine.ts`：纯规则、地图解析/封闭与连通校验、状态、计数、胜利、撤销；无 DOM / 存储依赖。
- `src/levels.ts`：12 个原创关卡，地形与角色/箱子初始化数据分离。
- `src/main.ts`：DOM、聚焦范围内的键盘输入、方向按钮、规则/选关/重置弹窗、结算。
- `src/style.css`：原创暖仓库视觉，地面/墙/目标/实体独立图层，可见焦点与 reduced-motion。
- `src/storage.ts`：版本化进度与异常降级。
- `src/engine.test.ts`、`src/storage.test.ts`：73 个单测。
- `src/solutions.json`：只供单测与浏览器测试使用的关卡合法解，不由产品代码导入，不打包为 UI 作弊入口。
- `scripts/smoke.mjs`：真实 Chrome 键盘与触屏验收、错误采集与截图。

## 已实跑的验收（2026-11-20）

| 命令 | 结果 |
| --- | --- |
| `npm test` | 73/73 通过，含每个关卡每一步合法性与最终通关 |
| `npm run build` | 严格 TS + Vite 生产构建通过 |
| `npm run test:browser` | 开发 5179，51/51 检查通过 |
| `GAME_URL=http://localhost:4179 npm run test:browser` | 生产 preview 4179，51/51 检查通过 |
| `npm install` 安装审计 | 0 vulnerabilities |

浏览器覆盖 1440×900 桌面、390×844 Chrome 移动触屏上下文（isMobile / hasTouch + Playwright tap）、360px 最宽关卡与 reduced-motion；真实键盘完成全部 12 关，在该 Chrome 触屏上下文完整完成双箱窄门关。没有进行实体手机测试。规则弹窗焦点/关闭恢复、棋盘范围键盘接管、撤销/重置/选关/下一关、刷新进度、禁用/损坏/非法存储全部通过。没有 pageerror、console error 或资源 HTTP 错误。

截图和 JSON 结果在被忽略的 `artifacts/dev/` 与 `artifacts/preview/`，每组包括：

- `desktop-1440.png`
- `mobile-390.png`
- `mobile-360-reduced-motion.png`
- `victory-first.png`、`victory-final.png`
- `level-picker.png`
- `smoke-results.json`

当前功能已冻结，等待主 Agent 独立复核并配置发布。已知范围限制仅为上述不保存中局、不做死锁检测/在线求解；没有待修复的已知功能阻塞。
