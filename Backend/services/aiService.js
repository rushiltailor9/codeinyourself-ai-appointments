import { GoogleGenAI } from '@google/genai';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import AIChat from '../models/AIChat.js';
import { getAvailableSlots, validateSlotAvailability } from './availabilityService.js';
import { createAppointment, cancelAppointment, rescheduleAppointment } from './appointmentService.js';

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

/**
 * Helper to call Gemini LLM for conversational enhancements
 */
export async function callGemini(prompt, systemInstruction = '') {
  const ai = getGeminiClient();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text ? response.text.trim() : null;
  } catch (err) {
    console.warn('[Gemini] Fallback triggered:', err.message);
    return null;
  }
}

// Resolve date helper (today, tomorrow, weekday names, or YYYY-MM-DD)
export function resolveDateString(text) {
  const lower = text.toLowerCase();
  const today = new Date();

  if (lower.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  if (lower.includes('tomorrow') || lower.includes('tomorow')) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (lower.includes(WEEKDAYS[i])) {
      const todayIdx = today.getDay();
      let diff = i - todayIdx;
      if (diff <= 0) diff += 7; // Next occurrence
      const d = new Date(today);
      d.setDate(today.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }
  const explicit = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (explicit) return explicit[0];

  return null;
}

// Extract time helper (3pm, 15:00, 3:30 pm, 11am, 14:00, 2pm)
export function resolveTimeString(text) {
  // Strip out any full YYYY-MM-DD date strings so numbers from year/month don't get misparsed as hours
  const textWithoutDates = text.replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '');
  const match = textWithoutDates.toLowerCase().match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridian = match[3] ? match[3].toLowerCase() : null;

  if (hour > 23) return null;
  if (meridian === 'pm' && hour < 12) hour += 12;
  if (meridian === 'am' && hour === 12) hour = 0;
  if (!meridian && hour < 8) hour += 12; // Assume afternoon if 1-7 without am/pm
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-z.]{2,}/i);
  return match ? match[0] : null;
}

/**
 * Main AI Chat Processor with Tool Calling and Database Validation
 */
