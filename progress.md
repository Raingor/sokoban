# 推箱子实施实录

## 2026-11-20 · 范围与骨架

- 只写 `/Users/mac-2312-r/workspace/wwwroot/M-projects/sokoban/`；根计划及 game-2048 少量配置/浏览器脚本只读。
- 加载 frontend-design，确定「小小仓库」：奶油纸、松绿石墙、立体原木箱、圆形虚线泊位、原创 CSS 搬运员。
- Node v24.18.0；5179/4179 初查、启动前复查均无已有监听。独立依赖安装/lock，安装审计 0 vulnerabilities。
- Vite 相对 base、严格 TypeScript、统一五条 scripts 与 strictPort 配置完成。
- 已向主 Agent 发出骨架节点回报。

## 规则与界面

- 12 个原创关卡，单箱 3 关、双箱 5 关、三箱 4 关，包含柱子、双侧通道、窄门、货架与换位规划。
- 离线创作验证生成测试用合法解序列；产品不包含在线求解器，不导入测试解，不提供全局游戏状态或作弊入口。
- 引擎与 DOM/存储隔离；地形、箱子、角色分离；DOM 地面/墙/目标/实体独立图层。
- 实现合法移动/推箱、目标保留、全部归位才胜利、移动/推箱计数、无限撤销、重置确认、规则、选关、下一关。
- 版本化本地进度校验与存储异常降级；只保存选关和每关最佳，不保存中局。
- 首次单测发现「角色离开目标」测试夹具误放两个目标而只有一个箱子；修正测试夹具后全部通过，产品规则未绕过校验。
- 已向主 Agent 发出规则/界面节点回报。

## 最终实际验收

以下在最终图层调整后重跑：

1. `npm test`：2 个测试文件，73/73 单测通过。
2. `npm run build`：tsc --noEmit + Vite 构建通过。
3. `npm run test:browser`：独立 Google Chrome，开发 http://localhost:5179，51/51 通过。
4. `GAME_URL=http://localhost:4179 npm run test:browser`：独立 Google Chrome，生产 preview，51/51 通过。

浏览器共 102 项通过：1440×900、390×844 Chrome 移动触屏上下文、360px 无横向溢出；规则弹窗/焦点圈/焦点恢复；棋盘之外方向键不干扰；Z/按钮逐步撤销；取消/确认/快速重置；12 关真实键盘解序列；第 7 关双箱窄门在独立 Chrome 的 isMobile / hasTouch 上下文通过 Playwright tap 完成 30 步，不是实体手机测试；通关下一关、完成/最佳刷新保留；最后一关无不存在的下一关；reduced-motion；存储禁用、JSON损坏、不支持版本、非法字段。pageerror/console/HTTP错误均为 0。

截图：`artifacts/dev/` 与 `artifacts/preview/`，含桌面/390/360/首关胜利/末关胜利/选关各 6 张及结果 JSON。按全局要求调用 magpie-vision 审阅桌面/手机截图，两次均 50 秒超时；随后直接读取截图完成视觉核查，棋盘、箱子、泊位及触屏方向控件无明显遮挡或横向溢出。视觉工具超时不影响实际 Chrome 验收。

## 冻结交回

- 已向主 Agent 回报双态验收结果，代码功能冻结，供独立复核。
- 开发服务 5179 与生产 preview 4179 继续运行，未停止其他服务。
- 没有执行 Git、workflow、commit、push、deploy、Artifact、memory，也没有派发 Agent。
- 没有已知功能阻塞；不做完备死锁检测、不做在线求解、不保存中局是本轮明确边界。

## 主 Agent 独立验收与Pages发布
- 独立73单测、严格构建与生产preview 51检查通过；magpie-vision核对390截图无溢出或遮挡。
- 仓库：https://github.com/Raingor/sokoban ，首次提交 `8f73855`。
- 工作流 https://github.com/Raingor/sokoban/actions/runs/44718772032 成功。
- 站点：https://raingor.github.io/sokoban/ ，HTTP200；线上51/51浏览器检查通过，实际完成12关键盘序列及触屏多箱关卡。
- 无pageerror/console/HTTP错误；线上截图与报告在被忽略的 `artifacts/online/`。

## 2026-11-20 · 新增19位仓库陪伴员（与上述原版历史验收分开）

- 收到主 Agent 新任务后仅修改 sokoban/，读取 xiaoxiaole/src/catalog.ts 的19人物；只复制19个 characters-2d/<id>.webp 到本项目 public，合计682,082字节，逐字节一致。没有复制全身图、PNG或Three，没有兄弟运行时依赖。
- 新增独立 characters.ts / characters.css，在标题下用暖色名牌呈现当前头像、完整名字和「今日陪伴员」；原生 details/summary 展开19角色网格，不新增dialog、不覆盖棋盘、不替换原搬运员。
- 所有角色按钮具有aria-label/aria-pressed、图像alt、可见焦点；选完收起，Esc收起恢复summary焦点。选择模块不接触规则或当前局面，方向键不会误走。
- 独立版本化角色存储，try/catch覆盖访问/读写异常；坏JSON、非法id、错误版本回默认角色，写失败会提示且本次仍可选择。
- 新增 characters.test.ts，实际 npm test **89/89通过**；npm run build **严格TS+Vite通过**。node --check scripts/characters-smoke.mjs通过。
- 新增 scripts/characters-smoke.mjs：独立Chrome/GAME_URL，19图解码与所有角色选择、键盘/触屏/Esc、进度不重置、刷新、异常存储、360无溢出及截图。**遵照主 Agent 错峰安排，本轮没有启动浏览器，没有执行该脚本，未生成角色验收截图，不声称新版线上通过。**
- README、task_plan同步区分历史和新版结果。新增角色代码冻结交回；由主 Agent 跑角色脚本与原玩法回归，再统一Git/Pages。本轮无Git/推送/发布/memory，也未改其他游戏或根计划。

## 主Agent人物版发布验收（2026-11-20）
- 代码提交 `76e468e` 已推送main，Pages工作流 https://github.com/Raingor/sokoban/actions/runs/44733738922 成功。
- 主Agent独立单测与生产构建通过；本地与线上均通过 26 项人物检查和 51 项完整玩法回归。
- 线上地址 https://raingor.github.io/sokoban/ ，全部19张头像加载、选择与刷新保存、键盘与360px手机、存储异常降级通过；无页面、控制台或HTTP资源错误。
- 新版已上线，上文子Agent“未启动浏览器/待主Agent发布”仅为历史交接状态；截图和JSON位于忽略的artifacts目录，不提交构建/凭据。
