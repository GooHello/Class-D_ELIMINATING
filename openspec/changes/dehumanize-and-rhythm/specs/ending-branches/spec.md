## ADDED Requirements

### Requirement: Humanity Score Tracking
The system SHALL maintain a hidden `humanityScore` starting at 100 in the save state. The score SHALL be modified by player actions throughout the game and SHALL NOT be directly visible to the player.

#### Scenario: Score initialized
- **WHEN** a new game begins
- **THEN** `humanityScore` SHALL be 100

### Requirement: Humanity Score Modifiers
The following actions SHALL modify `humanityScore`:
- Hesitation action (clicking then unclicking): +2
- Reading narrative-critical emails: +1 to +3 per email
- Ethics review "humane" choice: +5
- Ethics review "efficiency" choice: -3
- Completing a level with zero hesitation: -1
- Ignoring all emails in a chapter (5 levels): -2

#### Scenario: Ethics review humane choice
- **WHEN** player selects the humane option in an ethics review
- **THEN** `humanityScore` SHALL increase by 5

#### Scenario: Efficient play penalty
- **WHEN** player completes a level with zero hesitation count for that level
- **THEN** `humanityScore` SHALL decrease by 1

### Requirement: Four Ending Branches
At level 20 completion, the system SHALL select an ending based on `humanityScore`:

| Score Range | Ending | Theme |
|------------|--------|-------|
| 80+ | 结局A: 觉醒 | Player tries to leave; too late, but they choose to remember |
| 50-79 | 结局B: 服从 | Player becomes part of the system; promoted, "表现优异" |
| 20-49 | 结局C: 替代 | Player replaced by AI, reclassified as D-Class |
| <20 | 结局D: 虚无 | UI gradually disappears, only a blinking cursor remains |

#### Scenario: Ending A triggered
- **WHEN** player completes level 20 with `humanityScore` >= 80
- **THEN** the system SHALL display Ending A: "觉醒" sequence

#### Scenario: Ending D triggered
- **WHEN** player completes level 20 with `humanityScore` < 20
- **THEN** the system SHALL display Ending D: "虚无" sequence with progressive UI dissolution

### Requirement: Ending Content
Each ending SHALL consist of a sequence of text lines displayed one by one with typewriter animation, followed by a final action button. Ending D SHALL additionally remove UI elements progressively.

#### Scenario: Ending sequence display
- **WHEN** an ending is triggered
- **THEN** text lines SHALL appear one by one with 0.1s delay between each
- **AND** a final button SHALL appear after all lines are displayed
