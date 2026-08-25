import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testPrompt() {
  const prompt = `
You are an expert AI Solution Architect & Technical Assistant for Nexora Technologies.
Available Services:
1. Web Development Consultation (30 min, Free): Scoping and architecture for new websites, SaaS, apps, React/Node.
2. IT Support Call (20 min, Free): Troubleshooting server down, crashes, infrastructure, database, cloud, bugs.
3. Product Strategy Session (45 min, $149): Product roadmaps, technical architecture, scaling, startup MVP strategy.
4. Security Audit Intro (30 min, Free): Security audits, vulnerabilities, SSL/TLS, compliance, penetration testing.

Client message: "Our production server keeps crashing with high CPU usage and memory leaks. How can you help us fix this and can I get someone to look at it tomorrow at 3pm?"

Task:
1. Provide a concise, expert diagnostic explanation (1-2 sentences) solving/troubleshooting this (e.g. heap dumps, monitoring process loops, profiling memory).
2. Recommend the best matching service (IT Support Call).
3. Be friendly, expert, and under 60 words.
`;

  const models = [process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
  let text = null;
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (res && res.text) {
        text = res.text;
        console.log(`[Used Model: ${model}]`);
        break;
      }
    } catch (err) {
      console.warn(`[Model ${model} failed]:`, err.message);
    }
  }

  console.log('Gemini Problem-Solving Response:');
  console.log(text || 'Fallback rule engine active.');
}

testPrompt().catch(console.error);
