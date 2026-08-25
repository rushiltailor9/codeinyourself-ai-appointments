import fetch from 'node-fetch';
import mongoose from 'mongoose';
import Setting from '../models/Setting.js';
import TeamMember from '../models/TeamMember.js';
import Availability from '../models/Availability.js';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== TESTING SETTINGS & TEAM MANAGEMENT FLOW ===\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/ai_appointment');

  // 1. Test GET /api/settings
  console.log('1. Testing GET /api/settings');
  const getSetRes = await fetch(`${BASE_URL}/settings`);
  const getSetData = await getSetRes.json();
  console.log('   Status:', getSetRes.status, '| Success:', getSetData.success);
  console.log('   Current working hours:', getSetData.settings?.workingHours);

  // 2. Test POST /api/settings (Update Start Time & End Time)
  console.log('\n2. Testing POST /api/settings (Update start to 08:30 and end to 18:30)');
  const updateSetRes = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workingHours: { start: '08:30', end: '18:30' },
      bufferMinutes: 30,
      aiVoiceTone: 'Professional, welcoming, and concise',
    }),
  });
  const updateSetData = await updateSetRes.json();
  console.log('   Status:', updateSetRes.status, '| Success:', updateSetData.success);
  console.log('   Updated hours in response:', updateSetData.settings?.workingHours);

  // Verify that Availability in database synchronized
  const mondayAvail = await Availability.findOne({ dayOfWeek: 'Monday' });
  console.log('   Synced Monday DB Availability startTime:', mondayAvail?.startTime, '| endTime:', mondayAvail?.endTime);
  const syncCheck = mondayAvail?.startTime === '08:30' && mondayAvail?.endTime === '18:30';
  console.log('   Check 1 (DB Working Hours Synchronized):', syncCheck ? 'PASS' : 'FAIL');

  // Verify slot generation with new hours
  console.log('\n3. Testing Slot Generation with New Operating Hours');
  const slotRes = await fetch(`${BASE_URL}/availability?date=2026-08-28&duration=30`);
  const slotData = await slotRes.json();
  console.log('   First slot start:', slotData.slots?.[0]?.startTime, '| Last slot end:', slotData.slots?.[slotData.slots?.length - 1]?.endTime);
  const slotCheck = slotData.slots?.[0]?.startTime === '08:30';
  console.log('   Check 2 (First Slot Starts at 08:30):', slotCheck ? 'PASS' : 'FAIL');

  // 4. Test GET /api/team/members
  console.log('\n4. Testing GET /api/team/members');
  const getTeamRes = await fetch(`${BASE_URL}/team/members`);
  const getTeamData = await getTeamRes.json();
  console.log('   Status:', getTeamRes.status, '| Members count:', getTeamData.teamMembers?.length);

  // 5. Test POST /api/team/members (Add Team Member)
  console.log('\n5. Testing POST /api/team/members (Add member)');
  const addMemberRes = await fetch(`${BASE_URL}/team/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sarah Connor',
      role: 'Cybersecurity Analyst',
      email: 'sarah@nexora.com',
      color: '#5CB8F2',
    }),
  });
  const addMemberData = await addMemberRes.json();
  console.log('   Status:', addMemberRes.status, '| Success:', addMemberData.success);
  console.log('   Created member:', addMemberData.teamMember?.name, '| ID:', addMemberData.teamMember?._id);
  const memberId = addMemberData.teamMember?._id;
  console.log('   Check 3 (Team Member Created):', addMemberData.success && memberId ? 'PASS' : 'FAIL');

  // 6. Test PUT /api/team/members/:id (Update Team Member)
  console.log(`\n6. Testing PUT /api/team/members/${memberId} (Update member)`);
  const updateMemberRes = await fetch(`${BASE_URL}/team/members/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sarah Connor-Reese',
      role: 'Lead Security Director',
      color: '#C75CF2',
    }),
  });
  const updateMemberData = await updateMemberRes.json();
  console.log('   Status:', updateMemberRes.status, '| Success:', updateMemberData.success);
  console.log('   Updated Name:', updateMemberData.teamMember?.name, '| Role:', updateMemberData.teamMember?.role);
  const updateCheck = updateMemberData.teamMember?.name === 'Sarah Connor-Reese';
  console.log('   Check 4 (Team Member Updated):', updateCheck ? 'PASS' : 'FAIL');

  // 7. Test DELETE /api/team/members/:id (Delete Team Member)
  console.log(`\n7. Testing DELETE /api/team/members/${memberId} (Delete member)`);
  const delMemberRes = await fetch(`${BASE_URL}/team/members/${memberId}`, {
    method: 'DELETE',
  });
  const delMemberData = await delMemberRes.json();
  console.log('   Status:', delMemberRes.status, '| Success:', delMemberData.success, '| Msg:', delMemberData.message);
  const delCheck = delMemberData.success === true;
  console.log('   Check 5 (Team Member Deleted):', delCheck ? 'PASS' : 'FAIL');

  // Reset working hours back to standard 09:00 - 18:00
  console.log('\n8. Resetting working hours to 09:00 - 18:00');
  await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workingHours: { start: '09:00', end: '18:00' },
      bufferMinutes: 10,
    }),
  });

  await mongoose.disconnect();
  console.log('\n=== ALL SETTINGS & TEAM MANAGEMENT TESTS COMPLETED ===');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
