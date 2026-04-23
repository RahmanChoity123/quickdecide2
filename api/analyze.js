// Gemini 2.0 Flash — Free tier (1500 requests/day)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tasks } = req.body;
  if (!tasks || typeof tasks !== 'string') {
    return res.status(400).json({ error: 'Tasks required' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const prompt = `You are a ruthlessly efficient AI chief of staff for a busy LinkedIn professional. Analyze this task list and categorize each item into exactly one of: DO (do it yourself NOW - high value + urgent), DELEGATE (someone else should do this), DEFER (do later, not urgent), DELETE (not worth doing).

Return ONLY valid JSON, no markdown fences, no explanation. Format:
{
  "tasks": [
    {
      "title": "short task name",
      "category": "DO|DELEGATE|DEFER|DELETE",
      "emoji": "relevant emoji",
      "reason": "one punchy sentence why",
      "priority": "HIGH|MED|LOW"
    }
  ],
  "insight": "One powerful insight about this person's task list (2-3 sentences, brutally honest, actionable)",
  "hoursSaved": number between 1 and 5
}

Task list:
${tasks}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
