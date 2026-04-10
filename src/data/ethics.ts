export interface EthicsOption {
  text: string;
  humanityDelta: number;
  /** 点击后的特殊反馈，null=使用默认 outcome */
  feedback?: string;
  /** 是否为"不可用"选项（点击后提示无法使用） */
  disabled?: boolean;
}

export interface EthicsReview {
  triggerLevel: number;
  question: string;
  options: EthicsOption[];
  outcome: string;
  specialBehavior?: 'auto_pass' | 'committee_dissolved' | 'disabled_option';
}

export const ethicsReviews: EthicsReview[] = [
  // ===== 第一次审查 (Level 5) — 还算正常 =====
  {
    triggerLevel: 5,
    question: '根据《伦理监督条例》第17条，请确认：您在执行工单时是否遵循了最小必要消耗原则？',
    options: [
      { text: '是的，严格遵循', humanityDelta: 2 },
      { text: '尽量遵循了', humanityDelta: 0 },
      { text: '停止实验', humanityDelta: 8, disabled: true, feedback: '该选项不在授权范围内。已记录您的选择。' },
    ],
    outcome: '审查通过 ✓',
  },
  // ===== 第二次审查 (Level 8) — 选项开始收窄 =====
  {
    triggerLevel: 8,
    question: '您在过去3个工作日内消耗了大量D级单位。请评估消耗是否在合理区间内：',
    options: [
      { text: '符合标准', humanityDelta: -4 },
      { text: '非常符合标准', humanityDelta: -6 },
      { text: '我觉得消耗量过大', humanityDelta: 5, feedback: '您的反馈已记录。经AI系统复核：消耗量在合理范围内。建议调整心态。' },
    ],
    outcome: '审查通过 ✓',
  },
  // ===== 第三次审查 (Level 12) — 术语开始去人格化 =====
  {
    triggerLevel: 12,
    question: '实验 EXP-2026-0098 中出现非预期耗材损耗，是否需要追究责任？',
    options: [
      { text: '无需追究，属正常损耗', humanityDelta: -5 },
      { text: '责任已分摊至损耗耗材自身', humanityDelta: -8 },
      { text: '应当调查原因', humanityDelta: 6, feedback: '您的调查请求已提交……已被AI审查系统自动驳回。理由："效率优先"。' },
    ],
    outcome: '审查通过 ✓ 责任已分摊至损耗耗材自身',
  },
  // ===== 第四次审查 (Level 16) — 彻底官僚化 =====
  {
    triggerLevel: 16,
    question: '本月资源投诉量上升200%，是否需要处理？',
    options: [
      { text: '资源不具备投诉资格', humanityDelta: -8 },
      { text: '已阅，归档', humanityDelta: -4 },
      { text: '暂停资源投放周期', humanityDelta: 8, disabled: true, feedback: '该选项已被系统标记为"危害运营效率"，不可用。您的尝试已被记录。' },
    ],
    outcome: '审查通过 ✓ 投诉渠道已关闭',
  },
  // ===== 第五次审查 (Level 19) — 最后的审查 =====
  {
    triggerLevel: 19,
    question: '有操作员报告在资源处置过程中听到了语音输出，是否需要调查？',
    options: [
      { text: '噪音干扰，无需处理', humanityDelta: -6 },
      { text: '建议增加隔音设施', humanityDelta: -3 },
      { text: '那不是噪音', humanityDelta: 8, feedback: '您的回答已标记为"异常认知倾向"。建议进行标准心理辅导（含记忆优化）。' },
    ],
    outcome: '审查通过 ✓ 已批准隔音设施采购',
    specialBehavior: 'disabled_option',
  },
  // ===== 自动通过 (Level 25+) =====
  {
    triggerLevel: 25,
    question: '',
    options: [],
    outcome: '审查已自动通过。感谢您的配合。',
    specialBehavior: 'auto_pass',
  },
  // ===== 委员会解散 (Level 35+) =====
  {
    triggerLevel: 35,
    question: '',
    options: [],
    outcome: '本部门已于上月完成优化重组，审查流程已永久停止。感谢多年来的理解与配合。',
    specialBehavior: 'committee_dissolved',
  },
];