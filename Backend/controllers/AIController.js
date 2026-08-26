import AIChat from '../models/AIChat.js';
import { processAIChat } from '../services/aiService.js';

export async function handleAIChat(req, res) {
  try {
    const { message, conversationId } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const result = await processAIChat({
      message,
      conversationId,
      user: req.user || null,
    });

    return res.json(result);
  } catch (error) {
    console.error('[AIController] Error handling chat:', error);
    return res.status(500).json({
      success: false,
      message: 'I ran into an issue connecting with our booking system. Please try again in a moment.',
      error: error.message,
    });
  }
}

export async function getAllChatsAdmin(req, res) {
  try {
    // Only return real user chats (exclude automated test runs)
    const chats = await AIChat.find({
      conversationId: { $not: /^(test-|no-appt-|e2e-)/i },
      clientEmail: { $not: /(@example\.com|tester)/i },
    }).sort({ updatedAt: -1 });

    // Format to match admin dashboard format if needed
    const formatted = chats.map((c) => ({
      id: c.conversationId,
      _id: c._id,
      clientName: c.clientName || 'Guest Client',
      clientEmail: c.clientEmail || '',
      previewMessage: c.previewMessage || (c.messages.length > 0 ? c.messages[c.messages.length - 1].text : ''),
      actionRequired: c.actionRequired,
      takenOver: c.takenOver,
      messages: c.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      })),
    }));
    return res.json({ success: true, chats: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleTakeover(req, res) {
  try {
    const { conversationId } = req.params;
    const chat = await AIChat.findOne({ conversationId });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat conversation not found' });

    chat.takenOver = !chat.takenOver;
    chat.actionRequired = chat.takenOver ? 'Admin Active' : null;
    await chat.save();

    return res.json({ success: true, takenOver: chat.takenOver, actionRequired: chat.actionRequired });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function sendAdminChatMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'text is required' });

    const chat = await AIChat.findOne({ conversationId });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const msg = {
      sender: 'admin',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    chat.messages.push(msg);
    chat.previewMessage = text;
    chat.takenOver = true;
    chat.actionRequired = 'Admin Active';
    await chat.save();

    return res.json({ success: true, message: msg });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
