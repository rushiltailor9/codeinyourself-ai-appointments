import { getUserNotifications, markNotificationAsRead } from '../services/notificationService.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user ? req.user._id : null;
    const role = req.user?.role || 'client';
    const notifications = await getUserNotifications(userId, role);
    return res.json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    const updated = await markNotificationAsRead(req.params.id);
    return res.json({ success: true, notification: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
