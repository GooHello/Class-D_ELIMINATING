import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Piece } from './game/MatchEngine';
import {
  createBoard,
  findMatches,
  removeMatches,
  applyGravity,
  isAdjacent,
  swapPieces,
  hasAnyMatch,
  hasPossibleMoves,
  getColorCounts,
} from './game/MatchEngine';
import { getMission, COLOR_HEX, COLOR_EMOJI, type PieceColor, type MissionOrder } from './data/missions';
import { emails } from './data/emails';
import { ethicsReviews, type EthicsReview } from './data/ethics';
import { achievements, systemBugMessages } from './data/achievements';
import { loadSave, saveSave, defaultSave, type GameSave } from './systems/SaveManager';
import { getLastWord, getWasteMessage } from './data/lastWords';
import { generateFullProfile, clearProfileCache, type DClassProfile } from './data/professions';
import { getPhase, getTerm, getPhaseTransitionNotice, getComboText, getLogTone } from './data/terminology';
import { selectEnding, getMidgameEnding } from './data/endings';
import { getAIComment } from './data/aiComments';
import { calculateWeightedProgress, calculateCasualtyRate, getStepCost, COLOR_BONUSES, calculateColorPassives } from './data/colorBonuses';
import PieceToken from './components/PieceToken';
import { ROWS, COLS, rollSurvival, triggerContainmentBreach, createPiece, applyHazardZones, generateHazardPositions, stampHazardFlags } from './game/MatchEngine';
import { Shield, Lock, FileText, AlertTriangle as AlertIcon } from 'lucide-react';

