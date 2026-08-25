import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` },
    sender: { type: String, enum: ['client', 'user', 'ai', 'assistant', 'tool', 'admin'], required: true },
    text: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIChatSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    clientName: { type: String, default: 'Guest Client' },
    clientEmail: { type: String, default: '' },
    previewMessage: { type: String, default: '' },
    actionRequired: { type: String, default: null }, // e.g. 'Escalation Suggested', 'Admin Active'
    takenOver: { type: Boolean, default: false },
    messages: [ChatMessageSchema],
    bookingDraft: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        service: null,
        serviceId: null,
        date: null,
        time: null,
        name: null,
        email: null,
        awaitingName: false,
        awaitingConfirmation: false,
        pendingAction: null,
        targetAppointmentId: null,
        targetDetails: null,
        rescheduleDate: null,
        rescheduleTime: null,
      }),
    },
  },
  { timestamps: true }
);

export default mongoose.model('AIChat', AIChatSchema);
