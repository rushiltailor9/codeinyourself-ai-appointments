import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    reason: { type: String, default: 'Public Holiday / Closed' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Holiday', HolidaySchema);
