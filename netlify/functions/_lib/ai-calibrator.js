/**
 * AI result calibrator — deterministic rule-based correction layer.
 * Sits between raw LLM output and final carbon estimation.
 *
 * Enforces:
 * 1. Category-specific weight bounds (clamp outliers)
 * 2. Category ↔ attribute cross-validation
 * 3. Confidence adjustment based on validation pass rate
 */

const WEIGHT_BOUNDS = {
  BOOKS:       { min: 0.05, max: 5.0,   label: '教材书籍' },
  CLOTHING:    { min: 0.05, max: 3.0,   label: '衣物鞋包' },
  ELECTRONICS: { min: 0.05, max: 15.0,  label: '电子产品' },
  DORM:        { min: 0.05, max: 20.0,  label: '宿舍用品' },
  STATIONERY:  { min: 0.01, max: 2.0,   label: '文具工具' },
  SPORTS:      { min: 0.05, max: 15.0,  label: '运动用品' },
  FOOD:        { min: 0.05, max: 5.0,   label: '食物分享' },
};

const FOOD_WEIGHT_BOUNDS = {
  COMMON: { min: 0.1, max: 3.0,  defaultWeight: 0.5 },
  MEAT:   { min: 0.1, max: 3.0,  defaultWeight: 0.5 },
  VEG:    { min: 0.1, max: 2.0,  defaultWeight: 0.3 },
  SNACK:  { min: 0.05, max: 2.0, defaultWeight: 0.3 },
};

const VALID_CATEGORIES = Object.keys(WEIGHT_BOUNDS);

const VALID_CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'UNKNOWN'];

const VALID_FOOD_TYPES = ['COMMON', 'MEAT', 'VEG', 'SNACK'];

/**
 * Cross-validation rules: [category, checkFn, warningMessage]
 * Returns warning string if check fails, null if OK.
 */
const CROSS_CHECKS = [
  {
    name: 'food_not_electronics',
    test: (r) => r.isFood && r.category === 'ELECTRONICS',
    fix: (r) => { r.category = 'FOOD'; },
    warning: '识别为食物但分类为电子产品，已修正为 FOOD',
  },
  {
    name: 'electronics_not_food',
    test: (r) => r.category === 'ELECTRONICS' && r.isFood,
    fix: (r) => { r.isFood = false; },
    warning: '电子产品不应标记为食物，已移除食物标记',
  },
  {
    name: 'food_missing_info',
    test: (r) => r.isFood && !r.foodInfoSuggestion,
    fix: (r) => {
      r.foodInfoSuggestion = { foodType: 'COMMON', expiryDays: 2 };
    },
    warning: '标记为食物但缺少食物信息，已设为默认值',
  },
  {
    name: 'food_type_mismatch',
    test: (r) => r.foodInfoSuggestion && !VALID_FOOD_TYPES.includes(r.foodInfoSuggestion.foodType),
    fix: (r) => { r.foodInfoSuggestion.foodType = 'COMMON'; },
    warning: '食物子类型无效，已重置为普通食物',
  },
  {
    name: 'condition_invalid',
    test: (r) => r.condition && !VALID_CONDITIONS.includes(r.condition),
    fix: (r) => { r.condition = 'UNKNOWN'; },
    warning: '物品状态值无效，已重置为未知',
  },
  {
    name: 'category_invalid',
    test: (r) => r.category && !VALID_CATEGORIES.includes(r.category),
    fix: (r) => { r.category = 'OTHER'; },
    warning: '分类值无效',
  },
  {
    name: 'confidence_range',
    test: (r) => r.confidence !== undefined && (r.confidence < 0 || r.confidence > 1),
    fix: (r) => { r.confidence = Math.max(0, Math.min(1, r.confidence)); },
    warning: '置信度超出 0-1 范围，已裁剪',
  },
];

/**
 * Calibrate an AI recognition result.
 *
 * @param {object} result - Raw LLM output
 * @param {object} [context] - User-provided context { title, description, category }
 * @returns {{ result: object, corrections: string[], originalWeight: number|null }}
 */
