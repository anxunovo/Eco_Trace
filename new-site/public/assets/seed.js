// 碳系数配置、枚举、种子数据
import { CATEGORIES } from './carbon-coefficients.js';
export {
  CATEGORIES,
  FOOD_SUBCATS,
  CATEGORY_MAP,
  CARBON_COEFFICIENTS,
  CARBON_COEFFICIENT_VERSION,
  estimateCarbonFromCatalog,
  findCarbonCoefficient,
} from './carbon-coefficients.js';

export const HOME_ENTRIES = [
  { key: 'BOOKS',       label: '教材资料',   icon: '📚', kind: 'category' },
  { key: 'ELECTRONICS', label: '电子产品',   icon: '🎧', kind: 'category' },
  { key: 'DORM',        label: '宿舍用品',   icon: '🛏️', kind: 'category' },
  { key: 'CLOTHING',    label: '衣物鞋包',   icon: '👕', kind: 'category' },
  { key: 'STATIONERY',  label: '文具工具',   icon: '✏️', kind: 'category' },
  { key: 'SPORTS',      label: '运动用品',   icon: '🏸', kind: 'category' },
  { key: 'FOOD',        label: '食物分享',   icon: '🍎', kind: 'category' },
  { key: 'FREE',        label: '免费专区',   icon: '🎁', kind: 'trade' },
  { key: 'SWAP',        label: '交换专区',   icon: '🔄', kind: 'trade' },
  { key: 'GRAD',        label: '毕业季专区', icon: '🎓', kind: 'tag' },
];

export const TRADE_MODES = {
  SALE:       { label: '付费转让', color: 'bg-amber-100 text-amber-700' },
  FREE:       { label: '免费赠送', color: 'bg-leaf-100 text-leaf-700' },
  SWAP:       { label: '物品交换', color: 'bg-sky-100 text-sky-700' },
  NEGOTIABLE: { label: '面议',     color: 'bg-slate-100 text-slate-700' },
};

export const CONDITIONS = {
  NEW:      '全新',
  LIKE_NEW: '几乎全新',
  GOOD:     '九成新',
  FAIR:     '有使用痕迹',
  UNKNOWN:  '未填写',
};

export const STATUS_LABELS = {
  DRAFT:     { label: '草稿',    color: 'bg-slate-100 text-slate-600' },
  ACTIVE:    { label: '发布中',  color: 'bg-leaf-100 text-leaf-700' },
  COMPLETED: { label: '已流转',  color: 'bg-emerald-100 text-emerald-700' },
  EXPIRED:   { label: '已过期',  color: 'bg-slate-200 text-slate-500' },
  REMOVED:   { label: '已下架',  color: 'bg-slate-200 text-slate-500' },
};

export const CAMPUS_NAMES = ['东海岸校区', '桑浦山校区'];

export const CAMPUS_LOCATIONS = [
  '桑浦山校区图书馆', '东海岸校区图书馆', '桑浦山校区 3 号宿舍楼下', '桑浦山校区 5 号宿舍楼下', '桑浦山校区 2 号教学楼',
  '桑浦山校区教学楼 A 大厅', '东海岸校区体育馆', '桑浦山校区食堂门口', '东海岸校区食堂门口',
  '桑浦山校区学生活动中心', '桑浦山校区大活 101', '桑浦山校区社团办公室', '桑浦山校区快递站', '东海岸校区快递站',
];

export const SEED_USERS = [
  { id: 'u_alice',  nickname: '李小雨', avatar: '🌸', school: '汕头大学', campus: '桑浦山校区', role: 'STUDENT' },
  { id: 'u_bob',    nickname: '王学长', avatar: '🧢', school: '汕头大学', campus: '东海岸校区', role: 'STUDENT' },
  { id: 'u_club',   nickname: '绿芽社团', avatar: '🌱', school: '汕头大学', campus: '桑浦山校区', role: 'STUDENT' },
  { id: 'u_grad',   nickname: '毕业生小陈', avatar: '🎓', school: '汕头大学', campus: '桑浦山校区', role: 'STUDENT' },
  { id: 'u_admin',  nickname: '管理员', avatar: '🛠️', school: '汕头大学', campus: '—', role: 'ADMIN' },
];

// 时间助手
const now = Date.now();
const hAgo  = h => new Date(now - h * 3600_000).toISOString();
const hLater = h => new Date(now + h * 3600_000).toISOString();
const dAgo  = d => hAgo(d * 24);

