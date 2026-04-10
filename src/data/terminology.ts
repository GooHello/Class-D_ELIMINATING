/**
 * 去人格化术语系统
 * 随关卡推进，对D级人员的称呼从"人"逐渐退化为"资源"
 */

export type DehumanPhase = 'PHASE_HUMAN' | 'PHASE_NUMBER' | 'PHASE_BATCH' | 'PHASE_VOID';

export function getPhase(level: number): DehumanPhase {
  if (level <= 5) return 'PHASE_HUMAN';
  if (level <= 10) return 'PHASE_NUMBER';
  if (level <= 15) return 'PHASE_BATCH';
  return 'PHASE_VOID';
}

type TermKey = 'unit' | 'deploy' | 'death' | 'survive' | 'inventory' | 'unitCounter';

const TERM_MAP: Record<TermKey, Record<DehumanPhase, string>> = {
  unit: {
    PHASE_HUMAN: 'D级人员',
    PHASE_NUMBER: '编号单位',
    PHASE_BATCH: '耗材',
    PHASE_VOID: '资源',
  },
  deploy: {
    PHASE_HUMAN: '部署',
    PHASE_NUMBER: '调配',
    PHASE_BATCH: '投放',
    PHASE_VOID: '消耗',
  },
  death: {
    PHASE_HUMAN: '阵亡',
    PHASE_NUMBER: '损耗',
    PHASE_BATCH: '折旧',
    PHASE_VOID: 'Δ⁻',
  },
  survive: {
    PHASE_HUMAN: '存活',
    PHASE_NUMBER: '可回收',
    PHASE_BATCH: '残余',
    PHASE_VOID: 'Δ⁰',
  },
  inventory: {
    PHASE_HUMAN: 'D级库存',
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
