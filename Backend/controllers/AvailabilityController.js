import Availability from '../models/Availability.js';
import Holiday from '../models/Holiday.js';
import { getAvailableSlots } from '../services/availabilityService.js';

export async function getSlots(req, res) {
  try {
    const { date, duration } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query parameter is required (YYYY-MM-DD)' });

    const result = await getAvailableSlots(date, Number(duration) || 30);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAvailabilitySettings(req, res) {
  try {
    const availability = await Availability.find().sort({ dayOfWeek: 1 });
    const holidays = await Holiday.find({ active: true });
    return res.json({ success: true, availability, holidays });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function saveAvailability(req, res) {
  try {
    const { availabilities } = req.body;
    if (Array.isArray(availabilities)) {
      for (const item of availabilities) {
        if (item._id) {
          await Availability.findByIdAndUpdate(item._id, item);
        } else if (item.dayOfWeek) {
          await Availability.findOneAndUpdate({ dayOfWeek: item.dayOfWeek }, item, { upsert: true });
        }
      }
    }
    const updated = await Availability.find();
    return res.json({ success: true, availability: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function addHoliday(req, res) {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    const holiday = await Holiday.create({ date: new Date(date), reason });
    return res.status(201).json({ success: true, holiday });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
