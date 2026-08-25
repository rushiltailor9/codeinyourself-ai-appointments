import mongoose from 'mongoose';
import { processAIChat } from '../services/aiService.js';
import Appointment from '../models/Appointment.js';
import dotenv from 'dotenv';

dotenv.config();

async function runUpdateTest() {
  console.log('--- TESTING EXACT USER PHRASE: "Update slot" ---');
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

  // 2. Client sends: "I want to update slot"
  const convId = `test-update-conv-${Date.now()}`;
  console.log('User input: "I want to update slot"');
  const res1 = await processAIChat({
    message: 'I want to update slot',
    conversationId: convId,
    user: testClient,
  });

  console.log('AI Response:', res1.message);
  console.log('Check 1: Asks "You want to update Date or Time":', res1.message.includes('You want to update Date or Time') ? 'PASS' : 'FAIL');

  // 3. User specifies new date and time: "2026-08-28 at 15:00"
  console.log('\nUser input: "2026-08-28 at 15:00"');
  const res2 = await processAIChat({
    message: '2026-08-28 at 15:00',
    conversationId: convId,
    user: testClient,
  });
  console.log('AI Response:', res2.message);
  console.log('Check 2: Slot updated with confirmation:', res2.rescheduled === true ? 'PASS' : 'FAIL');

  console.log('\n--- UPDATE PHRASE TESTS COMPLETED ---');
  await mongoose.disconnect();
}

runUpdateTest().catch(console.error);
