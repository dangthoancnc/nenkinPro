const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.error('No API key found in env.');
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(keys[0]);
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-pro-vision', 'gemini-1.5-flash-latest'];
  
  for (const modelName of models) {
    try {
      console.log('Testing', modelName);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello world');
      console.log('Response for', modelName, ':', await result.response.text());
      console.log('SUCCESS:', modelName);
      return;
    } catch (error) {
      console.error('API Error for', modelName, ':', error.message);
    }
  }
}

run();
