import { analyzeImages } from './_lib/ai-client.js';
import { calibrateAiResult } from './_lib/ai-calibrator.js';
import { estimateCarbon } from './_lib/carbon-engine.js';
import { ok, badRequest, methodNotAllowed, cors } from './_lib/response.js';

export const config = {
  path: '/api/ai/analyze'
};

export default async function reqHandler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return methodNotAllowed(req);

  try {
    const body = await req.json();
    const { images, title, description, category } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return badRequest('Missing or empty images array', req);
    }
    if (images.length > 5) {
      return badRequest('Maximum 5 images allowed', req);
    }

    const MAX_SIZE_BYTES = 4 * 1024 * 1024;
    for (const img of images) {
      const base64Data = img.split(',')[1] || img;
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > MAX_SIZE_BYTES) {
        return badRequest('Image exceeds 4MB limit', req);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let rawResult;
    try {
      rawResult = await analyzeImages({
        images,
        title,
        description,
        category,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('AI analysis error:', error);
      rawResult = {
        category: 'OTHER',
        condition: 'UNKNOWN',
        estimatedWeightKg: 1.0,
        confidence: 0,
        assumptions: ['AI service unavailable, using defaults'],
        fallback: true,
      };
    }

    // Calibrate: clamp weights, cross-validate, adjust confidence
    const { result, corrections } = calibrateAiResult(rawResult, { title, description, category });
    if (corrections.length > 0) {
      result.calibrations = corrections;
    }

    // Use carbon-engine for accurate estimation instead of hardcoded formula
    try {
      const carbonResult = await estimateCarbon({
        category: result.category,
        weightKg: result.estimatedWeightKg,
        foodInfo: result.isFood ? result.foodInfoSuggestion : null,
        condition: result.condition,
      });
      result.carbonSavedEstimate = {
        amount: carbonResult.carbonSavedKg,
        unit: 'kg CO2e',
      };
      result.carbonSource = carbonResult.source;
      // Upgrade confidence if carbon-engine has higher confidence
      if (carbonResult.confidence > (result.confidence || 0)) {
        result.confidence = Math.min(result.confidence + 0.1, carbonResult.confidence);
      }
      // Append carbon assumptions
      result.assumptions = [...(result.assumptions || []), ...(carbonResult.assumptions || [])];
    } catch (carbonErr) {
      // Fallback if carbon-engine fails (e.g., DB unavailable)
      const weight = result.estimatedWeightKg || 1.0;
      result.carbonSavedEstimate = {
        amount: parseFloat((weight * 2.5 * 0.8).toFixed(2)),
        unit: 'kg CO2e',
      };
      result.carbonSource = 'fallback';
    }

    return ok(result, req);
  } catch (error) {
    console.error('Request parsing error:', error);
    return badRequest('Invalid request body', req);
  }
}
