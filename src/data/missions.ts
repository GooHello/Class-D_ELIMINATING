export interface MissionOrder {
  id: string;
  scpSubject: string;
  title: string;
  securityLevel: number;
  targetProgress: number;
  bonusColors: PieceColor[];
  maxMoves: number;
  specialConditions?: string;
  rewardText: string;
  casualtyEstimate: string;
  /** 叙事节奏标记 */
  narrativeBeat: 'minor' | 'major' | null;
}

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
  {
    id: 'EXP-2026-0001',
    scpSubject: 'SCP-999',
    title: '日常互动测试',
    securityLevel: 1,
    targetProgress: 20,
    bonusColors: ['blue'],
    maxMoves: 20,
    rewardText: '实验顺利完成。受试资源状态良好。（罕见）',
    casualtyEstimate: '0',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0002',
    scpSubject: 'SCP-173',
    title: '收容间清洁作业',
    securityLevel: 1,
    targetProgress: 25,
    bonusColors: ['blue', 'red'],
    maxMoves: 20,
    rewardText: '清洁完毕。2单位折损，在标准范围内。',
    casualtyEstimate: '2',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0003',
    scpSubject: 'SCP-914',
    title: '精加工测试：粗糙→精细',
    securityLevel: 1,
    targetProgress: 30,
    bonusColors: ['orange'],
    maxMoves: 22,
    rewardText: '加工完成。3名操作人员在"超精细"设置下被重组。资产已回收。',
    casualtyEstimate: '3',
    narrativeBeat: 'minor', // L3 小爆点
  },
  {
    id: 'EXP-2026-0004',
    scpSubject: 'SCP-500',
    title: '万能药剂量测试',
    securityLevel: 1,
    targetProgress: 28,
    bonusColors: ['green'],
    maxMoves: 20,
    rewardText: '测试完成。1粒SCP-500已消耗。受试者已痊愈后被送回收容。',
    casualtyEstimate: '0',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0005',
    scpSubject: 'SCP-087',
    title: '楼梯间探索（第██次尝试）',
    securityLevel: 2,
    targetProgress: 35,
    bonusColors: ['red', 'purple'],
    maxMoves: 22,
    rewardText: '探索在B-12层终止。设备回收率：0%。人员回收率：0%。',
    casualtyEstimate: '全损',
    narrativeBeat: 'major', // L5 大爆点：首次伦理审查
  },

  // ===== 第二章：深入泥潭 =====
  {
    id: 'EXP-2026-0006',
    scpSubject: 'SCP-106',
    title: '老人再收容协议',
    securityLevel: 2,
    targetProgress: 40,
    bonusColors: ['red'],
    maxMoves: 22,
    rewardText: '再收容成功。诱饵人员已计入本月折旧。',
    casualtyEstimate: '1（诱饵）',
    narrativeBeat: 'minor', // L6 小爆点 + 阶段转换
  },
  {
    id: 'EXP-2026-0007',
    scpSubject: 'SCP-682',
    title: '再生能力抑制实验',
    securityLevel: 3,
    targetProgress: 50,
    bonusColors: ['red', 'green'],
    maxMoves: 25,
    rewardText: 'SCP-682已再生。实验失败。投入资源全损。建议追加预算。',
    casualtyEstimate: '8-12',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0008',
    scpSubject: 'SCP-049',
    title: '"治疗"行为观察',
    securityLevel: 2,
    targetProgress: 45,
    bonusColors: ['green', 'purple'],
    maxMoves: 22,
    rewardText: '观察完成。2名受试者已被"治愈"。产物已收容。',
    casualtyEstimate: '2（转化）',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0009',
    scpSubject: 'SCP-096',
    title: '面部辨识阈值测试',
    securityLevel: 3,
    targetProgress: 55,
    bonusColors: ['blue', 'orange'],
    maxMoves: 22,
    rewardText: '阈值已更新。受试者及摄影团队已处理。现场清洁完成。',
    casualtyEstimate: '全损',
    narrativeBeat: 'minor', // L9 小爆点
  },
  {
    id: 'EXP-2026-0010',
    scpSubject: 'SCP-035',
    title: '宿主适配性研究',
    securityLevel: 3,
    targetProgress: 60,
    bonusColors: ['purple'],
    maxMoves: 25,
    rewardText: '第██名宿主已耗尽。SCP-035已归还特制收容柜。',
    casualtyEstimate: '3-5',
    narrativeBeat: 'major', // L10 大爆点：AI上线
  },

  // ===== 第三章：体制之轮 =====
  {
    id: 'EXP-2026-0011',
    scpSubject: 'SCP-231',
    title: '110-蒙托克程序执行',
    securityLevel: 4,
    targetProgress: 65,
    bonusColors: ['red', 'purple'],
    maxMoves: 25,
    rewardText: '程序已完成。细节已列为5级机密。您无需了解更多。',
    casualtyEstimate: '[数据删除]',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0012',
    scpSubject: 'SCP-2000',
    title: '设施维护人员轮换',
    securityLevel: 2,
    targetProgress: 45,
    bonusColors: ['orange', 'blue'],
    maxMoves: 24,
    rewardText: '维护完成。轮换人员记忆已标准化处理。',
    casualtyEstimate: '0（已处理）',
    narrativeBeat: 'minor', // L12 小爆点 — 喘息关
  },
  {
    id: 'EXP-2026-0013',
    scpSubject: 'SCP-610',
    title: '"肉体盛宴"样本采集',
    securityLevel: 4,
    targetProgress: 75,
    bonusColors: ['green', 'red'],
    maxMoves: 25,
    rewardText: '样本已获取。采集队伍已执行净化协议。区域已封锁。',
    casualtyEstimate: '全队',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0014',
    scpSubject: 'SCP-055',
    title: '反模因特性验证',
    securityLevel: 3,
    targetProgress: 65,
    bonusColors: ['purple', 'orange'],
    maxMoves: 22,
    rewardText: '实验……已完成？记录显示一切正常。我们做了什么来着？',
    casualtyEstimate: '未知',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0015',
    scpSubject: 'SCP-2521',
    title: '信息载体暴露测试',
    securityLevel: 4,
    targetProgress: 80,
    bonusColors: ['purple'],
    maxMoves: 25,
    rewardText: '██████████████████████████████',
    casualtyEstimate: '██',
    narrativeBeat: 'major', // L15 大爆点：伦理委员会解散
  },

  // ===== 第四章：终局之路 =====
  {
    id: 'EXP-2026-0016',
    scpSubject: 'SCP-3000',
    title: '记忆消除鳗提取作业',
    securityLevel: 4,
    targetProgress: 85,
    bonusColors: ['green', 'purple'],
    maxMoves: 25,
    rewardText: 'Y-909化合物提取成功。资源消耗量在预算范围内。',
    casualtyEstimate: '6-10',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0017',
    scpSubject: 'SCP-4999',
    title: '临终陪伴者观测',
    securityLevel: 1,
    targetProgress: 50,
    bonusColors: ['blue', 'green'],
    maxMoves: 25,
    rewardText: '未观测到SCP-4999显现。受试者已按标准流程处理。没有人陪伴他们。',
    casualtyEstimate: '3',
    narrativeBeat: null, // 情感喘息关 — 让玩家有时间细读档案
  },
  {
    id: 'EXP-2026-0018',
    scpSubject: 'SCP-001提案',
    title: '把守人协议验证',
    securityLevel: 5,
    targetProgress: 100,
    bonusColors: ['red', 'orange', 'purple'],
    maxMoves: 28,
    rewardText: '[本报告已被O5议会删除]',
    casualtyEstimate: '[权限不足]',
    narrativeBeat: 'minor', // L18 小爆点
  },
  {
    id: 'EXP-2026-0019',
    scpSubject: 'SCP-2935',
    title: '"死亡终结"洞穴探索',
    securityLevel: 5,
    targetProgress: 110,
    bonusColors: ['purple', 'red'],
    maxMoves: 28,
    rewardText: '探索队已返回。他们说另一边什么都没有。什么都没有了。',
    casualtyEstimate: '全队（精神层面）',
    narrativeBeat: null,
  },
  {
    id: 'EXP-2026-0020',
    scpSubject: 'SCP-5000',
    title: '灭绝协议复盘：为什么？',
    securityLevel: 5,
    targetProgress: 80,
    bonusColors: ['purple', 'red', 'green', 'orange', 'blue'],
    maxMoves: 30,
    rewardText: '',
    casualtyEstimate: '所有人',
    narrativeBeat: 'major', // L20 — 最终关降低难度，系统已不在乎了
  },
];

export function getMission(level: number): MissionOrder {
  const idx = Math.min(level - 1, missions.length - 1);
  return missions[Math.max(0, idx)];
}