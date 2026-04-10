## ADDED Requirements

### Requirement: Five Color Passive Effects
Each of the 5 piece colors SHALL have a unique passive effect that triggers when pieces of that color are matched:

| Color | Role | Passive Effect | Trigger Condition |
|-------|------|---------------|-------------------|
| Blue (🔧) | 杂役 | Recover 1 move | Match 4+ pieces |
| Red (☢️) | 危险接触 | 15% chance mini-breach (reshuffle 2 random rows) | Any match |
| Green (🧬) | 生物实验 | Reduce casualty rate by 5% for this match | Any match |
| Orange (⚙️) | 机械操作 | Cross-clear: remove pieces in + pattern from match center | Match 4+ pieces |
| Purple (🟪) | 异常 | Random effect: +2 moves, or -1 move, or breach, or bonus progress | Any match |

#### Scenario: Blue passive triggers on 4-match
- **WHEN** player matches 4 or more blue pieces
- **THEN** `movesLeft` SHALL increase by 1
- **AND** battle log SHALL record "杂役工种被动: 回复1步"

#### Scenario: Blue passive does not trigger on 3-match
- **WHEN** player matches exactly 3 blue pieces
- **THEN** no extra moves SHALL be added

#### Scenario: Red passive breach
- **WHEN** player matches red pieces and the 15% chance succeeds
- **THEN** 2 random rows SHALL be reshuffled
- **AND** a brief "小型收容突破" animation SHALL play

#### Scenario: Green passive reduces casualties
- **WHEN** player matches green pieces
- **THEN** the casualty rate for that match SHALL be reduced by 5 percentage points

#### Scenario: Orange cross-clear on 4-match
- **WHEN** player matches 4+ orange pieces
- **THEN** all pieces in the same row and column as the match center SHALL be removed
- **AND** removed pieces SHALL count toward progress

#### Scenario: Purple random effect
- **WHEN** player matches purple pieces
- **THEN** one random effect SHALL be selected from: +2 moves (25%), -1 move (25%), mini-breach (25%), +10 bonus progress (25%)

### Requirement: Recommended Color Outline Highlight
Pieces whose color matches the mission's `bonusColors` SHALL display a visible outline/glow effect on the board. This SHALL replace the current opacity-based target color dimming.

#### Scenario: Bonus color highlighted
- **WHEN** a piece's color is in the current mission's `bonusColors` array
- **THEN** the piece SHALL display a pulsing border glow (CSS box-shadow animation)

#### Scenario: Non-bonus color normal display
- **WHEN** a piece's color is NOT in `bonusColors`
- **THEN** the piece SHALL display at full normal opacity with no special border

### Requirement: Passive Effect Notification
When a passive effect triggers, a brief floating text SHALL appear near the match location indicating the effect (e.g., "+1步", "折损↓", "十字清除").

#### Scenario: Passive float text
- **WHEN** any color passive triggers
- **THEN** a floating text notification SHALL appear for 1.5 seconds near the match area
