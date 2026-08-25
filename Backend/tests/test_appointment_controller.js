import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runAppointmentControllerTests() {
  console.log('--- TESTING APPOINTMENT CONTROLLER REST ENDPOINTS ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  // Create test user and token
  let testUser = await User.findOne({ email: 'appt_tester@example.com' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Appointment Tester',
      email: 'appt_tester@example.com',
      password: 'hashedpassword123',
      phone: '+91 12345 67890',
      role: 'client',
      status: 'active',
    });
  }

  const clientToken = jwt.sign(
    { userId: testUser._id, role: testUser.role, email: testUser.email },
    process.env.JWT_SECRET || 'codeinyourself_secret_key_2026',
    { expiresIn: '1h' }
  );

  let adminUser = await User.findOne({ role: 'admin' });
  const adminToken = jwt.sign(
    { userId: adminUser._id, role: 'admin', email: adminUser.email },
    process.env.JWT_SECRET || 'codeinyourself_secret_key_2026',
    { expiresIn: '1h' }
  );

  const testDate = '2026-08-28';
  const testTime = '16:00';

  // Clean up
  await Appointment.deleteMany({ clientEmail: testUser.email });

  // 1. Test POST /api/appointments (Create appointment)
  console.log('\n1. Testing POST /api/appointments');
  const createRes = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      serviceName: 'Web Development Consultation',
      date: testDate,
      startTime: testTime,
      reason: 'Initial consultation via portal',
    }),
  });
  const createData = await createRes.json();
  console.log('   Status:', createRes.status, '| Success:', createData.success);
  console.log('   Check 1 (Appointment Created):', createData.success && createData.appointment._id ? 'PASS' : 'FAIL');
  const createdId = createData.appointment?._id;

  // 2. Test GET /api/appointments/my (Get client's appointments)
  console.log('\n2. Testing GET /api/appointments/my');
  const myRes = await fetch(`${BASE_URL}/appointments/my`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const myData = await myRes.json();
  console.log('   Status:', myRes.status, '| Count:', myData.appointments?.length);
  console.log('   Check 2 (Client Appointments Found):', myData.appointments?.length > 0 ? 'PASS' : 'FAIL');

  // 3. Test GET /api/appointments/:id
  console.log(`\n3. Testing GET /api/appointments/${createdId}`);
  const getRes = await fetch(`${BASE_URL}/appointments/${createdId}`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const getData = await getRes.json();
  console.log('   Status:', getRes.status, '| Retrieved Service:', getData.appointment?.serviceName);
  console.log('   Check 3 (Single Appointment Retrieved):', getData.appointment?.startTime === testTime ? 'PASS' : 'FAIL');

  // 4. Test PUT /api/appointments/:id (Reschedule)
  console.log(`\n4. Testing PUT /api/appointments/${createdId} (Reschedule to 16:30)`);
  const reschedRes = await fetch(`${BASE_URL}/appointments/${createdId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      date: testDate,
      startTime: '16:30',
    }),
  });
  const reschedData = await reschedRes.json();
  console.log('   Status:', reschedRes.status, '| New Time:', reschedData.appointment?.startTime);
  console.log('   Check 4 (Rescheduled successfully):', reschedData.appointment?.startTime === '16:30' ? 'PASS' : 'FAIL');

  // 5. Test GET /api/appointments/admin (Admin list)
  console.log('\n5. Testing GET /api/appointments/admin');
  const adminRes = await fetch(`${BASE_URL}/appointments/admin`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminData = await adminRes.json();
  console.log('   Status:', adminRes.status, '| Total Admin Count:', adminData.appointments?.length);
  console.log('   Check 5 (Admin Appointments list):', Array.isArray(adminData.appointments) ? 'PASS' : 'FAIL');

  // 6. Test PATCH /api/appointments/admin/:id/status (Admin Status update)
  console.log(`\n6. Testing PATCH /api/appointments/admin/${createdId}/status (Set to COMPLETED)`);
  const statusRes = await fetch(`${BASE_URL}/appointments/admin/${createdId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  const statusData = await statusRes.json();
  console.log('   Status:', statusRes.status, '| Updated Status:', statusData.appointment?.status);
  console.log('   Check 6 (Admin Status Updated):', statusData.appointment?.status === 'COMPLETED' ? 'PASS' : 'FAIL');

  // 7. Test DELETE /api/appointments/:id (Cancel)
  console.log(`\n7. Testing DELETE /api/appointments/${createdId} (Cancel)`);
  const cancelRes = await fetch(`${BASE_URL}/appointments/${createdId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ reason: 'Client requested cancellation via API' }),
  });
  const cancelData = await cancelRes.json();
  console.log('   Status:', cancelRes.status, '| Message:', cancelData.message);
  console.log('   Check 7 (Cancelled status):', cancelData.appointment?.status === 'CANCELLED' ? 'PASS' : 'FAIL');

  console.log('\n--- ALL APPOINTMENT CONTROLLER REST TESTS COMPLETED ---');

  // Auto-cleanup test data so only real users remain in MongoDB
  await mongoose.connection.collection('appointments').deleteMany({ clientEmail: testUser.email });
  await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
  await mongoose.disconnect();
}

runAppointmentControllerTests().catch(console.error);
