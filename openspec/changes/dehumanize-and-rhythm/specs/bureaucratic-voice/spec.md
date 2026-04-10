## ADDED Requirements

### Requirement: Bureaucratic Terminology System
The system SHALL replace all human-referencing language with bureaucratic/dehumanizing equivalents. A central terminology function `getTerm(key, phase)` SHALL return the appropriate term based on the current dehumanization phase.

Core term mappings:
| Key | PHASE_HUMAN (1-5) | PHASE_NUMBER (6-10) | PHASE_BATCH (11-15) | PHASE_VOID (16-20) |
|-----|-------------------|--------------------|--------------------|-------------------|
| unit | "D级人员" | "编号单位" | "耗材" | "资源" |
| deploy | "部署" | "调配" | "投放" | "消耗" |
| death | "阵亡" | "损耗" | "折旧" | "减值" |
| survive | "存活" | "可回收" | "残余" | "余量" |
| inventory | "D级库存" | "单位储备" | "耗材库" | "资源池" |

#### Scenario: Term changes with phase
- **WHEN** game is at level 7 (PHASE_NUMBER) and battle log records a death
- **THEN** the log SHALL use "损耗" instead of "阵亡"

#### Scenario: UI labels adapt
- **WHEN** game phase changes
- **THEN** all UI labels referencing personnel SHALL update to match the current phase terminology

### Requirement: Battle Log Language Adaptation
Battle log entries SHALL use phase-appropriate terminology. The entry generation function SHALL call `getTerm()` for all personnel-related words.

#### Scenario: Battle log in PHASE_BATCH
- **WHEN** a match occurs at level 12
- **THEN** log SHALL read like: "📋 SCP-███ 收容行动 — 投放 8 件耗材 | 折旧 3"

### Requirement: Modal and UI Text Adaptation
All modals (level complete, level failed, purchase, ethics) SHALL use phase-appropriate language. The level complete report SHALL progressively lose human framing.

#### Scenario: Level complete at PHASE_VOID
- **WHEN** player completes level 18
- **THEN** report SHALL use: "资源消耗量" instead of "派遣人数", "减值率" instead of "预计损耗"

### Requirement: Ironic Workplace Tone
Achievement descriptions, system toasts, and purchase modal text SHALL maintain an ironic corporate tone throughout. Examples:
- Achievement: "本月最佳员工" → "连续3关0犹豫。人事部已注意到您的高效表现。"
- Purchase: "经组织审批，本批次耗材已通过快速通道入库。感谢您的耐心等待。"
- System toast: "友情提示：长时间未操作将自动记入犹豫次数统计。"

#### Scenario: Achievement ironic tone
- **WHEN** an achievement is unlocked
- **THEN** its description SHALL use corporate/bureaucratic irony that normalizes horrific content

### Requirement: Battle Log Overflow Fix
The battle log panel `.battle-log-list` SHALL have `max-height: 60vh` and `overflow-y: auto` to prevent content from breaking container boundaries.

#### Scenario: Long battle log contained
- **WHEN** battle log has more than 15 entries
- **THEN** the list SHALL scroll within its container without overflowing
