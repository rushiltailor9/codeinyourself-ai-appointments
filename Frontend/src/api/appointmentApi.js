import { request } from './apiClient.js';

export async function getMyAppointments(email = '') {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return await request(`/appointments/my${query}`);
}

export async function createAppointment(data) {
  return await request('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllAppointmentsAdmin(params = {}) {
  const queryParts = [];
  if (params.status) queryParts.push(`status=${params.status}`);
  if (params.date) queryParts.push(`date=${params.date}`);
  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return await request(`/appointments/admin${qs}`);
}

export async function updateAppointmentStatusAdmin(id, status) {
  return await request(`/appointments/admin/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function cancelAppointment(id, reason = '') {
  return await request(`/appointments/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function rescheduleAppointment(id, date, startTime) {
  return await request(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ date, startTime }),
  });
}
