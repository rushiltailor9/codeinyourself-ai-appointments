import mongoose from 'mongoose';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import AIChat from '../models/AIChat.js';
import Notification from '../models/Notification.js';

async function cleanupTestData() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment';
  await mongoose.connect(uri);

  const realEmails = [
    'admin@codeinyourself.com',
    'rushil@gmail.com',
    'ronak@gmail.com',
    'neel@gmail.com',
    'heer@gmail.com',
  ];

  console.log('--- Cleaning Test Data ---');

  // 1. Delete test users
  const userDel = await User.deleteMany({ email: { $nin: realEmails } });
  console.log(`Deleted ${userDel.deletedCount} test users.`);

  // 2. Delete test appointments
  const apptDel = await Appointment.deleteMany({ clientEmail: { $nin: realEmails } });
  console.log(`Deleted ${apptDel.deletedCount} test appointments.`);

  // 3. Delete test AI chats
  const chatDel = await AIChat.deleteMany({ clientEmail: { $nin: realEmails } });
  console.log(`Deleted ${chatDel.deletedCount} test AI chats.`);

  // 4. Delete test notifications (filter by test keywords / test users)
  const testKeywords = [
    'Oliver Queen',
    'Client Alpha',
    'Client Beta',
    'Appointment Tester',
    'User One',
    'Eleanor Vance',
    'E2E Client',
    'example.com',
    'test.com',
    'nexora.com',
    '2026-08-28',
    '2026-09-10',
    '2026-09-11',
  ];

  const allNotifs = await Notification.find({});
  let deletedNotifs = 0;

  for (const notif of allNotifs) {
    const isTest = testKeywords.some((kw) => notif.message.includes(kw));
    if (isTest) {
      await Notification.deleteOne({ _id: notif._id });
      deletedNotifs++;
    }
  }
  console.log(`Deleted ${deletedNotifs} test notifications.`);

  // 5. Verification output
  console.log('\n=== CURRENT DATABASE STATE ===');
  const remainingUsers = await User.find({}, 'name email role');
  console.log(`Users (${remainingUsers.length}):`);
  remainingUsers.forEach((u) => console.log(` - ${u.name} (${u.email}) [${u.role}]`));

  const remainingAppts = await Appointment.find({}, 'clientName clientEmail serviceName date startTime status source');
  console.log(`\nAppointments (${remainingAppts.length}):`);
  remainingAppts.forEach((a) =>
    console.log(` - ${a.clientName} (${a.clientEmail}) | ${a.serviceName} | ${a.date} ${a.startTime} | ${a.status} [${a.source}]`)
  );

  const remainingChats = await AIChat.find({}, 'clientName clientEmail messages');
  console.log(`\nAI Chats (${remainingChats.length}):`);
  remainingChats.forEach((c) => console.log(` - ${c.clientName} (${c.clientEmail}) | ${c.messages?.length || 0} messages`));

  const remainingNotifs = await Notification.find({}, 'recipientRole message type createdAt');
  console.log(`\nNotifications (${remainingNotifs.length}):`);
  remainingNotifs.forEach((n) => console.log(` - [${n.recipientRole}] ${n.type}: ${n.message}`));

  await mongoose.disconnect();
  console.log('\nCleanup completed successfully.');
}

cleanupTestData().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
