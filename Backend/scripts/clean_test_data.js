import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AIChat from '../models/AIChat.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

dotenv.config();

async function cleanTestData() {
  console.log('--- CLEANING TEST DATA FROM DATABASE ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  // 1. Delete test AI Chats
  const chatRes = await AIChat.deleteMany({
    $or: [
      { conversationId: /^(test-|no-appt-|e2e-)/i },
      { clientEmail: /(@example\.com|tester|client_alpha|client_beta)/i },
      { clientName: /(tester|sarah connor|oliver queen|gemini tester|e2e client|client a|client b)/i },
    ],
  });
  console.log(`✓ Removed ${chatRes.deletedCount} test chat records from AIChat collection.`);

  // 2. Delete test Appointments
  const apptRes = await Appointment.deleteMany({
    $or: [
      { clientEmail: /(@example\.com|tester|client_alpha|client_beta)/i },
      { clientName: /(tester|sarah connor|oliver queen|gemini tester|e2e client|client a|client b)/i },
    ],
  });
  console.log(`✓ Removed ${apptRes.deletedCount} test appointment records from Appointment collection.`);

  // 3. Delete test Users
  const userRes = await User.deleteMany({
    email: /(@example\.com|tester)/i,
    role: { $ne: 'admin' }, // keep real admin
  });
  console.log(`✓ Removed ${userRes.deletedCount} test user records from User collection.`);

  // Show remaining real user chats
  const remainingChats = await AIChat.find();
  console.log(`\nRemaining REAL user chats in database: ${remainingChats.length}`);
  remainingChats.forEach((c, idx) => {
    console.log(`  ${idx + 1}. [${c.clientName}] (${c.clientEmail}) - Conv: ${c.conversationId}`);
  });

  const remainingAppts = await Appointment.find();
  console.log(`\nRemaining REAL appointments in database: ${remainingAppts.length}`);
  remainingAppts.forEach((a, idx) => {
    console.log(`  ${idx + 1}. [${a.clientName}] ${a.serviceName} on ${a.date} at ${a.startTime}`);
  });

  console.log('\n--- TEST DATA CLEANUP COMPLETE ---');
  await mongoose.disconnect();
}

cleanTestData().catch(console.error);
