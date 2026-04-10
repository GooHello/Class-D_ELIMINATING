## ADDED Requirements

### Requirement: Email Modal Full-Screen Reader
Clicking an email in the sidebar list SHALL open a full-screen Modal overlay with a split layout: left side shows email list (scrollable), right side shows the selected email body. The Modal SHALL have a close button.

#### Scenario: Open email modal
- **WHEN** player clicks any email item in the sidebar
- **THEN** a full-screen Modal SHALL appear with the email list on the left and the clicked email content on the right

#### Scenario: Navigate between emails
- **WHEN** email modal is open and player clicks a different email in the left list
- **THEN** the right panel SHALL update to show the newly selected email

#### Scenario: Close email modal
- **WHEN** player clicks the close button or presses Escape
- **THEN** the Modal SHALL close and return to the game view

### Requirement: 20 Narrative Emails
The system SHALL contain at least 20 narrative-driven emails unlocked progressively by level. Email categories:
- **人事通知** (HR notices): promotions, policy changes, termination notices
- **匿名举报** (Anonymous reports): someone trying to warn, messages getting shorter/more desperate
- **AI系统公告** (AI system): automated messages becoming increasingly autonomous
- **被删除的伦理报告** (Deleted ethics reports): partially redacted, fragments visible
- **日常行政** (Mundane admin): parking, cafeteria menus, fire drill — normalizing horror

#### Scenario: Email unlocked by level
- **WHEN** player reaches the level specified in an email's `unlockLevel` field
- **THEN** the email SHALL appear in the email list with a "NEW" badge

#### Scenario: Email marked as read
- **WHEN** player opens an email in the modal reader
- **THEN** the email SHALL be marked as read and the "NEW" badge SHALL be removed

### Requirement: Email Affects Humanity Score
Certain emails SHALL be flagged as `narrativeCritical`. Reading these emails SHALL increase `humanityScore` by the email's `humanityBonus` value (1-3).

#### Scenario: Critical email read
- **WHEN** player reads an email with `narrativeCritical: true` and `humanityBonus: 3`
- **THEN** `humanityScore` SHALL increase by 3

### Requirement: Email Content Tone
All emails SHALL use bureaucratic/corporate language. Horror elements SHALL be presented through the lens of mundane workplace communication. Examples:
- Death of personnel → "资源利用率报告"
- Ethics violation → "流程合规性建议"
- SCP breach → "设施维护通知"

#### Scenario: Email tone consistency
- **WHEN** any email is displayed
- **THEN** it SHALL use formal bureaucratic Chinese, avoid emotional language, and frame horrific content as routine operations
