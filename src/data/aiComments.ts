/**
 * AI 效率分析系统 — 实时干预文案
 * 随关卡推进，AI 从"建议"变成"命令"
 */

export interface AIComment {
  text: string;
  /** 最低触发关卡 */
  minLevel: number;
  /** 触发条件类型 */
  trigger: 'after_match' | 'hesitation' | 'low_efficiency' | 'high_efficiency' | 'idle' | 'skill_used';
  /** 触发概率 (0~1) */
  chance: number;
}

// ===== 消除后的 AI 评语 =====
export const AI_COMMENTS: AIComment[] = [
  // 早期：温和的建议
  { text: '💡 建议：优先消除推荐工种可提升效率。', trigger: 'after_match', minLevel: 3, chance: 0.08 },
  { text: '📊 本步效率：中等。参考值：高。', trigger: 'after_match', minLevel: 5, chance: 0.06 },
  { text: '📋 系统提示：当前折损率偏高，建议调整操作策略。', trigger: 'after_match', minLevel: 6, chance: 0.07 },

  // 中期：开始带有评判
  { text: '⚡ 效率分析：该操作未达到推荐阈值。', trigger: 'after_match', minLevel: 8, chance: 0.10 },
  { text: '📈 提示：连锁消除可显著提升资源利用率。您似乎尚未充分利用此机制。', trigger: 'after_match', minLevel: 9, chance: 0.08 },
  { text: '🔍 行为分析：操作模式出现偏差。建议重新校准。', trigger: 'after_match', minLevel: 10, chance: 0.10 },
  { text: '⚠ 注意：您的操作效率低于本站平均水平 12%。', trigger: 'low_efficiency', minLevel: 8, chance: 0.15 },

  // 后期：命令式
  { text: '⚠ 系统指令：加快操作节奏。当前速度不可接受。', trigger: 'after_match', minLevel: 13, chance: 0.12 },
  { text: '🤖 AI-HRMS：建议减少不必要的决策时间。决策应在 1.5 秒内完成。', trigger: 'hesitation', minLevel: 12, chance: 0.25 },
  { text: '📊 效率报告：您的犹豫行为已累计 ██ 次。此数据将影响年终评估。', trigger: 'hesitation', minLevel: 14, chance: 0.30 },
  { text: '🔴 警告：操作间隔超出容许范围。已启动效率监控协议。', trigger: 'idle', minLevel: 15, chance: 0.35 },

  // 终章：完全独裁
  { text: '🤖 AI-HRMS v4.0：您的决策与系统推荐的偏差率为 ██%。建议服从系统建议。', trigger: 'after_match', minLevel: 16, chance: 0.15 },
  { text: '⚠ 自动评估：该操作被标记为"次优解"。已记录。', trigger: 'after_match', minLevel: 17, chance: 0.18 },
  { text: '🔴 系统覆盖：您的操作权限将在本工单结束后进入复审。', trigger: 'low_efficiency', minLevel: 18, chance: 0.25 },
  { text: '🤖 提醒：人类操作员的存在是过渡性安排。请珍惜剩余的工作机会。', trigger: 'after_match', minLevel: 19, chance: 0.20 },
  { text: '⚙ 系统通知：AI 已为您预计算了最优路径。偏离将被记录。', trigger: 'after_match', minLevel: 20, chance: 0.25 },

  // 高效时的"表扬"——但表扬方式令人不安
  { text: '✅ 效率评估：优秀。您的操作模式与 AI 基准高度一致。', trigger: 'high_efficiency', minLevel: 8, chance: 0.15 },
  { text: '✅ 系统评价：该操作的效率评分为 S。继续保持——或者说，继续服从。', trigger: 'high_efficiency', minLevel: 14, chance: 0.20 },
  { text: '✅ AI-HRMS：出色。您越来越像我们了。', trigger: 'high_efficiency', minLevel: 18, chance: 0.30 },

  // 使用技能时
  { text: '📋 行为记录：操作员使用了主动干预技能。已标记为"非标准操作"。', trigger: 'skill_used', minLevel: 10, chance: 0.20 },
  { text: '⚠ 系统提示：频繁使用技能可能表明操作员难以独立完成标准作业。', trigger: 'skill_used', minLevel: 14, chance: 0.30 },
  { text: '🔴 AI评估：技能使用频率超出预期。建议接受辅助培训（含记忆优化）。', trigger: 'skill_used', minLevel: 18, chance: 0.35 },
];

/**
 * 根据当前关卡和触发条件获取一条 AI 评语
 */
export function getAIComment(level: number, trigger: AIComment['trigger']): string | null {
  const eligible = AI_COMMENTS.filter(c => c.trigger === trigger && level >= c.minLevel);
  if (eligible.length === 0) return null;

  // 从符合条件的评语中按概率抽取
  for (const comment of eligible) {
    if (Math.random() < comment.chance) {
      return comment.text;
    }
  }
  return null;
}
