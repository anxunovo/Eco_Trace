const PROMPT = `You are an AI assistant for a campus second-hand marketplace (汕头大学).
Analyze this image and return ONLY valid JSON, no markdown.

Fields:
- category: one of [BOOKS, CLOTHING, ELECTRONICS, DORM, SPORTS, FOOD, STATIONERY]
- isFood: boolean
- condition: one of [NEW, LIKE_NEW, GOOD, FAIR, UNKNOWN]
- estimatedWeightKg: number (realistic weight in kg, NOT volume)
- titleSuggestion: string (Chinese, ≤40 chars)
- descriptionSuggestion: string (Chinese, ~50 chars)
- foodInfoSuggestion: if isFood, { foodType: one of [COMMON, MEAT, VEG, SNACK], expiryDays: number }
- confidence: number 0-1
- assumptions: array of strings

WEIGHT GUIDELINES (be realistic, not optimistic):
  Textbooks: 0.3-1.5 kg each  | Clothing: 0.2-1.5 kg per piece
  Electronics (headphones/lamp): 0.1-2 kg | Large electronics (monitor): 3-10 kg
  Dorm items (shelf/fan): 0.5-8 kg | Stationery: 0.05-0.5 kg
  Sports (racket/ball): 0.1-2 kg | Food portions: 0.1-2 kg

Return ONLY valid JSON.`;

async function callZhipuAI(imageUrl, title, description, category, signal) {
  const userPrompt = `User provided: title="${title}", description="${description}", category="${category || 'auto'}"\n${PROMPT}`;
  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ZHIPUAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4v-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }],
          temperature: 0.3,
        }),
        signal
      });

      if (!response.ok) {
        const errStr = await response.text();
        let errJson;
        try { errJson = JSON.parse(errStr); } catch {}

        const isRateLimit = errJson && errJson.error &&
          (errJson.error.code === '1302' || errJson.error.code === '1305' ||
           errJson.error.code === 1302 || errJson.error.code === 1305);

        if (isRateLimit && attempt < MAX_RETRIES) {
          attempt++;
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(`ZhipuAI API error ${response.status}: ${errStr}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('ZhipuAI API error')) throw error;
      throw error;
    }
  }
}

function mergeResults(results) {
  if (results.length === 1) return results[0];

  // Sort by confidence descending
  const sorted = [...results].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const best = { ...sorted[0] };

  // Category voting: if majority agree, boost confidence
  const catCounts = {};
  for (const r of results) {
    if (r.category) catCounts[r.category] = (catCounts[r.category] || 0) + 1;
  }
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] > results.length / 2) {
    best.category = topCat[0];
    best.confidence = Math.min((best.confidence || 0) + 0.05 * (topCat[1] - 1), 1);
  }

  // Collect all assumptions
  const allAssumptions = [...new Set(results.flatMap(r => r.assumptions || []))];
  if (results.length > 1) allAssumptions.push(`分析了 ${results.length} 张图片`);
  best.assumptions = allAssumptions;

  return best;
}

export async function analyzeImages({ images, title, description, category, signal }) {
  // Send each image as a separate parallel request (glm-4v-flash only supports 1 image)
  const tasks = images.map(img => callZhipuAI(img, title, description, category, signal));
  const settled = await Promise.allSettled(tasks);

  const successes = settled
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  if (successes.length === 0) {
    const firstErr = settled[0]?.reason;
    throw firstErr || new Error('All image analysis requests failed');
  }

  return mergeResults(successes);
}
