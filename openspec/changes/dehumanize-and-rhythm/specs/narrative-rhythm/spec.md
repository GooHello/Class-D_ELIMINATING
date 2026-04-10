## ADDED Requirements

### Requirement: 20-Level Narrative Arc
The game SHALL consist of exactly 20 levels. Each level SHALL have a unique SCP subject, title, and narrative context. The levels SHALL be structured as:
- Levels 1-5: "入职培训" — 简单任务，建立日常感
- Levels 6-10: "深入泥潭" — 难度上升，道德模糊加剧
- Levels 11-15: "体制之轮" — 系统失控，个体消亡
- Levels 16-20: "终局之路" — 走向结局分支

#### Scenario: Game has exactly 20 missions
- **WHEN** missions data is loaded
- **THEN** there SHALL be exactly 20 mission entries, indexed 1-20

### Requirement: Minor Beat Every 3 Levels
A minor narrative beat SHALL trigger at levels 3, 6, 9, 12, 15, 18. Minor beats include: anomalous email arrival, system glitch toast, brief ethics reminder, or a dark humor workplace announcement.

#### Scenario: Level 3 minor beat
- **WHEN** player completes level 3
- **THEN** a minor narrative event SHALL trigger (e.g., anomalous email unlocked)

### Requirement: Major Beat Every 5 Levels
A major narrative beat SHALL trigger at levels 5, 10, 15, 20. Major beats include: containment breach event, ethics review, staff restructuring announcement, or ending trigger.

#### Scenario: Level 5 major beat
- **WHEN** player completes level 5
- **THEN** a major event SHALL trigger (e.g., first ethics review + dehumanization phase shift)

#### Scenario: Level 10 major beat
- **WHEN** player completes level 10
- **THEN** a major event SHALL trigger (e.g., "AI效率优化系统上线" announcement + ethics committee weakened)

### Requirement: Mission Data with Beat Markers
Each mission in `missions.ts` SHALL include a `narrativeBeat` field indicating if it triggers a minor beat (`'minor'`), major beat (`'major'`), or no beat (`null`).

#### Scenario: Mission has beat marker
- **WHEN** mission data for level 5 is accessed
- **THEN** `narrativeBeat` SHALL equal `'major'`
