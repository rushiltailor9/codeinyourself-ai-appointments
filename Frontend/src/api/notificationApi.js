import { request } from './apiClient.js';

export async function fetchNotifications() {
  return await request('/notifications');
}

export async function markNotificationRead(id) {
  return await request(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}
