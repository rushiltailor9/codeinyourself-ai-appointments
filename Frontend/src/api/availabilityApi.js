import { request } from './apiClient.js';

export async function fetchAvailableSlots(date, duration = 30) {
  return await request(`/availability?date=${date}&duration=${duration}`);
}

export async function fetchAvailabilitySettings() {
  return await request('/availability/settings');
}

export async function saveAvailabilitySettings(availabilities) {
  return await request('/availability/settings', {
    method: 'POST',
    body: JSON.stringify({ availabilities }),
  });
}
