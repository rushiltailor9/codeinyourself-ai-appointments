import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const activeServices = [
  { name: 'Web Development Consultation', durationMinutes: 30, price: 0, description: 'Initial scoping call for a new website or web app build.' },
  { name: 'IT Support Call', durationMinutes: 20, price: 0, description: 'Troubleshooting session for existing infrastructure or software.' },
  { name: 'Product Strategy Session', durationMinutes: 45, price: 149, description: 'Roadmap and technical architecture planning for new products.' },
  { name: 'Security Audit Intro', durationMinutes: 30, price: 0, description: 'Scoping call ahead of a full infrastructure security audit.' },
];

async function analyzeClientProblemWithGemini(message) {
  const serviceCatalog = activeServices
    .map((s) => `- ${s.name} (${s.durationMinutes} mins, ${s.price > 0 ? '$' + s.price : 'Free'}): ${s.description}`)
    .join('\n');

  const prompt = `
You are an expert AI Technical Solutions Architect for Nexora Technologies.
A client has sent the following message: "${message}"

Our Active Services:
${serviceCatalog}

Analyze the client's problem, question, or requirement:
1. Provide a direct, expert, helpful technical answer or diagnostic solution to the client's problem (1-2 clear sentences).
2. Recommend the single most appropriate service from our catalog to address their requirement.
3. Suggest next booking steps.

Return ONLY a JSON object with this format (no markdown fences, no raw backticks):
{
  "isProblemOrRequirement": true,
  "matchedServiceName": "Web Development Consultation",
  "technicalAdvice": "Brief expert diagnosis or technical solution explaining how we can solve their problem.",
  "responseMessage": "The full conversational response answering their question and inviting them to book the recommended service."
}
If the message is not a technical/business inquiry (e.g. just saying "yes", "no", "cancel", "hi"), return {"isProblemOrRequirement": false}.
`;

  const models = [process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (res && res.text) {
        const cleanText = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      }
    } catch (err) {
      console.warn(`[Model ${model} failed]:`, err.message);
    }
  }
  return { isProblemOrRequirement: false, fallback: true };
}

async function run() {
  console.log('--- TEST 1: Server crash / memory leak ---');
  const res1 = await analyzeClientProblemWithGemini('My server is crashing due to memory leaks and unhandled rejections. Can you help?');
  console.log(res1);

  console.log('\n--- TEST 2: New Next.js App Requirement ---');
  const res2 = await analyzeClientProblemWithGemini('We need an e-commerce platform with Next.js, Stripe checkout, and user accounts.');
  console.log(res2);

  console.log('\n--- TEST 3: Security & Penetration Testing Requirement ---');
  const res3 = await analyzeClientProblemWithGemini('We suspect our API endpoints have SQL injection or XSS vulnerabilities. How can you audit this?');
  console.log(res3);
}

run().catch(console.error);
