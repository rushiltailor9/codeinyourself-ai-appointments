import { validateSlotAvailability } from '../services/availabilityService.js';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Availability from '../models/Availability.js';
import dotenv from 'dotenv';

dotenv.config();

async function runValidationTests() {
  console.log('--- TESTING TIME, SUNDAY & OVERLAP VALIDATION RULES ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  // Test 1: Sunday booking
  // 2026-08-30 is Sunday
  const sundayRes = await validateSlotAvailability('2026-08-30', '11:00', 30);
  console.log('1. Sunday Booking Validation:');
  console.log('   Valid:', sundayRes.valid, '| Message:', sundayRes.message);
  console.log('   Check:', sundayRes.valid === false && sundayRes.message.includes('closed on Sundays') ? 'PASS' : 'FAIL');

  // Test 2: Before 9:00 AM (e.g., 08:00 AM on Wednesday 2026-08-26)
  const before9Res = await validateSlotAvailability('2026-08-26', '08:00', 30);
  console.log('\n2. Before 9:00 AM Booking Validation:');
  console.log('   Valid:', before9Res.valid, '| Message:', before9Res.message);
  console.log('   Check:', before9Res.valid === false && before9Res.message.includes('9:00 AM to 6:00 PM') ? 'PASS' : 'FAIL');

  // Test 3: After 6:00 PM (e.g., 19:00 / 7:00 PM on Wednesday 2026-08-26)
  const after6Res = await validateSlotAvailability('2026-08-26', '19:00', 30);
  console.log('\n3. After 6:00 PM Booking Validation:');
  console.log('   Valid:', after6Res.valid, '| Message:', after6Res.message);
  console.log('   Check:', after6Res.valid === false && after6Res.message.includes('9:00 AM to 6:00 PM') ? 'PASS' : 'FAIL');

  // Test 4: Overlapping / Already Booked Slot
  const testDate = '2026-08-27';
  const testTime = '11:00';
  await Appointment.deleteMany({ date: testDate, startTime: testTime });

  await Appointment.create({
    clientName: 'User One',
    clientEmail: 'user1@example.com',
    serviceName: 'Web Development Consultation',
    date: testDate,
    startTime: testTime,
    endTime: '11:30',
    duration: 30,
    status: 'CONFIRMED',
  });

  // User B tries to book the same slot
  const overlapRes = await validateSlotAvailability(testDate, testTime, 30);
  console.log('\n4. Duplicate / Already Booked Slot Validation:');
  console.log('   Valid:', overlapRes.valid, '| Message:', overlapRes.message);
  console.log('   Check:', overlapRes.valid === false && overlapRes.message.includes('already Booked') ? 'PASS' : 'FAIL');

  console.log('\n--- ALL VALIDATION TESTS COMPLETED ---');
  await mongoose.disconnect();
}

runValidationTests().catch(console.error);
