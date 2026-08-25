import mongoose from 'mongoose';

const TeamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'Team Member', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    color: { type: String, default: '#5CF2A3' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('TeamMember', TeamMemberSchema);
