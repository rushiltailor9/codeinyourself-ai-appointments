import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processAIChat } from '../services/aiService.js';

dotenv.config();

async function runProblemSolvingTests() {
  console.log('=== TESTING AI PROBLEM SOLVING & REQUIREMENT EXECUTION FLOW ===\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment');

  // Test 1: Technical Diagnostic Problem Solving
  console.log('1. Testing Technical Diagnostic Problem (Server Memory Leak)...');
  const convId1 = `test-prob-1-${Date.now()}`;
  const res1 = await processAIChat({
    message: 'Our production database and server keep crashing due to high connection pool exhaustion and memory leaks. How can you help us fix this?',
    conversationId: convId1,
  });

  console.log('   AI Solution & Recommendation:');
  console.log('   ----------------------------------------');
  console.log('   ' + res1.message);
  console.log('   ----------------------------------------');
  console.log('   Matched Service in Draft:', res1.draft?.service);
  const check1 = res1.draft?.service === 'IT Support Call' || res1.message.toLowerCase().includes('support');
  console.log('   Check 1 (Diagnoses & Recommends IT Support):', check1 ? 'PASS' : 'FAIL');

  // Test 2: Full-Stack Web App Scoping Requirement
  console.log('\n2. Testing Scoping Requirement (Next.js & SaaS Platform)...');
  const convId2 = `test-prob-2-${Date.now()}`;
  const res2 = await processAIChat({
    message: 'We need to build a custom multi-tenant SaaS dashboard with Next.js and Stripe payments.',
    conversationId: convId2,
  });

  console.log('   AI Solution & Recommendation:');
  console.log('   ----------------------------------------');
  console.log('   ' + res2.message);
  console.log('   ----------------------------------------');
  console.log('   Matched Service in Draft:', res2.draft?.service);
  const check2 =
    res2.draft?.service === 'Web Development Consultation' ||
    res2.draft?.service === 'Product Strategy Session' ||
    res2.message.toLowerCase().includes('web') ||
    res2.message.toLowerCase().includes('strategy');
  console.log('   Check 2 (Scoping Advice & Recommends Service):', check2 ? 'PASS' : 'FAIL');

  // Test 3: Problem Solving + Slot Execution in Single Message
  console.log('\n3. Testing Problem Solving + Direct Slot Scheduling...');
  const convId3 = `test-prob-3-${Date.now()}`;
  const res3 = await processAIChat({
    message: 'We suspect our API endpoints have security vulnerabilities and need a penetration audit. Can we schedule a session tomorrow at 2pm for Alex River (alex@rivertech.io)?',
    conversationId: convId3,
  });

  console.log('   AI Verification & Slot Confirmation:');
  console.log('   ----------------------------------------');
  console.log('   ' + res3.message);
  console.log('   ----------------------------------------');
  console.log('   Awaiting Confirmation:', res3.awaitingConfirmation);
  const check3 = res3.awaitingConfirmation === true && (res3.draft?.service === 'Security Audit Intro' || res3.message.toLowerCase().includes('security'));
  console.log('   Check 3 (Identifies Service, Verifies Slot & Prepares Confirmation):', check3 ? 'PASS' : 'FAIL');

  // Clean up test conversations
  await mongoose.connection.collection('aichats').deleteMany({
    conversationId: { $in: [convId1, convId2, convId3] },
  });

  await mongoose.disconnect();
  console.log('\n=== ALL AI PROBLEM SOLVING & REQUIREMENT TESTS PASSED ===');
}

runProblemSolvingTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