const IMG = name => '/assets/seed-images/' + name;

// ------------------------------------------------------------------
// 种子物品（26 条：22 ACTIVE / 3 COMPLETED / 1 EXPIRED）
// ------------------------------------------------------------------
export const SEED_LISTINGS = [
  // ---------- ACTIVE 教材 ----------
  {
    id: 'l_001', ownerId: 'u_alice',
    title: '九成新高等数学教材',
    description: '高等数学（上册），适合低年级同学复习使用，书页完整，只有少量铅笔笔记，可擦。',
    category: 'BOOKS', images: [IMG('books_1.jpg'), IMG('books_3.jpg')],
    tradeMode: 'SALE', price: 12, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '桑浦山校区图书馆',
    contactMethod: '微信', contactValue: 'demo_alice',
    estimatedWeightKg: 0.8, estimatedCarbonSavedKg: 0.7,
    aiConfidence: 0.82, aiAssumptions: ['判断为纸质教材', '按单本教材约 0.8kg 估算', '按二手再利用替代部分新购需求估算'],
    isFood: false, interestedCount: 3, tags: [],
    status: 'ACTIVE', createdAt: hAgo(2),
  },
  {
    id: 'l_006', ownerId: 'u_bob',
    title: '线性代数复习资料（活页）',
    description: '手写整理的期末复习讲义，免费送给有需要的学弟学妹。',
    category: 'BOOKS', images: [IMG('books_2.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '桑浦山校区教学楼 A 大厅',
    contactMethod: 'QQ', contactValue: '10000002',
    estimatedWeightKg: 0.3, estimatedCarbonSavedKg: 0.5,
    aiConfidence: 0.8, aiAssumptions: ['纸质学习资料', '按 0.3kg 估算', '系数 1.3 × 0.7'],
    isFood: false, interestedCount: 12, tags: [],
    status: 'ACTIVE', createdAt: hAgo(40),
  },
  {
    id: 'l_013', ownerId: 'u_grad',
    title: '经济学原理（曼昆，第七版）',
    description: '经管院专业教材，整本书几乎全新，只有第一章有少量荧光笔标注。',
    category: 'BOOKS', images: [IMG('books_4.jpg')],
    tradeMode: 'SALE', price: 25, condition: 'LIKE_NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区图书馆',
    contactMethod: '微信', contactValue: 'demo_grad',
    estimatedWeightKg: 1.2, estimatedCarbonSavedKg: 1.1,
    aiConfidence: 0.85, aiAssumptions: ['判断为大本教材', '按 1.2kg 估算', '系数 1.3 × 0.7'],
    isFood: false, interestedCount: 6, tags: ['GRAD'],
    status: 'ACTIVE', createdAt: hAgo(8),
  },
  {
    id: 'l_014', ownerId: 'u_alice',
    title: '古代汉语词典（缩印本）',
    description: '用了一学期，外皮有点折痕但内页很干净。',
    category: 'BOOKS', images: [IMG('books_5.jpg')],
    tradeMode: 'SALE', price: 18, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '东海岸校区图书馆',
    contactMethod: '微信', contactValue: 'demo_alice',
    estimatedWeightKg: 0.9, estimatedCarbonSavedKg: 0.8,
    aiConfidence: 0.79, aiAssumptions: ['判断为词典 / 工具书', '按 0.9kg 估算'],
    isFood: false, interestedCount: 1, tags: [],
    status: 'ACTIVE', createdAt: hAgo(15),
  },

  // ---------- ACTIVE 宿舍 ----------
  {
    id: 'l_002', ownerId: 'u_bob',
    title: '宿舍收纳盒三件套',
    description: '毕业清理，三个不同大小的收纳盒，一起带走。',
    category: 'DORM', images: [IMG('dorm_1.jpg'), IMG('dorm_3.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '桑浦山校区 3 号宿舍楼下',
    contactMethod: '微信', contactValue: 'demo_bob',
    estimatedWeightKg: 2.0, estimatedCarbonSavedKg: 4.2,
    aiConfidence: 0.74, aiAssumptions: ['塑料 / 布艺收纳', '按 2.0kg 估算', '宿舍用品再利用系数 0.7'],
    isFood: false, interestedCount: 5, tags: ['GRAD'],
    status: 'ACTIVE', createdAt: hAgo(5),
  },
  {
    id: 'l_005', ownerId: 'u_grad',
    title: '毕业季衣架一包（约 20 个）',
    description: '塑料衣架，有少量使用痕迹，急出。',
    category: 'DORM', images: [IMG('dorm_2.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'FAIR',
    campus: '桑浦山校区', locationText: '桑浦山校区 5 号宿舍楼下',
    contactMethod: '站内留言', contactValue: '',
    estimatedWeightKg: 1.0, estimatedCarbonSavedKg: 2.1,
    aiConfidence: 0.7, aiAssumptions: ['塑料衣架', '按 1.0kg 估算', '宿舍用品系数 3.0 × 0.7'],
    isFood: false, interestedCount: 7, tags: ['GRAD'],
    status: 'ACTIVE', createdAt: hAgo(30),
  },
  {
    id: 'l_010', ownerId: 'u_bob',
    title: '可交换马克杯一个',
    description: '纯白陶瓷马克杯，想换一杯奶茶或者文具小物。',
    category: 'DORM', images: [IMG('mug_1.jpg'), IMG('mug_2.jpg')],
    tradeMode: 'SWAP', swapWanted: '奶茶 / 文具 / 咖啡豆', condition: 'LIKE_NEW',
    campus: '桑浦山校区', locationText: '东海岸校区图书馆',
    contactMethod: 'QQ', contactValue: '10000002',
    estimatedWeightKg: 0.35, estimatedCarbonSavedKg: 1.5,
    aiConfidence: 0.7, aiAssumptions: ['马克杯，宿舍用品', '按 0.35kg × 3.0 × 0.7 估算'],
    isFood: false, interestedCount: 2, tags: [],
    status: 'ACTIVE', createdAt: hAgo(70),
  },
  {
    id: 'l_016', ownerId: 'u_alice',
    title: '全新枕芯一对（带防尘袋）',
    description: '买多了一对，从未拆封，宿舍用尺寸。',
    category: 'DORM', images: [IMG('mug_3.jpg')],
    tradeMode: 'SALE', price: 35, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区快递站',
    contactMethod: '微信', contactValue: 'demo_alice',
    estimatedWeightKg: 1.8, estimatedCarbonSavedKg: 3.8,
    aiConfidence: 0.65, aiAssumptions: ['寝具，按 1.8kg 估算'],
    isFood: false, interestedCount: 0, tags: [],
    status: 'ACTIVE', createdAt: hAgo(20),
  },

  // ---------- ACTIVE 电子 ----------
  {
    id: 'l_004', ownerId: 'u_grad',
    title: '台灯（USB 三档亮度）',
    description: '用了一年多的 USB 护眼台灯，三档亮度，毕业带不走了。',
    category: 'ELECTRONICS', images: [IMG('lamp_1.jpg'), IMG('lamp_3.jpg')],
    tradeMode: 'SALE', price: 20, condition: 'GOOD',
    campus: '东海岸校区', locationText: '东海岸校区快递站',
    contactMethod: '微信', contactValue: 'demo_grad',
    estimatedWeightKg: 0.6, estimatedCarbonSavedKg: 15.0,
    aiConfidence: 0.9, aiAssumptions: ['小型电子产品：台灯', '按单件 25.0kg CO₂e 估算', '替代系数 0.6'],
    isFood: false, interestedCount: 2, tags: ['GRAD'],
    status: 'ACTIVE', createdAt: hAgo(24),
  },
  {
    id: 'l_011', ownerId: 'u_grad',
    title: '闲置无线鼠标',
    description: '毕业出闲，USB 接收器和电池都在，可正常使用。',
    category: 'ELECTRONICS', images: [IMG('mouse_1.jpg')],
    tradeMode: 'SALE', price: 15, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '桑浦山校区 2 号教学楼',
    contactMethod: '微信', contactValue: 'demo_grad',
    estimatedWeightKg: 0.12, estimatedCarbonSavedKg: 15.0,
    aiConfidence: 0.93, aiAssumptions: ['小型电子产品：鼠标', '按单件 25.0 × 0.6 估算'],
    isFood: false, interestedCount: 1, tags: ['GRAD'],
    status: 'ACTIVE', createdAt: hAgo(80),
  },
  {
    id: 'l_017', ownerId: 'u_bob',
    title: '蓝牙耳机（半入耳，盒子在）',
    description: '用了大半年还很新，配对一切正常，配件齐全。换有线耳机了。',
    category: 'ELECTRONICS', images: [IMG('earphones_1.jpg'), IMG('earphones_2.jpg')],
    tradeMode: 'SALE', price: 60, condition: 'LIKE_NEW',
    campus: '东海岸校区', locationText: '东海岸校区快递站',
    contactMethod: '微信', contactValue: 'demo_bob',
    estimatedWeightKg: 0.08, estimatedCarbonSavedKg: 15.0,
    aiConfidence: 0.94, aiAssumptions: ['小型电子产品：耳机', '按单件 25.0 × 0.6 估算'],
    isFood: false, interestedCount: 4, tags: [],
    status: 'ACTIVE', createdAt: hAgo(6),
  },

  // ---------- ACTIVE 衣物 ----------
  {
    id: 'l_009', ownerId: 'u_alice',
    title: '九成新帆布包（米白色）',
    description: '去年买的校园风帆布包，里面还放着小挂件，想换个更大的双肩包。',
    category: 'CLOTHING', images: [IMG('bag_1.jpg'), IMG('bag_3.jpg')],
    tradeMode: 'NEGOTIABLE', condition: 'LIKE_NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区食堂门口',
    contactMethod: '微信', contactValue: 'demo_alice',
    estimatedWeightKg: 0.4, estimatedCarbonSavedKg: 5.6,
    aiConfidence: 0.86, aiAssumptions: ['帆布包，衣物鞋包类', '按单件 8.0kg CO₂e 估算', '替代系数 0.7'],
    isFood: false, interestedCount: 0, tags: [],
    status: 'ACTIVE', createdAt: hAgo(55),
  },
  {
    id: 'l_018', ownerId: 'u_grad',
    title: '校园卫衣 M 码（灰色）',
    description: '只穿过两三次，洗过一次，没什么使用痕迹。M 码偏大。',
    category: 'CLOTHING', images: [IMG('clothes_1.jpg')],
    tradeMode: 'SALE', price: 30, condition: 'LIKE_NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区 5 号宿舍楼下',
    contactMethod: '微信', contactValue: 'demo_grad',
    estimatedWeightKg: 0.55, estimatedCarbonSavedKg: 5.6,
    aiConfidence: 0.83, aiAssumptions: ['衣物鞋包类', '按单件 8.0kg CO₂e 估算', '替代系数 0.7'],
    isFood: false, interestedCount: 2, tags: ['GRAD'],
    status: 'ACTIVE', createdAt: hAgo(12),
  },

  // ---------- ACTIVE 文具 ----------
  {
    id: 'l_019', ownerId: 'u_alice',
    title: '文具套装：多色笔 + 笔袋 + 便签',
    description: '考研用过一阵子，笔都还有墨水，便签是全新没拆。',
    category: 'STATIONERY', images: [IMG('stationery_1.jpg'), IMG('stationery_2.jpg')],
    tradeMode: 'SALE', price: 8, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '桑浦山校区图书馆',
    contactMethod: '站内留言', contactValue: '',
    estimatedWeightKg: 0.3, estimatedCarbonSavedKg: 1.4,
    aiConfidence: 0.71, aiAssumptions: ['文具套装', '按单件 2.0kg × 0.7 估算'],
    isFood: false, interestedCount: 3, tags: [],
    status: 'ACTIVE', createdAt: hAgo(4),
  },

  // ---------- ACTIVE 运动 ----------
  {
    id: 'l_003', ownerId: 'u_alice',
    title: '闲置羽毛球拍一把',
    description: '用了两学期，手感还行，想换个瑜伽垫或者跳绳。',
    category: 'SPORTS', images: [IMG('sports_racket_1.jpg'), IMG('sports_racket_3.jpg')],
    tradeMode: 'SWAP', swapWanted: '瑜伽垫 / 跳绳 / 其它运动器材', condition: 'GOOD',
    campus: '东海岸校区', locationText: '东海岸校区体育馆',
    contactMethod: 'QQ', contactValue: '10000001',
    estimatedWeightKg: 0.15, estimatedCarbonSavedKg: 3.5,
    aiConfidence: 0.88, aiAssumptions: ['羽毛球拍，运动用品', '按单件 5.0kg CO₂e 估算', '替代系数 0.7'],
    isFood: false, interestedCount: 1, tags: [],
    status: 'ACTIVE', createdAt: hAgo(10),
  },
  {
    id: 'l_020', ownerId: 'u_bob',
    title: '加厚瑜伽垫（紫色）',
    description: '室友买的，没用过两次。送收纳带。',
    category: 'SPORTS', images: [IMG('sports_yoga_1.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'LIKE_NEW',
    campus: '东海岸校区', locationText: '东海岸校区体育馆',
    contactMethod: '微信', contactValue: 'demo_bob',
    estimatedWeightKg: 1.2, estimatedCarbonSavedKg: 3.5,
    aiConfidence: 0.82, aiAssumptions: ['运动用品', '按单件 5.0kg CO₂e 估算'],
    isFood: false, interestedCount: 6, tags: [],
    status: 'ACTIVE', createdAt: hAgo(18),
  },

  // ---------- ACTIVE 食物 ----------
  {
    id: 'l_007', ownerId: 'u_club',
    title: '未开封矿泉水 6 瓶',
    description: '社团活动剩余，全部未开封，500ml/瓶。',
    category: 'FOOD', images: [IMG('food_water_1.jpg'), IMG('food_water_3.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区学生活动中心',
    contactMethod: '微信', contactValue: 'demo_club',
    estimatedWeightKg: 3.0, estimatedCarbonSavedKg: 1.2,
    aiConfidence: 0.92, aiAssumptions: ['未开封饮料', '按零食饮料系数 2.0 × 1.0 替代系数估算'],
    isFood: true,
    foodInfo: {
      foodType: 'SNACK', packageStatus: 'UNOPENED',
      weightKg: 3.0, servings: 6,
      expireAt: hLater(48),
      storageNote: '常温储存即可',
      safetyConfirmed: true,
    },
    interestedCount: 2, tags: [],
    status: 'ACTIVE', createdAt: hAgo(1),
  },
  {
    id: 'l_008', ownerId: 'u_club',
    title: '社团活动剩余未开封零食',
    description: '包含薯片、饼干、糖果等若干，均未开封。',
    category: 'FOOD', images: [IMG('food_snack_1.jpg'), IMG('food_snack_3.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区大活 101',
    contactMethod: '微信', contactValue: 'demo_club',
    estimatedWeightKg: 1.5, estimatedCarbonSavedKg: 3.0,
    aiConfidence: 0.85, aiAssumptions: ['零食', '按 1.5kg 估算', '零食饮料系数 2.0 × 1.0'],
    isFood: true,
    foodInfo: {
      foodType: 'SNACK', packageStatus: 'UNOPENED',
      weightKg: 1.5, servings: 10,
      expireAt: hLater(72),
      storageNote: '常温阴凉处',
      safetyConfirmed: true,
    },
    interestedCount: 4, tags: [],
    status: 'ACTIVE', createdAt: hAgo(3),
  },
  {
    id: 'l_012', ownerId: 'u_club',
    title: '社团水果拼盘剩余未动部分',
    description: '小型会议剩余的水果盘，未分发部分，主要是苹果和橙子。',
    category: 'FOOD', images: [IMG('food_fruit_1.jpg'), IMG('food_fruit_3.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区社团办公室',
    contactMethod: '微信', contactValue: 'demo_club',
    estimatedWeightKg: 1.0, estimatedCarbonSavedKg: 0.8,
    aiConfidence: 0.82, aiAssumptions: ['果蔬类食物', '按 1.0kg × 0.8 × 1.0 估算'],
    isFood: true,
    foodInfo: {
      foodType: 'VEG', packageStatus: 'COOKED',
      weightKg: 1.0, servings: 4,
      expireAt: hLater(6),
      storageNote: '已经切好，尽快食用',
      safetyConfirmed: true,
    },
    interestedCount: 3, tags: [],
    status: 'ACTIVE', createdAt: hAgo(0.5),
  },
  {
    id: 'l_021', ownerId: 'u_alice',
    title: '即将到期纯牛奶 4 盒（明早过期）',
    description: '买多了喝不完，明天到期。室友愿意带走可以联系。',
    category: 'FOOD', images: [IMG('food_water_2.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区 3 号宿舍楼下',
    contactMethod: '微信', contactValue: 'demo_alice',
    estimatedWeightKg: 1.0, estimatedCarbonSavedKg: 8.0,
    aiConfidence: 0.88, aiAssumptions: ['肉蛋奶类', '按 1.0kg × 8.0 × 1.0 估算'],
    isFood: true,
    foodInfo: {
      foodType: 'MEAT', packageStatus: 'UNOPENED',
      weightKg: 1.0, servings: 4,
      expireAt: hLater(14),
      storageNote: '冷藏保存',
      safetyConfirmed: true,
    },
    interestedCount: 5, tags: [],
    status: 'ACTIVE', createdAt: hAgo(2),
  },
  {
    id: 'l_022', ownerId: 'u_club',
    title: '活动剩余便当 3 份（中午做的）',
    description: '社团中午活动多准备了几份便当，米饭+蔬菜+蛋。今晚 8 点前自取。',
    category: 'FOOD', images: [IMG('food_snack_2.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区社团办公室',
    contactMethod: '微信', contactValue: 'demo_club',
    estimatedWeightKg: 1.2, estimatedCarbonSavedKg: 3.0,
    aiConfidence: 0.84, aiAssumptions: ['普通食物（熟食）', '按 1.2kg × 2.5 × 1.0 估算'],
    isFood: true,
    foodInfo: {
      foodType: 'COMMON', packageStatus: 'COOKED',
      weightKg: 1.2, servings: 3,
      expireAt: hLater(7),
      storageNote: '常温，尽快食用',
      safetyConfirmed: true,
    },
    interestedCount: 8, tags: [],
    status: 'ACTIVE', createdAt: hAgo(0.3),
  },

  // ---------- COMPLETED（让看板有数据） ----------
  {
    id: 'l_023', ownerId: 'u_grad',
    title: '马原毛概复习资料',
    description: '考前突击整理的笔记和题集，已经送出。',
    category: 'BOOKS', images: [IMG('books_6.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'GOOD',
    campus: '桑浦山校区', locationText: '桑浦山校区 2 号教学楼',
    contactMethod: '微信', contactValue: 'demo_grad',
    estimatedWeightKg: 0.4, estimatedCarbonSavedKg: 0.4,
    aiConfidence: 0.78, aiAssumptions: ['复习资料', '按 0.4kg 估算'],
    isFood: false, interestedCount: 9, tags: [],
    status: 'COMPLETED', createdAt: dAgo(8), completedAt: dAgo(6),
  },
  {
    id: 'l_024', ownerId: 'u_alice',
    title: '九成新帆布鞋 38 码',
    description: '冬天没怎么穿，被新室友带走啦。',
    category: 'CLOTHING', images: [IMG('clothes_2.jpg')],
    tradeMode: 'SALE', price: 25, condition: 'LIKE_NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区 5 号宿舍楼下',
    contactMethod: '微信', contactValue: 'demo_alice',
    estimatedWeightKg: 0.6, estimatedCarbonSavedKg: 5.6,
    aiConfidence: 0.86, aiAssumptions: ['衣物鞋包', '按单件 8.0kg × 0.7 估算'],
    isFood: false, interestedCount: 4, tags: [],
    status: 'COMPLETED', createdAt: dAgo(5), completedAt: dAgo(3),
  },
  {
    id: 'l_025', ownerId: 'u_bob',
    title: '陶瓷笔筒一个',
    description: '简约风，已被新生带走。',
    category: 'STATIONERY', images: [IMG('stationery_3.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'GOOD',
    campus: '东海岸校区', locationText: '东海岸校区快递站',
    contactMethod: '微信', contactValue: 'demo_bob',
    estimatedWeightKg: 0.4, estimatedCarbonSavedKg: 1.4,
    aiConfidence: 0.69, aiAssumptions: ['文具', '按单件 2.0kg × 0.7 估算'],
    isFood: false, interestedCount: 3, tags: [],
    status: 'COMPLETED', createdAt: dAgo(7), completedAt: dAgo(5),
  },

  // ---------- EXPIRED 食物 ----------
  {
    id: 'l_026', ownerId: 'u_club',
    title: '活动剩余饼干礼盒',
    description: '上周末活动剩余，已超过最晚领取时间。',
    category: 'FOOD', images: [IMG('food_snack_3.jpg')],
    tradeMode: 'FREE', price: 0, condition: 'NEW',
    campus: '桑浦山校区', locationText: '桑浦山校区大活 101',
    contactMethod: '微信', contactValue: 'demo_club',
    estimatedWeightKg: 0.8, estimatedCarbonSavedKg: 1.6,
    aiConfidence: 0.81, aiAssumptions: ['零食', '按 0.8kg × 2.0 × 1.0 估算'],
    isFood: true,
    foodInfo: {
      foodType: 'SNACK', packageStatus: 'UNOPENED',
      weightKg: 0.8, servings: 5,
      expireAt: hAgo(3),  // 已过期
      storageNote: '常温阴凉处',
      safetyConfirmed: true,
    },
    interestedCount: 2, tags: [],
    status: 'EXPIRED', createdAt: dAgo(2),
  },
];

// ---------- 碳足迹计算排放因子 ----------
// 数据来源: IPCC AR6, China Grid Emission Factor (2024), FAO
export const FOOTPRINT_FACTORS = {
  transport: {
    walk:    { label: '步行',   factor: 0,    icon: '🚶', unit: 'kg CO₂e/km' },
    bike:    { label: '自行车', factor: 0,    icon: '🚲', unit: 'kg CO₂e/km' },
    bus:     { label: '公交',   factor: 0.08, icon: '🚌', unit: 'kg CO₂e/km' },
    shuttle: { label: '校车',   factor: 0.06, icon: '🚐', unit: 'kg CO₂e/km' },
    car:     { label: '私家车', factor: 0.21, icon: '🚗', unit: 'kg CO₂e/km' },
    ecar:    { label: '电动',   factor: 0.05, icon: '🔋', unit: 'kg CO₂e/km' },
  },
  electricity: {
    chinaGrid: { label: '中国电网', factor: 0.581, icon: '⚡', unit: 'kg CO₂e/kWh' },
  },
  food: {
    vegan:      { label: '纯素',   meatRatio: 0,    factor: 1.5,  icon: '🥗', unit: 'kg CO₂e/day' },
    lightVeg:   { label: '偏素',   meatRatio: 0.2,  factor: 2.5,  icon: '🥬', unit: 'kg CO₂e/day' },
    balanced:   { label: '均衡',   meatRatio: 0.4,  factor: 3.8,  icon: '🍱', unit: 'kg CO₂e/day' },
    meatHeavy:  { label: '偏肉',   meatRatio: 0.6,  factor: 5.2,  icon: '🍖', unit: 'kg CO₂e/day' },
    heavyMeat:  { label: '多肉',   meatRatio: 0.8,  factor: 6.8,  icon: '🥩', unit: 'kg CO₂e/day' },
  },
};

// 等效换算因子
export const CARBON_EQUIVALENTS = {
  treeAbsorption: 18.3,       // kg CO₂e/year per tree (中国杉木平均)
  carKmPerKg: 4.6,            // km driven per kg CO₂e (汽油车平均)
  electricityKwhPerKg: 1.72,  // kWh per kg CO₂e (中国电网因子)
  phoneChargePerKg: 115,      // 手机充电次数 per kg CO₂e
};

// 生态小贴士分类
export const ECO_TIP_CATEGORIES = [
  { key: 'energy',    label: '节能减排', icon: '💡', color: 'bg-amber-100 text-amber-700' },
  { key: 'transport', label: '绿色出行', icon: '🚌', color: 'bg-sky-100 text-sky-700' },
  { key: 'food',      label: '低碳饮食', icon: '🥗', color: 'bg-leaf-100 text-leaf-700' },
  { key: 'recycle',   label: '循环利用', icon: '♻️', color: 'bg-teal-100 text-teal-700' },
  { key: 'lifestyle', label: '绿色生活', icon: '🌱', color: 'bg-violet-100 text-violet-700' },
];

export const SEED_ECO_TIPS = [
  { id: 't_001', category: 'energy', title: '随手关灯，省电又减碳',
    body: '宿舍离开时随手关灯，每天可节省约 0.5 kWh 电力，一年累计减少约 106 kg CO₂e 排放。',
    action: '离开宿舍时检查所有灯和电器是否关闭', carbonLink: '发布闲置物品可减碳约 5.6 kg CO₂e/件' },
  { id: 't_002', category: 'transport', title: '选择公交或校车出行',
    body: '每公里公交排放仅 0.08 kg CO₂e，比私家车（0.21 kg/km）减少 62% 的碳排放。汕头大学校车每日往返，是低碳首选。',
    action: '短途优先步行或骑行，中程选校车', carbonLink: '使用碳循校园发布闲置，每件减碳约 2-15 kg' },
  { id: 't_003', category: 'food', title: '减少食物浪费，从食堂开始',
    body: '中国每年约 1700-1800 万吨食物被浪费。每浪费 1 kg 食物约产生 2.5 kg CO₂e 排放。食堂适量点餐是最简单的减碳行动。',
    action: '按需点餐，吃多少打多少', carbonLink: '通过平台分享剩余食物，每次可减碳 0.8-8.0 kg' },
  { id: 't_004', category: 'recycle', title: '教材循环使用，知识也在流转',
    body: '一本 0.8 kg 的教材再利用可减少约 0.7 kg CO₂e 排放。全校每年数千本教材流转，减碳效果可观。',
    action: '期末把用过的教材发布到碳循校园', carbonLink: '教材再利用减碳 0.7-1.1 kg CO₂e/本' },
  { id: 't_005', category: 'lifestyle', title: '减少一次性用品消耗',
    body: '一个塑料袋的碳足迹约 0.04 kg CO₂e，中国每天消耗约 30 亿个塑料袋。自带购物袋和水杯是最简单的改变。',
    action: '随身携带购物袋和水杯', carbonLink: '二手再利用的减碳效果是减塑的 50-600 倍' },
  { id: 't_006', category: 'energy', title: '空调温度设 26°C',
    body: '空调每调高 1°C 可节省约 7% 电力。宿舍空调设 26°C 既舒适又省电，每天可减少约 0.3 kg CO₂e。',
    action: '把宿舍空调设到 26°C 并保持', carbonLink: '减碳和闲置流转一样，都是举手之劳' },
  { id: 't_007', category: 'recycle', title: '毕业季物品捐赠与流转',
    body: '毕业生平均遗留 15-20 kg 可再利用物品。通过二手流转而非丢弃，每件可减碳 2-15 kg CO₂e，全校毕业季累计可达数吨。',
    action: '毕业前整理闲置发布到碳循校园', carbonLink: '宿舍用品再利用减碳 2.1-4.2 kg/件' },
  { id: 't_008', category: 'transport', title: '短途骑行，健康又低碳',
    body: '骑行零碳排放，还能锻炼身体。校园内 2 km 以内的出行，骑行只需 6-8 分钟，比找停车位还快。',
    action: '2 km 内的出行选择自行车或步行', carbonLink: '平台每完成一次闲置流转 ≈ 减少 3 km 私家车排放' },
  { id: 't_009', category: 'food', title: '选择当季本地食材',
    body: '反季蔬果需要温室种植或长途运输，碳足迹是当季本地的 3-5 倍。食堂选择当季菜品是最经济的减碳方式。',
    action: '优先选择食堂当季菜品', carbonLink: '平台食物分享功能帮助减少食物浪费' },
  { id: 't_010', category: 'lifestyle', title: '二手优于全新',
    body: '生产一件新衣服的碳足迹约 8 kg CO₂e，一双新鞋约 14 kg。选择二手闲置不仅省钱，还能直接减少生产端碳排放。',
    action: '需要物品时先看看碳循校园有没有', carbonLink: '每件二手衣物流转减碳 5.6 kg CO₂e' },
  { id: 't_011', category: 'energy', title: '拔掉不用的充电器',
    body: '待机状态的充电器仍然消耗电力（空载功耗约 0.1-0.5W）。宿舍 4-6 个充电器全年待机，累计浪费约 17-88 kWh 电力。',
    action: '充电完成后拔掉充电器', carbonLink: '节约的电力 ≈ 二手耳机再利用的减碳量（15 kg CO₂e）' },
  { id: 't_012', category: 'recycle', title: '电子产品再利用价值最高',
    body: '小型电子产品的碳排放主要来自生产阶段（约 25 kg CO₂e/件）。通过二手流转延长使用寿命，减碳效果远超其他品类。',
    action: '闲置电子产品优先考虑二手流转而非丢弃', carbonLink: '电子产品再利用减碳 15 kg CO₂e/件' },
];

export const STORAGE_KEYS = {
  users:       'tx.users',
  current:     'tx.currentUserId',
  listings:    'tx.listings',
  interests:   'tx.interests',
  carbon:      'tx.carbonRecords',
  version:     'tx.seed.version',
  calcHistory: 'tx.calcHistory',
  ecoTips:     'tx.ecoTips',
};

// 修改此字符串可强制刷新种子数据（旧版本会被覆盖）
export const SEED_VERSION = '2026-05-09-v2.2-green-impact';
