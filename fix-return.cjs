
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

// Keep lines 1-797 (logic section)
const logic = lines.slice(0, 797);

const render = `  return (
    <>
      {/* ===== NAV BAR ===== */}
      <nav className="navbar">
        <div className="navbar-title">
          <span className="scp-logo">⚙</span>
          <span>SCP基金会 · Site-██ 人力资源终端</span>
          <span className="scp-version">BUILD 3.7.2</span>
        </div>
        <div className="navbar-tabs">
          {[
            { id: '工单', icon: '📋' },
            { id: '设施', icon: '🏗️' },
            { id: '库存', icon: '📦' },
            { id: '报表', icon: '📊' },
            { id: '伦理', icon: '⚖️' },
          ].map(tab => (
            <button
              key={tab.id}
              className={\`navbar-tab \${activeTab === tab.id ? 'active' : ''}\`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.id}
            </button>
          ))}
        </div>
        <div className="navbar-right">
          <div className="navbar-badge" onClick={() => setShowAchievements(!showAchievements)}>
            🏅
          </div>
          <div className="scp-clearance">安保许可: ██</div>
          <div className={\`navbar-inventory \${save.inventoryCount <= 500 ? 'warning' : ''}\`}>
            D级库存：{save.inventoryCount.toLocaleString()}
          </div>
        </div>
      </nav>

      <div className="scp-ticker">
        <span>SECURE · CONTAIN · PROTECT</span>
        <span className="ticker-sep">|</span>
        <span>站点状态：正常运转</span>
        <span className="ticker-sep">|</span>
        <span>当前操作员：{save.playerOperatorId}</span>
        <span className="ticker-sep">|</span>
        <span>日期：{new Date().toLocaleDateString('zh-CN')}</span>
        <span className="ticker-sep">|</span>
        <span>活跃异常收容项：████</span>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="main-layout">

        {/* ===== BATTLE LOG (LEFT PANEL) ===== */}
        <div className="battle-log-panel">
          <div className="battle-log-header">
            <AlertIcon size={14} /> 实时行动记录
          </div>
          <div className="battle-log-stats">
            <span>总部署: {battleLog.filter(l => l.type === 'deploy').reduce((s, l) => s + (l.deployed || 0), 0)}</span>
            <span className="deploy-dead">阵亡: {battleLog.filter(l => l.type === 'deploy').reduce((s, l) => s + (l.dead || 0), 0)}</span>
            <span className="deploy-survivors">存活: {battleLog.filter(l => l.type === 'deploy').reduce((s, l) => s + (l.survived || 0), 0)}</span>
          </div>
          <div className="battle-log-list">
            {battleLog.length === 0 && (
              <div className="battle-log-empty">暂无行动记录</div>
            )}
            {battleLog.map(entry => (
              <div key={entry.id} className={\`battle-log-entry log-\${entry.type}\`}>
                <div className="log-time">{entry.timestamp}</div>
                {entry.type === 'deploy' && (
                  <>
                    <div className="log-title">📋 {entry.scpName} 收容行动</div>
                    <div className="log-detail">
                      投入 <strong>{entry.deployed}</strong> 人 |
                      <span className="deploy-dead"> 阵亡 {entry.dead}</span>
                    </div>
                    {entry.deathCause && entry.dead! > 0 && (
                      <div className="log-cause">死因: {entry.deathCause}</div>
                    )}
                  </>
                )}
                {entry.type === 'breach' && (
                  <>
                    <div className="log-title log-breach-title">⚠️ 收容突破</div>
                    <div className="log-detail">{entry.detail}</div>
                  </>
                )}
                {entry.type === 'waste' && (
                  <div className="log-detail log-waste-text">⚠ {entry.detail}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== GAME AREA (CENTER) ===== */}
        <div className="game-area">
          <div className="board-container">
            <div className="board-grid">
              {board.map((row, r) =>
                row.map((piece, c) => (
                  <PieceToken
                    key={\`\${r}-\${c}\`}
                    color={piece.color}
                    special={piece.special}
                    dClassId={piece.dClassId}
                    isSelected={!!(selected && selected[0] === r && selected[1] === c)}
                    isRemoving={removingCells.has(\`\${r},\${c}\`)}
                    isDropping={droppingCells.has(\`\${r},\${c}\`)}
                    isPlayerPiece={piece.isPlayerPiece}
                    isTargetColor={bonusColorSet.has(piece.color)}
                    onClick={() => handlePieceClick(r, c)}
                    onHover={() => {
                      triggerProfessionFlash(piece);
                      setHoveredProfile(generateFullProfile(piece.dClassId));
                    }}
                    onHoverEnd={() => setHoveredProfile(null)}
                  />
                ))
              )}
            </div>
            {/* Speech bubbles */}
            {speechBubbles.map(b => (
              <div
                key={b.id}
                className={\`speech-bubble \${b.isWaste ? 'waste' : ''}\`}
                style={{ left: b.x, top: b.y }}
              >
                {b.text}
              </div>
            ))}
            {comboFloat && <div className="combo-float">{comboFloat}</div>}
          </div>

          <div className="game-status">
            <span className={\`moves-left \${movesLeft <= 5 ? 'low' : ''}\`}>
              步数剩余: {movesLeft}
            </span>
            <span className={\`combo-display \${combo > 1 ? 'active' : ''}\`}>
              {combo > 1 ? \`COMBO ×\${combo}\` : ''}
            </span>
          </div>

          <div className="status-bar">
            {professionFlash && (
              <span className="profession-flash" key={professionFlash}>
                {professionFlash}
              </span>
            )}
          </div>

          {/* ===== HOVER PROFILE PANEL ===== */}
          <div className="profile-panel">
            {hoveredProfile ? (
              <>
                <div className="profile-header">
                  <span className="profile-id">{hoveredProfile.id}</span>
                  <span className="profile-name">{hoveredProfile.name}</span>
                  <span className="profile-job">{hoveredProfile.formerJob}</span>
                </div>
                <div className="profile-reason">入站原因: {hoveredProfile.reason}</div>
              </>
            ) : (
              <span className="profile-empty">[ 将鼠标移至人员上方以查看档案 ]</span>
            )}
          </div>

          {/* ===== SKILL BUTTONS ===== */}
          <div className="skill-bar">
            <button
              className={\`skill-btn \${skillCooldowns.shuffle > 0 ? 'on-cooldown' : ''}\`}
              onClick={useSkillShuffle}
              disabled={isAnimating || skillCooldowns.shuffle > 0}
              title="收容突破协议：重组棋盘（消耗2步）"
            >
              <span className="skill-icon">🔄</span>
              <span className="skill-name">收容突破</span>
              {skillCooldowns.shuffle > 0 && <span className="skill-cd">{skillCooldowns.shuffle}</span>}
            </button>
            <button
              className={\`skill-btn \${skillCooldowns.purge > 0 ? 'on-cooldown' : ''}\`}
              onClick={() => !isAnimating && skillCooldowns.purge <= 0 && setSelectingPurgeColor(true)}
              disabled={isAnimating || skillCooldowns.purge > 0}
              title="全面清洗协议：消除所选工种全部人员（消耗3步）"
            >
              <span className="skill-icon">☢️</span>
              <span className="skill-name">全面清洗</span>
            </button>
            <button
              className={\`skill-btn \${skillCooldowns.extraMoves > 0 ? 'on-cooldown' : ''}\`}
              onClick={useSkillExtraMoves}
              disabled={skillCooldowns.extraMoves > 0}
              title="追加派遣令：增加5步操作步数（每关1次）"
            >
              <span className="skill-icon">📑</span>
              <span className="skill-name">追加派遣</span>
              {skillCooldowns.extraMoves > 0 && <span className="skill-cd">已用</span>}
            </button>
          </div>

          {/* Purge color picker */}
          {selectingPurgeColor && (
            <div className="purge-picker">
              <div className="purge-title">选择清洗工种</div>
              <div className="purge-options">
                {(['blue','red','green','orange','purple'] as PieceColor[]).map(c => (
                  <button key={c} className={\`purge-color-btn \${c}\`} onClick={() => useSkillPurge(c)}>
                    {COLOR_EMOJI[c]}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" style={{fontSize:12,marginTop:4}} onClick={() => setSelectingPurgeColor(false)}>取消</button>
            </div>
          )}
        </div>

        {/* ===== INFO PANEL (RIGHT) ===== */}
        <div className="info-panel">

          {/* ---- TAB: 工单 ---- */}
          {activeTab === '工单' && (
            <>
              {/* Mission Order */}
              <div className="panel scp-panel">
                <div className="panel-header scp-header">
                  <FileText size={14} /> 实验工单 {mission.id}
                  <span className={\`security-badge security-\${mission.securityLevel}\`}>
                    {mission.securityLevel}级安保
                  </span>
                </div>
                <div className="panel-body">
                  <div className="scp-doc-watermark">FOUNDATION USE ONLY</div>
                  <div className="mission-info">
                    <div className="scp-doc-row">
                      <span className="scp-label">项目编号</span>
                      <span className="scp-value">{mission.scpSubject}</span>
                    </div>
                    <div className="scp-doc-row">
                      <span className="scp-label">实验名称</span>
                      <span className="scp-value">{mission.title}</span>
                    </div>
                    <div className="scp-doc-row">
                      <span className="scp-label">预估损耗</span>
                      <span className="scp-value">{mission.casualtyEstimate}</span>
                    </div>
                    <div className="scp-divider" />
                    <div className="scp-label" style={{marginBottom:8}}>收容进度</div>
                    <div className="requirement-row">
                      <div className="requirement-bar">
                        <div className="requirement-fill blue" style={{ width: \`\${Math.min(100, (totalProgress / (mission.targetProgress || 1)) * 100)}%\` }} />
                      </div>
                      <span className={\`requirement-text \${totalProgress >= (mission.targetProgress || 999) ? 'requirement-done' : ''}\`}>
                        {totalProgress >= (mission.targetProgress || 999) ? '✅ ' : ''}{totalProgress}/{mission.targetProgress}
                      </span>
                    </div>
                    {mission.bonusColors && mission.bonusColors.length > 0 && (
                      <div style={{fontSize:11,color:'#86909c',marginTop:8}}>
                        推荐工种: {mission.bonusColors.map(c => COLOR_EMOJI[c]).join(' ')}（效率加成）
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Dashboard */}
              <div className="panel scp-panel">
                <div className="panel-header scp-header">
                  <Shield size={14} /> 运营数据 [受限]
                </div>
                <div className="panel-body">
                  <div className="kpi-grid">
                    <div className="kpi-item"><div className="kpi-value">{save.dailyConsumed}</div><div className="kpi-label">今日折旧</div></div>
                    <div className="kpi-item"><div className="kpi-value">{save.totalConsumed.toLocaleString()}</div><div className="kpi-label">累计折旧</div></div>
                    <div className="kpi-item"><div className="kpi-rating">{lastRating}</div><div className="kpi-label">效率评级</div></div>
                    <div className="kpi-item"><div className="kpi-value">{save.inventoryCount.toLocaleString()}</div><div className="kpi-label">库存余量</div></div>
                  </div>
                  <div className="kpi-quota">
                    <div className="kpi-quota-text"><span>月度折旧指标</span><span>{Math.floor(quotaProgress)}%</span></div>
                    <div className="kpi-quota-bar"><div className="kpi-quota-fill" style={{ width: \`\${quotaProgress}%\` }} /></div>
                  </div>
                  {wasteCount > 0 && (
                    <div className="waste-warning">
                      资源浪费率：{((wasteCount / Math.max(1, save.dailyConsumed + wasteCount)) * 100).toFixed(0)}% — {wasteCount > 20 ? '⚠️ 严重超标' : '需关注'}
                    </div>
                  )}
                </div>
              </div>

              {/* Email System */}
              <div className="panel scp-panel">
                <div className="panel-header scp-header">
                  <Lock size={14} /> 加密通信 {unreadCount > 0 && <span className="unread-dot">{unreadCount}</span>}
                </div>
                <div className="email-list">
                  {availableEmails.length === 0 && (
                    <div style={{ padding: 16, color: '#86909c', fontSize: 13 }}>
                      <Lock size={12} style={{verticalAlign:'middle'}} /> 无待处理通信
                    </div>
                  )}
                  {availableEmails.map(email => (
                    <div key={email.id}>
                      <div
                        className={\`email-item \${!save.readEmails.includes(email.id) ? 'unread' : ''}\`}
                        onClick={() => handleEmailClick(email.id)}
                      >
                        <div className="email-from">
                          <Lock size={10} style={{verticalAlign:'middle',marginRight:4}} />
                          {email.from}
                        </div>
                        <div className="email-subject">
                          {!save.readEmails.includes(email.id) && <span className="email-new-tag">NEW</span>}
                          {email.subject}
                        </div>
                      </div>
                      {expandedEmail === email.id && (
                        <div className="email-body-expanded">
                          <div className="email-classification">机密等级：CONFIDENTIAL | 阅后即焚协议：否</div>
                          {email.body}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ---- TAB: 设施 ---- */}
          {activeTab === '设施' && (
            <>
              <div className="panel scp-facility-panel">
                <div className="panel-header" style={{ background: '#1d2129', color: '#fff', fontFamily: 'Consolas, monospace' }}>
                  🔒 SITE-██ 设施状态监控
                </div>
                <div className="panel-body">
                  <div className="facility-status">
                    <div className="facility-row">
                      <span className="facility-label">站点编号</span>
                      <span className="facility-value">Site-██ [2级安保许可]</span>
                    </div>
                    <div className="facility-row">
                      <span className="facility-label">收容状态</span>
                      <span className="facility-value" style={{ color: '#00b42a' }}>🟢 绿色 — 无收容突破</span>
                    </div>
                    <div className="facility-row">
                      <span className="facility-label">活跃实验</span>
                      <span className="facility-value">{save.currentLevel - 1} 项已完成 / 1 项进行中</span>
                    </div>
                    <div className="facility-row">
                      <span className="facility-label">D级消耗率</span>
                      <span className="facility-value">{save.kpiHistory.length > 0 ? (save.totalConsumed / save.kpiHistory.length).toFixed(1) : '-'} 人/实验</span>
                    </div>
                    <div className="facility-row">
                      <span className="facility-label">在站人员</span>
                      <span className="facility-value">研究员 ██名 / D级 {save.inventoryCount.toLocaleString()}名</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">📡 异常收容状态</div>
                <div className="panel-body" style={{ fontSize: 12, lineHeight: 2 }}>
                  <div className="report-line"><span>Safe级</span><span style={{ color: '#00b42a' }}>██项 — 稳定</span></div>
                  <div className="report-line"><span>Euclid级</span><span style={{ color: '#ff7d00' }}>██项 — 监控中</span></div>
                  <div className="report-line"><span>Keter级</span><span style={{ color: '#f53f3f' }}>██项 — 强化收容</span></div>
                  <div className="report-line"><span>Thaumiel级</span><span style={{ color: '#3370ff' }}>█项 — [权限不足]</span></div>
                  <div className="report-line"><span>已无效化</span><span style={{ color: '#86909c' }}>██项</span></div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">⚠ 📢 近期站点通告</div>
                <div className="panel-body" style={{ fontSize: 12, lineHeight: 1.8, color: '#4e5969' }}>
                  <p>📢 提醒：B区走廊监控探头故障已修复，请勿在该区域进行未授权活动。</p>
                  <p style={{marginTop:4}}>📢 SCP-173收容间清洁排班已更新，请查阅工单系统。</p>
                  <p style={{marginTop:4}}>📢 食堂本周菜单已调整。D级人员用餐时段不变。</p>
                  <p style={{marginTop:4}}>📢 <span style={{color:'#f53f3f'}}>注意</span>：严禁与SCP-049进行非实验性对话。违者将被重新分类。</p>
                </div>
              </div>
            </>
          )}

          {/* ---- TAB: 库存 ---- */}
          {activeTab === '库存' && (
            <div className="panel">
              <div className="panel-header">📦 D级人员库存管理</div>
              <div className="panel-body">
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: save.inventoryCount <= 500 ? '#f53f3f' : 'var(--oa-text)' }}>
                    {save.inventoryCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#86909c', marginTop: 4 }}>当前可用库存（人）</div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 13, lineHeight: 2.2 }}>
                  <div className="report-line"><span>初始配额</span><span>3,000 人</span></div>
                  <div className="report-line"><span>累计消耗</span><span style={{ color: '#f53f3f' }}>{save.totalConsumed.toLocaleString()} 人</span></div>
                  <div className="report-line"><span>累计补充</span><span style={{ color: '#00b42a' }}>{Math.max(0, save.totalConsumed - 3000 + save.inventoryCount).toLocaleString()} 人</span></div>
                  <div className="report-line"><span>库存状态</span><span>{save.inventoryCount > 1500 ? '🟢 充足' : save.inventoryCount > 500 ? '🟡 适中' : '🔴 紧缺'}</span></div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 13, lineHeight: 2 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>工种分布（标准配比）</div>
                  <div className="report-line"><span>🔧 杂役工种</span><span>35%</span></div>
                  <div className="report-line"><span>☢️ 危险接触工种</span><span>25%</span></div>
                  <div className="report-line"><span>🧬 生物实验工种</span><span>20%</span></div>
                  <div className="report-line"><span>⚙️ 机械操作工种</span><span>12%</span></div>
                  <div className="report-line"><span>🟪 [数据删除]工种</span><span>8%</span></div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 11, color: '#86909c', lineHeight: 1.8 }}>
                  来源渠道：██省特批转化项目 | AI替代下岗人员特批通道<br/>
                  下批到货预计：████年██月██日<br/>
                  备注：库存低于500时系统将自动发起采购申请
                </div>
              </div>
            </div>
          )}

          {/* ---- TAB: 报表 ---- */}
          {activeTab === '报表' && (
            <div className="panel">
              <div className="panel-header">📊 运营数据报表</div>
              <div className="panel-body">
                <div className="kpi-grid" style={{ marginBottom: 16 }}>
                  <div className="kpi-item"><div className="kpi-value">{save.dailyConsumed}</div><div className="kpi-label">今日消耗</div></div>
                  <div className="kpi-item"><div className="kpi-value">{save.weeklyConsumed}</div><div className="kpi-label">本周消耗</div></div>
                  <div className="kpi-item"><div className="kpi-value">{save.totalConsumed.toLocaleString()}</div><div className="kpi-label">累计消耗</div></div>
                  <div className="kpi-item"><div className="kpi-rating">{lastRating}</div><div className="kpi-label">效率评级</div></div>
                </div>
                <div className="kpi-quota">
                  <div className="kpi-quota-text"><span>月度指标 ({monthlyQuota}人)</span><span>{Math.floor(quotaProgress)}%</span></div>
                  <div className="kpi-quota-bar"><div className="kpi-quota-fill" style={{ width: \`\${quotaProgress}%\` }} /></div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>近期工单记录</div>
                <div style={{ fontSize: 12, lineHeight: 2 }}>
                  {save.kpiHistory.length === 0 && <div style={{ color: '#86909c' }}>暂无记录</div>}
                  {save.kpiHistory.slice(-8).reverse().map((h, i) => (
                    <div key={i} className="report-line">
                      <span>第{h.level}关</span>
                      <span>消耗 {h.consumed}人 | 评级 {h.rating}</span>
                    </div>
                  ))}
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 12, lineHeight: 2 }}>
                  <div className="report-line"><span>平均每单耗人</span><span>{save.kpiHistory.length > 0 ? (save.totalConsumed / save.kpiHistory.length).toFixed(1) : '-'}</span></div>
                  <div className="report-line"><span>犹豫次数</span><span>{save.hesitationCount} 次</span></div>
                  <div className="report-line"><span>已完成工单</span><span>{save.currentLevel - 1} 个</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ---- TAB: 伦理 ---- */}
          {activeTab === '伦理' && (
            <div className="panel">
              <div className="panel-header">⚖️ 伦理委员会</div>
              <div className="panel-body">
                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 14, lineHeight: 2 }}>
                  {save.ethicsReviewsPassed >= 6 ? (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🚫</div>
                      <div style={{ fontWeight: 600, color: '#86909c' }}>本部门已于上月完成优化重组。</div>
                      <div style={{ fontSize: 12, color: '#c9cdd4' }}>审查流程已永久停止。感谢多年来的理解与配合。</div>
                    </>
                  ) : save.ethicsReviewsPassed >= 5 ? (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
                      <div style={{ fontWeight: 600 }}>审查流程已自动化</div>
                      <div style={{ fontSize: 12, color: '#86909c' }}>所有审查现由AI自动处理，无需人工介入。</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600 }}>伦理委员会工作台</div>
                      <div style={{ fontSize: 12, color: '#86909c' }}>状态：运行中</div>
                    </>
                  )}
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 13, lineHeight: 2.2 }}>
                  <div className="report-line"><span>未通过审查</span><span>0 次</span></div>
                  <div className="report-line"><span>合规评级</span><span style={{ color: '#00b42a' }}>✅ 完全合规</span></div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 11, color: '#86909c', lineHeight: 1.8 }}>
                  提示：伦理审查将在特定工单完成后自动触发。<br/>
                  所有审查结果均已归档备案（编号 ETH-████-██）。<br/>
                  如对审查结果有异议，请……<span style={{ textDecoration: 'line-through' }}>联系伦理委员会</span> <span style={{ color: '#c9cdd4' }}>（该渠道已关闭）</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Level Complete Report */}
      {showReport && isLevelComplete && (
        <div className="modal-overlay">
          <div className="modal report-modal">
            <div className="report-content">
              <div className="report-title">SCP基金会实验结算报告</div>
              <div className="report-line"><span>工单编号：</span><span>{mission.id}</span></div>
              <div className="report-line"><span>实验对象：</span><span>{mission.scpSubject}</span></div>
              <div className="report-line"><span>日　　期：</span><span>{new Date().toLocaleDateString('zh-CN')}</span></div>
              <hr className="report-divider" />
              <div className="report-line"><span>派遣人数：</span><span>{levelConsumed}人</span></div>
              <div className="report-line"><span>预计损耗：</span><span>{mission.casualtyEstimate}</span></div>
              <div className="report-line"><span>步数使用：</span><span>{mission.maxMoves - movesLeft}/{mission.maxMoves}</span></div>
              <div className="report-conclusion">{mission.rewardText}</div>
              <div className="report-rating">
                {'⭐'.repeat(Math.max(1, 5 - ['S','A','B','C','D'].indexOf(lastRating)))}
                {' '}效率评级：{lastRating === 'S' ? '卓越' : lastRating === 'A' ? '优秀' : lastRating === 'B' ? '良好' : lastRating === 'C' ? '合格' : '待改进'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={goNextLevel}>已阅，归档</button>
            </div>
          </div>
        </div>
      )}

      {/* Level Failed */}
      {showFailed && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">📋 工单执行报告</div>
            <div className="modal-body">
              <div className="failed-text">
                <p>步数已用尽，工单目标未完成。</p>
                <p style={{ marginTop: 8, fontSize: 12, color: '#86909c' }}>
                  请注意：连续未达标将影响您的年度绩效评级。
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={retryLevel}>重新派遣</button>
            </div>
          </div>
        </div>
      )}

      {/* Ethics Review */}
      {showEthics && currentEthics && (
        <div className="modal-overlay">
          <div className="modal ethics-modal">
            <div className="modal-header">⚖️ 伦理委员会例行审查</div>
            <div className="modal-body">
              {ethicsOutcome ? (
                <div className="ethics-outcome">{ethicsOutcome}</div>
              ) : currentEthics.specialBehavior === 'auto_pass' ? (
                <div className="ethics-outcome" style={{ color: '#86909c' }}>
                  审查已自动通过。感谢您的配合。
                </div>
              ) : currentEthics.specialBehavior === 'committee_dissolved' ? (
                <div className="ethics-outcome" style={{ color: '#86909c' }}>
                  {currentEthics.outcome}
                </div>
              ) : (
                <>
                  <div className="ethics-question">{currentEthics.question}</div>
                  <div className="ethics-options">
                    {currentEthics.options.map((opt, i) => (
                      <button key={i} className="btn btn-primary" onClick={handleEthicsOption} style={{ width: '100%' }}>
                        {opt}
                      </button>
                    ))}
                    {currentEthics.specialBehavior === 'disabled_option' && (
                      <button
                        className="btn btn-disabled"
                        onClick={() => {
                          setHesitationNotice('该选项暂不可用');
                          setTimeout(() => setHesitationNotice(null), 2000);
                        }}
                        style={{ width: '100%' }}
                      >
                        暂停实验
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">📦 D级人员采购申请单</div>
            <div className="modal-body">
              <p>库存不足，请选择补充来源：</p>
              <div className="purchase-options">
                <label className="purchase-option">
                  <input type="checkbox" checked={false} onChange={() => {}} />
                  死刑犯定向转化
                </label>
                <label className="purchase-option">
                  <input type="checkbox" checked={false} onChange={() => {}} />
                  失业人口招募
                </label>
                <label className="purchase-option forced">
                  <input type="checkbox" checked={true} readOnly />
                  AI替代下岗人员特批通道（默认）
                </label>
              </div>
              <p style={{ fontSize: 11, color: '#86909c' }}>
                注：无论选择何种来源，补充量均为标准配额。
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handlePurchase}>提交申请</button>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Panel */}
      {showAchievements && (
        <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">🏅 成就档案</div>
            <div className="achievement-list">
              {achievements.map(ach => {
                const unlocked = save.unlockedAchievements.includes(ach.id);
                if (ach.hidden && !unlocked) return null;
                return (
                  <div key={ach.id} className={\`achievement-item \${!unlocked ? 'achievement-locked' : ''}\`}>
                    <div className="achievement-icon">{unlocked ? ach.icon : '🔒'}</div>
                    <div className="achievement-info">
                      <h4>{unlocked ? ach.name : '???'}</h4>
                      <p>{unlocked ? ach.desc : '未解锁'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAchievements(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Psych Modal */}
      {showPsychModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">🧠 心理健康提示</div>
            <div className="modal-body">
              <p>系统检测到您可能存在操作犹豫倾向。</p>
              <p>是否需要安排免费心理辅导？</p>
              <p style={{ fontSize: 11, color: '#86909c', marginTop: 8 }}>
                （注：心理辅导包含标准记忆删除流程。）
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPsychModal(false)}>稍后提醒</button>
              <button className="btn btn-primary" onClick={() => setShowPsychModal(false)}>好的</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOASTS & NOTIFICATIONS ===== */}
      {achievementToast && (
        <div className="achievement-toast" key={achievementToast}>
          🎖 成就解锁：{achievementToast}
        </div>
      )}

      {hesitationNotice && (
        <div className="hesitation-notice" key={hesitationNotice}>
          {hesitationNotice}
        </div>
      )}

      {systemBug && (
        <div className="system-bug" key={systemBug}>
          {systemBug}
        </div>
      )}

      {/* ===== ENDING SCREENS ===== */}
      {showGlitch && <div className="glitch-overlay" />}

      {showEndingA && (
        <div className="ending-screen">
          <div className="ending-text">
            {endingLines.map((line, i) => (
              <div key={i} className="ending-line" style={{ animationDelay: \`\${i * 0.1}s\` }}>
                {line || <br />}
              </div>
            ))}
          </div>
          {showEndingBtn && (
            <button className="ending-btn" onClick={handleEndingAccept}>
              [接受重新分类]
            </button>
          )}
        </div>
      )}

      {/* ===== CONTAINMENT BREACH OVERLAY ===== */}
      {showBreach && (
        <div className="breach-overlay">
          <div className="breach-text">⚠️ 收容突破 ⚠️ 棋盘重组中…</div>
        </div>
      )}
    </>
  );
}

export default App;
`;

const output = logic.join('\n') + '\n' + render;
fs.writeFileSync('src/App.tsx', output, 'utf-8');
console.log('Written', output.split('\n').length, 'lines');

// Verify brace balance
let s = 0;
for (const ch of output) {
  if (ch === '{') s++;
  if (ch === '}') s--;
}
console.log('Brace balance:', s);