export function calibrateAiResult(result, context = {}) {
  const corrections = [];
  const originalWeight = result.estimatedWeightKg;

  // Deep clone to avoid mutating the original
  const r = { ...result };
  if (r.foodInfoSuggestion) r.foodInfoSuggestion = { ...r.foodInfoSuggestion };

  // 1. Run cross-validation checks
  for (const check of CROSS_CHECKS) {
    if (check.test(r)) {
      check.fix(r);
      corrections.push(check.warning);
    }
  }

  // 2. Clamp weight to category bounds
  if (r.category && r.category !== 'OTHER' && WEIGHT_BOUNDS[r.category]) {
    const bounds = WEIGHT_BOUNDS[r.category];
    if (r.estimatedWeightKg !== undefined && r.estimatedWeightKg !== null) {
      if (r.estimatedWeightKg < bounds.min) {
        corrections.push(`重量 ${r.estimatedWeightKg}kg 低于${bounds.label}下限 ${bounds.min}kg，已修正`);
        r.estimatedWeightKg = bounds.min;
      } else if (r.estimatedWeightKg > bounds.max) {
        corrections.push(`重量 ${r.estimatedWeightKg}kg 超过${bounds.label}上限 ${bounds.max}kg，已修正为 ${bounds.max}kg`);
        r.estimatedWeightKg = bounds.max;
      }
    } else {
      // No weight provided — use category default
      const defaultW = r.category === 'FOOD' ? 0.5 :
                       r.category === 'BOOKS' ? 0.8 :
                       r.category === 'DORM' ? 2.0 :
                       r.category === 'CLOTHING' ? 0.5 :
                       r.category === 'ELECTRONICS' ? 0.5 :
                       r.category === 'STATIONERY' ? 0.2 :
                       r.category === 'SPORTS' ? 1.0 : 1.0;
      r.estimatedWeightKg = defaultW;
    }
  }

  // 3. Food-specific weight clamping
  if (r.isFood && r.foodInfoSuggestion) {
    const foodBounds = FOOD_WEIGHT_BOUNDS[r.foodInfoSuggestion.foodType] || FOOD_WEIGHT_BOUNDS.COMMON;
    const fw = r.foodInfoSuggestion.weightKg || r.estimatedWeightKg;
    if (fw !== undefined) {
      if (fw < foodBounds.min) {
        corrections.push(`食物重量 ${fw}kg 过低，已修正为 ${foodBounds.min}kg`);
        r.foodInfoSuggestion.weightKg = foodBounds.min;
        r.estimatedWeightKg = foodBounds.min;
      } else if (fw > foodBounds.max) {
        corrections.push(`食物重量 ${fw}kg 过高，已修正为 ${foodBounds.max}kg`);
        r.foodInfoSuggestion.weightKg = foodBounds.max;
        r.estimatedWeightKg = foodBounds.max;
      }
    }
    // Clamp expiry days
    if (r.foodInfoSuggestion.expiryDays !== undefined) {
      if (r.foodInfoSuggestion.expiryDays < 1) {
        r.foodInfoSuggestion.expiryDays = 1;
      } else if (r.foodInfoSuggestion.expiryDays > 365) {
        r.foodInfoSuggestion.expiryDays = 365;
      }
    }
  }

  // 4. Title sanity check — must be non-empty, reasonable length
  if (r.titleSuggestion) {
    r.titleSuggestion = r.titleSuggestion.trim();
    if (r.titleSuggestion.length > 60) {
      r.titleSuggestion = r.titleSuggestion.substring(0, 60);
      corrections.push('标题过长，已截断至 60 字');
    }
  }

  // 5. If user provided a category hint and AI returned a different one,
  //    keep AI result but note the discrepancy
  if (context.category && context.category !== 'auto' && context.category !== r.category) {
    corrections.push(`用户选择 ${context.category}，AI 识别为 ${r.category}`);
  }

  // 6. Adjust confidence: start from AI confidence, penalize for each correction
  if (r.confidence !== undefined) {
    const penalty = corrections.length * 0.08;
    r.confidence = Math.max(0.1, Math.round((r.confidence - penalty) * 100) / 100);
  }

  return {
    result: r,
    corrections,
    originalWeight,
  };
}
