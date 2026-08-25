import { request } from './apiClient.js';

export async function sendChatMessage({ message, conversationId }) {
  return await request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId }),
  });
}

export async function getChatsAdmin() {
  return await request('/ai/chats');
}

export async function toggleChatTakeover(conversationId) {
  return await request(`/ai/chats/${conversationId}/takeover`, {
    method: 'POST',
  });
}

export async function sendAdminReply(conversationId, text) {
  return await request(`/ai/chats/${conversationId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
