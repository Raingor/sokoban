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
