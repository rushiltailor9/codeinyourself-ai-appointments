import express from 'express';
import {
  handleAIChat,
  getAllChatsAdmin,
  toggleTakeover,
  sendAdminChatMessage,
} from '../controllers/AIController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/chat', authMiddleware, handleAIChat);
router.get('/chats', authMiddleware, adminMiddleware, getAllChatsAdmin);
router.post('/chats/:conversationId/takeover', authMiddleware, adminMiddleware, toggleTakeover);
router.post('/chats/:conversationId/reply', authMiddleware, adminMiddleware, sendAdminChatMessage);

export default router;
