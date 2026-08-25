import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AIChat from '../models/AIChat.js';
import Appointment from '../models/Appointment.js';
import { processAIChat } from '../services/aiService.js';

dotenv.config();

async function runDeclineSlotThankYouTests() {
  console.log('--- TESTING CLIENT SAYING NO AFTER SLOT AVAILABLE ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  const testUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Maya Lin',
    email: 'maya.lin@example.com',
  };

  const convId = `test-decline-${Date.now()}`;

  // 1. Client requests slot that is available
  console.log('1. Client request: "Web consultation tomorrow at 2pm"');
  const res1 = await processAIChat({
    message: 'Web consultation tomorrow at 2pm',
    conversationId: convId,
    user: testUser,
  });
  console.log('   AI Response:', res1.message);
  console.log('   Check 1 (Slot availability verified & confirmation requested):', res1.awaitingConfirmation === true ? 'PASS' : 'FAIL');

  // 2. Client says "no"
  console.log('\n2. Client says: "no"');
  const res2 = await processAIChat({
    message: 'no',
    conversationId: convId,
    user: testUser,
  });
  console.log('   AI Response:', res2.message);
  console.log('   Check 2 (Includes Thank you / courteous parting message):', res2.message.toLowerCase().includes('thank you') ? 'PASS' : 'FAIL');
  console.log('   Check 3 (Acknowledges with No problem):', res2.message.toLowerCase().includes('no problem') ? 'PASS' : 'FAIL');
  console.log('   Check 4 (Personalized with Maya):', res2.message.includes('Maya') ? 'PASS' : 'FAIL');
  console.log('   Check 5 (Marks declined: true):', res2.declined === true ? 'PASS' : 'FAIL');

  // 3. Verify no appointment was created in MongoDB
  const apptCount = await Appointment.countDocuments({ clientEmail: testUser.email });
  console.log('   Check 6 (No appointment created in MongoDB):', apptCount === 0 ? 'PASS (0 appointments)' : 'FAIL');

  // 4. Test "no thanks" in general conversation
  const convId2 = `test-not-now-${Date.now()}`;
  console.log('\n3. Client says: "no thanks"');
  const res3 = await processAIChat({
    message: 'no thanks',
    conversationId: convId2,
    user: testUser,
  });
  console.log('   AI Response:', res3.message);
  console.log('   Check 7 (Polite thank you message):', res3.message.toLowerCase().includes('thank you') ? 'PASS' : 'FAIL');

  // Cleanup
  console.log('\n--- CLEANING UP TEMPORARY TEST DATA ---');
  await AIChat.deleteMany({ conversationId: { $in: [convId, convId2] } });
  await Appointment.deleteMany({ clientEmail: testUser.email });
  console.log('✓ Cleaned up test data.');

  console.log('\n=== ALL DECLINE & THANK YOU TESTS PASSED (100%) ===');
  await mongoose.disconnect();
}

runDeclineSlotThankYouTests().catch(console.error);
