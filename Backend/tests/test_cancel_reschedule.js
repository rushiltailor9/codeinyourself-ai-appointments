import mongoose from 'mongoose';
import { processAIChat } from '../services/aiService.js';
import Appointment from '../models/Appointment.js';
import AIChat from '../models/AIChat.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { validateSlotAvailability } from '../services/availabilityService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCancelAndRescheduleFlow() {
  console.log('--- STARTING AI CANCELLATION CONFIRMATION & RESCHEDULE TESTS ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  // Prepare test clients
  const clientA = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Client Alpha',
    email: 'client_alpha@example.com',
  };
  const clientB = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Client Beta',
    email: 'client_beta@example.com',
  };

  const testDate = '2026-08-28'; // Friday
  const testTime = '10:00';

  // Clean up any test appointments on this slot
  await Appointment.deleteMany({ date: testDate });

  // 1. Create active appointment for Client A
  const apptA = await Appointment.create({
    userId: clientA._id,
    clientName: clientA.name,
    clientEmail: clientA.email,
    serviceName: 'Web Development Consultation',
    date: testDate,
    startTime: testTime,
    endTime: '10:30',
    duration: 30,
    status: 'CONFIRMED',
    source: 'ai-chat',
  });
  console.log(`1. Created active appointment for Client A on ${testDate} at ${testTime}`);

  // 2. Client A requests cancellation via AI
  const convIdA = `test-conv-cancel-${Date.now()}`;
  console.log('2. Client A asks AI: "I want to cancel my booking slot"');
  const cancelPromptRes = await processAIChat({
    message: 'I want to cancel my booking slot',
    conversationId: convIdA,
    user: clientA,
  });
  console.log('   AI Response:', cancelPromptRes.message);
  console.log('   Passes cancel confirmation check:', cancelPromptRes.message.includes('You Sure Cancel The Slot') ? 'PASS' : 'FAIL');

  // 3. Client A confirms cancellation
  console.log('3. Client A responds: "Yes confirm"');
  const cancelConfirmRes = await processAIChat({
    message: 'Yes confirm',
    conversationId: convIdA,
    user: clientA,
  });
  console.log('   AI Response:', cancelConfirmRes.message);
  console.log('   Passes cancellation success check:', cancelConfirmRes.cancelled === true ? 'PASS' : 'FAIL');

  // Verify slot is now open in MongoDB
  const slotAfterCancel = await validateSlotAvailability(testDate, testTime, 30);
  console.log('   Slot availability after cancellation (Valid should be true):', slotAfterCancel.valid ? 'PASS (Slot is released for others)' : 'FAIL');

  // 4. Client B books the released slot
  console.log(`\n4. Client B books the released slot ${testDate} at ${testTime}...`);
  const apptB = await Appointment.create({
    userId: clientB._id,
    clientName: clientB.name,
    clientEmail: clientB.email,
    serviceName: 'Web Development Consultation',
    date: testDate,
    startTime: testTime,
    endTime: '10:30',
    duration: 30,
    status: 'CONFIRMED',
    source: 'ai-chat',
  });
  console.log('   Client B booking created successfully.');

  // 5. Client B requests reschedule
  const convIdB = `test-conv-resched-${Date.now()}`;
  console.log('5. Client B asks AI: "I want to update my appointment time"');
  const reschedPromptRes = await processAIChat({
    message: 'I want to update my appointment time',
    conversationId: convIdB,
    user: clientB,
  });
  console.log('   AI Response:', reschedPromptRes.message);
  console.log('   Passes "You want to update Date or Time" check:', reschedPromptRes.message.includes('update Date or Time') ? 'PASS' : 'FAIL');

  // 6. Client B provides unavailable slot (Sunday 2026-08-30 at 11:00)
  console.log('6. Client B requests unavailable slot: "Move to Sunday 2026-08-30 at 11am"');
  const unavailRes = await processAIChat({
    message: 'Move to 2026-08-30 at 11:00',
    conversationId: convIdB,
    user: clientB,
  });
  console.log('   AI Response:', unavailRes.message);
  console.log('   Passes Sunday rejection during reschedule:', unavailRes.message.includes('closed on Sundays') ? 'PASS' : 'FAIL');

  // 7. Client B provides valid new slot: "2026-08-28 at 14:00"
  console.log('7. Client B requests valid slot: "2026-08-28 at 14:00"');
  const validReschedRes = await processAIChat({
    message: '2026-08-28 at 14:00',
    conversationId: convIdB,
    user: clientB,
  });
  console.log('   AI Response:', validReschedRes.message);
  console.log('   Passes reschedule success:', validReschedRes.rescheduled === true ? 'PASS' : 'FAIL');

  const updatedApptB = await Appointment.findById(apptB._id);
  console.log(`   MongoDB Updated Time: ${updatedApptB.startTime} (Expected 14:00):`, updatedApptB.startTime === '14:00' ? 'PASS' : 'FAIL');

  console.log('\n--- ALL CANCELLATION AND RESCHEDULING TESTS COMPLETED SUCCESSFULLY ---');

  // Auto-cleanup test records
  await Appointment.deleteMany({ _id: { $in: [apptA._id, apptB._id] } });
  await AIChat.deleteMany({ conversationId: { $in: [convIdA, convIdB] } });
  await mongoose.disconnect();
}

testCancelAndRescheduleFlow().catch(console.error);
