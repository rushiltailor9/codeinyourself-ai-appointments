export const SERVICES = [
  { name: 'Web Development Consultation', duration: 30, keywords: ['web', 'website', 'development', 'app'] },
  { name: 'IT Support Call', duration: 20, keywords: ['support', 'it', 'broken', 'down', 'fix', 'issue', 'bug'] },
  { name: 'Product Strategy Session', duration: 45, keywords: ['strategy', 'product', 'roadmap', 'planning'] },
  { name: 'Security Audit Intro', duration: 30, keywords: ['security', 'audit', 'infrastructure'] },
];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function nextDateForWeekday(targetDay) {
  const today = new Date();
  const todayIdx = today.getDay();
  let diff = targetDay - todayIdx;
  if (diff <= 0) diff += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result.toISOString().split('T')[0];
}

export function extractService(text) {
  const lower = text.toLowerCase();
  const match = SERVICES.find((s) => s.keywords.some((k) => lower.includes(k)));
  return match ? match.name : null;
}

export function extractDate(text) {
  const lower = text.toLowerCase();
  if (lower.includes('today')) return new Date().toISOString().split('T')[0];
  if (lower.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (lower.includes(WEEKDAYS[i])) return nextDateForWeekday(i);
  }
  const explicit = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (explicit) return explicit[0];
  return null;
}

export function extractTime(text) {
  const match = text.toLowerCase().match(/(\d{1,2})(:(\d{2}))?\s?(am|pm)?/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = match[3] ? parseInt(match[3], 10) : 0;
  const meridian = match[4];
  if (hour > 23) return null;
  if (meridian === 'pm' && hour < 12) hour += 12;
  if (meridian === 'am' && hour === 12) hour = 0;
  if (!meridian && hour < 8) hour += 12;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-z.]{2,}/i);
  return match ? match[0] : null;
}

export function isWithinBusinessHours(time) {
  if (!time) return true;
  const [h] = time.split(':').map(Number);
  return h >= 9 && h < 18;
}

export function advanceBooking(draft, userText) {
  const updated = { ...draft };

  const service = extractService(userText);
  if (service) updated.service = service;

  const date = extractDate(userText);
  if (date) updated.date = date;

  const time = extractTime(userText);
  if (time) updated.time = time;

  const email = extractEmail(userText);
  if (email) updated.email = email;

  if (!updated.service) {
    return {
      draft: updated,
      reply: "Sure — what would you like the appointment for? We offer Web Development Consultations, IT Support Calls, Product Strategy Sessions, and Security Audit intros.",
      done: false,
    };
  }

  if (!updated.date || !updated.time) {
    return {
      draft: updated,
      reply: `Got it — ${updated.service}. What date and time works for you? (e.g. "Tuesday at 3pm" or "tomorrow at 10am")`,
      done: false,
    };
  }

  if (!isWithinBusinessHours(updated.time)) {
    return {
      draft: { ...updated, time: null },
      reply: "This slot is not available. Our operating hours are 9:00 AM to 6:00 PM on weekdays. Please book another slot within this window.",
      done: false,
    };
  }

  if (!updated.name) {
    return {
      draft: updated,
      reply: `Perfect — ${updated.service} on ${updated.date} at ${updated.time}. What name should I put this under?`,
      done: false,
      awaitingName: true,
    };
  }

  if (!updated.email) {
    return {
      draft: updated,
      reply: `Thanks, ${updated.name}. What email should the confirmation go to?`,
      done: false,
    };
  }

  return {
    draft: updated,
    reply: `You're booked — ${updated.service} on ${updated.date} at ${updated.time}. A confirmation is on its way to ${updated.email}. Reply here anytime to reschedule or cancel.`,
    done: true,
  };
}
