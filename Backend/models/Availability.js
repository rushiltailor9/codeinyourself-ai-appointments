import mongoose from 'mongoose';

const BreakSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // e.g. "13:00"
    endTime: { type: String, required: true },   // e.g. "14:00"
  },
  { _id: false }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: { type: String, required: true }, // "Monday", "Tuesday", etc.
    startTime: { type: String, required: true, default: '09:00' },
    endTime: { type: String, required: true, default: '18:00' },
    slotDurationMinutes: { type: Number, default: 30 },
    breaks: [BreakSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Availability', AvailabilitySchema);
