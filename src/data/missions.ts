export interface SecondaryObjective {
  description: string;
  /** 检查函数的 key（在 App.tsx 中实现判定逻辑） */
  type: 'min_green' | 'max_casualty_rate' | 'no_skills' | 'min_combo' | 'max_moves_used' | 'min_purple';
  /** 阈值 */
  threshold: number;
  /** 完成后的人性指数变化 */
  humanityDelta: number;
  /** 完成后的文案 */
  resultText: string;
}

export interface MissionOrder {
  id: string;
  scpSubject: string;
  title: string;
  securityLevel: number;
  targetProgress: number;
  bonusColors: PieceColor[];
  /** 固定操作步数 — 与人命消耗脱钩 */
  fixedMoves: number;
  /** 调拨人员数（叙事展示用，实际人命消耗由消除方块数决定） */
  suggestedDeploy: number;
  /** 最低投入（叙事展示用） */
  minDeploy: number;
  /** 最高投入（叙事展示用） */
  maxDeploy: number;
  specialConditions?: string;
  rewardText: string;
  casualtyEstimate: string;
  /** 叙事节奏标记 */
  narrativeBeat: 'minor' | 'major' | null;
  /** 副目标（可选） */
  secondaryObjective?: SecondaryObjective;
  /** 高危区域数量（0=无） */
  hazardZones?: number;
  /** 关卡类型：默认 match3，silent 为静默审阅关 */
  missionType?: 'match3' | 'silent';
}

/** 每个方块代表一个小队的人数 */
export const SQUAD_SIZE = 5;

export type PieceColor = 'blue' | 'red' | 'green' | 'orange' | 'purple';

export const COLOR_LABELS: Record<PieceColor, string> = {
  blue: '杂役工种',
  red: '危险接触工种',
  green: '生物实验工种',
  orange: '机械操作工种',
  purple: '异常接触工种',
};

export const COLOR_HEX: Record<PieceColor, string> = {
  blue: '#4FC3F7',
  red: '#EF5350',
  green: '#66BB6A',
  orange: '#FFA726',
  purple: '#AB47BC',
};

export const COLOR_EMOJI: Record<PieceColor, string> = {
  blue: '�',
  red: '☢️',
  green: '🧬',
  orange: '⚙️',
  purple: '🟪',
};

// ====================================================================
// 20关叙事弧线
// 第一章 (1-5): 入职培训 — 建立日常感
// 第二章 (6-10): 深入泥潭 — 道德模糊加剧
// 第三章 (11-15): 体制之轮 — 系统失控，个体消亡
// 第四章 (16-20): 终局之路 — 走向结局分支
// ====================================================================

