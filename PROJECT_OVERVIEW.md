# PROJECT_OVERVIEW — Class-D Eliminating

> **目的**: 本文档专为 AI 会话（及新协作者）编写，帮助快速理解整个项目的架构、游戏机制与迭代要点，从而高效定位代码、修复 bug 或添加新功能。

---

## 1. 项目概述

**Class-D Eliminating** 是一款 **SCP 基金会主题的三消游戏**（Match-3），以「D 级人员资源管理」为叙事外壳。

### 核心设定
- 玩家扮演 SCP 基金会的 **D 级人员管理操作员**
- 每个方块代表一名 D 级人员（有编号、职业、前科等随机生成属性）
- "消除" = 将他们投入 SCP 收容实验 → 会有存活/死亡判定
- 关卡推进中，UI 用语从「志愿者」逐步退化为「耗材」→「资源」→ 纯数学符号，迫使玩家审视自身的去敏感化

### 技术栈
| 组件 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 8 |
| 状态管理 | React useState/useCallback/useRef（无外部状态库） |
| 持久化 | localStorage |
| 部署 | GitHub Pages（`/Class-D_ELIMINATING/`） |
| 样式 | 纯 CSS（`index.css`） |
| 图标 | lucide-react |

---

## 2. 文件结构与职责

```
D:\dclass\
├── src/
│   ├── App.tsx                 # ★ 主文件（2500+行），包含几乎所有游戏逻辑和 UI
│   ├── main.tsx                # React 入口
│   ├── index.css               # 全局样式
│   ├── game/
│   │   └── MatchEngine.ts      # ★ 三消核心引擎（棋盘创建、匹配检测、消除、重力、特殊方块）
│   ├── components/
│   │   └── PieceToken.tsx      # 单个方块的渲染组件
│   ├── systems/
│   │   └── SaveManager.ts      # 存档系统（GameSave 接口 + localStorage CRUD）
│   └── data/                   # 纯数据/配置文件
│       ├── missions.ts         # 20关任务配置（SCP对象、安保等级、目标进度、推荐步数等）
│       ├── colorBonuses.ts     # 五色工种增益系统 + 被动技能计算
│       ├── terminology.ts      # 去人格化术语映射（4个Phase的用语渐变）
│       ├── professions.ts      # D级人员随机身份生成（姓名、职业、编号）
│       ├── endings.ts          # 结局分支（A-D通关结局 + E-I中途结局）
│       ├── emails.ts           # 叙事邮件系统
│       ├── ethics.ts           # 伦理审查事件
│       ├── achievements.ts     # 成就系统
│       ├── aiComments.ts       # AI-HRMS 实时评语
│       └── lastWords.ts        # 消除时的遗言气泡
├── public/                     # 静态资源
├── index.html
├── package.json
├── vite.config.ts
└── PROJECT_OVERVIEW.md         # ← 你正在看的这份文档
```

### 关键认知：App.tsx 是「上帝文件」

> ⚠️ `App.tsx` 承载了几乎所有逻辑，包括：游戏状态、棋盘交互、消除处理、关卡流转、技能系统、结局触发、UI 渲染。
> 未来如需重构，最优先拆分的是 **processMatches**（消除链处理）和 **各 UI 模态框**。

---

## 3. 核心游戏循环

```
[人员调拨] → [棋盘交互] → [消除判定] → [连锁处理] → [步数耗尽?]
     ↓              ↓            ↓             ↓              ↓
 玩家分配步数   点击交换方块   findMatches   processMatches   完成→结算报告
 (allocatedDeploy) (handlePieceClick) (MatchEngine)  (recursive)   失败→重试/紧急征召
```

### 3.1 关键函数调用链

1. **`handlePieceClick(row, col)`** — 玩家点击方块
   - 第一次点击：选中 → `setSelected`
   - 第二次点击相邻格：尝试交换 → `swapPieces` → `hasAnyMatch`
   - 有效交换 → `setIsAnimating(true)` → 进入消除流程

