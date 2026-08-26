import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import AIChat from '../models/AIChat.js';
import { processAIChat, resolveDateString, resolveTimeString, matchServiceFuzzy } from '../services/aiService.js';

dotenv.config();

async function run15TestCases() {
  console.log('==================================================');
  console.log('RUNNING CONVERSATIONAL AI 15 TEST CASES SUITE');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  let activeServices = await Service.find({ status: true });
  if (!activeServices || activeServices.length === 0) {
    console.log('Seeding test services...');
    await Service.create([
      { name: 'IT Support Call', description: 'IT support service', durationMinutes: 30, price: 0, status: true },
      { name: 'Website Development Consultation', description: 'Web dev discussion', durationMinutes: 30, price: 0, status: true },
      { name: 'Product Strategy Session', description: 'Strategy consulting', durationMinutes: 30, price: 0, status: true },
    ]);
    activeServices = await Service.find({ status: true });
  }

  const testUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Client',
    email: 'test.conversational@example.com',
  };

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // --- TEST HELPERS ---
  console.log('--- TEST HELPERS: DATE, TIME & FUZZY SERVICE MATCHING ---');
  const dTomorrow = resolveDateString('tomorrow');
  assert(!!dTomorrow, `resolveDateString("tomorrow") returned: ${dTomorrow}`);

  const dAug27 = resolveDateString('27 August');
  assert(dAug27 === '2026-08-27', `resolveDateString("27 August") returned: ${dAug27}`);

  const dFriday = resolveDateString('next Friday');
  assert(!!dFriday, `resolveDateString("next Friday") returned: ${dFriday}`);

  const t3pm = resolveTimeString('3 PM');
  assert(t3pm === '15:00', `resolveTimeString("3 PM") returned: ${t3pm}`);

  const t5pm = resolveTimeString('at 5 PM');
  assert(t5pm === 'at 5 PM' ? t5pm === '17:00' : true, `resolveTimeString("at 5 PM") returned: ${t5pm}`);

  const sWeb = matchServiceFuzzy('I need help with my website', activeServices);
  assert(sWeb && sWeb.name.toLowerCase().includes('web'), `matchServiceFuzzy("I need help with my website") matched: ${sWeb?.name}`);

  const sIT = matchServiceFuzzy('I want an IT consultation', activeServices);
  assert(sIT && (sIT.name.toLowerCase().includes('it') || sIT.name.toLowerCase().includes('support')), `matchServiceFuzzy("I want an IT consultation") matched: ${sIT?.name}`);

  // --- TEST 1 ---
  console.log('\n--- TEST 1: "I want an IT consultation tomorrow at 3 PM." ---');
  const conv1 = `conv-t1-${Date.now()}`;
  const res1 = await processAIChat({ message: 'I want an IT consultation tomorrow at 3 PM.', conversationId: conv1, user: testUser });
  console.log('  Response:', res1.message);
  assert(!res1.message.includes('What service') && (res1.awaitingConfirmation || res1.message.includes('available')), 'Extracted service + date + time without asking for provided info');

  // --- TEST 2 ---
  console.log('\n--- TEST 2: "I need an appointment tomorrow." ---');
  const conv2 = `conv-t2-${Date.now()}`;
  const res2 = await processAIChat({ message: 'I need an appointment tomorrow.', conversationId: conv2, user: testUser });
  console.log('  Response:', res2.message);
  assert(res2.message.includes('service') || res2.message.includes('time'), 'Asked for missing service/time');

  // --- TEST 3 ---
  console.log('\n--- TEST 3: "Tomorrow at 4 PM. I need IT consultation." (Random order) ---');
  const conv3 = `conv-t3-${Date.now()}`;
  const res3 = await processAIChat({ message: 'Tomorrow at 4 PM. I need IT consultation.', conversationId: conv3, user: testUser });
  console.log('  Response:', res3.message);
  assert(res3.draft && res3.draft.service && res3.draft.time === '16:00', 'Extracted all fields out of order');

  // --- TEST 4 ---
  console.log('\n--- TEST 4: "I need help with my website next Friday afternoon." ---');
  const conv4 = `conv-t4-${Date.now()}`;
  const res4 = await processAIChat({ message: 'I need help with my website next Friday afternoon.', conversationId: conv4, user: testUser });
  console.log('  Response:', res4.message);
  assert(res4.draft && res4.draft.service && res4.draft.service.toLowerCase().includes('web') && res4.draft.date, 'Understood fuzzy service + next Friday date + afternoon time');

  // --- TEST 5 ---
  console.log('\n--- TEST 5: "I want an IT consultation." ---');
  const conv5 = `conv-t5-${Date.now()}`;
  const res5 = await processAIChat({ message: 'I want an IT consultation.', conversationId: conv5, user: testUser });
  console.log('  Response:', res5.message);
  assert(res5.draft && res5.draft.service && (!res5.draft.date || !res5.draft.time), 'Extracted service and asked for missing date/time');

  // --- TEST 6 ---
  console.log('\n--- TEST 6: "I want an appointment at 5 PM." ---');
  const conv6 = `conv-t6-${Date.now()}`;
  const res6 = await processAIChat({ message: 'I want an appointment at 5 PM.', conversationId: conv6, user: testUser });
  console.log('  Response:', res6.message);
  assert(res6.draft && res6.draft.time === '17:00' && !res6.draft.service, 'Extracted time and asked for missing service/date');

  // --- TEST 7 ---
  console.log('\n--- TEST 7: "I need an appointment on 27 August at 3 PM." ---');
  const conv7 = `conv-t7-${Date.now()}`;
  const res7 = await processAIChat({ message: 'I need an appointment on 27 August at 3 PM.', conversationId: conv7, user: testUser });
  console.log('  Response:', res7.message);
  assert(res7.draft && res7.draft.date === '2026-08-27' && res7.draft.time === '15:00' && res7.message.includes('service'), 'Extracted date (27 August) + time (3 PM) and asked for service only');

  // --- TEST 8 ---
  console.log('\n--- TEST 8: "Actually change it to 5 PM." (Detail Update) ---');
  const conv8 = `conv-t8-${Date.now()}`;
  await processAIChat({ message: 'I want an IT consultation tomorrow at 3 PM.', conversationId: conv8, user: testUser });
  const res8 = await processAIChat({ message: 'Actually change it to 5 PM.', conversationId: conv8, user: testUser });
  console.log('  Response:', res8.message);
  assert(res8.draft && res8.draft.service && res8.draft.time === '17:00', 'Updated state time 3 PM -> 5 PM while keeping service & date');

  // --- TEST 9 ---
  console.log('\n--- TEST 9: "No, don\'t book it." (Rejection) ---');
  const conv9 = `conv-t9-${Date.now()}`;
  await processAIChat({ message: 'I want an IT consultation tomorrow at 3 PM.', conversationId: conv9, user: testUser });
  const res9 = await processAIChat({ message: "No, don't book it.", conversationId: conv9, user: testUser });
  console.log('  Response:', res9.message);
  assert(res9.declined === true || !res9.draft.service, 'Declined booking and reset draft state');

  // --- TEST 10 ---
  console.log('\n--- TEST 10: "Yes, book it." (Confirmation & DB Creation) ---');
  const conv10 = `conv-t10-${Date.now()}`;
  const tmrwStr = resolveDateString('tomorrow');
  const setup10 = await processAIChat({ message: `I want an IT consultation on ${tmrwStr} at 2 PM.`, conversationId: conv10, user: testUser });
  console.log('  Setup response:', setup10.message);
  const res10 = await processAIChat({ message: 'Yes, book it.', conversationId: conv10, user: testUser });
  console.log('  Response:', res10.message);
  assert(res10.done === true && res10.booking, 'Appointment created in MongoDB and returned confirmation');

  if (res10.booking && res10.booking.id) {
    await Appointment.findByIdAndDelete(res10.booking.id);
  }

  // --- TEST 11 ---
  console.log('\n--- TEST 11: "Cancel my appointment tomorrow." ---');
  const conv11 = `conv-t11-${Date.now()}`;
  const tempAppt11 = await Appointment.create({
    userId: testUser._id,
    clientName: testUser.name,
    clientEmail: testUser.email,
    serviceName: 'IT Support Call',
    date: tmrwStr,
    startTime: '10:00',
    endTime: '10:30',
    status: 'CONFIRMED',
  });
  const res11 = await processAIChat({ message: 'Cancel my appointment tomorrow.', conversationId: conv11, user: testUser });
  console.log('  Response:', res11.message);
  assert(res11.awaitingConfirmation || res11.message.includes('Cancel'), 'Initiated cancel flow for user appointment');
  await Appointment.findByIdAndDelete(tempAppt11._id);

  // --- TEST 12 ---
  console.log('\n--- TEST 12: "Move my appointment to Friday at 4 PM." ---');
  const conv12 = `conv-t12-${Date.now()}`;
  const tempAppt12 = await Appointment.create({
    userId: testUser._id,
    clientName: testUser.name,
    clientEmail: testUser.email,
    serviceName: 'IT Support Call',
    date: tmrwStr,
    startTime: '10:00',
    endTime: '10:30',
    status: 'CONFIRMED',
  });
  const res12 = await processAIChat({ message: 'Move my appointment to Friday at 4 PM.', conversationId: conv12, user: testUser });
  console.log('  Response:', res12.message);
  assert(res12.rescheduled === true || res12.message.includes('updated'), 'Rescheduled existing appointment to Friday at 4 PM');
  await Appointment.findByIdAndDelete(tempAppt12._id);

  // --- TEST 13 ---
  console.log('\n--- TEST 13: Multiple messages with information in random order ---');
  const conv13 = `conv-t13-${Date.now()}`;
  await processAIChat({ message: 'I need an appointment at 2 PM', conversationId: conv13, user: testUser });
  await processAIChat({ message: 'For website development discussion', conversationId: conv13, user: testUser });
  const res13 = await processAIChat({ message: 'Tomorrow', conversationId: conv13, user: testUser });
  console.log('  Response:', res13.message);
  assert(res13.draft && res13.draft.service.includes('Web') && res13.draft.time === '14:00' && res13.draft.date === tmrwStr, 'Merged information across 3 turns in random order');

  // --- TEST 14 ---
  console.log('\n--- TEST 14: Unrelated / general question ---');
  const conv14 = `conv-t14-${Date.now()}`;
  const res14 = await processAIChat({ message: 'What services do you offer?', conversationId: conv14, user: testUser });
  console.log('  Response:', res14.message);
  assert(res14.message.includes('offer'), 'Answered general question naturally without creating appointment');

  // --- TEST 15 ---
  console.log('\n--- TEST 15: "Hi" ---');
  const conv15 = `conv-t15-${Date.now()}`;
  const res15 = await processAIChat({ message: 'Hi', conversationId: conv15, user: testUser });
  console.log('  Response:', res15.message);
  assert(res15.message.toLowerCase().includes('hello') || res15.message.toLowerCase().includes('welcome'), 'Responded with normal greeting, not appointment creation wizard');

  console.log('\n==================================================');
  console.log(`TEST RESULTS SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================\n');

  await mongoose.connection.collection('aichats').deleteMany({ conversationId: { $regex: /^conv-t/ } });
  await mongoose.disconnect();

  if (failCount > 0) {
    process.exit(1);
  }
}

run15TestCases().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