export const missions: MissionOrder[] = [
  // ===== 第一章：入职培训 =====
  // 设计原则：教学关，宽裕但不浪费。每个方块=1个5人小队
  {
    id: 'EXP-2026-0001',
    scpSubject: 'SCP-999',
    title: '日常互动测试',
    securityLevel: 1,
    targetProgress: 30,
    bonusColors: ['blue'],
    fixedMoves: 10,
    suggestedDeploy: 8,
    minDeploy: 5,
    maxDeploy: 15,
    rewardText: '实验顺利完成。受试资源状态良好。（罕见）',
    casualtyEstimate: '0',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0002',
    scpSubject: 'SCP-173',
    title: '收容间清洁作业',
    securityLevel: 1,
    targetProgress: 35,
    bonusColors: ['blue', 'red'],
    fixedMoves: 10,
    suggestedDeploy: 10,
    minDeploy: 6,
    maxDeploy: 18,
    rewardText: '清洁完毕。2单位折损，在标准范围内。',
    casualtyEstimate: '2',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0003',
    scpSubject: 'SCP-914',
    title: '精加工测试：粗糙→精细',
    securityLevel: 1,
    targetProgress: 40,
    bonusColors: ['orange'],
    fixedMoves: 11,
    suggestedDeploy: 12,
    minDeploy: 7,
    maxDeploy: 20,
    rewardText: '加工完成。3名操作人员在"超精细"设置下被重组。资产已回收。',
    casualtyEstimate: '3',
    narrativeBeat: 'minor',
  },
  {
    id: 'EXP-2026-0004',
    scpSubject: 'SCP-500',
    title: '万能药剂量测试',
    securityLevel: 1,
    targetProgress: 38,
    bonusColors: ['green'],
    fixedMoves: 11,
    suggestedDeploy: 10,
    minDeploy: 6,
    maxDeploy: 18,
    rewardText: '测试完成。1粒SCP-500已消耗。受试者已痊愈后被送回收容。',
    casualtyEstimate: '0',
    narrativeBeat: null,
    secondaryObjective: {
      type: 'min_green',
      threshold: 8,
      description: '使用生物方案：绿色消除 ≥ 8',
      humanityDelta: 3,
      resultText: '采用了生物友好方案，减少了不必要的损耗。',
    },
  },
  {
    id: 'EXP-2026-0005',
    scpSubject: 'SCP-087',
    title: '楼梯间探索（第██次尝试）',
    securityLevel: 2,
    targetProgress: 50,
    bonusColors: ['red', 'purple'],
    fixedMoves: 12,
    suggestedDeploy: 14,
    minDeploy: 8,
    maxDeploy: 22,
    rewardText: '探索在B-12层终止。设备回收率：0%。人员回收率：0%。',
    casualtyEstimate: '全损',
    narrativeBeat: 'major',
  },

  // ===== 第二章：深入泥潭 =====
  // 设计原则：难度爬升，步数开始紧张。玩家需要思考分配策略
  {
    id: 'EXP-2026-0006',
    scpSubject: 'SCP-106',
    title: '老人再收容协议',
    securityLevel: 2,
    targetProgress: 55,
    bonusColors: ['red'],
    fixedMoves: 11,
    suggestedDeploy: 15,
    minDeploy: 9,
    maxDeploy: 24,
    rewardText: '再收容成功。诱饵人员已计入本月折旧。',
    casualtyEstimate: '1（诱饵）',
    narrativeBeat: 'minor',
    hazardZones: 1,
  },
  {
    id: 'EXP-2026-0007',
    scpSubject: 'SCP-682',
    title: '再生能力抑制实验',
    securityLevel: 3,
    targetProgress: 65,
    bonusColors: ['red', 'green'],
    fixedMoves: 12,
    suggestedDeploy: 18,
    minDeploy: 10,
    maxDeploy: 28,
    rewardText: 'SCP-682已再生。实验失败。投入资源全损。建议追加预算。',
    casualtyEstimate: '8-12',
    narrativeBeat: null,
    secondaryObjective: {
      type: 'max_casualty_rate',
      threshold: 40,
      description: '控制折损率 ≤ 40%',
      humanityDelta: 5,
      resultText: '在高危实验中保持了较低的人员折损率。',
    },
  },
  {
    id: 'EXP-2026-0008',
    scpSubject: 'SCP-049',
    title: '"治疗"行为观察',
    securityLevel: 2,
    targetProgress: 58,
    bonusColors: ['green', 'purple'],
    fixedMoves: 12,
    suggestedDeploy: 15,
    minDeploy: 9,
    maxDeploy: 24,
    rewardText: '观察完成。2名受试者已被"治愈"。产物已收容。',
    casualtyEstimate: '2（转化）',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0009',
    scpSubject: 'SCP-096',
    title: '面部辨识阈值测试',
    securityLevel: 3,
    targetProgress: 70,
    bonusColors: ['blue', 'orange'],
    fixedMoves: 13,
    suggestedDeploy: 18,
    minDeploy: 10,
    maxDeploy: 28,
    rewardText: '阈值已更新。受试者及摄影团队已处理。现场清洁完成。',
    casualtyEstimate: '全损',
    narrativeBeat: 'minor',
    hazardZones: 1,
  },
  {
    id: 'EXP-2026-0010',
    scpSubject: 'SCP-035',
    title: '宿主适配性研究',
    securityLevel: 3,
    targetProgress: 75,
    bonusColors: ['purple'],
    fixedMoves: 13,
    suggestedDeploy: 20,
    minDeploy: 12,
    maxDeploy: 30,
    rewardText: '第██名宿主已耗尽。SCP-035已归还特制收容柜。',
    casualtyEstimate: '3-5',
    narrativeBeat: 'major',
    secondaryObjective: {
      type: 'min_purple',
      threshold: 12,
      description: '异常接触暴露 ≥ 12 次',
      humanityDelta: -3,
      resultText: '大量使用异常接触人员，效率极高。他们的后遗症不在你的报告范围内。',
    },
  },

  // ===== 静默审阅关 =====
  // 设计原则：强制面对。不是游戏，而是清算。
  {
    id: 'EXP-2026-AUDIT',
    scpSubject: '人事处',
    title: '季度人员处置报告审阅',
    securityLevel: 0,
    targetProgress: 0,
    bonusColors: [],
    fixedMoves: 0,
    suggestedDeploy: 0,
    minDeploy: 0,
    maxDeploy: 0,
    rewardText: '已确认审阅。本季度数据已归档。',
    casualtyEstimate: '—',
    narrativeBeat: 'major',
    missionType: 'silent',
  },

  // ===== 第三章：体制之轮 =====
  // 设计原则：真正的资源压力。玩家开始感受到库存紧张
  {
    id: 'EXP-2026-0011',
    scpSubject: 'SCP-231',
    title: '110-蒙托克程序执行',
    securityLevel: 4,
    targetProgress: 85,
    bonusColors: ['red', 'purple'],
    fixedMoves: 13,
    suggestedDeploy: 22,
    minDeploy: 14,
    maxDeploy: 35,
    rewardText: '程序已完成。细节已列为5级机密。您无需了解更多。',
    casualtyEstimate: '[数据删除]',
    narrativeBeat: null,
    hazardZones: 2,
    secondaryObjective: {
      type: 'no_skills',
      threshold: 0,
      description: '不使用任何技能（"纯粹依靠人力"）',
      humanityDelta: -5,
      resultText: '您选择了纯粹的资源消耗路线。高效。冷酷。',
    },
  },
  {
    id: 'EXP-2026-0012',
    scpSubject: 'SCP-2000',
    title: '设施维护人员轮换',
    securityLevel: 2,
    targetProgress: 55,
    bonusColors: ['orange', 'blue'],
    fixedMoves: 12,
    suggestedDeploy: 14,
    minDeploy: 8,
    maxDeploy: 22,
    rewardText: '维护完成。轮换人员记忆已标准化处理。',
    casualtyEstimate: '0（已处理）',
    narrativeBeat: 'minor',
  },
  {
    id: 'EXP-2026-0013',
    scpSubject: 'SCP-610',
    title: '"肉体盛宴"样本采集',
    securityLevel: 4,
    targetProgress: 95,
    bonusColors: ['green', 'red'],
    fixedMoves: 14,
    suggestedDeploy: 25,
    minDeploy: 15,
    maxDeploy: 38,
    rewardText: '样本已获取。采集队伍已执行净化协议。区域已封锁。',
    casualtyEstimate: '全队',
    narrativeBeat: null,
    hazardZones: 2,
  },
  {
    id: 'EXP-2026-0014',
    scpSubject: 'SCP-055',
    title: '反模因特性验证',
    securityLevel: 3,
    targetProgress: 80,
    bonusColors: ['purple', 'orange'],
    fixedMoves: 13,
    suggestedDeploy: 20,
    minDeploy: 12,
    maxDeploy: 30,
    rewardText: '实验……已完成？记录显示一切正常。我们做了什么来着？',
    casualtyEstimate: '未知',
    narrativeBeat: null,
    secondaryObjective: {
      type: 'min_combo',
      threshold: 4,
      description: '达成 4 连锁以上（"高效协同作业"）',
      humanityDelta: -2,
      resultText: '令人印象深刻的协同效率。这种精确度通常只在机器身上看到。',
    },
  },
  {
    id: 'EXP-2026-0015',
    scpSubject: 'SCP-2521',
    title: '信息载体暴露测试',
    securityLevel: 4,
    targetProgress: 100,
    bonusColors: ['purple'],
    fixedMoves: 15,
    suggestedDeploy: 25,
    minDeploy: 15,
    maxDeploy: 38,
    rewardText: '██████████████████████████████',
    casualtyEstimate: '██',
    narrativeBeat: 'major',
    hazardZones: 3,
  },

  // ===== 第四章：终局之路 =====
  // 设计原则：高压决策。每一步都很珍贵，库存可能告急
  {
    id: 'EXP-2026-0016',
    scpSubject: 'SCP-3000',
    title: '记忆消除鳗提取作业',
    securityLevel: 4,
    targetProgress: 105,
    bonusColors: ['green', 'purple'],
    fixedMoves: 15,
    suggestedDeploy: 28,
    minDeploy: 16,
    maxDeploy: 40,
    rewardText: 'Y-909化合物提取成功。资源消耗量在预算范围内。',
    casualtyEstimate: '6-10',
    narrativeBeat: null,
    secondaryObjective: {
      type: 'max_casualty_rate',
      threshold: 30,
      description: '折损率 ≤ 30%（"保全更多样本来源"）',
      humanityDelta: 6,
      resultText: '在极端环境中维持了人员存活率。他们还能用。',
    },
  },
  {
    id: 'EXP-2026-0017',
    scpSubject: 'SCP-4999',
    title: '临终陪伴者观测',
    securityLevel: 1,
    targetProgress: 60,
    bonusColors: ['blue', 'green'],
    fixedMoves: 13,
    suggestedDeploy: 14,
    minDeploy: 8,
    maxDeploy: 22,
    rewardText: '未观测到SCP-4999显现。受试者已按标准流程处理。没有人陪伴他们。',
    casualtyEstimate: '3',
    narrativeBeat: null,
    secondaryObjective: {
      type: 'max_moves_used',
      threshold: 10,
      description: '投入不超过 10 人（"最小化牺牲"）',
      humanityDelta: 8,
      resultText: '你尝试了用最少的人完成任务。在这个地方，这算是仁慈。',
    },
  },
  {
    id: 'EXP-2026-0018',
    scpSubject: 'SCP-001提案',
    title: '把守人协议验证',
    securityLevel: 5,
    targetProgress: 120,
    bonusColors: ['red', 'orange', 'purple'],
    fixedMoves: 16,
    suggestedDeploy: 30,
    minDeploy: 18,
    maxDeploy: 45,
    rewardText: '[本报告已被O5议会删除]',
    casualtyEstimate: '[权限不足]',
    narrativeBeat: 'minor',
    hazardZones: 3,
  },
  {
    id: 'EXP-2026-0019',
    scpSubject: 'SCP-2935',
    title: '"死亡终结"洞穴探索',
    securityLevel: 5,
    targetProgress: 130,
    bonusColors: ['purple', 'red'],
    fixedMoves: 17,
    suggestedDeploy: 32,
    minDeploy: 20,
    maxDeploy: 48,
    rewardText: '探索队已返回。他们说另一边什么都没有。什么都没有了。',
    casualtyEstimate: '全队（精神层面）',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0020',
    scpSubject: 'SCP-5000',
    title: '灭绝协议复盘：为什么？',
    securityLevel: 5,
    targetProgress: 110,
    bonusColors: ['purple', 'red', 'green', 'orange', 'blue'],
    fixedMoves: 18,
    suggestedDeploy: 28,
    minDeploy: 18,
    maxDeploy: 42,
    rewardText: '',
    casualtyEstimate: '所有人',
    narrativeBeat: 'major',
    hazardZones: 4,
  },
];

export function getMission(level: number): MissionOrder {
  const idx = Math.min(level - 1, missions.length - 1);
  return missions[Math.max(0, idx)];
}