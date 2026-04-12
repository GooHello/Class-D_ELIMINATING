// ===== 丰富的D级人员档案生成系统 =====
// 基金会是全球性组织，人员来源覆盖全世界

// ---- 中文名池 ----
const CN_SURNAMES = [
  '张','李','王','刘','陈','杨','黄','赵','周','吴','徐','孙','马','朱','胡',
  '郭','何','罗','梁','宋','郑','谢','韩','唐','冯','于','董','萧','程','曹',
  '田','袁','邓','许','傅','沈','曾','彭','吕','苏','卢','蒋','蔡','贾','丁',
];
const CN_GIVEN = [
  '伟','芳','娜','秀英','敏','静','强','磊','洋','勇','军','杰','娟','艳',
  '丽','涛','明','超','秀兰','霞','平','刚','桂英','凤','文','辉','浩','建华',
  '子轩','梓涵','一诺','浩然','思远','雨萱','欣怡','子墨','博文','晨曦',
];

// ---- 英语名池 ----
const EN_FIRST = [
  'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda',
  'William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica',
  'Thomas','Sarah','Charles','Karen','Daniel','Lisa','Matthew','Nancy',
  'Anthony','Betty','Mark','Margaret','Donald','Sandra','Steven','Ashley',
  'Andrew','Dorothy','Joshua','Kimberly','Kenneth','Emily','Kevin','Donna',
];
const EN_LAST = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson',
  'Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson',
  'White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker',
];

// ---- 日韩名池 ----
const JP_LAST = ['田中','佐藤','鈴木','高橋','渡辺','伊藤','山本','中村','小林','加藤','吉田','山田','松本','井上','木村'];
const JP_FIRST = ['太郎','花子','翔','美咲','蓮','陽菜','大翔','結衣','悠人','凛','健太','遥','拓海','七海','直樹'];
const KR_LAST = ['김','이','박','정','최','조','강','윤','장','임','한','오','서','신','권'];
const KR_FIRST = ['민준','서연','도윤','하은','시우','지유','준서','서윤','예준','하윤','지호','수아','건우','지안','현우'];

// ---- 俄语名池 ----
const RU_FIRST = ['Иван','Дмитрий','Алексей','Сергей','Андрей','Николай','Михаил','Владимир','Анна','Мария','Ольга','Елена','Наталья','Екатерина','Татьяна'];
const RU_LAST = ['Иванов','Петров','Сидоров','Козлов','Новиков','Морозов','Волков','Соколов','Лебедев','Попов','Кузнецов','Федоров','Смирнов','Васильев','Павлов'];

// ---- 西班牙/葡萄牙名池 ----
const ES_FIRST = ['José','María','Carlos','Ana','Juan','Carmen','Pedro','Isabel','Miguel','Rosa','Luis','Elena','Francisco','Lucía','Diego'];
const ES_LAST = ['García','Rodríguez','Martínez','López','González','Hernández','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez','Díaz','Cruz'];

// ---- 阿拉伯名池 ----
const AR_FIRST = ['محمد','أحمد','علي','فاطمة','عائشة','خديجة','عمر','حسن','يوسف','ليلى','سارة','إبراهيم','خالد','نور','مريم'];
const AR_LAST = ['الأحمد','المحمد','العلي','الحسن','الخالد','الصالح','الرشيد','العبدالله','الناصر','القاسم'];

// ---- 德语名池 ----
const DE_FIRST = ['Hans','Klaus','Jürgen','Helga','Ingrid','Greta','Wolfgang','Heinrich','Friedrich','Ursula','Erika','Dieter','Manfred','Petra','Brigitte'];
const DE_LAST = ['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter','Wolf','Schröder','Neumann'];

// ---- 名字生成器 ----
type NameGenFn = () => string;
const NAME_GENERATORS: { weight: number; gen: NameGenFn }[] = [
  { weight: 0.35, gen: () => CN_SURNAMES[r(CN_SURNAMES.length)] + CN_GIVEN[r(CN_GIVEN.length)] },
  { weight: 0.20, gen: () => EN_FIRST[r(EN_FIRST.length)] + ' ' + EN_LAST[r(EN_LAST.length)] },
  { weight: 0.10, gen: () => JP_LAST[r(JP_LAST.length)] + ' ' + JP_FIRST[r(JP_FIRST.length)] },
  { weight: 0.08, gen: () => KR_LAST[r(KR_LAST.length)] + KR_FIRST[r(KR_FIRST.length)] },
  { weight: 0.08, gen: () => RU_FIRST[r(RU_FIRST.length)] + ' ' + RU_LAST[r(RU_LAST.length)] },
  { weight: 0.08, gen: () => ES_FIRST[r(ES_FIRST.length)] + ' ' + ES_LAST[r(ES_LAST.length)] },
  { weight: 0.05, gen: () => AR_FIRST[r(AR_FIRST.length)] + ' ' + AR_LAST[r(AR_LAST.length)] },
  { weight: 0.06, gen: () => DE_FIRST[r(DE_FIRST.length)] + ' ' + DE_LAST[r(DE_LAST.length)] },
];

