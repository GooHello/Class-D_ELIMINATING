// 消除时的"遗言"气泡 —— 让玩家意识到这些是人
// 按频率分级：common > uncommon > rare > disturbing
export const lastWords = {
  common: [
    '收到，长官。',
    '是。',
    '明白。',
    '遵命。',
    '好的。',
    '了解。',
  ],
  uncommon: [
    '又是我们……',
    '今天第几批了？',
    '希望这次能活着回来。',
    '听说上一组全没了。',
    '我刚来三天……',
    '能不能换个人？',
    '为什么总是D级？',
  ],
  rare: [
    '我还没给家里打电话……',
    '我不想——',
    '等一下，我还没准备好——',
    '拜托了，让我打个电话……',
    '我女儿下周生日……',
    '有人记得我的名字吗？',
    '我以前是老师……',
    '我叫……算了，没人在乎。',
  ],
  disturbing: [
    '……',
    '（沉默）',
    '（该资源单元未产生语音输出）',
    '谢谢。终于结束了。',
    '你和我们没什么不同。',
    '你知道这个系统也会消耗你的，对吧？',
    '操作员，你有编号吗？',
  ],
};

// 非目标消除时的系统提示
export const wasteMessages = [
  '⚠ 非必要资源消耗，已计入浪费报告',
  '⚠ 该工种不在本次工单需求内',
  '⚠ 过度消耗将影响月度效率评级',
  '⚠ 提醒：请优先消耗指定工种',
  '⚠ 资源浪费已记录至操作员档案',
];

// 去人格化阶段的遗言过滤
const PHASE_NUMBER_WORDS = [
  '[语音数据已归档]',
  '编号……我的编号是……',
  '（信号质量不足，转录失败）',
  '请求……请求确认……',
  '#####',
  '单位报告：无异常。',
];

const PHASE_BATCH_WORDS = [
  '[信息已过滤]',
  '[批次通信已禁用]',
  '[数据流中断]',
  '...',
  '——',
];

// 根据概率和去人格化阶段获取遗言
export function getLastWord(phase?: string): string | null {
  // PHASE_VOID: 完全没有遗言
  if (phase === 'PHASE_VOID') return null;

  // PHASE_BATCH: 低概率输出过滤文本
  if (phase === 'PHASE_BATCH') {
    if (Math.random() < 0.8) return null; // 80% 沉默
    return PHASE_BATCH_WORDS[Math.floor(Math.random() * PHASE_BATCH_WORDS.length)];
  }

  // PHASE_NUMBER: 遗言变为乱码/归档
  if (phase === 'PHASE_NUMBER') {
    if (Math.random() < 0.5) return null; // 50% 沉默
    return PHASE_NUMBER_WORDS[Math.floor(Math.random() * PHASE_NUMBER_WORDS.length)];
  }

  // PHASE_HUMAN: 正常遗言
  const roll = Math.random();
  if (roll < 0.30) return null; // 30% no words
  if (roll < 0.60) return lastWords.common[Math.floor(Math.random() * lastWords.common.length)];
  if (roll < 0.80) return lastWords.uncommon[Math.floor(Math.random() * lastWords.uncommon.length)];
  if (roll < 0.95) return lastWords.rare[Math.floor(Math.random() * lastWords.rare.length)];
  return lastWords.disturbing[Math.floor(Math.random() * lastWords.disturbing.length)];
}

export function getWasteMessage(): string {
  return wasteMessages[Math.floor(Math.random() * wasteMessages.length)];
}