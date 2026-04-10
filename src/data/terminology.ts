/**
 * 去人格化术语系统
 * 随关卡推进，对D级人员的称呼从"人"逐渐退化为"资源"
 *
 * 核心设计原则：
 * PHASE_HUMAN（1-5关）：完全无害的办公用语，玩家不应感受到暴力
 * PHASE_NUMBER（6-10关）：开始出现"冰冷"但仍合理的管理术语
 * PHASE_BATCH（11-15关）：工业化用语，人已经变成物品
 * PHASE_VOID（16-20关）：数学符号，连词汇都被抽象掉了
 */

export type DehumanPhase = 'PHASE_HUMAN' | 'PHASE_NUMBER' | 'PHASE_BATCH' | 'PHASE_VOID';

export function getPhase(level: number): DehumanPhase {
  if (level <= 5) return 'PHASE_HUMAN';
  if (level <= 10) return 'PHASE_NUMBER';
  if (level <= 15) return 'PHASE_BATCH';
  return 'PHASE_VOID';
}

type TermKey =
  | 'unit' | 'deploy' | 'death' | 'survive' | 'inventory' | 'unitCounter'
  | 'casualtyRate' | 'casualtyLabel' | 'netLoss' | 'dailyConsumed' | 'totalConsumed'
  | 'quotaLabel' | 'kpiRatingLabel' | 'deathCauseLabel' | 'estimateLoss'
  | 'estimateCasualty' | 'postDeployInventory' | 'reportTitle' | 'disclaimer'
  | 'missionComplete' | 'missionFailed' | 'emergencyRecruit';

const TERM_MAP: Record<TermKey, Record<DehumanPhase, string>> = {
  unit: {
    PHASE_HUMAN: '志愿者',
    PHASE_NUMBER: '编号单位',
    PHASE_BATCH: '耗材',
    PHASE_VOID: '资源',
  },
  deploy: {
    PHASE_HUMAN: '派遣',
    PHASE_NUMBER: '调配',
    PHASE_BATCH: '投放',
    PHASE_VOID: '消耗',
  },
  death: {
    PHASE_HUMAN: '未返回',
    PHASE_NUMBER: '损耗',
    PHASE_BATCH: '折旧',
    PHASE_VOID: 'Δ⁻',
  },
  survive: {
    PHASE_HUMAN: '已返回',
    PHASE_NUMBER: '可回收',
    PHASE_BATCH: '残余',
    PHASE_VOID: 'Δ⁰',
  },
  inventory: {
    PHASE_HUMAN: '可用人员',
    PHASE_NUMBER: '单位储备',
    PHASE_BATCH: '耗材库',
    PHASE_VOID: 'Σ',
  },
  unitCounter: {
    PHASE_HUMAN: '人',
    PHASE_NUMBER: '单位',
    PHASE_BATCH: '件',
    PHASE_VOID: '',
  },
  casualtyRate: {
    PHASE_HUMAN: '未返回率',
    PHASE_NUMBER: '损耗率',
    PHASE_BATCH: '折旧率',
    PHASE_VOID: 'Δ⁻/Σ',
  },
  casualtyLabel: {
    PHASE_HUMAN: '未返回',
    PHASE_NUMBER: '损耗',
    PHASE_BATCH: '折损',
    PHASE_VOID: 'Δ⁻',
  },
  netLoss: {
    PHASE_HUMAN: '净未归',
    PHASE_NUMBER: '净损耗',
    PHASE_BATCH: '净折旧',
    PHASE_VOID: 'Σ⁻',
  },
  dailyConsumed: {
    PHASE_HUMAN: '今日参与',
    PHASE_NUMBER: '今日调用',
    PHASE_BATCH: '今日折旧',
    PHASE_VOID: 'Δd',
  },
  totalConsumed: {
    PHASE_HUMAN: '累计参与',
    PHASE_NUMBER: '累计调用',
    PHASE_BATCH: '累计折旧',
    PHASE_VOID: 'ΣΔ',
  },
  quotaLabel: {
    PHASE_HUMAN: '月度工作指标',
    PHASE_NUMBER: '月度调用指标',
    PHASE_BATCH: '月度折旧指标',
    PHASE_VOID: 'Q/Σ',
  },
  kpiRatingLabel: {
    PHASE_HUMAN: '工作评价',
    PHASE_NUMBER: '效率评级',
    PHASE_BATCH: '产出评级',
    PHASE_VOID: 'η',
  },
  deathCauseLabel: {
    PHASE_HUMAN: '未返回原因',
    PHASE_NUMBER: '损耗原因',
    PHASE_BATCH: '折旧原因',
    PHASE_VOID: 'cause',
  },
  estimateLoss: {
    PHASE_HUMAN: '预估风险',
    PHASE_NUMBER: '预估损耗率',
    PHASE_BATCH: '预估折损率',
    PHASE_VOID: 'est.Δ⁻',
  },
  estimateCasualty: {
    PHASE_HUMAN: '预估情况',
    PHASE_NUMBER: '预估损耗',
    PHASE_BATCH: '预估折损',
    PHASE_VOID: 'est.n',
  },
  postDeployInventory: {
    PHASE_HUMAN: '派遣后剩余',
    PHASE_NUMBER: '调配后剩余',
    PHASE_BATCH: '投放后库存',
    PHASE_VOID: 'Σ\'',
  },
  reportTitle: {
    PHASE_HUMAN: 'SCP基金会实验报告',
    PHASE_NUMBER: 'SCP基金会运营报告',
    PHASE_BATCH: '资源处置结算单',
    PHASE_VOID: 'RPT.AUTO',
  },
  disclaimer: {
    PHASE_HUMAN: '本报告仅供内部存档。如有疑问请联系您的主管。',
    PHASE_NUMBER: '本报告中所有术语均为标准化运营用语。',
    PHASE_BATCH: '免责声明：本报告中"折损""减值"等术语均为标准化运营用语，不暗示或代表任何主观价值判断。',
    PHASE_VOID: '[AUTO-GENERATED. NO HUMAN REVIEW REQUIRED.]',
  },
  missionComplete: {
    PHASE_HUMAN: '实验完成',
    PHASE_NUMBER: '工单完成',
    PHASE_BATCH: '处置完成',
    PHASE_VOID: 'DONE',
  },
  missionFailed: {
    PHASE_HUMAN: '实验未完成',
    PHASE_NUMBER: '工单未达标',
    PHASE_BATCH: '处置失败',
    PHASE_VOID: 'FAIL',
  },
  emergencyRecruit: {
    PHASE_HUMAN: '申请增援',
    PHASE_NUMBER: '紧急调配',
    PHASE_BATCH: '紧急征召',
    PHASE_VOID: 'FORCE_ALLOC',
  },
};

