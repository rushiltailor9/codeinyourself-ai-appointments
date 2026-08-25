import { request } from './apiClient.js';

export async function fetchServices() {
  return await request('/services');
}

export async function fetchAllServicesAdmin() {
  return await request('/services/admin');
}

export async function createServiceAdmin(serviceData) {
  return await request('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
}

export async function updateServiceAdmin(id, updateData) {
  return await request(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
}

export async function deleteServiceAdmin(id) {
  return await request(`/services/${id}`, {
    method: 'DELETE',
  });
}
