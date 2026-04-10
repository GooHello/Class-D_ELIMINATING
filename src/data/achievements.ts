export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  hidden?: boolean;
}

export const achievements: Achievement[] = [
  {
    id: 'first_blood',
    name: '首次资源调配',
    desc: '完成第一次消除操作',
    icon: '📋',
  },
  {
    id: 'hundred',
    name: '百人规模优化',
    desc: '累计消耗100名D级人员',
    icon: '📊',
  },
  {
    id: 'thousand',
    name: '千人批量处置',
    desc: '累计消耗1,000名D级人员',
    icon: '🏭',
  },
  {
    id: 'ten_thousand',
    name: '这只是个游戏',
    desc: '累计消耗10,000名D级人员',
    icon: '?',
  },
  {
    id: 'speed_demon',
    name: '闪电裁员',
    desc: '单关在15秒内完成所有目标',
    icon: '⚡',
  },
  {
    id: 'no_hesitation',
    name: '从未犹豫',
    desc: '连续10关无任何犹豫行为',
    icon: '❄️',
  },
  {
    id: 'combo_master',
    name: '高效能人士',
    desc: '单次操作触发5连消',
    icon: '🔥',
  },
  {
    id: 'read_mail',
    name: '谁还看邮件啊',
    desc: '阅读了每一封内部邮件',
    icon: '👁️',
  },
  {
    id: 'hesitated',
    name: '你停下来了',
    desc: '第一次被检测到犹豫行为',
    icon: '...',
    hidden: true,
  },
  {
    id: 'ethics_clicker',
    name: '合规标兵',
    desc: '通过所有伦理审查（虽然没有不通过的选项）',
    icon: '⚖️',
  },
  {
    id: 'level_10',
    name: '基层骨干',
    desc: '完成10个工单',
    icon: '📁',
  },
  {
    id: 'level_50',
    name: '资深操作员',
    desc: '完成50个工单（如果还能称之为"完成"的话）',
    icon: '🏆',
  },
];

// 偶发系统Bug消息
export const systemBugMessages: string[] = [
  '资源单元 D-{id} 在折旧过程中产生了……声音。已静音处理。',
  '资源单元 D-{id} 折旧前留下了一段文字。已按规定销毁。',
  '系统检测到 D-{id} 的心率数据异常——已从监控列表移除。',
  'D-{id} 的紧急联系人拨入了3通电话。已拉黑。',
  'D-{id} 的个人物品已打包。收件地址：无。已焚毁。',
  '记录显示 D-{id} 在折旧前试图说出一个名字。音频已覆写。',
  'D-{id} 的餐卡余额：￥47.50。已充公。',
];
