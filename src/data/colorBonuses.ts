/**
 * 五色增益体系 —— D级人员工种特性
 *
 * 蓝(杂役)：基础进度×1.0，无特殊效果——炮灰
 * 红(危险)：进度×1.2 + 消除时有概率触发"压制协议"（冻结1行3秒不可操作但不消失）
 * 绿(生物)：进度×1.0 + 消除后降低下次部署折损率15%
 * 橙(机械)：进度×1.1 + 消除4+时修复1个被收容突破破坏的格子
 * 紫(异常)：进度×1.5 但消除时10%概率触发小型收容突破
 */

import type { PieceColor } from './missions';

export interface ColorBonus {
  label: string;
  progressMultiplier: number;
  description: string;
  /** 额外被动描述 */
  passive: string;
}

export const COLOR_BONUSES: Record<PieceColor, ColorBonus> = {
  blue: {
    label: '杂役',
    progressMultiplier: 1.0,
    description: '标准D级人员，无特殊技能。',
    passive: '无',
  },
  red: {
    label: '危险接触',
    progressMultiplier: 1.2,
    description: '经过危险环境训练，收容效率更高。',
    passive: '消除4+时红色进度翻倍',
  },
  green: {
    label: '生物实验',
    progressMultiplier: 1.0,
    description: '具备基础生物知识，可优化收容流程。',
    passive: '消除后降低下次部署折损率15%',
  },
  orange: {
    label: '机械操作',
    progressMultiplier: 1.1,
    description: '设备操作专家，效率略高于标准。',
    passive: '消除4+时触发十字清除',
  },
  purple: {
    label: '异常接触',
    progressMultiplier: 1.5,
    description: '曾接触异常物品，收容效率极高但不稳定。',
    passive: '3消+进度 | 4+随机效果 | 5+保底正面',
  },
};

/**
 * 计算一次消除的加权进度
 * @param colorCounts 每种颜色被消除的数量
 * @param comboLevel 当前 combo 等级
 * @returns 加权后的总进度点数
 */
export function calculateWeightedProgress(
  colorCounts: Record<string, number>,
  comboLevel: number
): number {
  let total = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    const bonus = COLOR_BONUSES[color as PieceColor];
    if (bonus) {
      total += count * bonus.progressMultiplier;
    }
  }

  // Combo 加成：combo 2=+10%, combo 3=+25%, combo 4=+50%, combo 5+=+100%
  if (comboLevel >= 5) total *= 2.0;
  else if (comboLevel >= 4) total *= 1.5;
  else if (comboLevel >= 3) total *= 1.25;
  else if (comboLevel >= 2) total *= 1.1;

  return Math.floor(total);
}

/**
 * 计算部署折损率
 * 基础折损率由安保等级决定，combo和绿色增益可降低
 */
export function calculateCasualtyRate(
  securityLevel: number,
  comboLevel: number,
  greenBuff: number, // 累积的绿色降低折损 buff (0~1)
): number {
  // 基础折损率: securityLevel * 0.15 (1级=15%, 5级=75%)
  let rate = securityLevel * 0.15;

  // 绿色增益降低
  rate *= (1 - greenBuff);

  // Combo 降低: combo 2=折损×0.8, combo 3=折损×0.5, combo 4+=免折损
  if (comboLevel >= 4) rate = 0;
  else if (comboLevel >= 3) rate *= 0.5;
  else if (comboLevel >= 2) rate *= 0.8;

  return Math.max(0, Math.min(1, rate));
}

/**
 * 计算每步消耗的库存人数（由安保等级决定）
 */
export function getStepCost(securityLevel: number): number {
  return securityLevel;
}

// ===== 工种被动效果系统 =====

export interface ColorPassiveResult {
  extraMoves: number;           // 蓝色：+1步
  redProgressBonus: number;     // 红色：额外进度加成（等于红色消除数量）
  breachChance: number;         // 红色：触发突破概率 (0~1)
  casualtyReduction: number;    // 绿色：折损率降低 (0~1)
  crossClear: boolean;          // 橙色：触发十字清除
  crossClearOrigin?: { row: number; col: number }; // 橙色十字清除中心点
  anomalyEffect: 'extra_moves' | 'lose_move' | 'mini_breach' | 'bonus_progress' | null; // 紫色随机
  passiveText: string | null;   // 浮动提示文案
}

const EMPTY_PASSIVE: ColorPassiveResult = {
  extraMoves: 0,
  redProgressBonus: 0,
  breachChance: 0,
  casualtyReduction: 0,
  crossClear: false,
  anomalyEffect: null,
  passiveText: null,
};

/**
 * 计算本次消除触发的工种被动效果
 * @param colorCounts 每种颜色被消除的数量
 */
export function calculateColorPassives(
  colorCounts: Record<string, number>
): ColorPassiveResult {
  const result: ColorPassiveResult = { ...EMPTY_PASSIVE };
  const passiveTexts: string[] = [];

  // 蓝色：消除4+回复1步
  const blueCount = colorCounts['blue'] || 0;
  if (blueCount >= 4) {
    result.extraMoves += 1;
    passiveTexts.push('🔧 +1步');
  }

  // 红色：4+消除时本次红色进度翻倍（危险接触带来更多收容数据）
  const redCount = colorCounts['red'] || 0;
  if (redCount >= 4) {
    result.redProgressBonus = redCount; // 额外增加等量红色进度
    passiveTexts.push('☢️ 危险数据×2');
  }

  // 绿色：任意匹配降低折损率5%
  const greenCount = colorCounts['green'] || 0;
  if (greenCount > 0) {
    result.casualtyReduction = 0.05 * Math.min(greenCount, 5);
    passiveTexts.push('🧬 折损↓');
  }

  // 橙色：消除4+触发十字清除
  const orangeCount = colorCounts['orange'] || 0;
  if (orangeCount >= 4) {
    result.crossClear = true;
    passiveTexts.push('⚙️ 十字清除!');
  }

  // 紫色：3消=安全进度加成, 4+=高风险随机, 5+=保底正面
  const purpleCount = colorCounts['purple'] || 0;
  if (purpleCount >= 5) {
    // 5+消除：保底正面效果
    const roll = Math.random();
    if (roll < 0.4) {
      result.anomalyEffect = 'extra_moves';
      result.extraMoves += 3;
      passiveTexts.push('🟪 异常共鸣+3步!');
    } else {
      result.anomalyEffect = 'bonus_progress';
      passiveTexts.push('🟪 异常共鸣+20进度!');
    }
  } else if (purpleCount >= 4) {
    // 4消除：高风险随机（含负面）
    const roll = Math.random();
    if (roll < 0.3) {
      result.anomalyEffect = 'extra_moves';
      result.extraMoves += 2;
      passiveTexts.push('🟪 +2步!');
    } else if (roll < 0.5) {
      result.anomalyEffect = 'lose_move';
      result.extraMoves -= 1;
      passiveTexts.push('🟪 -1步...');
    } else {
      result.anomalyEffect = 'bonus_progress';
      passiveTexts.push('🟪 +15进度!');
    }
  } else if (purpleCount > 0) {
    // 3消除：安全进度加成
    result.anomalyEffect = 'bonus_progress';
    passiveTexts.push('🟪 +10进度');
  }

  result.passiveText = passiveTexts.length > 0 ? passiveTexts.join(' | ') : null;
  return result;
}
