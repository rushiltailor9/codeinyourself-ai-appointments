import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recipientRole: { type: String, enum: ['client', 'admin', 'all'], default: 'client' },
    type: { type: String, required: true }, // e.g. 'BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED'
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', NotificationSchema);