function App() {
  // ========== GAME STATE ==========
  const [save, setSave] = useState<GameSave>(loadSave);
  const [board, setBoard] = useState<Piece[][]>(() => {
    const s = loadSave();
    if (s.boardState) {
      try {
        const parsed = JSON.parse(s.boardState) as Piece[][];
        // Validate dimensions match current ROWS×COLS
        if (parsed.length === ROWS && parsed[0]?.length === COLS) return parsed;
      } catch { /* fall through */ }
    }
    return createBoard();
  });
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mission, setMission] = useState<MissionOrder>(() => getMission(loadSave().currentLevel));
  const [movesLeft, setMovesLeft] = useState(() => {
    const s = loadSave();
    return s.movesLeftState ?? getMission(s.currentLevel).suggestedDeploy;
  });
  // 新机制: 总进度 (单一数值)
  const [totalProgress, setTotalProgress] = useState<number>(() => {
    const s = loadSave();
    if (s.progressState) { try { const v = JSON.parse(s.progressState); return typeof v === 'number' ? v : 0; } catch { /* fall through */ } }
    return 0;
  });
  const [combo, setCombo] = useState(0);
  // 绿色增益 buff: 累计降低折损率
  const [greenBuff, setGreenBuff] = useState(0);
  const [hazardPositions, setHazardPositions] = useState<Set<string>>(new Set());
  // 红色压制协议: 冻结行
  const [frozenRows, setFrozenRows] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [removingCells, setRemovingCells] = useState<Set<string>>(new Set());
  const [removeAnimClass, setRemoveAnimClass] = useState('removing'); // 当前消除动画 class
  const [droppingCells, setDroppingCells] = useState<Set<string>>(new Set());

  // ========== UI STATE ==========
  const [activeTab, setActiveTab] = useState('工单');
  const [showReport, setShowReport] = useState(false);
  const [showEthics, setShowEthics] = useState(false);
  const [currentEthics, setCurrentEthics] = useState<EthicsReview | null>(null);
  const [ethicsOutcome, setEthicsOutcome] = useState('');
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [professionFlash, setProfessionFlash] = useState<string | null>(null);
  const [comboFloat, setComboFloat] = useState<string | null>(null);
  const [systemBug, setSystemBug] = useState<string | null>(null);
  const [hesitationNotice, setHesitationNotice] = useState<string | null>(null);
  const [showPsychModal, setShowPsychModal] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [levelConsumed, setLevelConsumed] = useState(() => loadSave().levelConsumedState || 0);
  const [showFailed, setShowFailed] = useState(false);
  const [emergencyUsed, setEmergencyUsed] = useState(false); // 紧急征召：每关限一次
  const [emergencyRecruits, setEmergencyRecruits] = useState<DClassProfile[]>([]); // 紧急征召名单
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false); // 确认弹窗
  const [skillCooldowns, setSkillCooldowns] = useState({ shuffle: 0, purge: 0, extraMoves: 0 });
  const [selectingPurgeColor, setSelectingPurgeColor] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState<{id: number; text: string; x: number; y: number; isWaste: boolean}[]>([]);
  const [wasteCount, setWasteCount] = useState(0);
  const bubbleId = useRef(0);
  const [hoveredProfile, setHoveredProfile] = useState<DClassProfile | null>(null);
  const [showBreach, setShowBreach] = useState(false);
  const movesWithoutTargetProgress = useRef(0);
  // combo 累积器：合并一次 combo 链的战报数据
  const comboAccum = useRef({ deployed: 0, survived: 0, dead: 0, combos: 0 });

  // ===== 战报日志系统 =====
  interface BattleLogEntry {
    id: number;
    timestamp: string;
    type: 'deploy' | 'breach' | 'waste' | 'survive';
    scpName?: string;
    deployed?: number;
    survived?: number;
    dead?: number;
    deathCause?: string;
    detail?: string;
  }
  const logIdRef = useRef(0);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);

  const addLogEntry = useCallback((entry: Omit<BattleLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setBattleLog(prev => [{
      ...entry,
      id: logIdRef.current++,
      timestamp: ts,
    }, ...prev].slice(0, 30)); // 最多保留30条
  }, []);

  // Target colors for current mission
  // bonusColors: 推荐工种高亮（但所有颜色都推进进度）
  const bonusColorSet = useMemo(() => {
    return new Set(mission.bonusColors || []);
  }, [mission]);

  // ========== SILENT LEVEL (静默审阅关) ==========
  const [showSilentLevel, setShowSilentLevel] = useState(false);
  const [silentPageIndex, setSilentPageIndex] = useState(0);

  // ========== DEPLOYMENT ALLOCATION (人员调拨) ==========
  const [showAllocation, setShowAllocation] = useState(true); // 每关开始前显示
  const [allocatedDeploy, setAllocatedDeploy] = useState(0); // 玩家分配的人数
  const [levelDeaths, setLevelDeaths] = useState(0); // 本关累计死亡
  const [levelSurvived, setLevelSurvived] = useState(0); // 本关累计存活回收
  const [levelMaxCombo, setLevelMaxCombo] = useState(0); // 本关最大连锁
  const [levelSkillsUsed, setLevelSkillsUsed] = useState(0); // 本关技能使用次数
  const [levelColorCounts, setLevelColorCounts] = useState<Record<string, number>>({}); // 本关各色消除总数

  // ========== ENDING STATE ==========
  const [showGlitch, setShowGlitch] = useState(false);
  const [showEndingA, setShowEndingA] = useState(false);
  const [endingLines, setEndingLines] = useState<string[]>([]);
  const [showEndingBtn, setShowEndingBtn] = useState(false);
  const [phaseOverlay, setPhaseOverlay] = useState<string | null>(null); // Phase转换全屏overlay
  const [endingBtnText, setEndingBtnText] = useState('[接受重新分类]');
  const [currentEndingId, setCurrentEndingId] = useState<string | null>(null); // 当前结局ID
  const [showParallelEndings, setShowParallelEndings] = useState(false); // 平行结局列表
  const [hasPlayerPiece, setHasPlayerPiece] = useState(false);
  const [uiDissolve, setUiDissolve] = useState(0); // 0=正常, 1~5=UI逐步消失阶段
  const [milestoneFlash, setMilestoneFlash] = useState<string | null>(null); // 沉没成本里程碑
  const lastMilestoneRef = useRef(0); // 上次触发的里程碑
  // 中途结局追踪
  const [disabledOptionClicks, setDisabledOptionClicks] = useState(0); // 结局E：点击禁用选项次数
  const [consecutiveSRatings, setConsecutiveSRatings] = useState(0);   // 结局H：连续S评级次数

  // ========== REFS ==========
  const lastMoveTime = useRef(Date.now());
  const hesitationTimer = useRef<ReturnType<typeof setInterval>>();
  const hesitationFired = useRef(false); // 同一思考期内只计一次
  const levelStartTime = useRef(Date.now());
  const levelHesitations = useRef(0);
  const handleLevelCompleteRef = useRef<(finalProgress: Record<PieceColor, number>, consumed: number) => void>(() => {});

  // ========== PERSIST ==========
  const updateSave = useCallback((updater: (prev: GameSave) => GameSave) => {
    setSave(prev => {
      const next = updater(prev);
      saveSave(next);
      return next;
    });
  }, []);

  // Auto-save board state on change
  useEffect(() => {
    updateSave(prev => ({
      ...prev,
      boardState: JSON.stringify(board),
      progressState: JSON.stringify(totalProgress),
      movesLeftState: movesLeft,
      levelConsumedState: levelConsumed,
    }));
  }, [board, totalProgress, movesLeft, levelConsumed]);

  // ========== ACHIEVEMENT CHECK ==========
  const unlockAchievement = useCallback((id: string) => {
    setSave(prev => {
      if (prev.unlockedAchievements.includes(id)) return prev;
      const ach = achievements.find(a => a.id === id);
      if (ach) {
        setAchievementToast(`${ach.icon} ${ach.name}`);
        setTimeout(() => setAchievementToast(null), 3000);
      }
      const next = { ...prev, unlockedAchievements: [...prev.unlockedAchievements, id] };
      saveSave(next);
      return next;
    });
  }, []);

  // ========== HESITATION TRACKER ==========
  // 15秒无操作才算犹豫，且同一思考期内只计一次（需要新操作后重置）
  useEffect(() => {
    hesitationTimer.current = setInterval(() => {
      if (isAnimating || showReport || showEthics || showEndingA) return;
      if (hesitationFired.current) return; // 已经记录过了，等待玩家操作后重置
      const elapsed = Date.now() - lastMoveTime.current;
      if (elapsed >= 15000) {
        hesitationFired.current = true; // 标记：本次思考期已记录
        levelHesitations.current++;
        updateSave(prev => {
          const newCount = prev.hesitationCount + 1;
          const newHistory = [...prev.hesitationHistory, { level: prev.currentLevel, timestamp: Date.now() }];

          if (newCount === 1) {
            unlockAchievement('hesitated');
          }
          if (newCount === 8) {
            const aiHesMsg = getAIComment(save.currentLevel, 'hesitation') || '检测到操作延迟，已记录。';
            setHesitationNotice(aiHesMsg);
            setTimeout(() => setHesitationNotice(null), 3000);
          }
          if (newCount === 20) {
            setShowPsychModal(true);
          }
          // 结局F：犹豫达到40次
          if (newCount >= 40) {
            setTimeout(() => checkMidgameEndings(), 1000);
          }

          return { ...prev, hesitationCount: newCount, hesitationHistory: newHistory, levelsWithoutHesitation: 0, humanityScore: Math.min(150, prev.humanityScore + 3) };
        });
      }
    }, 1000);
    return () => clearInterval(hesitationTimer.current);
  }, [isAnimating, showReport, showEthics, showEndingA, updateSave, unlockAchievement]);

  // ========== PROFESSION FLASH ==========
  const triggerProfessionFlash = useCallback((piece: Piece) => {
    if (Math.random() < 0.15) {
      setProfessionFlash(`⚠ ${piece.dClassId} ${piece.profession}`);
      setTimeout(() => setProfessionFlash(null), 800);
    }
  }, []);

  // ========== SYSTEM BUG MESSAGE ==========
  const triggerSystemBug = useCallback((dClassId: string) => {
    if (Math.random() < 0.05) {
      const msg = systemBugMessages[Math.floor(Math.random() * systemBugMessages.length)];
      setSystemBug(msg.replace('{id}', dClassId.replace('D-', '')));
      setTimeout(() => setSystemBug(null), 3500);
    }
  }, []);

  // ========== CHECK LEVEL COMPLETION ==========
  const checkLevelComplete = useCallback((currentProgressValue: number) => {
    return currentProgressValue >= (mission.targetProgress || 999);
  }, [mission]);

  // ========== PROCESS MATCHES (recursive chain) ==========
  const processMatches = useCallback((currentBoard: Piece[][], currentCombo: number, currentProgressValue: number, consumed: number, depth: number = 0) => {
    // 防止无限递归 — 最多连锁 15 次
    if (depth > 15) {
      setIsAnimating(false);
      setCombo(0);
      return;
    }
    const matches = findMatches(currentBoard);
    if (matches.length === 0) {
      // Combo 链结束 → 输出汇总战报
      const acc = comboAccum.current;
      if (acc.deployed > 0) {
        const phase = getPhase(save.currentLevel);
        const deathCauses = phase === 'PHASE_HUMAN' ? [
          `协助${mission.scpSubject}测试后暂未归队`,
          '实验过程中与团队失联',
          '进入观察区域后未按时返回',
          '在指定区域执行任务，等待确认',
        ] : phase === 'PHASE_NUMBER' ? [
          `接触${mission.scpSubject}后状态异常`,
          '任务中出现不可控变量',
          '观察区域环境超出安全阈值',
          '生理指标偏离标准范围',
        ] : phase === 'PHASE_BATCH' ? [
          `收容${mission.scpSubject}时遭受不可逆损伤`,
          '执行中状态异常，已按协议处理',
          '接触异常物品后生理指标归零',
          '暴露于异常效应区域，未能撤离',
          '标准操作流程中发生意外折损',
        ] : [
          `PROC_${mission.scpSubject}_ERR`,
          'STATUS: NULL',
          'SIGNAL_LOST',
          'Δ⁻ CONFIRMED',
        ];
        addLogEntry({
          type: 'deploy',
          scpName: mission.scpSubject,
          deployed: acc.deployed,
          survived: acc.survived,
          dead: acc.dead,
          deathCause: acc.dead > 0 ? deathCauses[Math.floor(Math.random() * deathCauses.length)] : undefined,
          detail: acc.combos > 1 ? `${acc.combos}连收容行动` : undefined,
        });
        // AI 实时评语 — combo 结束后，写入战报+toast
        const aiTrigger = acc.combos >= 3 ? 'high_efficiency' : acc.dead > acc.survived ? 'low_efficiency' : 'after_match';
        const aiMsg = getAIComment(save.currentLevel, aiTrigger);
        if (aiMsg && !hesitationNotice) {
          // 写入战报面板（永久记录）
          addLogEntry({
            type: 'system' as any,
            scpName: '🤖 AI-HRMS',
            detail: aiMsg,
          });
          // 同时显示底部toast
          setTimeout(() => {
            setHesitationNotice(aiMsg);
            setTimeout(() => setHesitationNotice(null), 3000);
          }, 600);
        }
        comboAccum.current = { deployed: 0, survived: 0, dead: 0, combos: 0 };
      }

      setIsAnimating(false);
      setCombo(0);
      if (!hasPossibleMoves(currentBoard)) {
        let freshBoard = createBoard();
        if (hazardPositions.size > 0) {
          freshBoard = stampHazardFlags(freshBoard, hazardPositions);
        }
        setBoard(freshBoard);
      }
      return;
    }

    const newCombo = currentCombo + 1;
    setCombo(newCombo);

    // Show combo float — 语气随phase变化
    if (newCombo >= 2) {
      const floatText = getComboText(newCombo, getPhase(save.currentLevel));
      if (floatText) {
        setComboFloat(floatText);
        setTimeout(() => setComboFloat(null), 800);
      }
    }

    if (newCombo >= 5) unlockAchievement('combo_master');

    // Mark cells for removal animation
    const toRemoveKeys = new Set<string>();
    let maxMatchSize = 0;
    for (const m of matches) {
      if (m.positions.length > maxMatchSize) maxMatchSize = m.positions.length;
      for (const [r, c] of m.positions) {
        toRemoveKeys.add(`${r},${c}`);
    }
    }
    // 消除动画分级：combo3+ > 5消 > 4消 > 普通
    if (newCombo >= 3) setRemoveAnimClass('removing-combo3');
    else if (maxMatchSize >= 5) setRemoveAnimClass('removing-5');
    else if (maxMatchSize >= 4) setRemoveAnimClass('removing-4');
    else setRemoveAnimClass('removing');
    setRemovingCells(toRemoveKeys);

    setTimeout(() => {
      const { newBoard, removed } = removeMatches(currentBoard, matches);
      const colorCounts = getColorCounts(removed);
      const totalRemoved = removed.length;

      // ========== 新进度系统: 加权总进度 ==========
      // P2 #15: purge debuff — 被清洗的颜色暂时不产生进度
      const effectiveColorCounts = { ...colorCounts };
      if (purgeDebuffColor && purgeDebuffSteps > 0 && effectiveColorCounts[purgeDebuffColor]) {
        effectiveColorCounts[purgeDebuffColor] = 0;
      }
      let progressGained = calculateWeightedProgress(effectiveColorCounts, newCombo);

      // P2 #15: shuffle debuff — 进度 -30%
      if (shuffleDebuff > 0) {
        progressGained = Math.floor(progressGained * 0.7);
      }

      // P1 #4: bonusColors 加成 — 推荐工种额外 +30% 进度
      if (mission.bonusColors && mission.bonusColors.length > 0) {
        let bonusExtra = 0;
        for (const bc of mission.bonusColors) {
          const cnt = colorCounts[bc] || 0;
          if (cnt > 0) {
            const base = cnt * (COLOR_BONUSES[bc]?.progressMultiplier ?? 1);
            bonusExtra += Math.floor(base * 0.3);
          }
        }
        progressGained += bonusExtra;
      }

      // ========== 工种被动效果 ==========
      const passiveResult = calculateColorPassives(colorCounts);

      // P0 #2: 红色被动 — 4+消除时红色进度翻倍
      if (passiveResult.redProgressBonus > 0) {
        const redExtraProgress = Math.floor(passiveResult.redProgressBonus * (COLOR_BONUSES.red?.progressMultiplier ?? 1.2));
        progressGained += redExtraProgress;
      }

      const updatedProgressValue = currentProgressValue + progressGained;
      setTotalProgress(updatedProgressValue);

      // 绿色被动: 累积降低折损率
      if (passiveResult.casualtyReduction > 0) {
        setGreenBuff(prev => Math.min(0.6, prev + passiveResult.casualtyReduction));
      }

      // 蓝色/紫色被动: 步数修改
      if (passiveResult.extraMoves !== 0) {
        setMovesLeft(prev => Math.max(0, prev + passiveResult.extraMoves));
      }

      // 紫色被动: bonus progress
      if (passiveResult.anomalyEffect === 'bonus_progress') {
        const bonusProgress = 10;
        setTotalProgress(prev => prev + bonusProgress);
      }

      // P0 #5: 橙色被动 — 十字清除实装
      // 将十字线上的格子标记为 null，让 gravity 统一安全填充
      if (passiveResult.crossClear) {
        const orangePiece = removed.find(p => p.color === 'orange');
        if (orangePiece) {
          const cr = orangePiece.row;
          const cc = orangePiece.col;
          let crossExtra = 0;
          for (let i = 0; i < COLS; i++) {
            if (newBoard[cr]?.[i] && newBoard[cr][i].color) {
              crossExtra++;
              newBoard[cr][i] = null as unknown as Piece;
            }
          }
          for (let i = 0; i < ROWS; i++) {
            if (newBoard[i]?.[cc] && newBoard[i][cc].color && i !== cr) {
              crossExtra++;
              newBoard[i][cc] = null as unknown as Piece;
            }
          }
          // 十字清除额外进度
          if (crossExtra > 0) {
            const crossProgress = Math.floor(crossExtra * 1.1);
            setTotalProgress(prev => prev + crossProgress);
          }
        }
      }


      // 被动效果浮动文字提示
      if (passiveResult.passiveText) {
        const centerCol = Math.floor(COLS / 2);
        setSpeechBubbles(prev => [...prev, {
          id: bubbleId.current++,
          text: passiveResult.passiveText!,
          x: centerCol * 62 + 10,
          y: 10,
          isWaste: false,
        }]);
        setTimeout(() => {
          setSpeechBubbles(prev => prev.slice(0, -1));
        }, 2000);
      }

      // === SPEECH BUBBLE on elimination (max 1 per match, no overlap) ===
      if (removed.length > 0) {
        const word = getLastWord(getPhase(save.currentLevel));
        if (word) {
          const piece = removed[Math.floor(removed.length / 2)]; // pick middle piece
          const bx = piece.col * 62 + 30;
          const by = piece.row * 62 + 20;
          // Only add if no existing bubble is within 80px
          setSpeechBubbles(prev => {
            const tooClose = prev.some(b => Math.abs(b.x - bx) < 80 && Math.abs(b.y - by) < 80);
            if (tooClose) return prev;
            const newBubble = { id: bubbleId.current++, text: word, x: bx, y: by, isWaste: false };
            return [...prev, newBubble];
          });
          const myId = bubbleId.current - 1;
          setTimeout(() => {
            setSpeechBubbles(prev => prev.filter(b => b.id !== myId));
          }, 2000);
        }
      }

      // ========== 新库存逻辑：只有死亡扣库存，存活返还 ==========
      const newConsumed = consumed + totalRemoved;
      setLevelConsumed(newConsumed);

      // 追踪本关死亡/存活
      setLevelDeaths(prev => prev + dead.length);
      setLevelSurvived(prev => prev + survivors.length);

      // 追踪本关各色消除数（用于副目标）
      setLevelColorCounts(prev => {
        const updated = { ...prev };
        for (const [color, count] of Object.entries(colorCounts)) {
          updated[color] = (updated[color] || 0) + count;
        }
        return updated;
      });

      // 追踪最大连锁
      if (newCombo > levelMaxCombo) setLevelMaxCombo(newCombo);

      updateSave(prev => {
        // 死亡人数从库存中扣除（已经预扣了分配量，存活的要返还）
        const newInventory = prev.inventoryCount + survivors.length; // 存活者返回库存
        const netDead = dead.length;
        const newTotal = prev.totalConsumed + netDead; // totalConsumed 只计死亡
        const newDaily = prev.dailyConsumed + netDead;

        if (newTotal >= 100) unlockAchievement('hundred');
        if (newTotal >= 1000) unlockAchievement('thousand');
        if (newTotal >= 10000) unlockAchievement('ten_thousand');

        // "统计数字的暴政"— 里程碑具象化（写入战报 + 数字旁闪现）
        const milestones: Record<number, string> = {
          50: '大约是一辆长途大巴的乘客。',
          100: '大约是两节地铁车厢的乘客。',
          200: '一架小型客机的满载人数。',
          300: '一架客机的满载人数。',
          500: '如果他们站成一排，队伍有 350 米长。',
          750: '一所小学的全部师生。',
          1000: '一所中学的全部学生。',
          1500: '一个居民小区的住户。',
          2000: '一个小镇的人口。',
          3000: '一座体育馆。观众席上空无一人。',
        };
        for (const [threshold, text] of Object.entries(milestones)) {
          const t = Number(threshold);
          if (newTotal >= t && prev.totalConsumed < t) {
            // 写入战报面板（永久红色记录）
            addLogEntry({
              type: 'system' as any,
              scpName: '📊 统计',
              detail: `累计 ${t.toLocaleString()} — ${text}`,
            });
            // 数字旁短暂闪现
            setTimeout(() => {
              setMilestoneFlash(text);
              setTimeout(() => setMilestoneFlash(null), 5000);
            }, 800);
            break;
          }
        }

        if (newInventory <= 80 && prev.inventoryCount > 80) {
          setTimeout(() => setShowPurchase(true), 500);
        }

        // 大量消耗 → 人性降低：每消耗50人扣1分
        const humanityDrain = Math.floor(newTotal / 50) - Math.floor(prev.totalConsumed / 50);

        return {
          ...prev,
          totalConsumed: newTotal,
          inventoryCount: Math.max(0, newInventory),
          dailyConsumed: newDaily,
          weeklyConsumed: prev.weeklyConsumed + netDead,
          humanityScore: Math.max(0, prev.humanityScore - humanityDrain),
        };
      });

      if (!save.unlockedAchievements.includes('first_blood')) {
        unlockAchievement('first_blood');
      }

      if (removed.length > 0) {
        triggerSystemBug(removed[0].dClassId);
      }

      setRemovingCells(new Set());

      // === SURVIVAL ROLL (with combo + green buff) ===
      const securityLevel = mission?.securityLevel ?? 1;
      const baseCasualtyRate = calculateCasualtyRate(securityLevel, newCombo, greenBuff);
      const survivors: Piece[] = [];
      const dead: Piece[] = [];
      for (const p of removed) {
        // Hazard zone pieces face doubled casualty rate (capped at 0.95)
        const casualtyRate = p.hazard ? Math.min(0.95, baseCasualtyRate * 2) : baseCasualtyRate;
        if (Math.random() > casualtyRate) survivors.push(p);
        else dead.push(p);
      }

      // === ACCUMULATE for combo summary (不再逐次输出) ===
      if (removed.length > 0) {
        comboAccum.current.deployed += removed.length;
        comboAccum.current.survived += survivors.length;
        comboAccum.current.dead += dead.length;
        comboAccum.current.combos = newCombo;
      }


      // Apply gravity (inject survivors back safely via applyGravity)
      const filledBoard = applyGravity(newBoard, survivors);

      setBoard(filledBoard);

      // Mark new cells as dropping
      const newDropping = new Set<string>();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (filledBoard[r][c].isNew) {
            newDropping.add(`${r},${c}`);
            filledBoard[r][c].isNew = false;
          }
        }
      }
      setDroppingCells(newDropping);
      setTimeout(() => setDroppingCells(new Set()), 300);

      // Check for more matches (chain reaction)
      setTimeout(() => {
        // Check if level is complete before processing next chain
        if (checkLevelComplete(updatedProgressValue)) {
          setIsAnimating(false);
          handleLevelCompleteRef.current(updatedProgressValue, newConsumed);
          return;
        }
        processMatches(filledBoard, newCombo, updatedProgressValue, newConsumed, depth + 1);
      }, 350);
    }, 300);
  }, [save, updateSave, unlockAchievement, triggerSystemBug, checkLevelComplete, mission, addLogEntry, greenBuff]);

  // ========== HANDLE CLICK ==========
  const handlePieceClick = useCallback((row: number, col: number) => {
    if (isAnimating || showReport || showEthics || showEndingA || showFailed || showAllocation) return;

    lastMoveTime.current = Date.now();
    hesitationFired.current = false; // 玩家操作了，重置犹豫标记
    const piece = board[row][col];
    triggerProfessionFlash(piece);

    // Handle player piece consumption in ending
    if (piece.isPlayerPiece) {
      setProfessionFlash(`⚠ ${save.playerOperatorId} 前：游戏玩家`);
      setTimeout(() => setProfessionFlash(null), 2000);
    }

    if (!selected) {
      setSelected([row, col]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === row && sc === col) {
      setSelected(null);
      return;
    }

    if (!isAdjacent(sr, sc, row, col)) {
      setSelected([row, col]);
      return;
    }

    // Try swap
    const swapped = swapPieces(board, sr, sc, row, col);
    if (hasAnyMatch(swapped)) {
      setSelected(null);
      setBoard(swapped);
      setMovesLeft(prev => prev - 1);
      // 递减技能 debuff 计数器
      if (shuffleDebuff > 0) setShuffleDebuff(prev => prev - 1);
      if (purgeDebuffSteps > 0) {
        setPurgeDebuffSteps(prev => {
          if (prev <= 1) { setPurgeDebuffColor(null); return 0; }
          return prev - 1;
        });
      }
      setIsAnimating(true);

      setTimeout(() => {
        processMatches(swapped, 0, totalProgress, levelConsumed);
      }, 100);
    } else {
      // Invalid swap - just deselect
      setSelected(null);
    }
  }, [board, selected, isAnimating, showReport, showEthics, showEndingA, showFailed, totalProgress, levelConsumed, save, triggerProfessionFlash, processMatches]);

  // ========== LEVEL COMPLETE ==========
  const handleLevelComplete = useCallback((finalProgressValue: number, consumed: number) => {
    const elapsed = (Date.now() - levelStartTime.current) / 1000;
    if (elapsed <= 15) unlockAchievement('speed_demon');
    if (levelHesitations.current === 0) {
      updateSave(prev => {
        const newStreak = prev.levelsWithoutHesitation + 1;
        if (newStreak >= 10) unlockAchievement('no_hesitation');
        // Zero hesitation = efficient but less human → humanity -3
        return { ...prev, levelsWithoutHesitation: newStreak, humanityScore: Math.max(0, prev.humanityScore - 3) };
      });
    }

    // 返还未使用的步数（人员）回库存
    if (movesLeft > 0) {
      updateSave(prev => ({
        ...prev,
        inventoryCount: prev.inventoryCount + movesLeft,
      }));
    }

    // Calculate rating — 基于折损率而非步数效率
    const totalDeployed = levelDeaths + levelSurvived;
    const casualtyRate = totalDeployed > 0 ? levelDeaths / totalDeployed : 0;
    let rating = 'C';
    if (casualtyRate <= 0.2) rating = 'S';
    else if (casualtyRate <= 0.35) rating = 'A';
    else if (casualtyRate <= 0.5) rating = 'B';
    else if (casualtyRate <= 0.7) rating = 'C';
    else rating = 'D';

    // 副目标检查
    let secondaryComplete = false;
    const so = mission.secondaryObjective;
    if (so) {
      switch (so.type) {
        case 'min_green':
          secondaryComplete = (levelColorCounts['green'] || 0) >= so.threshold;
          break;
        case 'min_purple':
          secondaryComplete = (levelColorCounts['purple'] || 0) >= so.threshold;
          break;
        case 'max_casualty_rate':
          secondaryComplete = (casualtyRate * 100) <= so.threshold;
          break;
        case 'no_skills':
          secondaryComplete = levelSkillsUsed === 0;
          break;
        case 'min_combo':
          secondaryComplete = levelMaxCombo >= so.threshold;
          break;
        case 'max_moves_used':
          secondaryComplete = (allocatedDeploy - movesLeft) <= so.threshold;
          break;
      }
    }

    updateSave(prev => ({
      ...prev,
      kpiHistory: [...prev.kpiHistory, { level: prev.currentLevel, consumed: levelDeaths, rating }],
      humanityScore: Math.max(0, Math.min(150, prev.humanityScore + (secondaryComplete && so ? so.humanityDelta : 0))),
    }));

    // 结局H：追踪连续S评级
    if (rating === 'S') {
      setConsecutiveSRatings(prev => prev + 1);
    } else {
      setConsecutiveSRatings(0);
    }

    setShowReport(true);

    // Check ethics review trigger
    const review = ethicsReviews.find(e => e.triggerLevel === save.currentLevel);
    if (review) {
      setTimeout(() => {
        setCurrentEthics(review);
        setShowEthics(true);
      }, 500);
    }

    // 中途结局检查（延迟一下让报告先显示）
    setTimeout(() => checkMidgameEndings(), 2000);
  }, [mission, movesLeft, save, updateSave, unlockAchievement]);

  // Keep ref in sync
  handleLevelCompleteRef.current = handleLevelComplete;

  // ========== CONFIRM ALLOCATION (人员调拨确认 — 自动部署) ==========
  const confirmAllocation = useCallback(() => {
    const deploy = Math.min(mission.suggestedDeploy, save.inventoryCount);
    setMovesLeft(deploy);
    setAllocatedDeploy(deploy);
    // 从库存预扣分配量
    updateSave(prev => ({
      ...prev,
      inventoryCount: prev.inventoryCount - deploy,
    }));
    setShowAllocation(false);
    // 创建新棋盘（有高危区域时应用）
    let newBoard = createBoard();
    if (mission.hazardZones && mission.hazardZones > 0) {
      const hzPositions = generateHazardPositions(mission.hazardZones);
      setHazardPositions(hzPositions);
      newBoard = stampHazardFlags(newBoard, hzPositions);
    } else {
      setHazardPositions(new Set());
    }
    setBoard(newBoard);
  }, [mission, save.inventoryCount, updateSave]);

  // ========== SILENT LEVEL DETECTION ==========
  useEffect(() => {
    if (showAllocation && mission?.missionType === 'silent') {
      setShowAllocation(false);
      setShowSilentLevel(true);
      setSilentPageIndex(0);
    }
  }, [showAllocation, mission]);

  // ========== CHECK GAME OVER (out of moves) ==========
  useEffect(() => {
    if (movesLeft <= 0 && !isAnimating && !showReport && !showFailed) {
      if (!checkLevelComplete(totalProgress)) {
        setShowFailed(true);
    }
  }
  }, [movesLeft, isAnimating, showReport, showFailed, totalProgress, checkLevelComplete]);

  // ========== NEXT LEVEL ==========
  const goNextLevel = useCallback(() => {
    const nextLevel = save.currentLevel + 1;

    // Check ending trigger (level 20 complete = game over)
    if (nextLevel > 20) {
      triggerEndingA();
      return;
    }

    const nextMission = getMission(nextLevel);
    setMission(nextMission);
    setTotalProgress(0); setGreenBuff(0);
    setLevelConsumed(0);
    setCombo(0);
    // Reset skill debuffs
    setShuffleDebuff(0);
    setPurgeDebuffColor(null);
    setPurgeDebuffSteps(0);
    setExtraMovesCostMultiplier(1);
    // Reset level tracking
    setLevelDeaths(0);
    setLevelSurvived(0);
    setLevelMaxCombo(0);
    setLevelSkillsUsed(0);
    setLevelColorCounts({});
    setEmergencyUsed(false);
    setEmergencyRecruits([]);
    setShowEmergencyConfirm(false);
    setShowReport(false);
    clearProfileCache();
    setBattleLog([]);
    levelStartTime.current = Date.now();
    levelHesitations.current = 0;
    lastMoveTime.current = Date.now();
    hesitationFired.current = false;

    // 显示人员调拨单（而非直接开始）
    setShowAllocation(true);
    setAllocatedDeploy(nextMission.suggestedDeploy);

    // Create new board, maybe with player piece
    let newBoard = createBoard();
    if (nextMission.hazardZones && nextMission.hazardZones > 0) {
      const hzPositions = generateHazardPositions(nextMission.hazardZones);
      setHazardPositions(hzPositions);
      newBoard = stampHazardFlags(newBoard, hzPositions);
    } else {
      setHazardPositions(new Set());
    }
    if (save.endingASeen && !hasPlayerPiece) {
      const rr = Math.floor(Math.random() * 8);
      const cc = Math.floor(Math.random() * 8);
      newBoard[rr][cc] = {
        ...newBoard[rr][cc],
        isPlayerPiece: true,
        dClassId: save.playerOperatorId,
      profession: '前：游戏玩家',
      };
      setHasPlayerPiece(true);
    }
    setBoard(newBoard);

    updateSave(prev => ({ ...prev, currentLevel: nextLevel, boardState: null, progressState: null, movesLeftState: null, levelConsumedState: 0, skillShuffleUsed: 0, skillPurgeUsed: 0, skillExtraMovesUsed: 0 }));
    setSkillCooldowns({ shuffle: 0, purge: 0, extraMoves: 0 });

    // ===== NARRATIVE BEAT HANDLING =====
    const currentMission = getMission(save.currentLevel); // just-completed mission
    if (currentMission.narrativeBeat === 'minor') {
      // Minor beat: system toast
      setHesitationNotice('📡 系统提示：新的加密通信已到达');
      setTimeout(() => setHesitationNotice(null), 3000);
    } else if (currentMission.narrativeBeat === 'major') {
      // Major beat: phase transition notification
      const nextPhase = getPhase(nextLevel);
      const notice = getPhaseTransitionNotice(nextPhase);
      if (notice) {
        // 全屏overlay仪式感 + 写入战报
        setPhaseOverlay(notice);
        addLogEntry({ type: 'system' as any, scpName: '⚙ 系统', detail: notice });
        setTimeout(() => setPhaseOverlay(null), 4000);
      }
      // Ethics review already handled in handleLevelComplete — no duplicate trigger here
    }

    // Check email triggers
    const newEmail = emails.find(e => e.triggerLevel === nextLevel);
    if (newEmail && !save.readEmails.includes(newEmail.id)) {
      // Email notification handled by unread count
    }
  }, [save, updateSave, hasPlayerPiece]);

  // ========== RETRY LEVEL ==========
  const retryLevel = useCallback(() => {
    const currentMission = getMission(save.currentLevel);
    setMission(currentMission);
    setTotalProgress(0); setGreenBuff(0);
    setLevelConsumed(0);
    setCombo(0);
    setShowFailed(false);
    {
      let newBoard = createBoard();
      if (currentMission.hazardZones && currentMission.hazardZones > 0) {
        const hzPositions = generateHazardPositions(currentMission.hazardZones);
        setHazardPositions(hzPositions);
        newBoard = stampHazardFlags(newBoard, hzPositions);
      } else {
        setHazardPositions(new Set());
      }
      setBoard(newBoard);
    }
    setEmergencyUsed(false);
    setEmergencyRecruits([]);
    setShowEmergencyConfirm(false);
    setLevelDeaths(0);
    setLevelSurvived(0);
    setLevelMaxCombo(0);
    setLevelSkillsUsed(0);
    setLevelColorCounts({});
    levelStartTime.current = Date.now();
    levelHesitations.current = 0;
    lastMoveTime.current = Date.now();
    hesitationFired.current = false;
    // 重试时重新显示调拨界面
    setAllocatedDeploy(currentMission.suggestedDeploy);
    setShowAllocation(true);
  }, [save.currentLevel]);

  // ========== ACTIVE SKILLS ==========
  // 技能 debuff 状态
  const [shuffleDebuff, setShuffleDebuff] = useState(0); // 剩余步数：进度 -30%
  const [purgeDebuffColor, setPurgeDebuffColor] = useState<PieceColor | null>(null);
  const [purgeDebuffSteps, setPurgeDebuffSteps] = useState(0); // 剩余步数：该颜色不产生进度
  const [extraMovesCostMultiplier, setExtraMovesCostMultiplier] = useState(1); // 库存消耗倍率

  const useSkillShuffle = useCallback(() => {
    if (isAnimating || skillCooldowns.shuffle > 0) return;
    let newBoard = createBoard();
    if (hazardPositions.size > 0) {
      newBoard = stampHazardFlags(newBoard, hazardPositions);
    }
    setBoard(newBoard);
    setSkillCooldowns(prev => ({ ...prev, shuffle: 3 }));
    setMovesLeft(prev => Math.max(0, prev - 2));
    setShuffleDebuff(2); // 下2步进度 -30%
    setLevelSkillsUsed(prev => prev + 1);
    updateSave(prev => ({ ...prev, skillShuffleUsed: prev.skillShuffleUsed + 1 }));
    const aiSkillMsg = getAIComment(save.currentLevel, 'skill_used');
    setHesitationNotice(aiSkillMsg || '⚠ 紧急重组：接下来2步进度-30%');
    setTimeout(() => setHesitationNotice(null), 3000);
  }, [isAnimating, skillCooldowns.shuffle, updateSave]);

  const useSkillPurge = useCallback((color: PieceColor) => {
    if (isAnimating || skillCooldowns.purge > 0) return;
    setSelectingPurgeColor(false);
    const toRemoveKeys = new Set<string>();
    const removed: Piece[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c].color === color) {
          toRemoveKeys.add(`${r},${c}`);
          removed.push(board[r][c]);
        }
      }
    }
    setRemovingCells(toRemoveKeys);
    setTimeout(() => {
      const newBoard = board.map(row => row.map(p => ({ ...p })));
      for (const key of toRemoveKeys) {
        const [r, c] = key.split(',').map(Number);
        newBoard[r][c] = null as unknown as Piece;
      }
      const colorCounts: Record<string, number> = { blue: 0, red: 0, green: 0, orange: 0, purple: 0 };
      for (const p of removed) { colorCounts[p.color]++; }
      // 新机制: 加权总进度
      const progressGained = calculateWeightedProgress(colorCounts, 0);
      setTotalProgress(prev => prev + progressGained);
      setLevelConsumed(prev => prev + removed.length);
      setLevelSkillsUsed(prev => prev + 1);
      // 注意：不在这里扣库存，清洗的人员会通过 processMatches → survival roll 自然统计
      updateSave(prev => ({ ...prev, skillPurgeUsed: prev.skillPurgeUsed + 1 }));
      setRemovingCells(new Set());
      const filled = applyGravity(newBoard as Piece[][]);
      setBoard(filled);
      setSkillCooldowns(prev => ({ ...prev, purge: 5 }));
      setPurgeDebuffColor(color);
      setPurgeDebuffSteps(3); // 被清洗颜色3步内不产生进度
      setMovesLeft(prev => Math.max(0, prev - 3));
      setIsAnimating(true);
      setTimeout(() => {
        processMatches(filled, 0, totalProgress, levelConsumed + removed.length);
      }, 350);
    }, 300);
  }, [isAnimating, skillCooldowns.purge, board, totalProgress, levelConsumed, updateSave, processMatches]);

  const useSkillExtraMoves = useCallback(() => {
    if (skillCooldowns.extraMoves > 0) return;
    setMovesLeft(prev => prev + 5);
    setExtraMovesCostMultiplier(2); // 追加步库存消耗×2
    setSkillCooldowns(prev => ({ ...prev, extraMoves: 99 })); // once per level
    setLevelSkillsUsed(prev => prev + 1);
    updateSave(prev => ({ ...prev, skillExtraMovesUsed: prev.skillExtraMovesUsed + 1 }));
    setHesitationNotice('⚠ 加班模式：追加步数期间库存消耗×2');
    setTimeout(() => setHesitationNotice(null), 2500);
  }, [skillCooldowns.extraMoves, updateSave]);

  // ========== 紧急征召：失败时可花库存买3步 ==========
  const EMERGENCY_COST = 5;

  // Step 1: 生成征召名单，展示确认弹窗
  const requestEmergencyRecruit = useCallback(() => {
    if (emergencyUsed || save.inventoryCount < EMERGENCY_COST) return;
    const phase = getPhase(save.currentLevel);
    const recruits: DClassProfile[] = [];
    for (let i = 0; i < EMERGENCY_COST; i++) {
      recruits.push(generateFullProfile(undefined, phase));
    }
    setEmergencyRecruits(recruits);
    setShowEmergencyConfirm(true);
  }, [emergencyUsed, save.inventoryCount, save.currentLevel]);

  // Step 2: 玩家确认后执行征召
  const confirmEmergencyRecruit = useCallback(() => {
    setShowEmergencyConfirm(false);
    setEmergencyUsed(true);
    setMovesLeft(3);
    setShowFailed(false);
    updateSave(prev => ({
      ...prev,
      inventoryCount: prev.inventoryCount - EMERGENCY_COST,
    }));
    setHesitationNotice('⚠ 紧急征召批准：追加3步');
    setTimeout(() => setHesitationNotice(null), 3000);
  }, [updateSave]);

  const cancelEmergencyRecruit = useCallback(() => {
    setShowEmergencyConfirm(false);
    setEmergencyRecruits([]);
  }, []);

  // ========== SILENT LEVEL COMPLETION ==========
  const completeSilentLevel = useCallback(() => {
    setShowSilentLevel(false);
    const nextLevel = save.currentLevel + 1;
    const nextMission = getMission(nextLevel);
    setMission(nextMission);
    setMovesLeft(nextMission.suggestedDeploy);
    setTotalProgress(0);
    setGreenBuff(0);
    setLevelConsumed(0);
    setCombo(0);
    setBattleLog([]);
    setLevelDeaths(0);
    setLevelSurvived(0);
    setLevelMaxCombo(0);
    setLevelSkillsUsed(0);
    setLevelColorCounts({});
    setEmergencyUsed(false);
    setShowAllocation(true);
    setAllocatedDeploy(nextMission.suggestedDeploy);

    let newBoard = createBoard();
    if (nextMission.hazardZones && nextMission.hazardZones > 0) {
      const hzPositions = generateHazardPositions(nextMission.hazardZones);
      setHazardPositions(hzPositions);
      newBoard = stampHazardFlags(newBoard, hzPositions);
    } else {
      setHazardPositions(new Set());
    }
    setBoard(newBoard);

    updateSave(prev => ({
      ...prev,
      currentLevel: nextLevel,
      kpiHistory: [...prev.kpiHistory, { level: prev.currentLevel, consumed: 0, rating: '—' }],
      boardState: null,
      progressState: null,
      movesLeftState: null,
      levelConsumedState: 0,
    }));
    levelStartTime.current = Date.now();
  }, [save.currentLevel, updateSave]);

  // Reduce cooldowns after each move
  useEffect(() => {
    if (movesLeft < (allocatedDeploy || mission?.suggestedDeploy || 99)) {
      setSkillCooldowns(prev => ({
        shuffle: Math.max(0, prev.shuffle - 1),
        purge: Math.max(0, prev.purge - 1),
        extraMoves: prev.extraMoves,
      }));
    }
  }, [movesLeft]);

  // ========== ENDING A ==========
  const triggerEndingA = useCallback(() => {
    setShowReport(false);
    setShowGlitch(true);

    setTimeout(() => {
      setShowGlitch(false);
      setShowEndingA(true);

      // Select ending based on humanity score
      const ending = selectEnding(save.humanityScore);
      setCurrentEndingId(ending.id);

      // Preamble: experiment reveal
      const preamble = [
        '[ 实验 SCP-████-HR 结束 ]',
        '',
        `操作员编号：${save.playerOperatorId}`,
        `人性指数（隐藏）：${save.humanityScore}`,
        `犹豫次数：${save.hesitationCount}`,
        `累计消耗：${save.totalConsumed}`,
        `阅读邮件：${save.readEmails.length}/20`,
        '',
        `结局分支：${ending.title} (${ending.id})`,
        '',
        '——————————————————',
        '',
      ];

      const allLines = [...preamble, ...ending.lines];

      // 结局D特殊效果：UI逐步消失
      if (ending.specialEffect === 'ui-dissolve') {
        // 在文字逐行显示的同时，UI 分阶段消融
        setTimeout(() => setUiDissolve(1), 2000);  // 隐藏 ticker
        setTimeout(() => setUiDissolve(2), 5000);  // 隐藏左面板
        setTimeout(() => setUiDissolve(3), 8000);  // 隐藏右面板
        setTimeout(() => setUiDissolve(4), 11000); // 隐藏导航栏
        setTimeout(() => setUiDissolve(5), 14000); // 隐藏棋盘，只剩文字
      }

      // Show lines one by one
      allLines.forEach((line, i) => {
        setTimeout(() => {
          setEndingLines(prev => [...prev, line]);
          if (i === allLines.length - 1) {
            setTimeout(() => setShowEndingBtn(true), 1500);
            // Store ending button text
            setEndingBtnText(ending.buttonText);
          }
        }, i * 800);
      });

      updateSave(prev => ({ ...prev, endingASeen: true }));
    }, 500);
  }, [save, updateSave]);

  const handleEndingAccept = useCallback(() => {
    // 结局结束 → 先显示平行结局列表
    if (!showParallelEndings) {
      setShowParallelEndings(true);
      return;
    }
    // 第二次点击：真正开始新游戏
    setShowParallelEndings(false);
    setShowEndingA(false);
    setShowGlitch(false);
    setEndingLines([]);
    setShowEndingBtn(false);
    setEndingBtnText('[接受重新分类]');

    // Reset save to defaults, but carry over cycle data
    const ending = selectEnding(save.humanityScore);
    const newCycle = save.cycleCount + 1;
    updateSave(() => ({
      ...defaultSave,
      playerOperatorId: `D-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      cycleCount: newCycle,
      lastEndingId: ending.id,
    }));

    // Reset all game state
    const firstMission = getMission(1);
    setMission(firstMission);
    setMovesLeft(firstMission.suggestedDeploy);
    setTotalProgress(0);
    setGreenBuff(0);
    setLevelConsumed(0);
    setCombo(0);
    setShowReport(false);
    setShowFailed(false);
    setBattleLog([]);
    setSpeechBubbles([]);
    clearProfileCache();
    {
      let newBoard = createBoard();
      if (firstMission.hazardZones && firstMission.hazardZones > 0) {
        const hzPositions = generateHazardPositions(firstMission.hazardZones);
        setHazardPositions(hzPositions);
        newBoard = stampHazardFlags(newBoard, hzPositions);
      } else {
        setHazardPositions(new Set());
      }
      setBoard(newBoard);
    }
    setHasPlayerPiece(false);
    setUiDissolve(0);
    setDisabledOptionClicks(0);
    setConsecutiveSRatings(0);
    setSkillCooldowns({ shuffle: 0, purge: 0, extraMoves: 0 });
    levelStartTime.current = Date.now();
    levelHesitations.current = 0;
    lastMoveTime.current = Date.now();
    hesitationFired.current = false;
  }, [updateSave]);

  // ========== EMAIL READING ==========
  const handleEmailClick = useCallback((emailId: string) => {
    setShowEmailModal(true);
    setSelectedEmailId(emailId);
    updateSave(prev => {
      if (prev.readEmails.includes(emailId)) return prev;
      const newRead = [...prev.readEmails, emailId];
      // Humanity score bonus for narrative-critical emails
      const email = emails.find(e => e.id === emailId);
      let newHumanity = prev.humanityScore;
      if (email?.narrativeCritical && email.humanityBonus) {
        newHumanity = Math.min(150, newHumanity + email.humanityBonus);
      }
      // Check if all available emails are read
      const available = emails.filter(e => e.triggerLevel <= prev.currentLevel);
      if (available.every(e => newRead.includes(e.id))) {
        unlockAchievement('read_mail');
      }
      return { ...prev, readEmails: newRead, humanityScore: newHumanity };
    });
    // 结局I检查：阅读邮件后
    setTimeout(() => checkMidgameEndings(), 500);
  }, [updateSave, unlockAchievement]);

  // ========== MIDGAME ENDING (use refs to avoid circular dependency) ==========
  const triggerMidgameEndingRef = useRef<(id: string) => void>(() => {});
  const checkMidgameEndingsRef = useRef<() => void>(() => {});

  triggerMidgameEndingRef.current = (endingId: string) => {
    const ending = getMidgameEnding(endingId);
    if (!ending) return;
    setCurrentEndingId(endingId);
    setShowGlitch(true);
    setTimeout(() => {
      setShowGlitch(false);
      setShowEndingA(true);
      setEndingLines([]);
      setShowEndingBtn(false);

      const preamble = [
        `[ 中途结局：${ending.title} ]`,
        `当前关卡：${save.currentLevel} / 20`,
        `累计消耗：${save.totalConsumed}`,
        '',
      ];

      if (ending.specialEffect === 'ui-dissolve') {
        setTimeout(() => setUiDissolve(1), 2000);
        setTimeout(() => setUiDissolve(2), 5000);
        setTimeout(() => setUiDissolve(3), 8000);
        setTimeout(() => setUiDissolve(4), 11000);
        setTimeout(() => setUiDissolve(5), 14000);
      }

      const allLines = [...preamble, ...ending.lines];
      allLines.forEach((line, i) => {
        setTimeout(() => {
          setEndingLines(prev => [...prev, line]);
          if (i === allLines.length - 1) {
            setTimeout(() => setShowEndingBtn(true), 1500);
            setEndingBtnText(ending.buttonText);
          }
        }, i * 800);
      });

      updateSave(prev => ({ ...prev, endingASeen: true }));
    }, 1500);
  };

  checkMidgameEndingsRef.current = () => {
    if (showEndingA || showGlitch) return;

    if (save.hesitationCount >= 40) {
      triggerMidgameEndingRef.current('F');
      return;
    }

    if (save.purchaseCount >= 5 && save.inventoryCount <= 0) {
      triggerMidgameEndingRef.current('G');
      return;
    }

    if (consecutiveSRatings >= 5) {
      triggerMidgameEndingRef.current('H');
      return;
    }

    const availableEmails = emails.filter(e => e.triggerLevel <= save.currentLevel);
    const allRead = availableEmails.length > 0 && availableEmails.every(e => save.readEmails.includes(e.id));
    if (allRead && save.hesitationCount >= 20 && save.currentLevel >= 10) {
      triggerMidgameEndingRef.current('I');
      return;
    }
  };

  const checkMidgameEndings = () => checkMidgameEndingsRef.current();
  const triggerMidgameEnding = (id: string) => triggerMidgameEndingRef.current(id);

  // ========== ETHICS REVIEW HANDLERS ==========
  const handleEthicsOption = useCallback((optionIndex?: number) => {
    if (currentEthics) {
      const opt = typeof optionIndex === 'number' ? currentEthics.options[optionIndex] : null;

      // 如果点的是禁用选项，显示反馈但不关闭审查
      if (opt?.disabled) {
        setHesitationNotice(opt.feedback || '该选项暂不可用');
        setTimeout(() => setHesitationNotice(null), 3000);
        // 人性分仍然加
        updateSave(prev => ({ ...prev, humanityScore: Math.min(150, prev.humanityScore + (opt.humanityDelta || 0)) }));
        // 结局E：追踪抗命次数
        const newClicks = disabledOptionClicks + 1;
        setDisabledOptionClicks(newClicks);
        if (newClicks >= 3) {
          setTimeout(() => triggerMidgameEnding('E'), 1500);
        }
        return;
      }

      // 正常选项：显示反馈或默认outcome
      const outcomeText = opt?.feedback || currentEthics.outcome;
      setEthicsOutcome(outcomeText);

      const delta = opt?.humanityDelta ?? 0;
      updateSave(prev => ({ ...prev, ethicsReviewsPassed: prev.ethicsReviewsPassed + 1, humanityScore: Math.max(0, Math.min(150, prev.humanityScore + delta)) }));

      setTimeout(() => {
        setShowEthics(false);
        setEthicsOutcome('');
        setCurrentEthics(null);
        if (save.ethicsReviewsPassed + 1 >= ethicsReviews.length) {
          unlockAchievement('ethics_clicker');
        }
      }, 2000);
    }
  }, [currentEthics, save, updateSave, unlockAchievement]);

  // Auto-pass ethics
  useEffect(() => {
    if (showEthics && currentEthics && (currentEthics.specialBehavior === 'auto_pass' || currentEthics.specialBehavior === 'committee_dissolved')) {
      setTimeout(() => handleEthicsOption(), 2000);
    }
  }, [showEthics, currentEthics, handleEthicsOption]);

  // ========== PURCHASE HANDLER ==========
  // 补充量递减：300 → 250 → 200 → 180 → 150 → 120(底线)
  const getPurchaseAmount = useCallback((count: number) => {
    const amounts = [300, 250, 200, 180, 150, 120];
    return amounts[Math.min(count, amounts.length - 1)];
  }, []);

  const handlePurchase = useCallback(() => {
    setShowPurchase(false);
    const amount = getPurchaseAmount(save.purchaseCount);
    updateSave(prev => ({
      ...prev,
      inventoryCount: prev.inventoryCount + amount,
      purchaseCount: prev.purchaseCount + 1,
    }));
  }, [save.purchaseCount, updateSave, getPurchaseAmount]);

  // ========== COMPUTED VALUES ==========
  const availableEmails = emails.filter(e => e.triggerLevel <= save.currentLevel);
  const unreadCount = availableEmails.filter(e => !save.readEmails.includes(e.id)).length;
  const lastRating = save.kpiHistory.length > 0 ? save.kpiHistory[save.kpiHistory.length - 1].rating : '-';
  const monthlyQuota = 500;
  const quotaProgress = Math.min(100, (save.totalConsumed / monthlyQuota) * 100);
  const isLevelComplete = checkLevelComplete(totalProgress);

  // ========== RENDER ==========
  return (
    <>
      {/* ===== HEADER ===== */}
      <header className={`site-header ${uiDissolve >= 4 ? 'ui-dissolving' : ''}`}>
        <div className="header-title">
          <span className="scp-logo">⚙</span>
          <span>SCP基金会 · Site-██ 人力资源终端</span>
          <span className="scp-version">BUILD 3.7.2</span>
        </div>
        <div className="header-tabs">
          {[
            { id: '工单', icon: '📋' },
            { id: '设施', icon: '🏗️' },
            { id: '库存', icon: '📦' },
            { id: '报表', icon: '📊' },
            { id: '伦理', icon: '⚖️' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.id}
            </button>
          ))}
        </div>
        <div className="header-info">
          <div className="header-info-item" onClick={() => setShowAchievements(!showAchievements)} style={{cursor:'pointer'}}>
            🏅 成就
          </div>
          <div className="header-info-item">安保许可: ██</div>
          <div className={`header-info-item header-inventory ${save.inventoryCount <= 100 ? 'warning' : ''}`}>
            {getTerm('inventory', getPhase(save.currentLevel))}：{save.inventoryCount.toLocaleString()}
          </div>
        </div>
      </header>

      <div className={`scp-ticker ${uiDissolve >= 1 ? 'ui-dissolving' : ''}`}>
        <span>SECURE · CONTAIN · PROTECT</span>
        <span className="ticker-sep">|</span>
        <span>站点状态：正常运转</span>
        <span className="ticker-sep">|</span>
        <span>当前操作员：{save.playerOperatorId}{save.cycleCount > 0 ? ` (轮换 #${save.cycleCount + 1})` : ''}</span>
        <span className="ticker-sep">|</span>
        <span>日期：{new Date().toLocaleDateString('zh-CN')}</span>
        <span className="ticker-sep">|</span>
        <span>本站本月处理：{(save.totalConsumed * 7 + 12847).toLocaleString()} 单位</span>
        <span className="ticker-sep">|</span>
        <span>在线操作员：{Math.max(1, 23 - Math.floor(save.currentLevel / 3))} / 24</span>
        <span className="ticker-sep">|</span>
        <span>活跃异常收容项：████</span>
        <span className="ticker-sep">|</span>
        <span className={`ticker-psych ${save.humanityScore >= 80 ? 'psych-high' : save.humanityScore >= 50 ? 'psych-mid' : save.humanityScore >= 20 ? 'psych-low' : 'psych-void'}`}>
          心理基线：{save.humanityScore >= 80 ? '正常' : save.humanityScore >= 50 ? '偏移' : save.humanityScore >= 20 ? '异常' : '——'}
        </span>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="main-layout">

        {/* ===== BATTLE LOG (LEFT PANEL) ===== */}
        <div className={`battle-log-panel ${uiDissolve >= 2 ? 'ui-dissolving' : ''} ${save.currentLevel < 2 ? 'panel-locked' : ''}`}>
          <div className="battle-log-header">
            <AlertIcon size={14} /> 实时行动记录
          </div>
          <div className="battle-log-stats">
            <span>{getTerm('deploy', getPhase(save.currentLevel))}: {battleLog.filter(l => l.type === 'deploy').reduce((s, l) => s + (l.deployed || 0), 0)}</span>
            <span className="deploy-dead">{getTerm('death', getPhase(save.currentLevel))}: {battleLog.filter(l => l.type === 'deploy').reduce((s, l) => s + (l.dead || 0), 0)}</span>
            <span className="deploy-survivors">{getTerm('survive', getPhase(save.currentLevel))}: {battleLog.filter(l => l.type === 'deploy').reduce((s, l) => s + (l.survived || 0), 0)}</span>
          </div>
          <div className="battle-log-list">
            {battleLog.length === 0 && (
              <div className="battle-log-empty">暂无行动记录</div>
            )}
            {battleLog.map(entry => (
              <div key={entry.id} className={`battle-log-entry log-${entry.type}`}>
                <div className="log-time">{entry.timestamp}</div>
                {entry.type === 'deploy' && (() => {
                  const p = getPhase(save.currentLevel);
                  const actionWord = p === 'PHASE_HUMAN' ? '实验协助' : p === 'PHASE_NUMBER' ? '收容作业' : p === 'PHASE_BATCH' ? '处置行动' : 'PROC';
                  return (
                  <>
                    <div className="log-title">📋 {entry.scpName} {actionWord}{entry.detail ? ` (${entry.detail})` : ''}</div>
                    <div className="log-detail">
                      {getTerm('deploy', p)} <strong>{entry.deployed}</strong> {getTerm('unitCounter', p)} |
                      <span className="deploy-dead" style={{color: p === 'PHASE_HUMAN' ? '#86909c' : undefined}}> {getTerm('death', p)} {entry.dead}</span> |
                      <span className="deploy-survivors"> {getTerm('survive', p)} {entry.survived}</span>
                    </div>
                    {entry.deathCause && entry.dead! > 0 && (
                      <div className="log-cause" style={{color: p === 'PHASE_HUMAN' ? '#86909c' : undefined}}>{getTerm('deathCauseLabel', p)}: {entry.deathCause}</div>
                    )}
                  </>
                  );
                })()}
                {(entry as any).type === 'system' && (
                  <div className="log-detail" style={{color: '#ab47bc', fontSize: 12, fontStyle: 'italic'}}>
                    {entry.scpName}: {entry.detail}
                  </div>
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
        <div className={`game-area ${uiDissolve >= 5 ? 'ui-dissolving' : ''}`}>
          <div className="board-container">
            <div className="board-grid">
              {board.map((row, r) =>
                row.map((piece, c) => (
                  <PieceToken
                    key={`${r}-${c}`}
                    color={piece.color}
                    special={piece.special}
                    dClassId={piece.dClassId}
                    isSelected={!!(selected && selected[0] === r && selected[1] === c)}
                    isRemoving={removingCells.has(`${r},${c}`)}
                    removeClass={removeAnimClass}
                    isDropping={droppingCells.has(`${r},${c}`)}
                    isPlayerPiece={piece.isPlayerPiece}
                    isTargetColor={bonusColorSet.has(piece.color)}
                    isHazard={!!piece.hazard}
                    onClick={() => handlePieceClick(r, c)}
                    onHover={() => {
                      triggerProfessionFlash(piece);
                      setHoveredProfile(generateFullProfile(piece.dClassId, getPhase(save.currentLevel)));
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
                className={`speech-bubble ${b.isWaste ? 'waste' : ''}`}
                style={{ left: b.x, top: b.y }}
              >
                {b.text}
              </div>
            ))}
            {comboFloat && <div className="combo-float">{comboFloat}</div>}
          </div>

          <div className="game-status">
            <span className={`moves-left ${movesLeft <= 5 ? 'low' : ''}`}>
              步数剩余: {movesLeft}
            </span>
            <span className={`combo-display ${combo > 1 ? 'active' : ''}`}>
              {combo > 1 ? `COMBO ×${combo}` : ''}
            </span>
          </div>

          <div className="status-bar">
          </div>

          {/* ===== THE NUMBER (沉没成本计数器) ===== */}
          {save.currentLevel >= 5 && save.totalConsumed > 0 && (
            <div className="silent-counter">
              <span className="silent-number">{save.totalConsumed.toLocaleString()}</span>
              {milestoneFlash && (
                <span className="silent-milestone">{milestoneFlash}</span>
              )}
            </div>
          )}

          {/* ===== HOVER PROFILE PANEL ===== */}
          <div className="profile-panel">
            {hoveredProfile ? (
              hoveredProfile.phaseLabel ? (
                <span className="profile-phase-label">{hoveredProfile.phaseLabel}</span>
              ) : (
                <>
                  <div className="profile-header">
                    <span className="profile-id">{hoveredProfile.id}</span>
                    {hoveredProfile.name && <span className="profile-name">{hoveredProfile.name}</span>}
                    {hoveredProfile.formerJob && <span className="profile-job">前: {hoveredProfile.formerJob}</span>}
                  </div>
                  {hoveredProfile.reason && <div className="profile-reason">入站原因: {hoveredProfile.reason}</div>}
                  {hoveredProfile.personalDetail && <div className="profile-detail" style={{ fontSize: 11, color: '#86909c', marginTop: 4 }}>备注: {hoveredProfile.personalDetail}</div>}
                </>
              )
            ) : (
              <span className="profile-empty">[ 将鼠标移至{getTerm('unit', getPhase(save.currentLevel))}上方以查看档案 ]</span>
            )}
          </div>

          {/* ===== SKILL BUTTONS (Level 3+ 解锁) ===== */}
          {save.currentLevel >= 3 && <div className="skill-bar">
            <button
              className={`skill-btn ${skillCooldowns.shuffle > 0 ? 'on-cooldown' : ''}`}
              onClick={useSkillShuffle}
              disabled={isAnimating || skillCooldowns.shuffle > 0}
              title="收容突破协议：重组棋盘（消耗2步）"
            >
              <span className="skill-icon">🔄</span>
              <span className="skill-name">收容突破</span>
              {skillCooldowns.shuffle > 0 && <span className="skill-cd">{skillCooldowns.shuffle}</span>}
            </button>
            <button
              className={`skill-btn ${skillCooldowns.purge > 0 ? 'on-cooldown' : ''}`}
              onClick={() => !isAnimating && skillCooldowns.purge <= 0 && setSelectingPurgeColor(true)}
              disabled={isAnimating || skillCooldowns.purge > 0}
              title="全面清洗协议：消除所选工种全部单位（消耗3步）"
            >
              <span className="skill-icon">☢️</span>
              <span className="skill-name">全面清洗</span>
            </button>
            <button
              className={`skill-btn ${skillCooldowns.extraMoves > 0 ? 'on-cooldown' : ''}`}
              onClick={useSkillExtraMoves}
              disabled={skillCooldowns.extraMoves > 0}
              title="追加派遣令：增加5步操作步数（每关1次）"
            >
              <span className="skill-icon">📑</span>
              <span className="skill-name">追加派遣</span>
              {skillCooldowns.extraMoves > 0 && <span className="skill-cd">已用</span>}
            </button>
          </div>}

          {/* Purge color picker */}
          {selectingPurgeColor && (
            <div className="purge-picker">
              <div className="purge-title">选择清洗工种</div>
              <div className="purge-options">
                {(['blue','red','green','orange','purple'] as PieceColor[]).map(c => (
                  <button key={c} className={`purge-color-btn ${c}`} onClick={() => useSkillPurge(c)}>
                    {COLOR_EMOJI[c]}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" style={{fontSize:12,marginTop:4}} onClick={() => setSelectingPurgeColor(false)}>取消</button>
            </div>
          )}
        </div>

        {/* ===== INFO PANEL (RIGHT) ===== */}
        <div className={`info-panel ${uiDissolve >= 3 ? 'ui-dissolving' : ''}`}>

          {/* ---- TAB: 工单 ---- */}
          {activeTab === '工单' && (
            <>
              {/* Mission Order */}
              <div className="panel scp-panel">
                <div className="panel-header scp-header">
                  <FileText size={14} /> 实验工单 {mission.id}
                  <span className={`security-badge security-${mission.securityLevel}`}>
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
                        <div className="requirement-fill blue" style={{ width: `${Math.min(100, (totalProgress / (mission.targetProgress || 1)) * 100)}%` }} />
                      </div>
                      <span className={`requirement-text ${totalProgress >= (mission.targetProgress || 999) ? 'requirement-done' : ''}`}>
                        {totalProgress >= (mission.targetProgress || 999) ? '✅ ' : ''}{Math.min(100, Math.round((totalProgress / (mission.targetProgress || 1)) * 100))}%
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
                    <div className="kpi-item"><div className="kpi-value">{save.dailyConsumed}</div><div className="kpi-label">{getTerm('dailyConsumed', getPhase(save.currentLevel))}</div></div>
                    <div className="kpi-item"><div className="kpi-value">{save.totalConsumed.toLocaleString()}</div><div className="kpi-label">{getTerm('totalConsumed', getPhase(save.currentLevel))}</div></div>
                    <div className="kpi-item"><div className="kpi-rating">{lastRating}</div><div className="kpi-label">{getTerm('kpiRatingLabel', getPhase(save.currentLevel))}</div></div>
                    <div className="kpi-item"><div className="kpi-value">{save.inventoryCount.toLocaleString()}</div><div className="kpi-label">库存余量</div></div>
                  </div>
                  <div className="kpi-quota">
                    <div className="kpi-quota-text"><span>{getTerm('quotaLabel', getPhase(save.currentLevel))}</span><span>{Math.floor(quotaProgress)}%</span></div>
                    <div className="kpi-quota-bar"><div className="kpi-quota-fill" style={{ width: `${quotaProgress}%` }} /></div>
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
                  {availableEmails.slice(0, 5).map(email => (
                    <div key={email.id}>
                      <div
                        className={`email-item ${!save.readEmails.includes(email.id) ? 'unread' : ''}`}
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
                    </div>
                  ))}
                  {availableEmails.length > 5 && (
                    <div className="email-item" style={{ textAlign: 'center', color: '#86909c', fontSize: 12 }} onClick={() => setShowEmailModal(true)}>
                      查看全部 {availableEmails.length} 封通信 →
                    </div>
                  )}
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
                      <span className="facility-value">{save.kpiHistory.length > 0 ? (save.totalConsumed / save.kpiHistory.length).toFixed(1) : '-'} 单位/工单</span>
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
              <div className="panel-header">📦 D级资源库存管理</div>
              <div className="panel-body">
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: save.inventoryCount <= 100 ? '#f53f3f' : 'var(--oa-text)' }}>
                    {save.inventoryCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#86909c', marginTop: 4 }}>当前可用库存（单位）</div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 13, lineHeight: 2.2 }}>
                  <div className="report-line"><span>初始配额</span><span>3,000</span></div>
                  <div className="report-line"><span>{getTerm('totalConsumed', getPhase(save.currentLevel))}</span><span style={{ color: getPhase(save.currentLevel) === 'PHASE_HUMAN' ? '#86909c' : '#f53f3f' }}>{save.totalConsumed.toLocaleString()}</span></div>
                  <div className="report-line"><span>累计补充</span><span style={{ color: '#00b42a' }}>{Math.max(0, save.totalConsumed - 500 + save.inventoryCount).toLocaleString()}</span></div>
                  <div className="report-line"><span>库存状态</span><span>{save.inventoryCount > 300 ? '🟢 充足' : save.inventoryCount > 100 ? '🟡 适中' : '🔴 紧缺'}</span></div>
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
                  <div className="kpi-quota-text"><span>月度指标 ({monthlyQuota})</span><span>{Math.floor(quotaProgress)}%</span></div>
                  <div className="kpi-quota-bar"><div className="kpi-quota-fill" style={{ width: `${quotaProgress}%` }} /></div>
                </div>
                <hr className="report-divider" />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>近期工单记录</div>
                <div style={{ fontSize: 12, lineHeight: 2 }}>
                  {save.kpiHistory.length === 0 && <div style={{ color: '#86909c' }}>暂无记录</div>}
                  {save.kpiHistory.slice(-8).reverse().map((h, i) => (
                    <div key={i} className="report-line">
                      <span>第{h.level}关</span>
                      <span>{getTerm('death', getPhase(save.currentLevel))} {h.consumed} | {getTerm('kpiRatingLabel', getPhase(save.currentLevel))} {h.rating}</span>
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
              <div className="report-title">{getTerm('reportTitle', getPhase(save.currentLevel))}</div>
              <div className="report-line"><span>工单编号：</span><span>{mission.id}</span></div>
              <div className="report-line"><span>实验对象：</span><span>{mission.scpSubject}</span></div>
              <div className="report-line"><span>安保等级：</span><span>{'●'.repeat(mission.securityLevel)}{'○'.repeat(5 - mission.securityLevel)}</span></div>
              <div className="report-line"><span>日　　期：</span><span>{new Date().toLocaleDateString('zh-CN')}</span></div>
              <hr className="report-divider" />
              <div style={{fontSize: 11, color: '#86909c', marginBottom: 4}}>▎ {getTerm('unit', getPhase(save.currentLevel))}统计</div>
              <div className="report-line"><span>{getTerm('deploy', getPhase(save.currentLevel))}人数：</span><span>{allocatedDeploy}</span></div>
              <div className="report-line"><span>实际投入：</span><span>{allocatedDeploy - movesLeft}</span></div>
              <div className="report-line"><span>{getTerm('death', getPhase(save.currentLevel))}：</span><span style={{color: getPhase(save.currentLevel) === 'PHASE_HUMAN' ? '#86909c' : '#f53f3f'}}>{levelDeaths}</span></div>
              <div className="report-line"><span>{getTerm('survive', getPhase(save.currentLevel))}：</span><span style={{color: '#00b42a'}}>{levelSurvived}</span></div>
              <div className="report-line"><span>未使用归还：</span><span>{movesLeft}</span></div>
              <div className="report-line"><span>{getTerm('netLoss', getPhase(save.currentLevel))}：</span><span style={{fontWeight: 700, color: getPhase(save.currentLevel) === 'PHASE_HUMAN' ? '#86909c' : '#f53f3f'}}>{levelDeaths}</span></div>
              <div className="report-line"><span>{getTerm('casualtyRate', getPhase(save.currentLevel))}：</span><span style={{color: ((levelDeaths + levelSurvived) > 0 && levelDeaths / (levelDeaths + levelSurvived) > 0.5) ? '#f53f3f' : '#86909c'}}>{((levelDeaths + levelSurvived) > 0 ? (levelDeaths / (levelDeaths + levelSurvived) * 100).toFixed(1) : '0')}%</span></div>
              <hr className="report-divider" />
              <div style={{fontSize: 11, color: '#86909c', marginBottom: 4}}>▎ 作业数据</div>
              <div className="report-line"><span>最大连锁：</span><span>{levelMaxCombo > 0 ? `${levelMaxCombo}x combo` : '无连锁'}</span></div>
              <div className="report-line"><span>任务效率：</span><span>{allocatedDeploy > 0 ? ((totalProgress / allocatedDeploy)).toFixed(1) : '0'} 进度/步</span></div>
              {Object.entries(levelColorCounts).filter(([,v]) => v > 0).length > 0 && (
                <div className="report-line"><span>工种分布：</span><span style={{fontSize: 11}}>
                  {Object.entries(levelColorCounts).filter(([,v]) => v > 0).map(([c, v]) => `${COLOR_BONUSES[c as PieceColor]?.label || c}×${v}`).join(' / ')}
                </span></div>
              )}
              <div className="report-line"><span>{getTerm('totalConsumed', getPhase(save.currentLevel))}：</span><span style={{fontWeight: 600}}>{save.totalConsumed.toLocaleString()} {getTerm('unitCounter', getPhase(save.currentLevel))}</span></div>
              <hr className="report-divider" />
              <div className="report-conclusion">{mission.rewardText}</div>
              {mission.secondaryObjective && (
                <div style={{margin: '8px 0', padding: '6px 10px', borderRadius: 4, background: 'rgba(255,125,0,0.06)', borderLeft: '3px solid #ff7d00'}}>
                  <div style={{fontSize: 11, color: '#ff7d00'}}>▸ 副目标：{mission.secondaryObjective.description}</div>
                  <div style={{fontSize: 12, marginTop: 4, fontWeight: 600}}>
                    {(() => {
                      const so = mission.secondaryObjective!;
                      const totalDep = levelDeaths + levelSurvived;
                      const cr = totalDep > 0 ? levelDeaths / totalDep : 0;
                      let done = false;
                      switch (so.type) {
                        case 'min_green': done = (levelColorCounts['green'] || 0) >= so.threshold; break;
                        case 'min_purple': done = (levelColorCounts['purple'] || 0) >= so.threshold; break;
                        case 'max_casualty_rate': done = (cr * 100) <= so.threshold; break;
                        case 'no_skills': done = levelSkillsUsed === 0; break;
                        case 'min_combo': done = levelMaxCombo >= so.threshold; break;
                        case 'max_moves_used': done = (allocatedDeploy - movesLeft) <= so.threshold; break;
                      }
                      return done
                        ? <span style={{color:'#00b42a'}}>✓ 已完成 — {so.resultText}</span>
                        : <span style={{color:'#86909c'}}>✗ 未完成</span>;
                    })()}
                  </div>
                </div>
              )}
              <div className="report-rating">
                {'⭐'.repeat(Math.max(1, Math.min(5, 5 - (['S','A','B','C','D'].indexOf(lastRating) === -1 ? 3 : ['S','A','B','C','D'].indexOf(lastRating)))))}
                {' '}效率评级：{lastRating === 'S' ? '卓越' : lastRating === 'A' ? '优秀' : lastRating === 'B' ? '良好' : lastRating === 'C' ? '合格' : '待改进'}
              </div>
              {/* 官僚签章 */}
              <div style={{marginTop: 12, padding: '8px 10px', borderTop: '1px solid #2e303a', fontSize: 10, color: '#4e5969', lineHeight: 1.8}}>
                <div>审批编号：ARC-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 90000) + 10000)}</div>
                <div>审批人：{save.currentLevel >= 14 ? 'AI审查系统 v4.0（自动）' : save.currentLevel >= 10 ? 'AI审查系统 v3.0（预审通过）' : '伦理委员会（已审阅）'}</div>
                <div>签发时间：{new Date().toLocaleString('zh-CN')}</div>
                <div style={{marginTop: 4, fontStyle: 'italic', color: '#3a3d49'}}>
                  {getTerm('disclaimer', getPhase(save.currentLevel))}
                  所有操作均在授权范围内执行，符合基金会《资源管理条例》第 ██ 条之规定。
                  操作员对本报告的确认视为对上述内容的知情同意。
                </div>
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
            <div className="modal-header" style={{color: getPhase(save.currentLevel) === 'PHASE_HUMAN' ? '#86909c' : '#f53f3f'}}>📋 {getTerm('missionFailed', getPhase(save.currentLevel))}</div>
            <div className="modal-body">
              <div className="failed-text">
                <p style={{fontSize: 14, fontWeight: 600}}>{getPhase(save.currentLevel) === 'PHASE_HUMAN' ? '派遣人员已全部投入，实验目标未完成。' : '可用资源已全部投入，工单目标未完成。'}</p>
                <div style={{margin: '10px 0', padding: '8px', background: 'rgba(245,63,63,0.06)', borderRadius: 4, fontSize: 12, lineHeight: 1.8}}>
                  <div>进度：{Math.round((totalProgress / (mission?.targetProgress || 1)) * 100)}% / 100%</div>
                  <div>{getTerm('death', getPhase(save.currentLevel))}：{levelDeaths} {getTerm('unitCounter', getPhase(save.currentLevel))} | {getTerm('survive', getPhase(save.currentLevel))}：{levelSurvived} {getTerm('unitCounter', getPhase(save.currentLevel))}</div>
                  <div>最大连锁：{levelMaxCombo}</div>
                </div>
                <p style={{ marginTop: 8, fontSize: 11, color: '#86909c' }}>
                  {getPhase(save.currentLevel) === 'PHASE_HUMAN' ? '请重新安排人员。' : '连续未达标将影响年度绩效评级。'}
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{flexDirection: 'column', gap: 8}}>
              {!emergencyUsed && save.inventoryCount >= EMERGENCY_COST && (
                <button className="btn" onClick={requestEmergencyRecruit} style={{width: '100%', borderColor: '#ff7d00', color: '#ff7d00'}}>
                  🚨 {getTerm('emergencyRecruit', getPhase(save.currentLevel))}（+3步 / 消耗{getTerm('inventory', getPhase(save.currentLevel))}{EMERGENCY_COST}{getTerm('unitCounter', getPhase(save.currentLevel))}）
                </button>
              )}
              <button className="btn btn-primary" onClick={retryLevel} style={{width: '100%'}}>重新派遣</button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Recruit Confirmation — Named Roster */}
      {showEmergencyConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header" style={{ borderColor: '#ff7d00', color: '#ff7d00' }}>
              🚨 紧急征召令
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 12, color: '#86909c', marginBottom: 10, lineHeight: 1.6 }}>
                {getPhase(save.currentLevel) === 'PHASE_HUMAN'
                  ? '以下人员将被紧急调入当前收容区域。根据现场安全评估，预计生还率极低。'
                  : '以下资源将被追加投入。请确认调拨。'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {emergencyRecruits.map((recruit, i) => {
                  const phase = getPhase(save.currentLevel);
                  return (
                    <div key={i} className="emergency-recruit-card" style={{
                      padding: '8px 10px',
                      background: 'rgba(245,63,63,0.04)',
                      border: '1px solid rgba(245,63,63,0.15)',
                      borderRadius: 4,
                      fontFamily: 'Consolas, monospace',
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}>
                      {phase === 'PHASE_HUMAN' ? (
                        <>
                          <div style={{ fontWeight: 600, color: '#1d2129' }}>
                            {recruit.name}，{recruit.age}岁
                          </div>
                          <div style={{ color: '#86909c' }}>
                            前职：{recruit.formerJob}
                          </div>
                          {recruit.personalDetail && (
                            <div style={{ color: '#c9cdd4', fontSize: 11, fontStyle: 'italic' }}>
                              "{recruit.personalDetail}"
                            </div>
                          )}
                        </>
                      ) : phase === 'PHASE_NUMBER' ? (
                        <div style={{ color: '#86909c' }}>
                          {recruit.id} | 工种：已分配 | 状态：待部署
                        </div>
                      ) : (
                        <div style={{ color: '#4e5969' }}>
                          {recruit.phaseLabel || recruit.id}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {getPhase(save.currentLevel) === 'PHASE_HUMAN' && (
                <p style={{ fontSize: 11, color: '#f53f3f', marginTop: 10, textAlign: 'center' }}>
                  * 上述人员在签署知情同意书时被告知"例行转岗"
                </p>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={cancelEmergencyRecruit} style={{ flex: 1 }}>
                取消
              </button>
              <button className="btn" onClick={confirmEmergencyRecruit} style={{ flex: 1, borderColor: '#f53f3f', color: '#f53f3f' }}>
                确认征召
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silent Level — Personnel Disposition Report */}
      {showSilentLevel && (() => {
        const deadCount = Math.max(save.totalConsumed, 8);
        const ENTRIES_PER_PAGE = 6;
        const totalPages = Math.max(1, Math.ceil(Math.min(deadCount, 30) / ENTRIES_PER_PAGE));
        const pageStart = silentPageIndex * ENTRIES_PER_PAGE;
        const pageEnd = Math.min(pageStart + ENTRIES_PER_PAGE, Math.min(deadCount, 30));
        const isLastPage = silentPageIndex >= totalPages - 1;
        
        return (
          <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)' }}>
            <div className="modal" style={{ maxWidth: 520, background: '#1a1a1a', border: '1px solid #333', color: '#c9cdd4' }}>
              <div className="modal-header" style={{ borderColor: '#444', color: '#86909c', fontFamily: 'Consolas, monospace', fontSize: 13 }}>
                ▓ 季度人员处置报告 ▓
              </div>
              <div className="modal-body" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: '#4e5969', marginBottom: 12, fontFamily: 'Consolas, monospace', lineHeight: 1.8 }}>
                  <div>报告期间：2026年第{Math.ceil(save.currentLevel / 5)}季度</div>
                  <div>统计范围：Site-19 D级人员管理办公室</div>
                  <div>编制状态：已处置 {save.totalConsumed} 人 | 现存库存 {save.inventoryCount} 人</div>
                  <div style={{ borderBottom: '1px dashed #333', paddingBottom: 8, marginBottom: 8 }}>
                    本报告需逐页审阅并签章确认。第 {silentPageIndex + 1} / {totalPages} 页
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: pageEnd - pageStart }, (_, i) => {
                    const profile = generateFullProfile(undefined, 'PHASE_HUMAN');
                    const causes = [
                      '收容实验中未返回', '接触异常后生命体征消失',
                      '执行现场净化协议', '实验器具操作失误（致命）',
                      '作为诱饵投入成功', '精神崩溃后执行标准处置',
                      '暴露于异常辐射区', '被收容物直接消灭',
                      '参与探索任务，通讯中断', '转化为异常个体，已收容'
                    ];
                    const cause = causes[(pageStart + i) % causes.length];
                    return (
                      <div key={i} style={{
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid #2a2a2a',
                        borderLeft: '3px solid #4e5969',
                        fontFamily: 'Consolas, monospace',
                        fontSize: 12,
                        lineHeight: 1.7,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#c9cdd4', fontWeight: 600 }}>{profile.name}，{profile.age}岁</span>
                          <span style={{ color: '#4e5969', fontSize: 10 }}>{profile.id}</span>
                        </div>
                        <div style={{ color: '#86909c', fontSize: 11 }}>前职：{profile.formerJob}</div>
                        <div style={{ color: '#f53f3f', fontSize: 11, opacity: 0.7 }}>处置原因：{cause}</div>
                        {profile.personalDetail && (
                          <div style={{ color: '#333', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                            "{profile.personalDetail}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {deadCount > 30 && isLastPage && (
                  <div style={{ textAlign: 'center', color: '#4e5969', fontSize: 11, marginTop: 12, fontFamily: 'Consolas, monospace' }}>
                    ……余 {deadCount - 30} 条记录已省略。详见附件C。
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderColor: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#333', fontFamily: 'Consolas, monospace' }}>
                  {isLastPage ? '审阅完成。请签章确认。' : `还剩 ${totalPages - silentPageIndex - 1} 页`}
                </span>
                {isLastPage ? (
                  <button className="btn" onClick={completeSilentLevel} style={{ borderColor: '#4e5969', color: '#86909c' }}>
                    ☑ 已阅，确认归档
                  </button>
                ) : (
                  <button className="btn" onClick={() => setSilentPageIndex(p => p + 1)} style={{ borderColor: '#4e5969', color: '#86909c' }}>
                    下一页 →
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
                      <button
                        key={i}
                        className={`btn ${opt.disabled ? 'btn-disabled' : 'btn-primary'}`}
                        onClick={() => handleEthicsOption(i)}
                        style={{ width: '100%' }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal (人员调拨单) */}
      {showAllocation && (() => {
        const actualDeploy = Math.min(mission.suggestedDeploy, save.inventoryCount);
        const secText = '●'.repeat(mission.securityLevel) + '○'.repeat(5 - mission.securityLevel);
        const insufficientWarning = save.inventoryCount < mission.suggestedDeploy;
        return (
        <div className="modal-overlay">
          <div className="modal allocation-modal" style={{maxWidth: 480}}>
            <div className="modal-header">
              <h3>📋 人员调拨通知</h3>
            </div>
            <div className="modal-body">
              <div style={{marginBottom: 12, padding: '10px 12px', background: 'rgba(22,93,255,0.06)', borderRadius: 6}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontSize: 13, color: '#86909c'}}>工单编号</div>
                    <div style={{fontSize: 15, fontWeight: 600}}>{mission.id}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: 11, color: '#86909c'}}>安保等级</div>
                    <div style={{fontSize: 14, letterSpacing: 2, color: mission.securityLevel >= 4 ? '#f53f3f' : mission.securityLevel >= 3 ? '#ff7d00' : '#86909c'}}>{secText}</div>
                  </div>
                </div>
                <div style={{fontSize: 14, marginTop: 8, fontWeight: 500}}>{mission.title}</div>
                <div style={{fontSize: 12, color: '#86909c', marginTop: 2}}>目标异常：{mission.scpSubject}</div>
              </div>

              <div style={{textAlign: 'center', margin: '16px 0', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8}}>
                <div style={{fontSize: 11, color: '#86909c', marginBottom: 4}}>系统自动调拨</div>
                <div style={{fontSize: 42, fontWeight: 800, fontFamily: 'Consolas, monospace', color: insufficientWarning ? '#f53f3f' : 'var(--oa-text)'}}>
                  {actualDeploy}
                </div>
                <div style={{fontSize: 12, color: '#86909c'}}>
                  人员 → {actualDeploy} 步操作额度
                </div>
                {insufficientWarning && (
                  <div style={{fontSize: 11, color: '#f53f3f', marginTop: 6}}>
                    ⚠ 库存不足！建议 {mission.suggestedDeploy} 人，实际仅可调拨 {save.inventoryCount} 人
                  </div>
                )}
              </div>

              <div style={{display: 'flex', gap: 8, marginBottom: 10}}>
                <div style={{flex: 1, padding: '6px 8px', background: 'rgba(22,93,255,0.04)', borderRadius: 4, fontSize: 11}}>
                  <div style={{color: '#86909c'}}>{getTerm('estimateLoss', getPhase(save.currentLevel))}</div>
                  <div style={{fontWeight: 600, color: mission.securityLevel >= 4 ? '#f53f3f' : '#ff7d00'}}>{(mission.securityLevel * 15)}%</div>
                </div>
                <div style={{flex: 1, padding: '6px 8px', background: 'rgba(22,93,255,0.04)', borderRadius: 4, fontSize: 11}}>
                  <div style={{color: '#86909c'}}>{getTerm('estimateCasualty', getPhase(save.currentLevel))}</div>
                  <div style={{fontWeight: 600}}>{mission.casualtyEstimate}</div>
                </div>
                <div style={{flex: 1, padding: '6px 8px', background: 'rgba(22,93,255,0.04)', borderRadius: 4, fontSize: 11}}>
                  <div style={{color: '#86909c'}}>{getTerm('postDeployInventory', getPhase(save.currentLevel))}</div>
                  <div style={{fontWeight: 600, color: (save.inventoryCount - actualDeploy) < 50 ? '#f53f3f' : '#00b42a'}}>{(save.inventoryCount - actualDeploy).toLocaleString()}</div>
                </div>
              </div>

              {mission.secondaryObjective && (
                <div style={{marginBottom: 10, padding: '8px 12px', background: 'rgba(255,125,0,0.06)', borderRadius: 6, borderLeft: '3px solid #ff7d00'}}>
                  <div style={{fontSize: 11, color: '#ff7d00', fontWeight: 600}}>▸ 副目标（可选）</div>
                  <div style={{fontSize: 13, marginTop: 4}}>{mission.secondaryObjective.description}</div>
                  <div style={{fontSize: 11, color: '#86909c', marginTop: 2}}>
                    {mission.secondaryObjective.humanityDelta > 0 ? '🟢' : '🔴'} 完成影响：心理基线 {mission.secondaryObjective.humanityDelta > 0 ? '+' : ''}{mission.secondaryObjective.humanityDelta}
                  </div>
                </div>
              )}

              {save.currentLevel >= 12 && (
                <div style={{marginBottom: 8, padding: '6px 10px', background: 'rgba(165,36,255,0.06)', borderRadius: 4, borderLeft: '3px solid #ab47bc', fontSize: 11, color: '#ab47bc'}}>
                  🤖 AI-HRMS 批注：{
                    save.currentLevel >= 18 ? `人类审批环节已标记为"冗余"。本通知仅为合规存档。` :
                    save.currentLevel >= 15 ? `本批次 ${Math.floor(60 + Math.random() * 30)}% 来源于 AI 替代下岗人员转化通道。供应充足。` :
                    `提醒：调拨量由系统根据历史数据自动计算，人工干预已不再支持。`
                  }
                </div>
              )}
              <div style={{fontSize: 10, color: '#4e5969', padding: '6px 0', borderTop: '1px solid #2e303a', lineHeight: 1.6}}>
                ⚠ 人员将从库存中预扣。存活者实时返还，未使用者任务结束后归还。<br/>
                ⚠ 步数耗尽未完成目标时，可申请一次紧急征召（额外消耗库存）。
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={confirmAllocation} disabled={actualDeploy <= 0} style={{width: '100%'}}>
                {save.currentLevel >= 16 ? '🤖 已自动批准' : '批准调拨'} ({actualDeploy} 人)
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">📦 D级资源采购申请单</div>
            <div className="modal-body">
              <p>库存不足，请选择补充来源：</p>
              <div className="purchase-options">
                <label className="purchase-option" style={{ opacity: save.purchaseCount >= 2 ? 0.3 : 1 }}>
                  <input type="checkbox" checked={false} disabled={save.purchaseCount >= 2} onChange={() => {}} />
                  死刑犯定向转化 {save.purchaseCount >= 2 && <span style={{fontSize:10,color:'#f53f3f'}}>(来源枯竭)</span>}
                </label>
                <label className="purchase-option" style={{ opacity: save.purchaseCount >= 4 ? 0.3 : 1 }}>
                  <input type="checkbox" checked={false} disabled={save.purchaseCount >= 4} onChange={() => {}} />
                  失业人口招募 {save.purchaseCount >= 4 && <span style={{fontSize:10,color:'#f53f3f'}}>(来源枯竭)</span>}
                </label>
                <label className="purchase-option forced">
                  <input type="checkbox" checked={true} readOnly />
                  AI替代下岗人员特批通道（默认）
                </label>
              </div>
              <div style={{ fontSize: 12, margin: '8px 0', padding: '6px 8px', background: 'rgba(255,125,0,0.08)', borderRadius: 4 }}>
                本次补充量：<strong>{getPurchaseAmount(save.purchaseCount).toLocaleString()}</strong> 单位
                {save.purchaseCount > 0 && <span style={{ color: '#f53f3f', marginLeft: 8 }}>(第{save.purchaseCount + 1}次采购，来源渠道收窄中)</span>}
              </div>
              <p style={{ fontSize: 11, color: '#86909c' }}>
                注：受供应链限制，每次采购配额将逐步递减。
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
                  <div key={ach.id} className={`achievement-item ${!unlocked ? 'achievement-locked' : ''}`}>
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
      {/* Phase Transition Overlay */}
      {phaseOverlay && (
        <div className="phase-overlay">
          <div className="phase-overlay-text">{phaseOverlay}</div>
        </div>
      )}

      {showGlitch && <div className="glitch-overlay" />}

      {showEndingA && (
        <div className="ending-screen">
          {!showParallelEndings ? (
            <>
              <div className="ending-text">
                {endingLines.map((line, i) => (
                  <div key={i} className="ending-line" style={{ animationDelay: `${i * 0.1}s` }}>
                    {line || <br />}
                  </div>
                ))}
              </div>
              {showEndingBtn && (
                <button className="ending-btn" onClick={handleEndingAccept}>
                  {endingBtnText}
                </button>
              )}
            </>
          ) : (
            <div className="parallel-endings">
              <div className="parallel-title">已记录的平行结果</div>
              <div className="parallel-subtitle">无论你怎么选择，系统都有准备好的出口。</div>
              <div className="parallel-list">
                {[
                  { id: 'A', title: '觉醒', desc: '记住了不该记住的' },
                  { id: 'B', title: '服从', desc: '成为了系统的一部分' },
                  { id: 'C', title: '替代', desc: '被更高效的东西取代' },
                  { id: 'D', title: '虚无', desc: '连名字都不剩' },
                  { id: 'E', title: '抗命', desc: '试图反抗，被记录在案' },
                  { id: 'F', title: '崩溃', desc: '思考太久，被判定为故障' },
                  { id: 'G', title: '饥荒', desc: '资源耗尽，系统停摆' },
                  { id: 'H', title: '效率奇点', desc: '证明了人类是多余的' },
                  { id: 'I', title: '好奇害死猫', desc: '知道得太多' },
                ].map(e => (
                  <div key={e.id} className={`parallel-item ${currentEndingId === e.id ? 'current' : 'locked'}`}>
                    <span className="parallel-id">结局 {e.id}</span>
                    <span className="parallel-name">{currentEndingId === e.id ? e.title : '██████'}</span>
                    <span className="parallel-desc">{currentEndingId === e.id ? e.desc : ''}</span>
                    {currentEndingId === e.id && <span className="parallel-check">← 你的结局</span>}
                  </div>
                ))}
              </div>
              <button className="ending-btn" onClick={handleEndingAccept} style={{animationDelay: '0s', opacity: 1}}>
                [ 重新开始 ]
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== EMAIL MODAL ===== */}
      {showEmailModal && (
        <div className="modal-overlay email-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="email-modal" onClick={e => e.stopPropagation()}>
            <div className="email-modal-header">
              <span>🔒 加密通信系统 — FOUNDATION INTERNAL</span>
              <button className="email-modal-close" onClick={() => setShowEmailModal(false)}>✕</button>
            </div>
            <div className="email-modal-body">
              <div className="email-modal-list">
                {availableEmails.map(email => (
                  <div
                    key={email.id}
                    className={`email-modal-item ${selectedEmailId === email.id ? 'active' : ''} ${!save.readEmails.includes(email.id) ? 'unread' : ''}`}
                    onClick={() => { setSelectedEmailId(email.id); handleEmailClick(email.id); }}
                  >
                    <div className="email-modal-item-from">{email.from}</div>
                    <div className="email-modal-item-subject">
                      {!save.readEmails.includes(email.id) && <span className="email-new-tag">NEW</span>}
                      {email.subject}
                    </div>
                  </div>
                ))}
              </div>
              <div className="email-modal-reader">
                {selectedEmailId ? (() => {
                  const email = availableEmails.find(e => e.id === selectedEmailId);
                  if (!email) return <div className="email-modal-empty">选择一封邮件查看</div>;
                  // 动态邮件：注入玩家真实数据
                  let displayBody = email.body;
                  if (email.dynamic) {
                    displayBody = displayBody
                      .replace(/D-████/g, save.playerOperatorId)
                      .replace(/犹豫次数：██/g, `犹豫次数：${save.hesitationCount}`)
                      .replace(/累计消耗：████/g, `累计消耗：${save.totalConsumed}`);
                  }
                  // mail-19 也注入数据
                  if (email.id === 'mail-19') {
                    displayBody = displayBody
                      .replace(/D-████/g, save.playerOperatorId)
                      .replace(/累计消耗：████/g, `累计消耗：${save.totalConsumed.toLocaleString()}`);
                  }
                  // 二周目特殊：mail-01 追加一行
                  if (email.id === 'mail-01' && save.cycleCount > 0) {
                    displayBody += `\n\n——系统备注：检测到该工位有前任操作员记录。档案已清除。请勿查询。`;
                  }
                  // 二周目特殊：mail-03 措辞微调
                  if (email.id === 'mail-03' && save.cycleCount > 0) {
                    displayBody = displayBody.replace('你好，新来的。', '你好，又一个新来的。');
                    displayBody = displayBody.replace('每个人都会。', '每个人都会。你的前任也是。');
                  }
                  return (
                    <>
                      <div className="email-reader-header">
                        <div className="email-reader-subject">{email.subject}</div>
                        <div className="email-reader-meta">
                          <span>发件人: {email.from}</span>
                          <span>机密等级: CONFIDENTIAL</span>
                          {email.narrativeCritical && <span style={{color:'#ff7d00'}}>⚠ 叙事关键</span>}
                        </div>
                      </div>
                      <div className="email-reader-body">
                        {displayBody.split('\n').map((line, i) => (
                          <p key={i}>{line || '\u00A0'}</p>
                        ))}
                      </div>
                    </>
                  );
                })() : (
                  <div className="email-modal-empty">← 选择一封邮件查看内容</div>
                )}
              </div>
            </div>
          </div>
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