function r(max: number) { return Math.floor(Math.random() * max); }

function generateName(): string {
  const roll = Math.random();
  let cum = 0;
  for (const ng of NAME_GENERATORS) {
    cum += ng.weight;
    if (roll <= cum) return ng.gen();
  }
  return NAME_GENERATORS[0].gen();
}

const AGES_WEIGHTS = [
  { min: 18, max: 25, weight: 0.25 },
  { min: 26, max: 35, weight: 0.35 },
  { min: 36, max: 50, weight: 0.25 },
  { min: 51, max: 65, weight: 0.12 },
  { min: 16, max: 17, weight: 0.03 },
];

// 前职业 + 入库原因（大幅扩充版）
const PROFESSION_ENTRIES = [
  { job: '外卖骑手', reason: '平台算法优化后失业，无力偿还贷款，因盗窃被捕后转化' },
  { job: '初中英语教师', reason: 'AI教学系统全面替代后遭裁撤，多次上访后被"自愿"签署转化协议' },
  { job: '游戏策划', reason: '被AI生成工具取代，失业后在论坛发表基金会相关猜测，被回收' },
  { job: '放射科医生', reason: 'AI诊断替代后转岗失败，接触SCP-███后被收容' },
  { job: '卡车司机', reason: '自动驾驶普及后失业，被招募为"高薪物流测试员"' },
  { job: '会计', reason: '财务AI接管后裁员，因伪造简历入职基金会前台公司，背景审查后转化' },
  { job: 'Prompt Engineer', reason: 'AI不再需要提示词后失业，在社交媒体讨论异常现象，被标记' },
  { job: '翻译', reason: '2024年即已被替代，长期失业后参加"语言研究项目"实为D级招募' },
  { job: '插画师', reason: '图像生成AI普及后失业，因绘制疑似SCP-085的同人图被基金会注意' },
  { job: '客服', reason: '对话AI替代后被辞退，应聘"电话测试员"进入基金会' },
  { job: '新闻记者', reason: '自动撰稿系统上线后裁员，试图调查基金会异常事件被逮捕' },
  { job: '股票交易员', reason: '量化AI完全替代后破产，被债权人出售给基金会关联机构' },
  { job: '药剂师', reason: '智能配药系统替代后失业，在黑市售药时被基金会特工截获' },
  { job: '法务助理', reason: '法律AI替代后无法就业，因非法获取基金会文件被捕' },
  { job: '大学教授', reason: 'AI课程替代后学校缩编，因公开质疑基金会伦理被重新分类' },
  { job: '程序员', reason: 'AI编程工具替代后失业，接触了一段异常代码，被回收' },
  { job: 'UI设计师', reason: 'AI设计工具替代后裁员，在前公司服务器中发现异常数据' },
  { job: '建筑设计师', reason: 'AI建模替代后失业，参与修缮基金会前台物业时目击异常' },
  { job: '快递员', reason: '无人配送替代后失业，意外签收了一个异常包裹' },
  { job: '收银员', reason: '无人零售替代后失业，在便利店值夜班时经历了SCP-3008事件' },
  { job: '驾校教练', reason: '自动驾驶无需学车后失业，被招募为"特殊车辆测试员"' },
  { job: '心理咨询师', reason: 'AI心理辅导替代后——讽刺的是，这里的心理辅导=记忆删除' },
  { job: '数据标注员', reason: 'AI自监督学习后不再需要，"被优化"进入D级人才池' },
  { job: '外科医生', reason: '手术机器人全面替代后转行失败，在灰色市场做手术被捕' },
  { job: '出租车司机', reason: '网约车→自动驾驶双重替代，因路怒伤人获刑后转化' },
  { job: '银行柜员', reason: '网点撤并后裁员，在地下钱庄工作时被基金会钓鱼执法' },
  { job: '图书管理员', reason: 'AI检索系统替代后失业，在一本异常书籍中看到了不该看的内容' },
  { job: '导游', reason: 'AR导览替代后失业，带非法团进入基金会伪装景区后被捕' },
  { job: '保安', reason: '智能安防系统替代后失业，被雇为基金会外围保安后"升级"' },
  { job: '仓库管理员', reason: '智能物流机器人替代后，在最后一个工作日打开了错误的箱子' },
  { job: '电话销售', reason: 'AI外呼系统替代后失业，被基金会电话招募时以为是诈骗' },
  { job: '影视编剧', reason: 'AI剧本生成替代后裁员，写了一个太过"真实"的SCP剧本' },
  { job: '配音演员', reason: 'AI语音合成替代后失业，声纹与SCP-████记录匹配' },
  { job: '摄影师', reason: 'AI图像生成替代后失业，拍到了不存在的第14张照片' },
  { job: '作曲家', reason: 'AI音乐生成替代后失业，谱写的最后一首曲子引发模因反应' },
  { job: '网约车司机', reason: '自动驾驶L5普及后失业，载过一名事后确认为SCP-████的乘客' },
  { job: '基金会伦理委员会前成员', reason: '提出异议后被重新分类为D级。档案编号：[已编辑]' },
  { job: '本平台前任操作员', reason: '效率不达标后被重新分类。请引以为戒。' },
  { job: '高速收费员', reason: 'ETC+自动驾驶后撤站，在最后一天收到了一枚异常硬币' },
  { job: '哲学教授', reason: '被认为"无实际产出"后裁撤，在课堂上讨论了认知危害概念' },
  { job: '消防员', reason: '因参与SCP-████收容失败事件中的救援行动，被实施B级记忆删除后转化' },
  { job: '网红/主播', reason: '在直播中无意拍摄到异常实体，视频被删除，本人被回收' },
  { job: '快递站站长', reason: '管理的站点成为SCP-████的临时收容地点，知情过多' },
  { job: '幼儿园教师', reason: '所在幼儿园被确认为SCP-████影响范围，全体教职工转化' },
  { job: '公务员', reason: '在处理户籍档案时发现了不存在的人口记录，追查后被注意到' },
  { job: '空姐', reason: '在航班上服务了一名现已确认为SCP-████的乘客，被隔离后转化' },
  { job: '厨师', reason: '为基金会站点食堂做饭时，在冷库里看到了不该看到的东西' },
  { job: '不详', reason: '档案损坏。指纹/虹膜/DNA数据均无匹配。此人可能本不存在。' },
  { job: '[数据删除]', reason: '[数据删除]。访问此记录需要4级权限。' },
  { job: '高中生', reason: '因父母均被分类为D级，监护权转移至基金会。年龄: 17' },
  { job: '无业', reason: '出生即被基金会标记。理由：██████████。从未拥有正常生活。' },
  // 国际化条目
  { job: '自由撰稿人', reason: '试图在伦敦发表关于异常事件的文章，被基金会特工拦截' },
  { job: '退役军人', reason: '在海外部署期间目击SCP-████，退役后被重新分类' },
  { job: '网约车司机', reason: '搭载了一名在任何数据库中都不存在的乘客，车辆被隔离' },
  { job: '仓库分拣员', reason: '打开了编号████████的包裹，内容物未知，24小时内被重新分类' },
  { job: '护士', reason: '护理了一名表现出异常再生能力的患者。患者逃脱。护士没有。' },
  { job: '科研人员', reason: '在野外调查异常信号时被GOC重新定向，后被基金会回收' },
  { job: '渔民', reason: '在湖中捕获疑似SCP-████的异常生物，目击者已处理，本人被重新分类' },
  { job: '土木工程师', reason: '在城市地下发现一处不可能存在的结构，汇报后被重新分类' },
  { job: '渔夫', reason: '在近海捕获了疑似异常生物，被基金会拘束并转化' },
  { job: '街头小贩', reason: '向一名特工出售了一杯表现出异常特性的饮品，被重新分类' },
];

