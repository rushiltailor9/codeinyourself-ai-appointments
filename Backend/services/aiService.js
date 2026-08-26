import { GoogleGenAI } from '@google/genai';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import AIChat from '../models/AIChat.js';
import { getAvailableSlots, validateSlotAvailability } from './availabilityService.js';
import { createAppointment, cancelAppointment, rescheduleAppointment } from './appointmentService.js';
import Setting from '../models/Setting.js';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Initialize Google Gemini LLM Client if API Key is configured
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  try {
    return new GoogleGenAI({ apiKey: apiKey.trim() });
  } catch (err) {
    console.warn('[Gemini] Initialization warning:', err.message);
    return null;
  }
}

export function getGeminiModelCandidates() {
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const defaults = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
  return Array.from(new Set([primaryModel, ...defaults]));
}

/**
 * Helper to call Gemini LLM for conversational responses with multi-model quota fallback
 */
export async function callGemini(prompt, systemInstruction = '') {
  const ai = getGeminiClient();
  if (!ai) return null;

  let effectiveInstruction = systemInstruction;
  if (!effectiveInstruction) {
    const setting = await Setting.findOne().catch(() => null);
    const tone = setting?.aiVoiceTone || 'Friendly, concise, and professional';
    effectiveInstruction = `You are the official AI appointment scheduling assistant for Nexora Technologies. Speak in a ${tone} tone. Keep responses clear and under 50 words.`;
  }

  const models = getGeminiModelCandidates();
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: effectiveInstruction ? { systemInstruction: effectiveInstruction } : undefined,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn(`[Gemini model ${model} failed]:`, err.message);
    }
  }
  return null;
}

// ----------------------------------------------------------------------
// NATURAL LANGUAGE DATE & TIME PARSERS
// ----------------------------------------------------------------------