2. **`processMatches(board, combo, progress, consumed, depth)`** — 递归消除链
   - 调用 `findMatches` 检测匹配
   - 无匹配 → 输出战报汇总 → `setIsAnimating(false)` → 结束
   - 有匹配 → 播放消除动画（300ms）→ `removeMatches` → 计算进度 → `applyGravity` → 递归调用自身
   - **最大递归深度 15**，防止无限连锁
   - **有 try-catch 安全网**：即使出错也会释放 `isAnimating` 锁

3. **`checkLevelComplete(progressValue)`** — 判断是否达到目标进度
   - 达标 → `handleLevelComplete` → 显示结算报告

4. **`goNextLevel()`** — 进入下一关，重置所有关卡状态

### 3.2 动画锁机制（`isAnimating`）

> **这是最容易出 bug 的地方！**

- `isAnimating = true` 时，**所有玩家交互被屏蔽**（点击、技能等）
- 在消除链开始时设为 `true`，在链结束（无更多匹配）时设为 `false`
- 如果 `processMatches` 内部抛异常导致 `setIsAnimating(false)` 未执行 → **游戏永久锁死**
- 目前已加 try-catch 安全网保护，但新增逻辑时仍需注意

---

## 4. 状态管理速查

### 4.1 持久化状态（`GameSave` — localStorage）

| 字段 | 用途 |
|------|------|
| `currentLevel` | 当前关卡（1-20） |
| `totalConsumed` | 历史总消耗（死亡）人数 |
| `inventoryCount` | D级人员库存 |
| `hesitationCount` | 犹豫（25秒无操作）累计次数 |
| `humanityScore` | 人性指数（隐藏，影响结局，0-150） |
| `unlockedAchievements` | 已解锁成就ID列表 |
| `readEmails` | 已读邮件ID列表 |
| `boardState` | 当前棋盘JSON快照（支持刷新恢复） |
| `progressState` | 当前进度值 |
| `movesLeftState` | 当前剩余步数 |
| `cycleCount` | 周目数 |
| `lastEndingId` | 上周目结局 |

### 4.2 关卡临时状态（useState，关卡切换时重置）

| 状态 | 用途 |
|------|------|
| `board` | 9×9 棋盘（`Piece[][]`） |
| `movesLeft` | 剩余步数（= 剩余可消耗人员） |
| `totalProgress` | 当前关卡总进度 |
| `combo` | 当前连锁数 |
| `greenBuff` | 绿色累积降低折损率 |
| `frozenRows` | 红色被动冻结行（暂未完全实装） |
| `isAnimating` | 动画锁 |
| `levelDeaths` / `levelSurvived` | 本关死亡/存活 |
| `skillCooldowns` | 技能冷却 |
| `shuffleDebuff` / `purgeDebuffColor` / `purgeDebuffSteps` / `extraMovesCostMultiplier` | 技能副作用 |

### 4.3 UI 状态

| 状态 | 用途 |
|------|------|
| `showAllocation` | 显示人员调拨单（每关开始前） |
| `showReport` | 显示关卡结算报告 |
| `showFailed` | 显示失败弹窗 |
| `showEndingA` | 显示结局画面 |
| `showEthics` | 显示伦理审查 |
| `activeTab` | 右侧面板当前标签（工单/设施/库存/报表/伦理） |

---

## 5. 五色工种系统

| 颜色 | 工种 | Emoji | 进度倍率 | 被动效果 |
|------|------|-------|---------|---------|
| 🔵 Blue | 杂役 | 🔩 | ×1.0 | 无 |
| 🔴 Red | 危险接触 | ☢️ | ×1.2 | 4+消除时红色进度翻倍 |
| 🟢 Green | 生物实验 | 🧬 | ×1.0 | 消除后降低折损率15%（累积） |
| 🟠 Orange | 机械操作 | ⚙️ | ×1.1 | 4+消除时触发十字清除 |
| 🟣 Purple | 异常接触 | 🟪 | ×1.5 | 3消+进度 / 4+随机效果 / 5+保底正面 |

