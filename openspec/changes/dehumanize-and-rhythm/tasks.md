## 1. 基础架构与数据层

- [x] 1.1 创建 `src/data/terminology.ts` 术语映射函数和 `getPhase(level)` 阶段计算函数
- [x] 1.2 创建 `src/data/endings.ts` 4个结局的文案数据 + `selectEnding(humanityScore)` 选择函数
- [x] 1.3 给 save state 添加 `humanityScore: number`（默认100），在 `App.tsx` 的 GameSave interface 中新增字段
- [x] 1.4 重写 `src/data/missions.ts` 20关完整数据（SCP编号/名称/难度/targetProgress/bonusColors/maxMoves/narrativeBeat/casualtyEstimate/rewardText）

## 2. 战报面板修复（快速修复）

- [x] 2.1 在 `src/index.css` 中为 `.battle-log-list` 添加 `max-height: 60vh; overflow-y: auto`
- [x] 2.2 在 `src/index.css` 中为 `.battle-log-panel` 添加 `overflow: hidden` 防止突破

## 3. 收容进度百分化

- [x] 3.1 在 `App.tsx` 的 return 渲染部分，将进度条文字从 `{totalProgress}/{mission.targetProgress}` 改为 `{Math.round((totalProgress / (mission.targetProgress || 1)) * 100)}%`
- [x] 3.2 进度条宽度计算保持不变（已经是百分比），仅修改显示文字

## 4. 推荐工种描边高亮

- [x] 4.1 在 `src/components/PieceToken.tsx` 中，当 `isTargetColor` 为 true 时添加 `.bonus-glow` className
- [x] 4.2 在 `src/index.css` 中实现 `.bonus-glow` 的 CSS `box-shadow` 脉冲动画
- [x] 4.3 移除现有的 opacity 降低逻辑

## 5. 工种被动效果系统

- [x] 5.1 在 `src/data/colorBonuses.ts` 中新增 `ColorPassiveResult` 接口和 `calculateColorPassive(color, matchCount, comboLevel)` 函数
- [x] 5.2 在 `App.tsx` 的 `processMatches` 中调用被动效果计算，应用蓝色(+1步)、绿色(折损↓)效果
- [x] 5.3 实现红色被动
- [x] 5.4 实现橙色被动
- [x] 5.5 实现紫色被动
- [x] 5.6 被动触发时显示浮动文字提示（复用 speechBubbles 机制或新增 passiveFloat state）

## 6. 去人格化演进系统

- [x] 6.1 改造 `src/data/professions.ts` 的 `generateFullProfile()` — 接受 phase 参数，4阶段返回不同格式的档案数据
- [x] 6.2 在 `App.tsx` 中 hover 回调传入当前 phase，更新 profile panel 渲染逻辑（4种布局）
- [x] 6.3 在 `App.tsx` 中所有 UI 文案调用 `getTerm()` 替换硬编码的"人员""阵亡"等词汇
- [x] 6.4 战报 `addLogEntry()` 使用 `getTerm()` 生成阶段适配文案

## 7. 邮件系统重构

- [x] 7.1 重写 `src/data/emails.ts` — 20封叙事邮件（含 unlockLevel/from/subject/body/narrativeCritical/humanityBonus 字段）
- [x] 7.2 在 `App.tsx` 中新增 `showEmailModal` / `selectedEmailId` state
- [x] 7.3 实现邮件 Modal 组件 — 全屏 overlay，左侧列表+右侧阅读区，close 按钮
- [x] 7.4 在 `src/index.css` 中实现邮件 Modal 样式（split layout, responsive）
- [x] 7.5 修改侧边栏邮件列表的 onClick 改为打开 Modal 而非展开折叠
- [x] 7.6 阅读 narrativeCritical 邮件时调用 humanity score 加分逻辑

## 8. 叙事节奏与爆点事件

- [x] 8.1 在 `App.tsx` 的 `goNextLevel()` 中检查 `mission.narrativeBeat`，触发对应事件
- [x] 8.2 实现小爆点事件（minor beat）：解锁邮件 + 系统 toast + 小型系统故障动画
- [x] 8.3 实现大爆点事件（major beat）：伦理审查触发 + 去人格化阶段转换通知 + 全屏事件动画
- [x] 8.4 第5关大爆点：首次伦理审查 + PHASE_HUMAN → PHASE_NUMBER 转换
- [x] 8.5 第10关大爆点：AI系统上线公告 + 伦理委员会削弱
- [x] 8.6 第15关大爆点：伦理委员会解散 + PHASE_BATCH → PHASE_VOID 转换预告
- [x] 8.7 第20关大爆点：根据 humanityScore 触发对应结局

## 9. 结局分支系统

- [x] 9.1 在 `App.tsx` 中实现 humanityScore 修改逻辑（犹豫+2, 伦理选择+5/-3, 零犹豫-1, 邮件忽略-2）
- [x] 9.2 第20关完成后调用 `selectEnding(humanityScore)` 获取结局数据
- [x] 9.3 实现4个结局的展示界面（复用现有 ending-screen 框架，扩展为4种变体）
- [ ] 9.4 结局D特殊效果：渐进式UI消失动画（navbar/sidebar/board逐步fade out）

## 10. 官僚语气文案润色

- [ ] 10.1 重写所有成就描述为反讽官僚风格
- [ ] 10.2 重写采购 Modal 文案
- [ ] 10.3 重写伦理审查选项文案（每关不同，配合叙事弧线）
- [ ] 10.4 系统 toast/bug 消息改为官僚语气
- [ ] 10.5 关卡完成报告和失败报告文案阶段化