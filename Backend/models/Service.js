import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, default: 30 },
    price: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Service', ServiceSchema);
