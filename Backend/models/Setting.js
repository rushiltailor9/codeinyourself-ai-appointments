import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: 'Nexora Technologies' },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    aiVoiceTone: { type: String, default: 'Friendly and concise' },
    bufferMinutes: { type: Number, default: 10 },
    reminderTimings: { type: [String], default: ['24h', '1h'] },
    autoEscalateKeywords: {
      type: [String],
      default: ['urgent', 'down', 'broken', 'not working'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', SettingSchema);