export function resolveDateString(text, refDate = new Date()) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // 1. "day after tomorrow"
  if (lower.includes('day after tomorrow') || lower.includes('day after tomorow')) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }

  // 2. "today"
  if (lower.includes('today')) {
    return refDate.toISOString().split('T')[0];
  }

  // 3. "tomorrow" / "tomorow"
  if (lower.includes('tomorrow') || lower.includes('tomorow')) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // 4. ISO format YYYY-MM-DD
  const isoMatch = lower.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 5. Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = lower.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = parseInt(dmyMatch[3], 10);
    return `${y}-${m}-${d}`;
  }

  // 6. Explicit month names: "27 August", "August 27", "27th of August", "August 27th"
  const monthsMap = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const monthPattern = Object.keys(monthsMap).join('|');
  const dayFirstMatch = lower.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern})\\b(?:\\s+(\\d{4}))?`, 'i'));
  if (dayFirstMatch) {
    const day = parseInt(dayFirstMatch[1], 10);
    const month = monthsMap[dayFirstMatch[2].toLowerCase()];
    const year = dayFirstMatch[3] ? parseInt(dayFirstMatch[3], 10) : refDate.getFullYear();
    const d = new Date(year, month, day);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }

  const monthFirstMatch = lower.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:\\s+(\\d{4}))?`, 'i'));
  if (monthFirstMatch) {
    const month = monthsMap[monthFirstMatch[1].toLowerCase()];
    const day = parseInt(monthFirstMatch[2], 10);
    const year = monthFirstMatch[3] ? parseInt(monthFirstMatch[3], 10) : refDate.getFullYear();
    const d = new Date(year, month, day);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }

  // 7. Weekdays ("Friday", "next Friday", "this Monday")
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const dayName = WEEKDAYS[i];
    if (lower.includes(dayName)) {
      const todayIdx = refDate.getDay();
      let diff = i - todayIdx;
      if (lower.includes('next ' + dayName)) {
        if (diff <= 0) diff += 7;
        diff += 7;
      } else {
        if (diff <= 0) diff += 7;
      }
      const d = new Date(refDate);
      d.setDate(refDate.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

export function resolveTimeString(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Strip dates (ISO dates, DD/MM/YYYY, and month name expressions like "27 august", "august 27th")
  const textWithoutDates = lower
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '')
    .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, '')
    .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\b/gi, '')
    .replace(/\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, '');

  // 1. First priority: explicit meridian match (e.g. "3 PM", "11 AM", "3:30 pm")
  const meridianMatch = textWithoutDates.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (meridianMatch) {
    let hour = parseInt(meridianMatch[1], 10);
    const minute = meridianMatch[2] ? parseInt(meridianMatch[2], 10) : 0;
    const meridian = meridianMatch[3].toLowerCase();

    if (hour >= 1 && hour <= 12 && minute <= 59) {
      if (meridian === 'pm' && hour < 12) hour += 12;
      if (meridian === 'am' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // 2. Second priority: 24-hour format or explicit "at HH:MM" / "at HH"
  const timeMatch = textWithoutDates.match(/\b(?:at|around|for)?\s*(\d{1,2})(?::(\d{2}))\b/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    if (hour <= 23 && minute <= 59) {
      if (hour < 8) hour += 12; // Assume afternoon for 1-7 without am/pm
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // 3. Third priority: "at 3" or "around 4" (single hour number between 1 and 23)
  const hourMatch = textWithoutDates.match(/\b(?:at|around|for)\s+(\d{1,2})\b/i);
  if (hourMatch) {
    let hour = parseInt(hourMatch[1], 10);
    if (hour >= 1 && hour <= 23) {
      if (hour < 8) hour += 12;
      return `${String(hour).padStart(2, '0')}:00`;
    }
  }

  // 4. Relative time of day expressions
  if (lower.includes('morning')) return '10:00';
  if (lower.includes('afternoon')) return '14:00';
  if (lower.includes('evening')) return '17:00';

  return null;
}

export function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-z.]{2,}/i);
  return match ? match[0] : null;
}

export function extractNameFromMessage(text) {
  const match = text.match(/(?:for|name is|i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
  if (match) {
    const candidate = match[1].trim();
    if (!['Web Development', 'IT Support', 'Product Strategy', 'Security Audit'].some(s => candidate.toLowerCase().includes(s.toLowerCase()))) {
      return candidate;
    }
  }
  return null;
}

// ----------------------------------------------------------------------
// SERVICE MATCHING
// ----------------------------------------------------------------------

export function matchServiceFuzzy(text, activeServices) {
  if (!text || !activeServices || activeServices.length === 0) return null;
  const lower = text.toLowerCase();

  // 1. Match exact or substring of active service names
  for (const s of activeServices) {
    if (lower.includes(s.name.toLowerCase())) {
      return s;
    }
  }

  // 2. IT Consultation / Support mapping
  if (lower.includes('it consultation') || lower.includes('it consult') || lower.includes('it support') || lower.includes('technical support') || (lower.includes('it') && (lower.includes('consult') || lower.includes('support')))) {
    const matched = activeServices.find(s => s.name.toLowerCase().includes('it consultation') || s.name.toLowerCase().includes('it support') || s.name.toLowerCase().startsWith('it '));
    if (matched) return matched;
    const fallbackIt = activeServices.find(s => s.name.toLowerCase().includes('support') || s.name.toLowerCase().includes('technical'));
    if (fallbackIt) return fallbackIt;
  }

  // 3. Web Development / Consultation mapping
  if (lower.includes('web consultation') || lower.includes('web dev') || lower.includes('website') || lower.includes('web development') || lower.includes('web') || lower.includes('app') || lower.includes('react') || lower.includes('next.js')) {
    const matched = activeServices.find(s => s.name.toLowerCase().includes('web') || s.name.toLowerCase().includes('software'));
    if (matched) return matched;
  }

  // 4. Security mapping
  if (lower.includes('security') || lower.includes('audit') || lower.includes('vulnerability') || lower.includes('hack') || lower.includes('penetration')) {
    const matched = activeServices.find(s => s.name.toLowerCase().includes('security') || s.name.toLowerCase().includes('audit'));
    if (matched) return matched;
  }

  // 5. Strategy mapping
  if (lower.includes('strategy') || lower.includes('roadmap') || lower.includes('architecture') || /\bproduct\b/i.test(lower)) {
    const matched = activeServices.find(s => s.name.toLowerCase().includes('strategy'));
    if (matched) return matched;
  }

  // If no service keyword matched, return null
  return null;
}

// ----------------------------------------------------------------------
// INTENT & ENTITY EXTRACTION ENGINE (GEMINI + NLP FALLBACK)
// ----------------------------------------------------------------------

export async function detectIntentAndEntities(message, activeServices, currentDraft = {}) {
  const lower = message.toLowerCase().trim();

  // Affirmative check
  const isAffirmative = ['yes', 'confirm', 'sure', 'sounds good', 'yes please', 'ok', 'okay', 'book it', 'proceed', 'that\'s correct', 'go ahead'].some(w => lower === w || lower.startsWith(w));

  // Negative check
  const isNegative = ['no', 'no thanks', 'no thank you', 'not now', 'nope', 'nah', 'nevermind', 'never mind', "don't book", "dont book", 'cancel', 'i changed my mind'].some(w => lower === w || lower.startsWith(w));

  // 1. Try Gemini LLM for structured analysis
  const ai = getGeminiClient();
  if (ai) {
    const serviceCatalog = activeServices.map(s => s.name).join(', ');
    const prompt = `
Analyze the user message in an AI appointment scheduling context.
User Message: "${message}"
Current Draft State: ${JSON.stringify(currentDraft)}
Available Services: [${serviceCatalog}]

Determine the user's INTENT from:
BOOK_APPOINTMENT, CHECK_AVAILABILITY, VIEW_APPOINTMENTS, CANCEL_APPOINTMENT, RESCHEDULE_APPOINTMENT, LIST_SERVICES, GENERAL_QUESTION, GREETING, CONFIRM_APPOINTMENT, REJECT_APPOINTMENT, CHANGE_APPOINTMENT_DETAILS, UNKNOWN

Extract available parameters:
- service (match available services if applicable)
- date (YYYY-MM-DD format if date mentioned)
- time (HH:mm format if time mentioned)
- isChangeRequest (boolean, true if modifying previously stated details like "actually 5 PM")

Return ONLY JSON format without markdown code fences:
{
  "intent": "BOOK_APPOINTMENT",
  "service": "IT Consultation",
  "date": "2026-08-27",
  "time": "15:00",
  "isChangeRequest": false
}
`;
    const models = getGeminiModelCandidates();
    for (const model of models) {
      try {
        const res = await ai.models.generateContent({ model, contents: prompt });
        if (res && res.text) {
          const cleanText = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          if (parsed && parsed.intent) {
            const localServiceObj = parsed.service ? matchServiceFuzzy(parsed.service, activeServices) : matchServiceFuzzy(message, activeServices);
            const localDate = parsed.date || resolveDateString(message);
            const localTime = parsed.time || resolveTimeString(message);

            return {
              intent: parsed.intent,
              service: localServiceObj ? localServiceObj.name : null,
              serviceId: localServiceObj ? localServiceObj._id : null,
              date: localDate,
              time: localTime,
              isChangeRequest: parsed.isChangeRequest || false,
            };
          }
        }
      } catch (err) {
        console.warn(`[Gemini Intent Model ${model} failed]:`, err.message);
      }
    }
  }

  // 2. Rule-based NLP Fallback
  let intent = 'UNKNOWN';

  if (isAffirmative && (currentDraft.awaitingConfirmation || currentDraft.pendingAction === 'CANCEL_CONFIRMATION')) {
    intent = 'CONFIRM_APPOINTMENT';
  } else if (isNegative) {
    intent = 'REJECT_APPOINTMENT';
  } else if (
    lower.includes('cancel') ||
    lower.includes('don\'t want the appointment') ||
    lower.includes('cancel my appointment')
  ) {
    intent = 'CANCEL_APPOINTMENT';
  } else if (
    lower.includes('reschedule') ||
    lower.includes('move my appointment') ||
    lower.includes('change my appointment') ||
    lower.includes('update my appointment') ||
    lower.includes('update appointment') ||
    lower.includes('update my appointment time') ||
    lower.includes('update slot') ||
    lower.includes('update booking') ||
    (lower.includes('move it to') && currentDraft.targetAppointmentId) ||
    currentDraft.pendingAction === 'RESCHEDULE_INPUT'
  ) {
    intent = 'RESCHEDULE_APPOINTMENT';
  } else if (
    lower.includes('change') ||
    lower.includes('actually') ||
    lower.includes('instead') ||
    lower.includes('make it')
  ) {
    intent = 'CHANGE_APPOINTMENT_DETAILS';
  } else if (
    lower.includes('my appointments') ||
    lower.includes('upcoming appointments') ||
    lower.includes('show my appointments') ||
    lower.includes('view my appointments')
  ) {
    intent = 'VIEW_APPOINTMENTS';
  } else if (
    lower.includes('available slot') ||
    lower.includes('open slot') ||
    lower.includes('suggest slot') ||
    lower.includes('what time') ||
    lower.includes('free slot')
  ) {
    intent = 'CHECK_AVAILABILITY';
  } else if (
    lower.includes('what services') ||
    lower.includes('list services') ||
    lower.includes('services do you offer')
  ) {
    intent = 'LIST_SERVICES';
  } else if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower.startsWith('hi ') ||
    lower.startsWith('hello ') ||
    lower.startsWith('hey ') ||
    lower.includes('good morning') ||
    lower.includes('good afternoon')
  ) {
    intent = 'GREETING';
  } else if (
    lower.includes('book') ||
    lower.includes('appointment') ||
    lower.includes('consultation') ||
    lower.includes('meet') ||
    lower.includes('need') ||
    lower.includes('want') ||
    resolveDateString(message) ||
    resolveTimeString(message) ||
    matchServiceFuzzy(message, activeServices)
  ) {
    intent = 'BOOK_APPOINTMENT';
  } else if (lower.includes('thank') || lower.includes('price') || lower.includes('cost') || lower.includes('where')) {
    intent = 'GENERAL_QUESTION';
  }

  const serviceObj = matchServiceFuzzy(message, activeServices);
  const dateStr = resolveDateString(message);
  const timeStr = resolveTimeString(message);

  return {
    intent,
    service: serviceObj ? serviceObj.name : null,
    serviceId: serviceObj ? serviceObj._id : null,
    date: dateStr,
    time: timeStr,
    isChangeRequest: intent === 'CHANGE_APPOINTMENT_DETAILS' || lower.includes('actually') || lower.includes('change'),
  };
}

// ----------------------------------------------------------------------
// MAIN CONVERSATIONAL AI CHAT PROCESSOR
// ----------------------------------------------------------------------

export async function processAIChat({ message, conversationId, user = null }) {
  const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  // Retrieve or create persistent conversation in MongoDB
  let chatRecord = await AIChat.findOne({ conversationId: convId });
  if (!chatRecord) {
    try {
      chatRecord = await AIChat.create({
        conversationId: convId,
        userId: user?._id || null,
        clientName: user?.name || 'Guest Client',
        clientEmail: user?.email || '',
        messages: [],
        bookingDraft: {
          intent: null,
          service: null,
          serviceId: null,
          date: null,
          time: null,
          name: user?.name || null,
          email: user?.email || null,
          awaitingConfirmation: false,
          pendingAction: null,
          targetAppointmentId: null,
          targetDetails: null,
        },
      });
    } catch (err) {
      if (err.code === 11000) {
        chatRecord = await AIChat.findOne({ conversationId: convId });
      } else {
        throw err;
      }
    }
  }

  // Push user message into conversation history
  chatRecord.messages.push({
    sender: 'client',
    text: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  chatRecord.previewMessage = message;

  let draft = chatRecord.bookingDraft || {};

  // Check admin takeover
  if (chatRecord.takenOver) {
    const aiResponse = "An agent has taken over this chat and will respond shortly.";
    chatRecord.messages.push({ sender: 'ai', text: aiResponse });
    await chatRecord.save();
    return { success: true, message: aiResponse, conversationId: convId, draft, done: false };
  }

  // Load active services from MongoDB
  const activeServices = await Service.find({ status: true });
  const serviceNames = activeServices.map((s) => s.name);

  // Intent & Entity Extraction
  const extractedInfo = await detectIntentAndEntities(message, activeServices, draft);
  const { intent, service, serviceId, date, time, isChangeRequest } = extractedInfo;

  draft.intent = intent;

  // 1. PENDING ACTION: Cancellation Confirmation
  if (draft.pendingAction === 'CANCEL_CONFIRMATION') {
    if (intent === 'CONFIRM_APPOINTMENT') {
      const apptId = draft.targetAppointmentId;
      if (apptId) {
        await cancelAppointment(apptId, 'Cancelled by client via AI chat');
      }
      const details = draft.targetDetails || {};
      const reply = `Your booking slot for ${details.service || 'appointment'} on ${details.date || ''} at ${details.time || ''} has been successfully cancelled.`;

      draft.pendingAction = null;
      draft.targetAppointmentId = null;
      draft.targetDetails = null;

      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId, cancelled: true };
    } else {
      const details = draft.targetDetails || {};
      const reply = `Understood. Your booking for ${details.service || 'appointment'} on ${details.date || ''} at ${details.time || ''} remains confirmed.`;
      draft.pendingAction = null;
      draft.targetAppointmentId = null;
      draft.targetDetails = null;

      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }
  }

  // 2. INTENT: CANCEL_APPOINTMENT
  if (intent === 'CANCEL_APPOINTMENT') {
    const userEmail = user?.email || draft.email || chatRecord.clientEmail;
    const userName = user?.name || draft.name || chatRecord.clientName;
    const orClauses = [];
    if (user?._id) orClauses.push({ userId: user._id });
    if (userEmail) orClauses.push({ clientEmail: new RegExp(`^${userEmail.trim()}$`, 'i') });
    if (userName && userName !== 'Guest Client') orClauses.push({ clientName: new RegExp(`^${userName.trim()}$`, 'i') });

    const appts = await Appointment.find({
      $or: orClauses.length > 0 ? orClauses : [{ _id: null }],
      status: { $in: ['CONFIRMED', 'confirmed', 'PENDING', 'pending'] },
    }).sort({ date: 1, startTime: 1 });

    if (!appts || appts.length === 0) {
      const reply = "I couldn't find any active booked appointments under your profile to cancel. You currently have no upcoming bookings.";
      chatRecord.messages.push({ sender: 'ai', text: reply });
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }

    let targetAppt = appts[0];
    if (date || time) {
      const matched = appts.find(a => (!date || a.date === date) && (!time || a.startTime === time));
      if (matched) targetAppt = matched;
    }

    draft.pendingAction = 'CANCEL_CONFIRMATION';
    draft.targetAppointmentId = targetAppt._id;
    draft.targetDetails = {
      service: targetAppt.serviceName,
      date: targetAppt.date,
      time: targetAppt.startTime,
    };

    const reply = `You Sure Cancel The Slot for ${targetAppt.serviceName} on ${targetAppt.date} at ${targetAppt.startTime}?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft, awaitingConfirmation: true };
  }

  // 3. INTENT: RESCHEDULE_APPOINTMENT (For already confirmed MongoDB appointments)
  if (intent === 'RESCHEDULE_APPOINTMENT' || draft.pendingAction === 'RESCHEDULE_INPUT') {
    const userEmail = user?.email || draft.email || chatRecord.clientEmail;
    const userName = user?.name || draft.name || chatRecord.clientName;
    const orClauses = [];
    if (user?._id) orClauses.push({ userId: user._id });
    if (userEmail) orClauses.push({ clientEmail: new RegExp(`^${userEmail.trim()}$`, 'i') });
    if (userName && userName !== 'Guest Client') orClauses.push({ clientName: new RegExp(`^${userName.trim()}$`, 'i') });

    let appt = null;
    if (draft.targetAppointmentId) {
      appt = await Appointment.findById(draft.targetAppointmentId);
    }
    if (!appt) {
      const appts = await Appointment.find({
        $or: orClauses.length > 0 ? orClauses : [{ _id: null }],
        status: { $in: ['CONFIRMED', 'confirmed', 'PENDING', 'pending'] },
      }).sort({ date: 1, startTime: 1 });
      if (appts && appts.length > 0) appt = appts[0];
    }

    if (!appt) {
      const reply = "I couldn't find any active booked appointments under your profile to reschedule. Would you like to schedule a new appointment?";
      draft.pendingAction = null;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }

    const targetDate = date || draft.rescheduleDate || appt.date;
    const targetTime = time || draft.rescheduleTime || appt.startTime;

    if (date || time) {
      const durationToUse = appt.duration || 30;
      const validation = await validateSlotAvailability(targetDate, targetTime, durationToUse, appt._id);
      if (!validation.valid) {
        const avail = await getAvailableSlots(targetDate);
        let reply = `${validation.message}`;
        if (avail.available && avail.slots.length > 0) {
          reply += ` Available slots on ${targetDate}: ${avail.slots.map(s => s.startTime).join(', ')}.`;
        }
        chatRecord.messages.push({ sender: 'ai', text: reply });
        await chatRecord.save();
        return { success: true, message: reply, conversationId: convId };
      }

      const updated = await rescheduleAppointment(appt._id, targetDate, targetTime, 'client');
      const reply = `Your appointment has been successfully updated to ${updated.serviceName} on ${updated.date} at ${updated.startTime}.`;
      draft.pendingAction = null;
      draft.targetAppointmentId = null;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId, rescheduled: true, appointment: updated };
    } else {
      draft.pendingAction = 'RESCHEDULE_INPUT';
      draft.targetAppointmentId = appt._id;
      const reply = `Which Service, Date, or Time would you like to update? You want to update Date or Time for your appointment (currently ${appt.serviceName} on ${appt.date} at ${appt.startTime})?`;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }
  }

  // 4. INTENT: VIEW_APPOINTMENTS
  if (intent === 'VIEW_APPOINTMENTS') {
    const userEmail = user?.email || draft.email || chatRecord.clientEmail;
    const userName = user?.name || draft.name || chatRecord.clientName;
    const orClauses = [];
    if (user?._id) orClauses.push({ userId: user._id });
    if (userEmail) orClauses.push({ clientEmail: new RegExp(`^${userEmail.trim()}$`, 'i') });
    if (userName && userName !== 'Guest Client') orClauses.push({ clientName: new RegExp(`^${userName.trim()}$`, 'i') });

    const appts = await Appointment.find({
      $or: orClauses.length > 0 ? orClauses : [{ _id: null }],
      status: { $in: ['CONFIRMED', 'confirmed', 'PENDING', 'pending'] },
    }).sort({ date: -1 });

    if (!appts || appts.length === 0) {
      const reply = "You don't have any upcoming appointments booked. Would you like me to help you schedule one?";
      chatRecord.messages.push({ sender: 'ai', text: reply });
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }

    const listStr = appts.map((a) => `• ${a.serviceName} on ${a.date} at ${a.startTime}`).join('\n');
    const reply = `Here are your upcoming appointments:\n${listStr}`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId };
  }

  // 5. INTENT: LIST_SERVICES
  if (intent === 'LIST_SERVICES') {
    const serviceList = activeServices.map((s) => `• ${s.name} (${s.durationMinutes} mins${s.price > 0 ? `, $${s.price}` : ', Free'})`).join('\n');
    const reply = `We offer the following services:\n${serviceList}\nWhich one would you like to book?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId };
  }

  // 5.5. INTENT: THANK_YOU / Courtesy Response
  const lowerMsg = message.toLowerCase().trim();
  if (
    lowerMsg.includes('thank') ||
    lowerMsg.includes('thx') ||
    lowerMsg.includes('appreciate') ||
    lowerMsg.includes('grateful')
  ) {
    const clientFirstName = user?.name?.split(' ')[0] || draft.name?.split(' ')[0] || '';
    const greetingName = clientFirstName ? ` ${clientFirstName}` : '';
    const reply = `You're very welcome${greetingName}! Thank you for choosing Nexora Technologies. We look forward to assisting you. Wishing you a great day ahead!`;

    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // 6. INTENT: GREETING
  if (intent === 'GREETING' && !draft.service && !draft.date) {
    const clientName = user?.name?.split(' ')[0] || draft.name?.split(' ')[0] || '';
    const greetingName = clientName ? ` ${clientName}` : '';
    const reply = `Hello${greetingName}! 👋 Welcome to Nexora Technologies (Codeinyourself AI Appointments). How can I help you today?\n\nWe offer: ${serviceNames.join(', ')}. What service or appointment date are you interested in?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // 7. INTENT: REJECT_APPOINTMENT
  if (intent === 'REJECT_APPOINTMENT') {
    const clientFirstName = user?.name?.split(' ')[0] || draft.name?.split(' ')[0] || '';
    const namePrefix = clientFirstName ? `, ${clientFirstName}` : '';
    const reply = `No problem at all${namePrefix}! Thank you for considering Codeinyourself IT Company. Let us know whenever you need assistance. Have a great day!`;

    chatRecord.bookingDraft = {
      intent: null,
      service: null,
      serviceId: null,
      date: null,
      time: null,
      name: user?.name || null,
      email: user?.email || null,
      awaitingConfirmation: false,
      pendingAction: null,
      targetAppointmentId: null,
      targetDetails: null,
    };

    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, declined: true, draft: chatRecord.bookingDraft };
  }

  // 8. INTENT: CONFIRM_APPOINTMENT
  if (intent === 'CONFIRM_APPOINTMENT' && draft.service && draft.date && draft.time) {
    const finalName = draft.name || user?.name || 'Guest Client';
    const finalEmail = draft.email || user?.email || 'client@example.com';

    try {
      const appt = await createAppointment({
        userId: user?._id || chatRecord.userId,
        clientName: finalName,
        clientEmail: finalEmail,
        serviceId: draft.serviceId,
        serviceName: draft.service,
        date: draft.date,
        startTime: draft.time,
        source: 'ai-chat',
      });

      const reply = `Your appointment has been confirmed for ${appt.serviceName} on ${appt.date} at ${appt.startTime} with Neha Shah. A confirmation has been sent to ${finalEmail}.`;

      chatRecord.bookingDraft = {
        intent: null,
        service: null,
        serviceId: null,
        date: null,
        time: null,
        name: user?.name || null,
        email: user?.email || null,
        awaitingConfirmation: false,
        pendingAction: null,
        targetAppointmentId: null,
        targetDetails: null,
      };

      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();

      return {
        success: true,
        message: reply,
        conversationId: convId,
        done: true,
        booking: {
          id: appt._id,
          clientName: appt.clientName,
          clientEmail: appt.clientEmail,
          service: appt.serviceName,
          date: appt.date,
          time: appt.startTime,
          status: 'confirmed',
        },
      };
    } catch (err) {
      const reply = `Sorry, could not confirm the booking: ${err.message}. Would you like to select another slot?`;
      draft.awaitingConfirmation = false;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: false, message: reply, conversationId: convId };
    }
  }

  // 9. DYNAMIC DRAFT STATE MERGING
  if (service) {
    draft.service = service;
    draft.serviceId = serviceId;
  }
  if (date) {
    draft.date = date;
  }
  if (time) {
    draft.time = time;
  }

  // Auto populate user credentials if available
  if (!draft.name && user?.name) draft.name = user.name;
  if (!draft.email && user?.email) draft.email = user.email;

  // Extract explicit name/email from message if mentioned
  const extractedEmail = extractEmail(message);
  if (extractedEmail) draft.email = extractedEmail;
  const extractedName = extractNameFromMessage(message);
  if (extractedName) draft.name = extractedName;

  // Check required fields for booking: service, date, time
  const missingFields = [];
  if (!draft.service) missingFields.push('service');
  if (!draft.date) missingFields.push('date');
  if (!draft.time) missingFields.push('time');

  // If fields are missing, ask ONLY for missing information
  if (missingFields.length > 0) {
    let reply = '';
    if (missingFields.includes('service') && missingFields.includes('date') && missingFields.includes('time')) {
      reply = `Which service and preferred date or time would you like to book? We offer: ${serviceNames.join(', ')}.`;
    } else if (missingFields.includes('service') && missingFields.includes('time')) {
      reply = `Which service and time would you prefer for ${draft.date}? We offer: ${serviceNames.join(', ')}.`;
    } else if (missingFields.includes('service') && missingFields.includes('date')) {
      reply = `Which service and date would you prefer for an appointment at ${draft.time}? We offer: ${serviceNames.join(', ')}.`;
    } else if (missingFields.includes('date') && missingFields.includes('time')) {
      reply = `What date and time would you prefer for your ${draft.service} appointment? (e.g. "Tomorrow at 3 PM")`;
    } else if (missingFields.includes('service')) {
      reply = `Which service would you like to book for ${draft.date}${draft.time ? ' at ' + draft.time : ''}? We offer: ${serviceNames.join(', ')}.`;
    } else if (missingFields.includes('date')) {
      reply = `What date would you prefer for your ${draft.service} appointment at ${draft.time}?`;
    } else if (missingFields.includes('time')) {
      const avail = await getAvailableSlots(draft.date);
      if (avail.available && avail.slots && avail.slots.length > 0) {
        const topSlots = avail.slots.map(s => s.startTime).join(', ');
        reply = `Available slots for ${draft.service} on ${draft.date} include: ${topSlots}. Which time works best for you?`;
      } else {
        reply = `Currently, all upcoming slots on ${draft.date} are fully booked or closed in our system. Please select another date.`;
        draft.date = null;
      }
    }

    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // 10. ALL REQUIRED FIELDS (service, date, time) ARE PRESENT
  const serviceObj = activeServices.find(s => s.name.toLowerCase() === draft.service.toLowerCase()) || activeServices[0];
  const duration = serviceObj ? serviceObj.durationMinutes : 30;

  const slotValidation = await validateSlotAvailability(draft.date, draft.time, duration);
  if (!slotValidation.valid) {
    const avail = await getAvailableSlots(draft.date);
    let reply = `${slotValidation.message}`;
    if (avail.available && avail.slots && avail.slots.length > 0) {
      const topSlots = avail.slots.map(s => s.startTime).join(', ');
      reply += ` Available openings on ${draft.date}: ${topSlots}. Which time works for you?`;
    }
    draft.time = null;
    if (slotValidation.reason === 'WEEKEND_CLOSED' || slotValidation.reason === 'HOLIDAY' || slotValidation.reason === 'PAST_DATE') {
      draft.date = null;
    }

    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  if (!draft.name) {
    const reply = `Great! ${draft.time} on ${draft.date} is available for ${draft.service}. What is your full name?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  if (!draft.email) {
    const reply = `Thanks ${draft.name}. What is your email address for the appointment confirmation?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  draft.awaitingConfirmation = true;
  const reply = `${draft.service} is available on ${draft.date} at ${draft.time}. Would you like me to confirm this booking?`;

  chatRecord.messages.push({ sender: 'ai', text: reply });
  chatRecord.bookingDraft = draft;
  chatRecord.markModified('bookingDraft');
  await chatRecord.save();

  return {
    success: true,
    message: reply,
    conversationId: convId,
    draft,
    awaitingConfirmation: true,
  };
}
