import Notification from '../models/Notification.js';

export async function createNotification({ userId = null, recipientRole = 'client', type, message }) {
  try {
    const notification = await Notification.create({
      userId,
      recipientRole,
      type,
      message,
      read: false,
    });
    return notification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error.message);
  }
}

export async function getUserNotifications(userId, role = 'client') {
  const query = {
    $or: [
      { userId },
      { recipientRole: role },
      { recipientRole: 'all' },
    ],
  };
  return await Notification.find(query).sort({ createdAt: -1 }).limit(50);
}

export async function markNotificationAsRead(notificationId, userId = null) {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
}
