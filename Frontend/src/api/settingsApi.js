import { request } from './apiClient.js';

export async function fetchSettings() {
  return await request('/settings');
}

export async function saveSettings(settingsData) {
  return await request('/settings', {
    method: 'POST',
    body: JSON.stringify(settingsData),
  });
}

export async function fetchTeamMembers() {
  return await request('/team/members');
}

export async function createTeamMember(memberData) {
  return await request('/team/members', {
    method: 'POST',
    body: JSON.stringify(memberData),
  });
}

export async function updateTeamMember(id, memberData) {
  return await request(`/team/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(memberData),
  });
}

export async function deleteTeamMember(id) {
  return await request(`/team/members/${id}`, {
    method: 'DELETE',
  });
}