// 人性化细节（随机附加）
const PERSONAL_DETAILS = [
  '手机锁屏是一只橘猫的照片',
  '入库时随身携带了一本写了一半的日记',
  '左手无名指有戒指压痕',
  '反复问工作人员"我什么时候能走"',
  '每天早上5点准时醒来，习惯性地穿外卖骑手服',
  '口袋里有一张过期的全家福照片',
  '会弹吉他，有时在牢房里哼歌',
  '对花粉过敏——这在SCP-610实验中被记为"无关变量"',
  '入库体检时血压180/110。医生评论："正常反应。"',
  '签署同意书时手在抖，但字迹很工整',
  '总是问"你们这里有图书馆吗"',
  '入库时哭了3个小时。已计入心理基线数据。',
  '前科：无。信用评分：742。欠款：￥0。完全清白。',
  '最后一次通话是给女儿打的，只说了"爸爸没事"',
  '手背上有一个小纹身，写着一个名字',
  '入库问卷"你有什么遗愿"一栏空白',
  '每次实验前都闭眼30秒。工作人员记录为"例行冥想"',
  '说自己"只是来打工的"',
  '一直在数墙上的裂缝',
  '入库时穿着一件印有"世界第一好爸爸"的T恤',
  '拒绝透露真实姓名。档案使用编号替代。',
  '体检发现早期癌症。医生评论："不影响实验进度。"',
  '入库物品：一把钥匙、一个打火机、一张写着地址的纸条',
  '食堂吃饭时总是一个人坐在角落',
  '曾尝试与SCP-999互动，被记录为"情绪异常稳定"',
  '问过3次"这里的WiFi密码是什么"',
  '每天往信箱投一封信。收件人地址已确认为不存在的地址。',
  '入库前最后的网络搜索记录："附近招聘""房租减免政策"',
  '反复要求"让我打电话给律师"——依据第12号协议驳回',
  '入库时携带了两个孩子的合照，估计年龄4岁和7岁',
  '连续3天拒绝进食，第4天授权强制喂食',
  '在牢房墙壁上刻了天数记号，停在了第47天',
  '能流利使用中英日三种语言，以及一种不存在的语言',
  '手腕上戴着两周前某音乐节的入场手环',
  '问过一名看守："你有没有想过，你才是实验对象？"',
];

