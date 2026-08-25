import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
    serviceName: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    startTime: { type: String, required: true }, // "HH:mm" e.g. "14:00"
    endTime: { type: String, required: true },   // "HH:mm" e.g. "14:30"
    duration: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
    },
    reason: { type: String, default: '' },
    staff: { type: String, default: 'Neha Shah' },
    source: {
      type: String,
      enum: ['ai-chat', 'manual', 'client-portal'],
      default: 'ai-chat',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', AppointmentSchema);
