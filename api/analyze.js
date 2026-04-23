export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  return res.status(200).json({ 
    keyExists: !!GEMINI_API_KEY,
    keyLength: GEMINI_API_KEY?.length || 0
  });
}
