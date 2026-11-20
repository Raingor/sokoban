# 小小仓库实施计划

- [x] 阅读根计划、隔离写入范围、加载 frontend-design；Node v24.18.0，5179/4179 初查空闲。
- [x] 独立 Vite / TypeScript / Vitest / Playwright 配置，严格 TS、相对 base、独立 lock。
- [x] 12 个原创递进关卡、纯规则引擎、逐步解序列验证。
- [x] 温暖仓库界面、键盘与触屏、撤销/重置/选关/规则/本地记录。
- [x] 73/73 单测、严格 TS 构建通过；开发与生产 Chrome 各 51/51 浏览器验收通过，截图完成。
- [x] 实录文档、向主 Agent 回报并冻结；Git / workflow / 发布由主 Agent 处理。Chrome 移动触屏上下文验收，不声称实体手机测试。

原版已由主 Agent 发布，以上为原版历史验收。没有自行执行 Git、workflow、commit、push、deploy、Artifact、memory 或派发 Agent。

## 新增19角色陪伴员

- [x] 只读源目录，复制19张WebP到本项目public；逐字节校验通过，无全身图/PNG/Three。
- [x] 独立characters.ts/css；显眼暖仓库名牌、全名、原生details的19角色选择。
- [x] 独立安全存储、非法id默认、aria-pressed/name/alt、焦点、Esc与选择后收起，不改变游戏状态。
- [x] 新增角色单测；实际89/89测试与严格构建通过。
- [x] 新增独立GAME_URL角色浏览器脚本并通过语法检查，更新实录，新增代码冻结交回。
- [ ] 主 Agent 错峰实跑角色浏览器脚本及原游戏回归（本轮未启动浏览器）。
- [ ] 主 Agent 统一Git/Pages发布与新版线上验收。

主 Agent 验收命令：`GAME_URL=http://localhost:4179 node scripts/characters-smoke.mjs`，以及 `GAME_URL=http://localhost:4179 npm run test:browser`。历史51项浏览器/线上通过不代表新增角色版已通过。
