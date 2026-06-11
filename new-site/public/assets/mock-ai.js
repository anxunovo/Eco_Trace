// Mock AI：根据关键词/用户已选分类返回建议字段 + 碳估算
// 后续替换为真实模型时，保持同名签名即可。
import { CATEGORIES, CATEGORY_MAP, FOOD_SUBCATS } from './seed.js';
import { calculateCarbonEstimate, round1 } from './store.js?v=20260609-demo5';

// 关键词 → 分类 映射（粗略规则，MVP 足够）
const KEYWORD_RULES = [
  { cat: 'BOOKS',       kws: ['书','教材','资料','讲义','习题','笔记','辞典','词典','卷','复习'] },
  { cat: 'ELECTRONICS', kws: ['台灯','鼠标','键盘','耳机','显示器','充电器','电源','音箱','电池','路由','硬盘','U盘','u盘','数据线','蓝牙','插线板','充电宝'] },
  { cat: 'DORM',        kws: ['收纳','衣架','马克杯','杯','挂钩','拖鞋','枕','被','席','垫','脸盆','洗脸','桶','电水壶','衣服架'] },
  { cat: 'CLOTHING',    kws: ['帆布','包','背包','书包','外套','卫衣','T恤','鞋','裤','裙','衣'] },
  { cat: 'STATIONERY',  kws: ['笔','笔袋','尺','文件夹','便签','订书','胶','剪刀','修正','橡皮','本子','文具'] },
  { cat: 'SPORTS',      kws: ['羽毛球','球拍','瑜伽','跳绳','网球','乒乓','篮球','哑铃','滑板','护膝','护腕'] },
  { cat: 'FOOD',        kws: ['矿泉水','牛奶','水果','苹果','橙','零食','饼干','薯片','糖果','饮料','面包','蛋糕','盒饭','便当','剩余食品','剩余零食','拼盘'] },
];

// 食物子分类识别
const FOOD_SUBCAT_RULES = [
  { key: 'VEG',   kws: ['水果','苹果','橙','香蕉','蔬菜','拼盘','西瓜','梨'] },
  { key: 'MEAT',  kws: ['肉','鸡','牛','猪','羊','蛋','奶','酸奶','冰淇淋'] },
  { key: 'SNACK', kws: ['薯片','饼干','糖','巧克力','饮料','矿泉水','可乐','奶茶','零食','面包','蛋糕'] },
  { key: 'COMMON',kws: ['盒饭','便当','米饭','面条','饭','主食','熟食'] },
];

function guessCategory(text) {
  const t = (text || '').toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.kws.some(k => t.includes(k.toLowerCase()))) return rule.cat;
  }
  return 'DORM'; // 兜底
}

function guessFoodSubcat(text) {
  const t = (text || '').toLowerCase();
  for (const rule of FOOD_SUBCAT_RULES) {
    if (rule.kws.some(k => t.includes(k.toLowerCase()))) return rule.key;
  }
  return 'COMMON';
}

function guessCondition(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('全新')) return 'NEW';
  if (t.includes('几乎全新') || t.includes('几乎新')) return 'LIKE_NEW';
  if (t.includes('九成')) return 'GOOD';
  if (t.includes('八成') || t.includes('有使用') || t.includes('痕迹') || t.includes('旧')) return 'FAIR';
  return 'GOOD';
}

function buildTitleSuggestion(category, text) {
  const cat = CATEGORY_MAP[category];
  const raw = (text || '').trim();
  if (raw.length >= 6) return raw.slice(0, 24);
  return `${cat?.label || '闲置物品'}${raw ? '：' + raw : ''}`;
}

function buildDescriptionSuggestion(category, isFood) {
  if (isFood) {
    return '食物由发布者自行填写，请确认包装、保质期和储存条件后再领取。';
  }
  const cat = CATEGORY_MAP[category];
  return `闲置${cat?.label || '物品'}，状态良好，校园自取。二手再利用可帮助减少资源浪费。`;
}

/**
 * analyzeListingImage(input)
 *
 * @param {object} input
 * @param {string[]} input.images  base64 图片数组（MVP 不实际做图像识别）
 * @param {string}   input.title   用户已填标题（可空）
 * @param {string}   input.description
 * @param {string}   input.category  用户已选分类（可空）
 * @param {object}   input.foodInfo  食物信息（可空）
 * @returns {Promise<object>}
 */
export async function analyzeListingImage(input = {}) {
  // 模拟延迟，演示更真实
  await new Promise(r => setTimeout(r, 700));

  const textForGuess = [input.title, input.description].filter(Boolean).join(' ');
  const category = input.category || guessCategory(textForGuess);
  const isFood = category === 'FOOD';
  const condition = guessCondition(textForGuess);
  const cat = CATEGORY_MAP[category];

  // 估算重量
  let estimatedWeightKg = input.estimatedWeightKg;
  if (!estimatedWeightKg) {
    if (isFood) {
      estimatedWeightKg = input.foodInfo?.weightKg || 0.5;
    } else if (cat?.mode === 'per_kg') {
      estimatedWeightKg = cat.defaultWeight || 1;
    }
  }

  // 食物子分类
  let foodInfo = input.foodInfo;
  if (isFood) {
    const subKey = foodInfo?.foodType || guessFoodSubcat(textForGuess);
    foodInfo = {
      ...foodInfo,
      foodType: subKey,
      weightKg: estimatedWeightKg,
    };
  }

  // 碳估算
  const carbon = calculateCarbonEstimate({
    category, isFood,
    estimatedWeightKg,
    foodInfo,
  });

  // 置信度：用户给的信息越多越高
  const confidence = round1(Math.min(
    0.5 + 0.1 * (input.images?.length || 0) + 0.08 * (textForGuess.length ? Math.min(textForGuess.length/8, 3) : 0),
    0.95
  ));

  return {
    titleSuggestion: buildTitleSuggestion(category, input.title),
    category,
    isFood,
    condition,
    estimatedWeightKg: round1(estimatedWeightKg || 0),
    descriptionSuggestion: input.description?.trim() || buildDescriptionSuggestion(category, isFood),
    carbonFactor: cat?.factor,
    estimatedCarbonSavedKg: carbon.estimatedCarbonSavedKg,
    confidence,
    assumptions: carbon.assumptions,
    foodInfoSuggestion: isFood ? foodInfo : undefined,
  };
}
