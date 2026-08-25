import express from 'express';
import { getNotifications, markAsRead } from '../controllers/NotificationController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, getNotifications);
router.patch('/:id/read', markAsRead);

export default router;
