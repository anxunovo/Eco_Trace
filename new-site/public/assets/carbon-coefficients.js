// Shared carbon coefficient catalog used by the browser estimator and DB seed scripts.

export const CARBON_COEFFICIENT_VERSION = 'demo-2026-05';

export const CATEGORIES = [
  { key: 'BOOKS',       label: '教材书籍',   icon: '📚', mode: 'per_kg',   factor: 1.3, defaultWeight: 0.8, substitution: 0.7, note: '纸质资料再利用', source: 'CLCD', sourceRef: 'paper-pulp-production' },
  { key: 'CLOTHING',    label: '衣物鞋包',   icon: '👕', mode: 'per_item', factor: 8.0, substitution: 0.7, note: '单件衣物 / 鞋包估算', source: 'ecoinvent', sourceRef: 'garment-production' },
  { key: 'ELECTRONICS', label: '小型电子产品', icon: '🎧', mode: 'per_item', factor: 25.0, substitution: 0.6, note: '耳机、台灯、小电器等', source: 'ecoinvent', sourceRef: 'consumer-electronics' },
  { key: 'DORM',        label: '宿舍用品',   icon: '🛏️', mode: 'per_kg',   factor: 3.0, defaultWeight: 2.0, substitution: 0.7, note: '收纳、置物架、生活用品', source: 'CLCD', sourceRef: 'household-goods' },
  { key: 'STATIONERY',  label: '文具工具',   icon: '✏️', mode: 'per_item', factor: 2.0, substitution: 0.7, note: '文具、小工具', source: 'CLCD', sourceRef: 'paper-products' },
  { key: 'SPORTS',      label: '运动用品',   icon: '🏸', mode: 'per_item', factor: 5.0, substitution: 0.7, note: '球拍、瑜伽垫等', source: 'ecoinvent', sourceRef: 'sporting-goods' },
  { key: 'FOOD',        label: '食物分享',   icon: '🍎', mode: 'per_kg',   factor: 2.5, defaultWeight: 0.5, substitution: 1.0, note: '按避免食物浪费估算（普通食物）', source: 'IPCC', sourceRef: 'food-waste-general' },
];

export const FOOD_SUBCATS = {
  COMMON: { label: '普通食物', factor: 2.5, note: '按避免食物浪费估算', source: 'IPCC', sourceRef: 'food-waste', defaultWeight: 0.5 },
  MEAT:   { label: '肉蛋奶类', factor: 8.0, note: '高碳食物估算项', source: 'IPCC', sourceRef: 'meat-production' },
  VEG:    { label: '果蔬类',   factor: 0.8, note: '低碳食物估算项', source: 'IPCC', sourceRef: 'vegetable-production' },
  SNACK:  { label: '零食饮料', factor: 2.0, note: '未开封零食、饮料等', source: 'IPCC', sourceRef: 'processed-food' },
};

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

export const CARBON_COEFFICIENTS = [
  ...CATEGORIES.map(c => ({
    category: c.key,
    subcategory: null,
    mode: c.mode,
    factor: c.factor,
    substitutionRate: c.substitution,
    defaultWeightKg: c.defaultWeight ?? null,
    source: c.source,
    sourceRef: c.sourceRef,
    sourceVersion: CARBON_COEFFICIENT_VERSION,
    note: c.note,
  })),
  ...Object.entries(FOOD_SUBCATS).map(([key, food]) => ({
    category: 'FOOD',
    subcategory: key,
    mode: 'per_kg',
    factor: food.factor,
    substitutionRate: 1.0,
    defaultWeightKg: food.defaultWeight ?? null,
    source: food.source,
    sourceRef: food.sourceRef,
    sourceVersion: CARBON_COEFFICIENT_VERSION,
    note: food.note,
  })),
];

function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

export function findCarbonCoefficient(category, subcategory = null) {
  return CARBON_COEFFICIENTS.find(c =>
    c.category === category && (c.subcategory ?? null) === (subcategory ?? null)
  );
}

export function estimateCarbonFromCatalog(input) {
  const isFood = input.isFood || input.category === 'FOOD';

  if (isFood) {
    const foodType = input.foodInfo?.foodType || 'COMMON';
    const sub = FOOD_SUBCATS[foodType] || FOOD_SUBCATS.COMMON;
    const coeff = findCarbonCoefficient('FOOD', FOOD_SUBCATS[foodType] ? foodType : 'COMMON');
    const weight = Number(input.foodInfo?.weightKg || input.estimatedWeightKg || input.weightKg || coeff?.defaultWeightKg || 0.5);
    const value = round1(weight * sub.factor * 1.0);
    return {
      estimatedCarbonSavedKg: value,
      weightKg: weight,
      assumptions: [
        `识别为食物：${sub.label}`,
        `按 ${weight} kg × ${sub.factor} 碳系数估算`,
        `${sub.note}（替代系数 1）`,
      ],
      source: coeff?.source || 'catalog',
      sourceRef: coeff?.sourceRef || '',
      confidence: input.foodInfo?.weightKg || input.estimatedWeightKg || input.weightKg ? 0.75 : 0.5,
    };
  }

  const cat = CATEGORY_MAP[input.category];
  const coeff = findCarbonCoefficient(input.category, null);
  if (!cat || !coeff) {
    return {
      estimatedCarbonSavedKg: 0,
      weightKg: 0,
      assumptions: ['未知分类，无法估算'],
      source: 'catalog',
      sourceRef: '',
      confidence: 0.2,
    };
  }

  if (cat.mode === 'per_kg') {
    const weight = Number(input.estimatedWeightKg || input.weightKg || cat.defaultWeight || 1);
    const value = round1(weight * coeff.factor * coeff.substitutionRate);
    return {
      estimatedCarbonSavedKg: value,
      weightKg: weight,
      assumptions: [
        `分类 ${cat.label}，按重量估算`,
        `重量 ${weight} kg × 碳系数 ${coeff.factor}`,
        `二手再利用替代系数 ${coeff.substitutionRate}`,
      ],
      source: coeff.source,
      sourceRef: coeff.sourceRef,
      confidence: input.estimatedWeightKg || input.weightKg ? 0.8 : 0.5,
    };
  }

  const value = round1(coeff.factor * coeff.substitutionRate);
  return {
    estimatedCarbonSavedKg: value,
    weightKg: input.estimatedWeightKg || input.weightKg || cat.defaultWeight || null,
    assumptions: [
      `分类 ${cat.label}，按单件估算`,
      `单件碳系数 ${coeff.factor}`,
      `二手再利用替代系数 ${coeff.substitutionRate}`,
    ],
    source: coeff.source,
    sourceRef: coeff.sourceRef,
    confidence: 0.75,
  };
}