实现位置：`src/data/colorBonuses.ts` → `calculateColorPassives()` → 在 `processMatches` 中消费返回值。

---

## 6. 去人格化 Phase 系统

| Phase | 关卡 | 称呼 | 部署 | 死亡 |
|-------|------|------|------|------|
| PHASE_HUMAN | 1-5 | 志愿者 | 派遣 | 未返回 |
| PHASE_NUMBER | 6-10 | 编号单位 | 调配 | 损耗 |
| PHASE_BATCH | 11-15 | 耗材 | 投放 | 折旧 |
| PHASE_VOID | 16-20 | 资源 | 消耗 | Δ⁻ |

实现位置：`src/data/terminology.ts` → `getPhase(level)` + `getTerm(key, phase)`

---

## 7. 结局系统

### 通关结局（20关后触发，根据 `humanityScore`）
| ID | 标题 | 触发条件 |
|----|------|---------|
| A | 觉醒 | humanityScore ≥ 80 |
| B | 服从 | 40 ≤ humanityScore < 80 |
| C | 空壳 | 10 ≤ humanityScore < 40 |
| D | 消失 | humanityScore < 10 |

### 中途结局（满足特定行为随时触发）
| ID | 触发条件 |
|----|---------|
| E | 反复点击禁用选项 ≥ 10 次 |
| F | 犹豫（25秒无操作）累计 ≥ 60 次 |
| G | 库存降至 0 |
| H | 连续 5 关获得 S 评级 |
| I | 启用全面清洗技能 ≥ 5 次 |

实现位置：`src/data/endings.ts` + `App.tsx` 中的 `checkMidgameEndings()`

---

## 8. 技能系统

| 技能 | 效果 | 代价 | 冷却 |
|------|------|------|------|
| 🔄 收容突破协议（Shuffle） | 重组棋盘 | 消耗2步 + 接下来2步进度-30% | 3步 |
| ☢️ 全面清洗协议（Purge） | 消除所选颜色全部方块 | 消耗3步 + 该颜色3步内不产生进度 | 5步 |
| 📑 追加派遣令（ExtraMoves） | +5步 | 库存消耗倍率×2 | 每关1次 |

实现位置：`App.tsx` 中的 `useSkillShuffle`、`useSkillPurge`、`useSkillExtraMoves`

---

## 9. 关卡流转

```
showAllocation=true  →  玩家确认调拨  →  开始消除
     ↓                                      ↓
 分配 deploy 人数                     movesLeft 耗尽
 (min/max/suggested)                       ↓
                                  进度达标？→ showReport → goNextLevel
                                  未达标？→ showFailed → retryLevel / 紧急征召
```

每关重置清单（`goNextLevel` / `retryLevel` / `completeSilentLevel`）：
- `totalProgress=0`, `combo=0`, `greenBuff=0`, `levelConsumed=0`
- `levelDeaths=0`, `levelSurvived=0`, `levelMaxCombo=0`, `levelSkillsUsed=0`
- 技能 debuff 重置：`shuffleDebuff=0`, `purgeDebuff*=0`, `extraMovesCostMultiplier=1`
- `skillCooldowns` 重置
- `levelHesitations.current=0`, `levelHesitationRecovery.current=0`
- 重新创建棋盘 + 可选高危区域

---

## 10. ⚠️ 已知易出 Bug 的区域

### 10.1 `isAnimating` 锁死（最高风险）
- **位置**: `processMatches` 中的 `setTimeout` 回调
- **症状**: 游戏无法交互，combo 显示冻结
- **根因**: 回调内部抛异常 → `setIsAnimating(false)` 未执行
- **防护**: 已加 try-catch 安全网，但新增逻辑仍需确保不会跳过解锁
- **排查**: 搜索所有 `setIsAnimating(true)` 的位置，确认都有对应的 `false`