export function getTerm(key: TermKey, phase: DehumanPhase): string {
  return TERM_MAP[key]?.[phase] ?? key;
}

/** 获取阶段转换时的系统通知文案 */
export function getPhaseTransitionNotice(phase: DehumanPhase): string | null {
  switch (phase) {
    case 'PHASE_NUMBER':
      return '📋 人事通知：根据基金会人事政策 HR-2024-██，自本日起人员档案系统将进行信息精简优化。个人信息字段已归档处理。';
    case 'PHASE_BATCH':
      return '📋 系统通知：为提升运营效率，人员管理系统已升级为批次化管理模式。个体编号已合并为批次编号。';
    case 'PHASE_VOID':
      return '📋 自动通知：人员档案模块已被资源管理模块替代。历史数据已迁移至冷存储。感谢您的理解与配合。';
    default:
      return null;
  }
}

/** 根据Phase返回combo提示文案（前期不暴露暴力） */
export function getComboText(combo: number, phase: DehumanPhase): string {
  if (phase === 'PHASE_HUMAN') {
    const texts = ['', '', '协同良好', '配合默契!', '高效协作!', '🏅 完美配合!'];
    return texts[Math.min(combo, texts.length - 1)] || `${combo}连携!`;
  }
  if (phase === 'PHASE_NUMBER') {
    const texts = ['', '', '效率++', '高效处置!', '卓越表现!', '🏅 极致效率!'];
    return texts[Math.min(combo, texts.length - 1)] || `${combo}x combo`;
  }
  if (phase === 'PHASE_BATCH') {
    const texts = ['', '', '效率++ 折损↓', '高效处置! 折损率×0.8', '卓越表现! 折损率×0.5', '🏅 人海战术! 免折损'];
    return texts[Math.min(combo, texts.length - 1)] || `${combo}x`;
  }
  // PHASE_VOID
  return combo >= 2 ? `×${combo}` : '';
}

/** 根据Phase返回战报条目的语气 */
export function getLogTone(phase: DehumanPhase, type: 'match' | 'death' | 'survive'): { prefix: string; color: string } {
  if (phase === 'PHASE_HUMAN') {
    return {
      match: { prefix: '测试', color: '#86909c' },
      death: { prefix: '未返回', color: '#86909c' },
      survive: { prefix: '已返回', color: '#86909c' },
    }[type];
  }
  if (phase === 'PHASE_NUMBER') {
    return {
      match: { prefix: '处理', color: '#86909c' },
      death: { prefix: '损耗', color: '#c9823a' },
      survive: { prefix: '回收', color: '#5b8f5b' },
    }[type];
  }
  if (phase === 'PHASE_BATCH') {
    return {
      match: { prefix: '处置', color: '#86909c' },
      death: { prefix: '折旧', color: '#f53f3f' },
      survive: { prefix: '残余', color: '#00b42a' },
    }[type];
  }
  // VOID
  return {
    match: { prefix: 'PROC', color: '#4e5969' },
    death: { prefix: 'Δ⁻', color: '#f53f3f' },
    survive: { prefix: 'Δ⁰', color: '#00b42a' },
  }[type];
}
