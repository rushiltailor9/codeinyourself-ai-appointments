import Availability from '../models/Availability.js';
import Holiday from '../models/Holiday.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';

// Helper: Convert "HH:mm" to minutes from midnight
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Convert minutes from midnight to "HH:mm"
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Helper: Compute endTime from startTime and duration in minutes
export function calculateEndTime(startTime, durationMinutes = 30) {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes;
  return minutesToTime(endMins);
}

// Helper: Check if two time intervals overlap (start1 < end2 && end1 > start2)
export function isOverlapping(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

// Helper: Get Day Name from date string "YYYY-MM-DD"
export function getDayName(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

/**
 * Get available slots for a specific date and service duration.
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {number} durationMinutes default 30
 */
export async function getAvailableSlots(dateStr, durationMinutes = 30) {
  const dayName = getDayName(dateStr);

  // Check if date is in holiday
  const holiday = await Holiday.findOne({
    date: {
      $gte: new Date(dateStr + 'T00:00:00.000Z'),
      $lte: new Date(dateStr + 'T23:59:59.999Z'),
    },
    active: true,
  });

  if (holiday) {
    return {
      date: dateStr,
      day: dayName,
      available: false,
      reason: `Closed for holiday: ${holiday.reason}`,
      slots: [],
    };
  }

  // Get availability config for this day of week
  const availConfig = await Availability.findOne({
    dayOfWeek: { $regex: new RegExp(`^${dayName}$`, 'i') },
    active: true,
  });

  if (!availConfig) {
    // Default weekend closed
    return {
      date: dateStr,
      day: dayName,
      available: false,
      reason: `No working hours configured for ${dayName}`,
      slots: [],
    };
  }

  const workStart = timeToMinutes(availConfig.startTime || '09:00');
  const workEnd = timeToMinutes(availConfig.endTime || '18:00');
  const step = availConfig.slotDurationMinutes || 30;

  // Get existing active appointments on this date
  const existingAppts = await Appointment.find({
    date: dateStr,
    status: { $in: ['CONFIRMED', 'PENDING'] },
  });

  const slots = [];
  for (let current = workStart; current + durationMinutes <= workEnd; current += step) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + durationMinutes);

    // Check if slot overlaps any break
    let overlapsBreak = false;
    if (availConfig.breaks && availConfig.breaks.length > 0) {
      for (const brk of availConfig.breaks) {
        if (isOverlapping(slotStart, slotEnd, brk.startTime, brk.endTime)) {
          overlapsBreak = true;
          break;
        }
      }
    }

    if (overlapsBreak) continue;

    // Check if slot overlaps any existing appointment
    let overlapsAppt = false;
    for (const appt of existingAppts) {
      if (isOverlapping(slotStart, slotEnd, appt.startTime, appt.endTime)) {
        overlapsAppt = true;
        break;
      }
    }

    if (!overlapsAppt) {
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        formatted: `${slotStart} - ${slotEnd}`,
      });
    }
  }

  return {
    date: dateStr,
    day: dayName,
    available: slots.length > 0,
    slots,
  };
}

/**
 * Validate whether a proposed appointment date/time is valid and available.
 */
export async function validateSlotAvailability(dateStr, startTime, durationMinutes = 30, excludeApptId = null) {
  const dayName = getDayName(dateStr);

  // Check past date
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) {
    return { valid: false, reason: 'PAST_DATE', message: 'This slot is not available. Cannot schedule appointments in the past. Please select a future date.' };
  }

  // Check Sunday / weekend / closed day
  if (dayName.toLowerCase() === 'sunday' || dayName.toLowerCase() === 'saturday') {
    return {
      valid: false,
      reason: 'WEEKEND_CLOSED',
      message: `This slot is not available. We are closed on ${dayName}s. Our operating hours are Monday to Friday, 9:00 AM to 6:00 PM. Please choose another date or slot.`,
    };
  }

  // Check holiday
  const holiday = await Holiday.findOne({
    date: {
      $gte: new Date(dateStr + 'T00:00:00.000Z'),
      $lte: new Date(dateStr + 'T23:59:59.999Z'),
    },
    active: true,
  });
  if (holiday) {
    return { valid: false, reason: 'HOLIDAY', message: `This slot is not available. The selected date is closed for holiday: ${holiday.reason}. Please choose another date.` };
  }

  const availConfig = await Availability.findOne({
    dayOfWeek: { $regex: new RegExp(`^${dayName}$`, 'i') },
    active: true,
  });
  if (!availConfig) {
    return { valid: false, reason: 'CLOSED', message: `This slot is not available. We are closed on ${dayName}s. Please book another slot.` };
  }

  const reqStart = timeToMinutes(startTime);
  const reqEnd = reqStart + durationMinutes;
  const workStart = timeToMinutes(availConfig.startTime || '09:00');
  const workEnd = timeToMinutes(availConfig.endTime || '18:00');

  // Check before 9:00 AM (09:00) or after 6:00 PM (18:00)
  if (reqStart < workStart || reqEnd > workEnd) {
    return {
      valid: false,
      reason: 'OUTSIDE_HOURS',
      message: `This slot is not available. Our operating hours are 9:00 AM to 6:00 PM (${availConfig.startTime} - ${availConfig.endTime}) on ${dayName}. Please book another slot within this window.`,
    };
  }

  // Check breaks (e.g. 13:00 - 14:00 lunch break)
  if (availConfig.breaks && availConfig.breaks.length > 0) {
    const endTime = minutesToTime(reqEnd);
    for (const brk of availConfig.breaks) {
      if (isOverlapping(startTime, endTime, brk.startTime, brk.endTime)) {
        return {
          valid: false,
          reason: 'STAFF_BREAK',
          message: `This slot is not available. Requested time overlaps with staff break (${brk.startTime} - ${brk.endTime}). Please book another slot.`,
        };
      }
    }
  }

  // Check existing appointments overlap (double booking prevention)
  const query = {
    date: dateStr,
    status: { $in: ['CONFIRMED', 'PENDING'] },
  };
  if (excludeApptId) {
    query._id = { $ne: excludeApptId };
  }

  const existingAppts = await Appointment.find(query);
  const endTime = minutesToTime(reqEnd);
  for (const appt of existingAppts) {
    if (isOverlapping(startTime, endTime, appt.startTime, appt.endTime)) {
      return {
        valid: false,
        reason: 'ALREADY_BOOKED',
        message: `This slot is already Booked on ${dateStr} (${appt.startTime} - ${appt.endTime}). Please select another slot.`,
      };
    }
  }

  return { valid: true, endTime };
}
