import mongoose from 'mongoose';
import { processAIChat } from '../services/aiService.js';
import Appointment from '../models/Appointment.js';
import AIChat from '../models/AIChat.js';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('--- TESTING EXACT USER PHRASES: "I want cancel the Booking" ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  const testClient = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Oliver Queen',
    email: 'oliver.queen@example.com',
  };

  const testDate = '2026-08-28';
  const testTime = '11:00';

  // 1. Create active appointment
  await Appointment.deleteMany({ clientEmail: testClient.email });
  const appt = await Appointment.create({
    userId: testClient._id,
    clientName: testClient.name,
    clientEmail: testClient.email,
    serviceName: 'Web Development Consultation',
    date: testDate,
    startTime: testTime,
    endTime: '11:30',
    duration: 30,
    status: 'CONFIRMED',
    source: 'ai-chat',
  });

  // 2. Client sends exact phrase: "I want cancel the Booking"
  const convId = `test-exact-phrase-${Date.now()}`;
  console.log('User input: "I want cancel the Booking"');
  const res1 = await processAIChat({
    message: 'I want cancel the Booking',
    conversationId: convId,
    user: testClient,
  });

  console.log('AI Response:', res1.message);
  console.log('Check 1: Does not show service list ("What service would you like to book"):', !res1.message.includes('What service would you like to book') ? 'PASS' : 'FAIL');
  console.log('Check 2: Asks "You Sure Cancel The Slot":', res1.message.includes('You Sure Cancel The Slot') ? 'PASS' : 'FAIL');

  // 3. User confirms cancellation
  console.log('\nUser input: "yes"');
  const res2 = await processAIChat({
    message: 'yes',
    conversationId: convId,
    user: testClient,
  });
  console.log('AI Response:', res2.message);
  console.log('Check 3: Slot cancelled and released:', res2.cancelled === true ? 'PASS' : 'FAIL');

  // 4. Test when no appointment exists
  console.log('\nUser input (no active appointments left): "I want cancel the Booking"');
  const res3 = await processAIChat({
    message: 'I want cancel the Booking',
    conversationId: `no-appt-conv-${Date.now()}`,
    user: testClient,
  });
  console.log('AI Response:', res3.message);
  console.log('Check 4: Explains no active appointments found:', res3.message.includes('couldn\'t find any active booked appointments') ? 'PASS' : 'FAIL');

  console.log('\n--- EXACT USER PHRASE TESTS COMPLETED ---');

  // Auto-cleanup test records
  await Appointment.deleteMany({ _id: appt._id });
  await AIChat.deleteMany({ clientEmail: testClient.email });
  await mongoose.disconnect();
}

runTest().catch(console.error);
