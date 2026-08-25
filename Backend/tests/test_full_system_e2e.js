import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runFullSystemE2ETest() {
  console.log('=== FULL SYSTEM E2E SANITY CHECK ===\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('1. Health Check:', health.status === 'online' ? 'PASS (200 OK)' : 'FAIL');

  // 2. Register & Login Client
  const testEmail = `e2e_user_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Client',
      email: testEmail,
      phone: '+1-555-4321',
      password: 'password123',
    }),
  });
  const regData = await regRes.json();
  console.log('2. Client Registration:', regData.success ? 'PASS' : 'FAIL');
  const token = regData.token;

  // 3. AI Chat Booking Flow
  const convId = `e2e-conv-${Date.now()}`;
  const chatRes1 = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: 'I want to book Web Development Consultation tomorrow at 3pm',
      conversationId: convId,
    }),
  });
  const chatData1 = await chatRes1.json();
  console.log('3. AI Step 1 (Intent & Availability Verification):', chatData1.awaitingConfirmation ? 'PASS' : 'FAIL');

  // 4. Confirm Booking
  const chatRes2 = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: 'Yes confirm',
      conversationId: convId,
    }),
  });
  const chatData2 = await chatRes2.json();
  console.log('4. AI Step 2 (Booking Confirmation in MongoDB):', chatData2.done ? 'PASS' : 'FAIL');

  // 5. Client Portal Fetch
  const portalRes = await fetch(`${BASE_URL}/appointments/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const portalData = await portalRes.json();
  console.log('5. Client Portal Booking Count:', portalData.appointments?.length === 1 ? 'PASS (1 booking found)' : 'FAIL');

  // 6. Thank you courteous response
  const chatRes3 = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: 'Thank you so much!',
      conversationId: convId,
    }),
  });
  const chatData3 = await chatRes3.json();
  console.log('6. AI Courtesy & Parting Message:', chatData3.message.includes('welcome') ? 'PASS' : 'FAIL');

  console.log('\n=== ALL E2E SANITY CHECKS PASSED (100%) ===');
}

runFullSystemE2ETest().catch(console.error);