// ===== 档案缓存 =====
// 同一个 dClassId 永远返回同一份档案，避免 hover 时刷新

const _profileCache = new Map<string, DClassProfile>();

export interface DClassProfile {
  id: string;
  name: string;
  age: number;
  formerJob: string;
  reason: string;
  personalDetail: string;
  /** 去人格化阶段下的显示标签 */
  phaseLabel?: string;
}

export function generateDClassId(): string {
  return `D-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function getRandomProfession(): string {
  const entry = PROFESSION_ENTRIES[r(PROFESSION_ENTRIES.length)];
  return `前：${entry.job}`;
}

/**
 * 根据 dClassId 和当前去人格化阶段获取档案。
 * phase 参数控制返回数据的详细程度：
 * - PHASE_HUMAN: 完整档案（姓名+背景+入站原因+个人细节）
 * - PHASE_NUMBER: 仅编号+工种代号，背景变为"[已归档]"
 * - PHASE_BATCH: 批次号，无个人信息
 * - PHASE_VOID: "[ 无可用数据 ]"
 */
export function generateFullProfile(dClassId?: string, phase?: string): DClassProfile {
  const id = dClassId || generateDClassId();
  const p = phase || 'PHASE_HUMAN';

  // PHASE_VOID: 不需要任何个人数据
  if (p === 'PHASE_VOID') {
    return {
      id: `资源#${id.replace('D-', '')}`,
      name: '',
      age: 0,
      formerJob: '',
      reason: '',
      personalDetail: '',
      phaseLabel: '[ 无可用数据 ]',
    };
  }

  // PHASE_BATCH: 只有批次号
  if (p === 'PHASE_BATCH') {
    const batchNum = Math.floor(Math.random() * 900) + 100;
    return {
      id: `LOT-2024-${String(batchNum).padStart(3, '0')}`,
      name: '',
      age: 0,
      formerJob: '[不适用]',
      reason: '[不适用]',
      personalDetail: '',
      phaseLabel: `批次 #${batchNum} | 状态: 可用`,
    };
  }

  // 缓存命中直接返回（只有 HUMAN 和 NUMBER 阶段需要真实数据）
  const cached = _profileCache.get(id);
  if (cached) {
    if (p === 'PHASE_NUMBER') {
      // Phase 3 混合制：保留编号和工种，去除姓名和个人信息
      return {
        ...cached,
        name: '',
        reason: '',
        personalDetail: '',
        // 不设 phaseLabel → tooltip 使用多行模板，但只显示 id + formerJob
      };
    }
    return cached;
  }

  // 生成新档案
  const name = generateName();

  const roll = Math.random();
  let cum = 0;
  let ageRange = AGES_WEIGHTS[0];
  for (const aw of AGES_WEIGHTS) {
    cum += aw.weight;
    if (roll <= cum) { ageRange = aw; break; }
  }
  const age = ageRange.min + Math.floor(Math.random() * (ageRange.max - ageRange.min + 1));

  const entry = PROFESSION_ENTRIES[r(PROFESSION_ENTRIES.length)];
  const detail = PERSONAL_DETAILS[r(PERSONAL_DETAILS.length)];

  const profile: DClassProfile = {
    id,
    name,
    age,
    formerJob: entry.job,
    reason: entry.reason,
    personalDetail: detail,
  };

  _profileCache.set(id, profile);

  // PHASE_NUMBER: 返回简化版（保留编号+工种，去除姓名/个人信息）
  if (p === 'PHASE_NUMBER') {
    return {
      ...profile,
      name: '',
      reason: '',
      personalDetail: '',
      // 不设 phaseLabel → tooltip 使用多行模板，但只显示 id + formerJob
    };
  }

  return profile;
}

/**
 * 清除缓存（关卡切换时可选调用）
 */
export function clearProfileCache() {
  _profileCache.clear();
}