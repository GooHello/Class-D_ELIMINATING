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
    '出发了。',
    '报到。',
    '等等我。',
    '来了。',
    '知道了。',
    '走吧。',
  ],
  uncommon: [
    '又是我们……',
    '今天第几批了？',
    '希望这次能活着回来。',
    '听说上一组全没了。',
    '我刚来三天……',
    '能不能换个人？',
    '为什么总是D级？',
    '上次那个人回来了吗？',
    '我还以为只是打扫……',
    '老张昨天也是这么走的。',
    '你看那个东西了吗？别看。',
    '他们说是例行检查。',
    '我签的合同不是这么写的。',
    '这防护服有什么用？',
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
    '我妈不知道我在这。',
    '可以帮我带句话吗？',
    '我昨天刚写了一封信……',
    '外面是什么季节了？',
    '我进来之前是厨师。',
    '我儿子还在等我回去。',
    '能不能……至少告诉我里面是什么？',
  ],
  disturbing: [
    '……',
    '（沉默）',
    '（该资源单元未产生语音输出）',
    '谢谢。终于结束了。',
    '你和我们没什么不同。',
    '你知道这个系统也会消耗你的，对吧？',
    '操作员，你有编号吗？',
    '你觉得你点的是按钮？',
    '（微笑）',
    '你闻到了吗？',
    '上一个坐你那位置的人，后来也进来了。',
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
  '[通信已截断]',
  '（频率偏移，无法解析）',
];

const PHASE_BATCH_WORDS = [
  '[信息已过滤]',
  '[批次通信已禁用]',
  '[数据流中断]',
  '...',
  '——',
  '[已静默]',
];

// 根据概率和去人格化阶段获取遗言
// level参数用于早期关卡提升出现率
export function getLastWord(phase?: string, level?: number): string | null {
  // PHASE_VOID: 完全没有遗言
  if (phase === 'PHASE_VOID') return null;

  // PHASE_BATCH: 低概率输出过滤文本
  if (phase === 'PHASE_BATCH') {
    if (Math.random() < 0.7) return null; // 70% 沉默
    return PHASE_BATCH_WORDS[Math.floor(Math.random() * PHASE_BATCH_WORDS.length)];
  }

  // PHASE_NUMBER: 遗言变为乱码/归档
  if (phase === 'PHASE_NUMBER') {
    if (Math.random() < 0.4) return null; // 40% 沉默
    return PHASE_NUMBER_WORDS[Math.floor(Math.random() * PHASE_NUMBER_WORDS.length)];
  }

  // PHASE_HUMAN: 正常遗言
  // 早期关卡(1-5)几乎必定出现气泡，后续逐渐降低
  const silenceChance = level && level <= 5 ? 0.08 : 0.15;
  const roll = Math.random();
  if (roll < silenceChance) return null;
  if (roll < silenceChance + 0.30) return lastWords.common[Math.floor(Math.random() * lastWords.common.length)];
  if (roll < silenceChance + 0.55) return lastWords.uncommon[Math.floor(Math.random() * lastWords.uncommon.length)];
  if (roll < silenceChance + 0.75) return lastWords.rare[Math.floor(Math.random() * lastWords.rare.length)];
  return lastWords.disturbing[Math.floor(Math.random() * lastWords.disturbing.length)];
}

export function getWasteMessage(): string {
  return wasteMessages[Math.floor(Math.random() * wasteMessages.length)];
}