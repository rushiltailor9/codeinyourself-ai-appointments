import mongoose from 'mongoose';
import { processAIChat } from '../services/aiService.js';
import dotenv from 'dotenv';

dotenv.config();

async function runThankYouGreetingTests() {
  console.log('--- TESTING THANK YOU & GREETING INTENT FLOWS ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  const testUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
  };

  const convId = `test-thanks-${Date.now()}`;

  // 1. Test "Thank you" with authenticated user
  console.log('1. User input: "Thank you"');
  const res1 = await processAIChat({
    message: 'Thank you',
    conversationId: convId,
    user: testUser,
  });
  console.log('   AI Response:', res1.message);
  console.log('   Check 1 (Includes "welcome"):', res1.message.toLowerCase().includes('welcome') ? 'PASS' : 'FAIL');
  console.log('   Check 2 (Includes "Thank you"):', res1.message.toLowerCase().includes('thank you') ? 'PASS' : 'FAIL');
  console.log('   Check 3 (Includes personalized name "Sarah"):', res1.message.includes('Sarah') ? 'PASS' : 'FAIL');

  // 2. Test "Thank you so much!"
  console.log('\n2. User input: "Thank you so much!"');
  const res2 = await processAIChat({
    message: 'Thank you so much!',
    conversationId: convId,
    user: testUser,
  });
  console.log('   AI Response:', res2.message);
  console.log('   Check 4 (Response contains courteous greeting/parting message):', res2.message.includes('Nexora') ? 'PASS' : 'FAIL');

  // 3. Test "Thanks a lot"
  console.log('\n3. User input: "Thanks a lot"');
  const res3 = await processAIChat({
    message: 'Thanks a lot',
    conversationId: convId,
    user: null,
  });
  console.log('   AI Response:', res3.message);
  console.log('   Check 5 (Handles guest user politely):', res3.message.toLowerCase().includes('welcome') ? 'PASS' : 'FAIL');

  // 4. Test "Hello" greeting
  console.log('\n4. User input: "Hello"');
  const convId2 = `test-greet-${Date.now()}`;
  const res4 = await processAIChat({
    message: 'Hello',
    conversationId: convId2,
    user: testUser,
  });
  console.log('   AI Response:', res4.message);
  console.log('   Check 6 (Greeting message):', res4.message.includes('Welcome to Nexora') ? 'PASS' : 'FAIL');

  console.log('\n--- ALL THANK YOU & GREETING TESTS COMPLETED ---');

  // Auto-cleanup test conversations
  await mongoose.connection.collection('aichats').deleteMany({
    conversationId: { $in: [convId, convId2] },
  });
  await mongoose.disconnect();
}

runThankYouGreetingTests().catch(console.error);