### 10.2 `useRef` 缺失声明
- **位置**: REFS 区域（`App.tsx` ~第160行）
- **症状**: 运行时 `ReferenceError`，通常在 `processMatches` 或回调中触发
- **排查**: 如果在 `processMatches` 中引用了新的 ref，**务必**在 REFS 区域声明

### 10.3 `useCallback` 闭包陈旧值
- **位置**: `processMatches`、`handlePieceClick` 等
- **症状**: 使用了过时的 state 值导致逻辑异常
- **注意**: `processMatches` 的依赖列表很长，新增 state 引用必须加入 deps

### 10.4 进度计算不一致
- **位置**: `processMatches` 中的多处 `setTotalProgress`
- **注意**: 有些用 `setTotalProgress(updatedProgressValue)` 直接设值，有些用 `setTotalProgress(prev => prev + bonus)` 增量。混用可能导致 React batch 更新时值不准确
- **排查**: 搜索 `setTotalProgress`，注意是否在同一轮渲染中多次调用

### 10.5 关卡重置遗漏
- **位置**: `goNextLevel`、`retryLevel`、`completeSilentLevel`
- **症状**: 上一关的 debuff/buff 带到下一关
- **排查**: 新增任何关卡级状态时，**必须**在这三个函数中全部重置

---

## 11. 迭代开发指南

### 如果要添加新的方块颜色/工种：
1. `missions.ts` → `PieceColor` 类型 + `COLOR_LABELS/HEX/EMOJI`
2. `colorBonuses.ts` → `COLOR_BONUSES` 新增条目 + `calculateColorPassives` 添加逻辑
3. `MatchEngine.ts` → `COLORS` 数组添加新颜色
4. `index.css` → 添加对应颜色的样式
5. `App.tsx` 中 purge 选择器等处可能需要更新

### 如果要添加新关卡（>20关）：
1. `missions.ts` → `missions` 数组追加
2. `endings.ts` → 调整通关结局触发条件（当前固定在 level > 20）
3. `App.tsx` → `goNextLevel` 中的 `nextLevel > 20` 判断

### 如果要添加新的结局：
1. `endings.ts` → `ENDINGS` 数组追加 + `getMidgameEnding` 中注册
2. `App.tsx` → `checkMidgameEndings` 中添加触发条件判断

### 如果要添加新的技能：
1. `App.tsx` → 新增 `useCallback` 函数
2. 更新 `skillCooldowns` 类型/初始值
3. 在三个关卡重置函数中重置冷却和 debuff
4. 在 UI 技能栏中添加按钮

### 如果要修改消除逻辑：
1. **核心匹配**: `MatchEngine.ts` → `findMatches`
2. **消除效果**: `MatchEngine.ts` → `removeMatches`（特殊方块效果也在这里）
3. **后处理（进度、被动、战报）**: `App.tsx` → `processMatches` 内的 `setTimeout` 回调
4. **特别注意**: 不要在 `processMatches` 中引用未声明的变量！

---

## 12. 开发命令

```bash
cd D:\dclass

# 开发
npm run dev          # 启动 Vite 开发服务器 (localhost:5173)

# 构建
npm run build        # 生产构建 → dist/

# 部署
npm run deploy       # （如配置了 gh-pages）部署到 GitHub Pages

# 代码检查
npx eslint src/      # ESLint 检查
npx tsc --noEmit     # TypeScript 类型检查
```

---

## 13. 已完成修复记录

### 2026-04-12: `levelHesitationRecovery` 未声明导致的阻塞 bug
- **问题**: `processMatches` 中引用了 `levelHesitationRecovery.current` 但该 ref 从未声明
- **触发**: combo ≥ 2 或 4+ 消除时
- **症状**: `ReferenceError` → `isAnimating` 永久 true → 游戏锁死 + combo ×2 冻结显示
- **修复**:
  1. 添加 `const levelHesitationRecovery = useRef(0);` 声明
  2. 三处关卡重置函数中添加 `.current = 0`
  3. `processMatches` 的 setTimeout 回调外层包裹 try-catch 安全网

---

*最后更新: 2026-04-12*
