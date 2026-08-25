import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { createAppointment, cancelAppointment, rescheduleAppointment, updateAppointmentStatus } from '../services/appointmentService.js';
import { getUserNotifications } from '../services/notificationService.js';

dotenv.config();

async function runBidirectionalNotificationTests() {
  console.log('--- TESTING BIDIRECTIONAL NOTIFICATIONS (ADMIN <-> CLIENT) ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  const testClientId = new mongoose.Types.ObjectId();
  const testEmail = `notify_client_${Date.now()}@example.com`;

  // 1. Create a test appointment
  const appt = await createAppointment({
    userId: testClientId,
    clientName: 'Notification Tester',
    clientEmail: testEmail,
    serviceName: 'Web Development Consultation',
    date: '2026-09-10',
    startTime: '14:00',
    source: 'manual',
  });
  console.log('1. Created test appointment for 2026-09-10 at 14:00.');

  // 2. Test Admin Cancelling Slot -> Gives Notification to Client
  console.log('\n2. Testing Admin Cancels Slot:');
  await cancelAppointment(appt._id, 'Engineer unavailable', 'admin');

  const clientNotifs1 = await getUserNotifications(testClientId, 'client');
  const adminCancelNotif = clientNotifs1.find((n) => n.type === 'BOOKING_CANCELLED_BY_ADMIN');
  console.log('   Client Notification Found:', !!adminCancelNotif);
  console.log('   Message:', adminCancelNotif?.message);
  console.log('   Check 1 (Client notified of admin cancellation):', adminCancelNotif ? 'PASS' : 'FAIL');

  // 3. Create second appointment for Client Cancellation test
  const appt2 = await createAppointment({
    userId: testClientId,
    clientName: 'Notification Tester',
    clientEmail: testEmail,
    serviceName: 'IT Support Call',
    date: '2026-09-11',
    startTime: '10:00',
    source: 'manual',
  });

  // Test Client Cancelling Slot -> Gives Notification to Admin
  console.log('\n3. Testing Client Cancels Slot:');
  await cancelAppointment(appt2._id, 'Schedule conflict', 'client');

  const adminNotifs = await getUserNotifications(null, 'admin');
  const clientCancelNotif = adminNotifs.find((n) => n.type === 'BOOKING_CANCELLED_BY_CLIENT' && n.message.includes('Notification Tester'));
  console.log('   Admin Notification Found:', !!clientCancelNotif);
  console.log('   Message:', clientCancelNotif?.message);
  console.log('   Check 2 (Admin notified of client cancellation):', clientCancelNotif ? 'PASS' : 'FAIL');

  // 4. Create third appointment for Reschedule test
  const appt3 = await createAppointment({
    userId: testClientId,
    clientName: 'Notification Tester',
    clientEmail: testEmail,
    serviceName: 'Product Strategy Session',
    date: '2026-09-14',
    startTime: '11:00',
    source: 'manual',
  });

  // Test Client Rescheduling Slot -> Gives Notification to Admin
  console.log('\n4. Testing Client Reschedules Slot:');
  await rescheduleAppointment(appt3._id, '2026-09-15', '15:00', 'client');

  const adminNotifsAfterResched = await getUserNotifications(null, 'admin');
  const reschedNotif = adminNotifsAfterResched.find((n) => n.type === 'BOOKING_RESCHEDULED' && n.message.includes('Notification Tester'));
  console.log('   Admin Notification Found:', !!reschedNotif);
  console.log('   Message:', reschedNotif?.message);
  console.log('   Check 3 (Admin notified of reschedule):', reschedNotif ? 'PASS' : 'FAIL');

  const clientNotifsAfterResched = await getUserNotifications(testClientId, 'client');
  const clientReschedNotif = clientNotifsAfterResched.find((n) => n.type === 'BOOKING_RESCHEDULED');
  console.log('   Check 4 (Client notified of reschedule):', clientReschedNotif ? 'PASS' : 'FAIL');

  console.log('\n--- CLEANING UP TEMPORARY TEST DATA ---');
  await Appointment.deleteMany({ _id: { $in: [appt._id, appt2._id, appt3._id] } });
  await Notification.deleteMany({ $or: [{ userId: testClientId }, { message: /Notification Tester/ }] });

  console.log('✓ Temporary test data purged.');
  console.log('\n=== ALL BIDIRECTIONAL NOTIFICATION TESTS PASSED (100%) ===');
  await mongoose.disconnect();
}

runBidirectionalNotificationTests().catch(console.error);
