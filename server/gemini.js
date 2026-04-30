import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const gemini = {
  model: genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }),
};

export default gemini;