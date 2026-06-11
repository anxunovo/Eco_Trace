import { query } from './db.js';
import { estimateCarbonFromCatalog } from '../../../new-site/public/assets/carbon-coefficients.js';

function roundCarbon(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function catalogFallback(input) {
  const result = estimateCarbonFromCatalog(input);
  return {
    carbonSavedKg: result.estimatedCarbonSavedKg,
    weightKg: result.weightKg || input.weightKg || 0,
    assumptions: result.assumptions,
    confidence: result.confidence,
    source: result.source || 'catalog',
  };
}

/**
 * Estimate carbon saved for a listing.
 * Returns { carbonSavedKg, weightKg, assumptions, confidence, source }
 */
export async function estimateCarbon({ category, weightKg, foodInfo, condition }) {
  if (category === 'FOOD' && foodInfo) {
    return estimateFoodCarbon(foodInfo);
  }

  const rows = await query(
    `SELECT factor, substitution_rate, default_weight_kg, source, source_ref, mode
     FROM carbon_coefficients
     WHERE category = ? AND subcategory IS NULL AND effective_to IS NULL
     ORDER BY effective_from DESC LIMIT 1`,
    [category]
  );

  const coeff = rows.rows[0];
  if (!coeff) {
    return catalogFallback({ category, weightKg, foodInfo, condition });
  }

  const { factor, substitution_rate, default_weight_kg, source, source_ref, mode } = coeff;
  const w = weightKg ?? default_weight_kg ?? 1.0;

  let carbon;
  if (mode === 'per_item') {
    carbon = factor * substitution_rate;
  } else {
    carbon = w * factor * substitution_rate;
  }

  return {
    carbonSavedKg: roundCarbon(carbon),
    weightKg: w,
    assumptions: [`基于 ${source}/${source_ref} 系数`, `置换率 ${substitution_rate}`],
    confidence: weightKg ? 0.8 : 0.5,
    source,
  };
}

async function estimateFoodCarbon(foodInfo) {
  const foodType = foodInfo.foodType || 'COMMON';
  const weight = foodInfo.weightKg || 0.5;

  const rows = await query(
    `SELECT factor, substitution_rate, source, source_ref
     FROM carbon_coefficients
     WHERE category = 'FOOD' AND subcategory = ? AND effective_to IS NULL
     ORDER BY effective_from DESC LIMIT 1`,
    [foodType]
  );

  const coeff = rows.rows[0];
  if (!coeff) {
    return catalogFallback({ category: 'FOOD', foodInfo: { ...foodInfo, weightKg: weight } });
  }

  const { factor, substitution_rate, source, source_ref } = coeff;
  const carbon = weight * factor * substitution_rate;

  return {
    carbonSavedKg: roundCarbon(carbon),
    weightKg: weight,
    assumptions: [`食物类 ${foodType}`, `基于 ${source}/${source_ref}`],
    confidence: 0.75,
    source,
  };
}