export async function processAIChat({ message, conversationId, user = null }) {
  const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  // Find or create conversation state in MongoDB
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
          service: null,
          serviceId: null,
          date: null,
          time: null,
          name: user?.name || null,
          email: user?.email || null,
          awaitingName: false,
          awaitingConfirmation: false,
          pendingAction: null,
          targetAppointmentId: null,
          targetDetails: null,
          rescheduleDate: null,
          rescheduleTime: null,
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

  // Record client message
  chatRecord.messages.push({
    sender: 'client',
    text: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  chatRecord.previewMessage = message;

  const lower = message.toLowerCase().trim();
  let draft = chatRecord.bookingDraft || {};

  // Check for admin takeover
  if (chatRecord.takenOver) {
    const aiResponse = "An agent has taken over this chat and will respond shortly.";
    chatRecord.messages.push({ sender: 'ai', text: aiResponse });
    await chatRecord.save();
    return { success: true, message: aiResponse, conversationId: convId, draft, done: false };
  }

  // Check escalation keywords
  if (lower.includes('urgent') || lower.includes('down') || lower.includes('broken') || lower.includes('server is down')) {
    chatRecord.actionRequired = 'Escalation Suggested';
  }

  // Load active services from MongoDB
  const activeServices = await Service.find({ status: true });
  const serviceNames = activeServices.map((s) => s.name);

  const isAffirmative = ['yes', 'confirm', 'sure', 'sounds good', 'yes please', 'ok', 'okay', 'book it', 'proceed', 'cancel it', 'yes cancel'].some((w) => lower === w || lower.startsWith(w));

  const isNegative = [
    'no',
    'no thanks',
    'no thank you',
    'not now',
    'nope',
    'nah',
    'nevermind',
    'never mind',
    "i can't",
    'i cannot',
    'cannot book',
    "can't book",
    'not today',
    'maybe later',
    'dont want',
    "don't want",
    'no i am busy',
    "no i'm busy",
    'not interested',
    'not available',
    'no i cannot',
    'no i cant',
    'no i can not',
    'decline',
    'not able to book',
    'not able',
  ].some((w) => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower.includes(' ' + w + ' ') || lower.includes('no thanks') || lower.includes('no thank you') || lower.includes('not now') || lower.includes('maybe later') || lower.includes("can't book") || lower.includes('cannot book') || lower.includes('not able to book') || lower.includes('not able'));

  // 1. PENDING ACTION: Cancellation Confirmation
  if (draft.pendingAction === 'CANCEL_CONFIRMATION') {
    if (isAffirmative || lower.includes('cancel')) {
      const apptId = draft.targetAppointmentId;
      if (apptId) {
        await cancelAppointment(apptId, 'Cancelled by client via AI chat');
      }
      const details = draft.targetDetails || {};
      const reply = `Your booking slot for ${details.service || 'appointment'} on ${details.date || ''} at ${details.time || ''} has been successfully cancelled. This slot is now available for other clients for booking.`;
      
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

  // 2. PENDING ACTION: Reschedule / Update Date or Time
  if (draft.pendingAction === 'RESCHEDULE_INPUT') {
    const apptId = draft.targetAppointmentId;
    const appt = await Appointment.findById(apptId);
    if (!appt || appt.status === 'CANCELLED') {
      const reply = "I could not find an active appointment to reschedule. Would you like to book a new appointment?";
      draft.pendingAction = null;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }

    const newExtractedDate = resolveDateString(message);
    const newExtractedTime = resolveTimeString(message);

    const targetDate = newExtractedDate || draft.rescheduleDate || appt.date;
    const targetTime = newExtractedTime || draft.rescheduleTime;

    if (!targetTime) {
      draft.rescheduleDate = targetDate;
      const avail = await getAvailableSlots(targetDate);
      let reply = `You want to update Date or Time for ${appt.serviceName}? `;
      if (avail.available && avail.slots.length > 0) {
        const topSlots = avail.slots.slice(0, 4).map((s) => s.startTime).join(', ');
        reply += `Available slots on ${targetDate} include: ${topSlots}. Which time works for you?`;
      } else {
        reply += `Please provide the new date and time you prefer (e.g. "Tomorrow at 4pm" or "Friday at 2pm").`;
      }
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId, draft };
    }

    // Validate proposed slot
    const slotValidation = await validateSlotAvailability(targetDate, targetTime, appt.duration, appt._id);
    if (!slotValidation.valid) {
      const avail = await getAvailableSlots(targetDate);
      let reply = `${slotValidation.message}`;
      if (avail.available && avail.slots.length > 0) {
        const topSlots = avail.slots.slice(0, 3).map((s) => s.startTime).join(', ');
        reply += ` Available openings on ${targetDate}: ${topSlots}. Which time works for you?`;
      }
      draft.rescheduleTime = null;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId, draft };
    }

    // Execute Reschedule in MongoDB
    const updated = await rescheduleAppointment(appt._id, targetDate, targetTime);
    const reply = `Your appointment for ${updated.serviceName} has been successfully updated to ${updated.date} at ${updated.startTime}. A confirmation notification has been sent.`;
    
    draft.pendingAction = null;
    draft.targetAppointmentId = null;
    draft.rescheduleDate = null;
    draft.rescheduleTime = null;

    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, rescheduled: true, appointment: updated };
  }

  // 3. INTENT: Cancel appointment request with Confirmation prompt
  if (lower.includes('cancel')) {
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

    const targetAppt = appts[0];
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

  // 4. INTENT: Reschedule / Update Date or Time
  if (
    lower.includes('reschedule') ||
    lower.includes('update') ||
    lower.includes('change time') ||
    lower.includes('change date') ||
    lower.includes('move') ||
    lower.includes('postpone')
  ) {
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
      const reply = "I couldn't find any active booked appointments under your profile to update or reschedule. Would you like to schedule a new appointment?";
      chatRecord.messages.push({ sender: 'ai', text: reply });
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId };
    }

    const targetAppt = appts[0];
    const newExtractedDate = resolveDateString(message);
    const newExtractedTime = resolveTimeString(message);

    if (newExtractedDate && newExtractedTime) {
      // Direct slot validation & reschedule
      const slotValidation = await validateSlotAvailability(newExtractedDate, newExtractedTime, targetAppt.duration, targetAppt._id);
      if (!slotValidation.valid) {
        const avail = await getAvailableSlots(newExtractedDate);
        let reply = `${slotValidation.message}`;
        if (avail.available && avail.slots.length > 0) {
          const topSlots = avail.slots.slice(0, 3).map((s) => s.startTime).join(', ');
          reply += ` Available openings on ${newExtractedDate}: ${topSlots}. Which time works for you?`;
        }
        draft.pendingAction = 'RESCHEDULE_INPUT';
        draft.targetAppointmentId = targetAppt._id;
        draft.rescheduleDate = newExtractedDate;
        chatRecord.messages.push({ sender: 'ai', text: reply });
        chatRecord.bookingDraft = draft;
        chatRecord.markModified('bookingDraft');
        await chatRecord.save();
        return { success: true, message: reply, conversationId: convId, draft };
      }

      const updated = await rescheduleAppointment(targetAppt._id, newExtractedDate, newExtractedTime);
      const reply = `Your appointment for ${updated.serviceName} has been successfully updated to ${updated.date} at ${updated.startTime}. A confirmation notification has been sent.`;
      
      draft.pendingAction = null;
      draft.targetAppointmentId = null;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId, rescheduled: true, appointment: updated };
    }

    // Ask user if they want to update Date or Time
    draft.pendingAction = 'RESCHEDULE_INPUT';
    draft.targetAppointmentId = targetAppt._id;
    draft.rescheduleDate = newExtractedDate || targetAppt.date;
    draft.rescheduleTime = newExtractedTime || null;

    const reply = `You want to update Date or Time for ${targetAppt.serviceName} (currently on ${targetAppt.date} at ${targetAppt.startTime})? Please provide the new date and time you prefer.`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, awaitingRescheduleInput: true };
  }

  // 5. INTENT: Check existing appointments ("show my appointments", "my appointments")
  if (lower.includes('my appointments') || lower.includes('upcoming appointments') || lower.includes('view my appointments')) {
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

  // 6. INTENT: List Services
  if (lower.includes('what services') || lower.includes('services do you offer') || lower.includes('list services')) {
    const serviceList = activeServices.map((s) => `• ${s.name} (${s.durationMinutes} min${s.price > 0 ? `, $${s.price}` : ', Free'})`).join('\n');
    const reply = `We offer the following services:\n${serviceList}\nWhich one would you like to book?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId };
  }

  // 7. Booking confirmation response ("yes", "confirm", "confirm booking", "sounds good", "sure")
  if (draft.awaitingConfirmation && isAffirmative && draft.service && draft.date && draft.time && draft.name && draft.email) {
    try {
      const appt = await createAppointment({
        userId: user?._id || chatRecord.userId,
        clientName: draft.name,
        clientEmail: draft.email,
        serviceId: draft.serviceId,
        serviceName: draft.service,
        date: draft.date,
        startTime: draft.time,
        source: 'ai-chat',
      });

      const reply = `Your appointment has been confirmed for ${appt.serviceName} on ${appt.date} at ${appt.startTime} with Neha Shah. A confirmation has been sent to ${draft.email}.`;
      
      chatRecord.bookingDraft = {
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
      const reply = `Sorry, could not confirm the booking: ${err.message}. Would you like to select another time?`;
      draft.awaitingConfirmation = false;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: false, message: reply, conversationId: convId };
    }
  }

  // 7.1. INTENT: Client Says No / Declines Booking After Slot Is Available Or During Confirmation
  if (
    isNegative &&
    !isAffirmative &&
    (draft.awaitingConfirmation || (draft.service && (draft.date || draft.time)))
  ) {
    const clientFirstName = user?.name?.split(' ')[0] || draft.name?.split(' ')[0] || '';
    const namePrefix = clientFirstName ? `, ${clientFirstName}` : '';
    const reply = `No problem at all${namePrefix}! Thank you for considering Nexora Technologies. If you need any assistance or would like to schedule an appointment in the future, feel free to reach out anytime. Wishing you a great day ahead!`;

    chatRecord.bookingDraft = {
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

  // 7.2. INTENT: Client Says "No" / "No Thanks" In General
  if (
    isNegative &&
    !draft.service &&
    !draft.date &&
    !draft.pendingAction
  ) {
    const clientFirstName = user?.name?.split(' ')[0] || '';
    const namePrefix = clientFirstName ? `, ${clientFirstName}` : '';
    const reply = `You're very welcome${namePrefix}! Thank you for contacting Nexora Technologies. Let us know whenever you need any IT assistance. Have a wonderful day ahead!`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // 8. INTENT: Thank You & Polite Greeting Response
  if (
    lower.includes('thank') ||
    lower.includes('thx') ||
    lower.includes('appreciate') ||
    lower.includes('grateful')
  ) {
    const clientName = user?.name?.split(' ')[0] || draft.name?.split(' ')[0] || '';
    const greetingName = clientName ? `, ${clientName}` : '';
    const reply = `You're very welcome${greetingName}! Thank you for choosing Nexora Technologies. We look forward to assisting you. Wishing you a great day ahead! If you need anything else, feel free to reach out anytime.`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // 9. INTENT: General Greeting ("hi", "hello", "hey", "good morning", "good evening")
  if (
    (lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower.startsWith('hi ') ||
      lower.startsWith('hello ') ||
      lower.startsWith('hey ') ||
      lower.includes('good morning') ||
      lower.includes('good afternoon') ||
      lower.includes('good evening')) &&
    !draft.service &&
    !draft.date
  ) {
    const clientName = user?.name?.split(' ')[0] || draft.name?.split(' ')[0] || '';
    const greetingName = clientName ? ` ${clientName}` : '';
    const reply = `Hello${greetingName}! Welcome to Nexora Technologies. How can I assist you today? You can schedule a consultation, manage your appointments, or ask about our available services.`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // Extract service from user message
  for (const s of activeServices) {
    if (lower.includes(s.name.toLowerCase())) {
      draft.service = s.name;
      draft.serviceId = s._id;
      break;
    }
  }
  if (!draft.service) {
    if (lower.includes('web') || lower.includes('consultation') || lower.includes('website')) {
      const matched = activeServices.find((s) => s.name.toLowerCase().includes('web'));
      if (matched) { draft.service = matched.name; draft.serviceId = matched._id; }
    } else if (lower.includes('it support') || lower.includes('support') || lower.includes('server')) {
      const matched = activeServices.find((s) => s.name.toLowerCase().includes('support'));
      if (matched) { draft.service = matched.name; draft.serviceId = matched._id; }
    } else if (lower.includes('strategy') || lower.includes('product')) {
      const matched = activeServices.find((s) => s.name.toLowerCase().includes('strategy'));
      if (matched) { draft.service = matched.name; draft.serviceId = matched._id; }
    } else if (lower.includes('security') || lower.includes('audit')) {
      const matched = activeServices.find((s) => s.name.toLowerCase().includes('security'));
      if (matched) { draft.service = matched.name; draft.serviceId = matched._id; }
    }
  }

  // Extract date
  const extractedDate = resolveDateString(message);
  if (extractedDate) draft.date = extractedDate;

  // Extract time
  const extractedTime = resolveTimeString(message);
  if (extractedTime) draft.time = extractedTime;

  // Extract email
  const extractedEmail = extractEmail(message);
  if (extractedEmail) draft.email = extractedEmail;

  // Check if name provided
  if (!draft.name && user?.name) {
    draft.name = user.name;
  }
  if (!draft.email && user?.email) {
    draft.email = user.email;
  }

  // Step 1: Missing Service
  if (!draft.service) {
    let customGeminiReply = null;
    if (getGeminiClient()) {
      customGeminiReply = await callGemini(
        `A client sent the message: "${message}". We offer: ${serviceNames.join(', ')}. Provide a concise, friendly response under 35 words asking which service they would like to book.`,
        'You are the official AI booking assistant for Nexora Technologies. Be concise and professional.'
      );
    }
    const reply = customGeminiReply || `Sure! What service would you like to book? We offer ${serviceNames.join(', ')}.`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // Step 2: Missing Date or Time
  if (!draft.date || !draft.time) {
    let reply = `Got it — ${draft.service}. `;
    if (!draft.date && !draft.time) {
      reply += `What date and time works best for you? (e.g. "Tomorrow at 3pm" or "Friday at 11am")`;
    } else if (!draft.date) {
      reply += `What date would you prefer?`;
    } else {
      // Check availability on this date to recommend open slots
      const avail = await getAvailableSlots(draft.date);
      if (avail.available && avail.slots.length > 0) {
        const topSlots = avail.slots.slice(0, 4).map((s) => s.startTime).join(', ');
        reply += `Available slots on ${draft.date} include ${topSlots}. Which time do you prefer?`;
      } else {
        reply += `We don't have available slots on ${draft.date}. Could you choose another date?`;
      }
    }
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // Step 3: Validate slot with MongoDB
  const slotValidation = await validateSlotAvailability(draft.date, draft.time, 30);
  if (!slotValidation.valid) {
    const avail = await getAvailableSlots(draft.date);
    let reply = `${slotValidation.message}`;
    if (avail.available && avail.slots.length > 0) {
      const topSlots = avail.slots.slice(0, 3).map((s) => s.startTime).join(', ');
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

  // Step 4: Missing Name
  if (!draft.name) {
    const isNotDateOrTime = !extractedDate && !extractedTime && !extractedEmail;
    const isShortMessage = message.trim().length > 0 && message.trim().length <= 50;
    const isNotServiceKeywords = !lower.includes('service') && !lower.includes('appointment') && !lower.includes('book') && !lower.includes('cancel');

    if (isNotDateOrTime && isShortMessage && isNotServiceKeywords && (draft.awaitingName || (draft.service && draft.date && draft.time))) {
      let cleanName = message.replace(/^(my name is|i'm|i am|this is|it's|name is)\s+/i, '').trim();
      cleanName = cleanName.replace(/[.!,]$/g, '').trim();
      if (cleanName.length > 1) {
        draft.name = cleanName;
        draft.awaitingName = false;
      }
    }

    if (!draft.name) {
      const reply = `Great! ${draft.time} on ${draft.date} is available. What is your full name?`;
      draft.awaitingName = true;
      chatRecord.messages.push({ sender: 'ai', text: reply });
      chatRecord.bookingDraft = draft;
      chatRecord.markModified('bookingDraft');
      await chatRecord.save();
      return { success: true, message: reply, conversationId: convId, draft, awaitingName: true };
    }
  }

  // Step 5: Missing Email
  if (!draft.email) {
    const reply = `Thanks ${draft.name}. What is your email address for the appointment confirmation?`;
    chatRecord.messages.push({ sender: 'ai', text: reply });
    chatRecord.bookingDraft = draft;
    chatRecord.markModified('bookingDraft');
    await chatRecord.save();
    return { success: true, message: reply, conversationId: convId, draft };
  }

  // Step 6: Explicit Confirmation Requirement
  draft.awaitingConfirmation = true;
  const reply = `I have verified availability: ${draft.service} on ${draft.date} at ${draft.time} for ${draft.name} (${draft.email}). Would you like to confirm this booking?`;
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
