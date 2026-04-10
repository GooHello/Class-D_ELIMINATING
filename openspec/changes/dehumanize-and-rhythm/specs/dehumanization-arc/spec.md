## ADDED Requirements

### Requirement: Dehumanization Phase System
The system SHALL divide the 20-level game into 4 dehumanization phases based on `currentLevel`. Each phase changes how D-Class personnel are displayed in the profile panel, board tooltips, and battle log.

| Phase | Levels | Profile Display | Term Used |
|-------|--------|----------------|-----------|
| PHASE_HUMAN | 1-5 | Full name, background story, entry reason | "D级人员" |
| PHASE_NUMBER | 6-10 | ID number + role code only, background shows "[已归档]" | "编号单位" |
| PHASE_BATCH | 11-15 | Batch number (e.g. "LOT-2024-███"), no personal info | "耗材" |
| PHASE_VOID | 16-20 | "[ 无可用数据 ]" or "资源#███" | "资源" |

#### Scenario: Phase transition at level 6
- **WHEN** player advances to level 6
- **THEN** profile panel SHALL show only ID number and role code, background field SHALL display "[已归档]"

#### Scenario: Phase transition at level 11
- **WHEN** player advances to level 11
- **THEN** profile panel SHALL show only batch number format "LOT-YYYY-███", all personal fields SHALL be removed

#### Scenario: Phase transition at level 16
- **WHEN** player advances to level 16
- **THEN** profile panel SHALL show "[ 无可用数据 ]" when hovering any piece, or a generic resource counter "资源#███"

### Requirement: Hover Profile Panel Adapts to Phase
The hover profile panel SHALL dynamically render different layouts based on the current dehumanization phase. The `generateFullProfile()` function SHALL accept the current phase as a parameter and return phase-appropriate data.

#### Scenario: Hover in PHASE_HUMAN
- **WHEN** player hovers a piece during levels 1-5
- **THEN** panel SHALL display: ID, full name, former job, entry reason

#### Scenario: Hover in PHASE_VOID
- **WHEN** player hovers a piece during levels 16-20
- **THEN** panel SHALL display only: "[ 无可用数据 ]" in muted text

### Requirement: Phase Transition Notification
The system SHALL display a system notification email and/or toast when a phase transition occurs, framed in bureaucratic language (e.g., "根据基金会人事政策 HR-2024-██，自本日起人员档案系统将进行信息精简优化").

#### Scenario: Entering PHASE_NUMBER
- **WHEN** player reaches level 6
- **THEN** a system email SHALL be unlocked explaining the "档案精简优化" policy
- **AND** a toast notification SHALL appear briefly
