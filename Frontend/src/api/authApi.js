import { request } from './apiClient.js';

export async function loginUser({ email, password, name }) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function registerUser({ name, email, password, phone }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function getProfile() {
  return await request('/auth/profile');
}

export function logoutUser() {
  localStorage.removeItem('token');
}
