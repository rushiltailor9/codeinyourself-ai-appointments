import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Availability from '../models/Availability.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const INITIAL_SERVICES = [
  {
    name: 'Web Development Consultation',
    description: 'Initial scoping call for a new website or web app build.',
    durationMinutes: 30,
    price: 0,
    status: true,
  },
  {
    name: 'IT Support Call',
    description: 'Troubleshooting session for existing infrastructure or software.',
    durationMinutes: 20,
    price: 0,
    status: true,
  },
  {
    name: 'Product Strategy Session',
    description: 'Roadmap and technical architecture planning for new products.',
    durationMinutes: 45,
    price: 149,
    status: true,
  },
  {
    name: 'Security Audit Intro',
    description: 'Scoping call ahead of a full infrastructure security audit.',
    durationMinutes: 30,
    price: 0,
    status: true,
  },
];

const INITIAL_AVAILABILITIES = [
  { dayOfWeek: 'Monday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, breaks: [{ startTime: '13:00', endTime: '14:00' }], active: true },
  { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, breaks: [{ startTime: '13:00', endTime: '14:00' }], active: true },
  { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, breaks: [{ startTime: '13:00', endTime: '14:00' }], active: true },
  { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, breaks: [{ startTime: '13:00', endTime: '14:00' }], active: true },
  { dayOfWeek: 'Friday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30, breaks: [{ startTime: '13:00', endTime: '14:00' }], active: true },
];

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_appointment';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to ${uri}✅`);
    await seedInitialData();
    return true;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}❌`);
    console.error(`[MongoDB Note] Ensure MongoDB service is started on ${uri}`);
    return false;
  }
}

async function seedInitialData() {
  try {
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(INITIAL_SERVICES);
      console.log('[Seed] Inserted initial services.');
    }

    const availCount = await Availability.countDocuments();
    if (availCount === 0) {
      await Availability.insertMany(INITIAL_AVAILABILITIES);
      console.log('[Seed] Inserted initial weekly availability.');
    }

    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin Manager',
        email: 'admin@codeinyourself.com',
        phone: '+1-555-0100',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
      });
      console.log('[Seed] Default admin account created (admin@codeinyourself.com / admin123).');
    }
  } catch (error) {
    console.error('[Seed] Warning during database seeding:', error.message);
  }
}
