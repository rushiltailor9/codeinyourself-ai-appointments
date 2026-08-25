import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { validateSlotAvailability, calculateEndTime } from './availabilityService.js';
import { createNotification } from './notificationService.js';

export async function createAppointment({
  userId = null,
  clientName,
  clientEmail,
  serviceId = null,
  serviceName,
  date,
  startTime,
  reason = '',
  source = 'ai-chat',
  staff = 'Neha Shah',
}) {
  if (!clientName || !clientEmail || !date || !startTime) {
    throw new Error('clientName, clientEmail, date, and startTime are required.');
  }

  // Resolve service if not passed or find by name
  let duration = 30;
  let resolvedServiceName = serviceName;
  let resolvedServiceId = serviceId;

  if (serviceId) {
    const s = await Service.findById(serviceId);
    if (s) {
      duration = s.durationMinutes;
      resolvedServiceName = s.name;
    }
  } else if (serviceName) {
    const s = await Service.findOne({ name: { $regex: new RegExp(serviceName, 'i') } });
    if (s) {
      duration = s.durationMinutes;
      resolvedServiceName = s.name;
      resolvedServiceId = s._id;
    }
  }

  // Final immediate recheck before creation
  const validation = await validateSlotAvailability(date, startTime, duration);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const endTime = validation.endTime || calculateEndTime(startTime, duration);

  const appointment = await Appointment.create({
    userId,
    clientName,
    clientEmail: clientEmail.toLowerCase(),
    serviceId: resolvedServiceId,
    serviceName: resolvedServiceName || 'General Consultation',
    date,
    startTime,
    endTime,
    duration,
    status: 'CONFIRMED',
    reason,
    source,
    staff,
  });

  // Client notification
  await createNotification({
    userId,
    recipientRole: 'client',
    type: 'BOOKING_CONFIRMED',
    message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.startTime} has been confirmed.`,
  });

  // Admin notification
  await createNotification({
    recipientRole: 'admin',
    type: 'NEW_BOOKING',
    message: `New booking: ${appointment.clientName} booked ${appointment.serviceName} for ${appointment.date} at ${appointment.startTime}.`,
  });

  return appointment;
}

export async function getMyAppointments(userId, clientEmail = null) {
  const query = {};
  if (userId) {
    query.userId = userId;
  } else if (clientEmail) {
    query.clientEmail = clientEmail.toLowerCase();
  } else {
    return [];
  }
  return await Appointment.find(query).sort({ date: -1, startTime: -1 });
}

export async function getAllAppointments(filter = {}) {
  const query = {};
  if (filter.status) query.status = filter.status.toUpperCase();
  if (filter.date) query.date = filter.date;
  return await Appointment.find(query).sort({ date: -1, startTime: -1 });
}

export async function updateAppointmentStatus(appointmentId, status, updatedBy = 'admin', reason = '') {
  const allowed = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
  const upperStatus = status.toUpperCase();
  if (!allowed.includes(upperStatus)) {
    throw new Error(`Invalid status: ${status}. Must be one of ${allowed.join(', ')}`);
  }

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { status: upperStatus },
    { new: true }
  );

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Bidirectional Cancel Notification Routing
  if (upperStatus === 'CANCELLED') {
    if (updatedBy === 'admin') {
      // Admin cancelled -> Notify Client
      await createNotification({
        userId: appointment.userId,
        recipientRole: 'client',
        type: 'BOOKING_CANCELLED_BY_ADMIN',
        message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.startTime} was cancelled by administrator.${reason ? ` Reason: ${reason}` : ''}`,
      });
    } else {
      // Client cancelled -> Notify Admin & Client
      await createNotification({
        recipientRole: 'admin',
        type: 'BOOKING_CANCELLED_BY_CLIENT',
        message: `Client ${appointment.clientName} cancelled their appointment for ${appointment.serviceName} scheduled on ${appointment.date} at ${appointment.startTime}.${reason ? ` Reason: ${reason}` : ''}`,
      });

      await createNotification({
        userId: appointment.userId,
        recipientRole: 'client',
        type: 'BOOKING_CANCELLED',
        message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.startTime} has been cancelled.`,
      });
    }
  } else {
    // Send standard status update notification to client
    await createNotification({
      userId: appointment.userId,
      recipientRole: 'client',
      type: `BOOKING_${upperStatus}`,
      message: `Your appointment on ${appointment.date} at ${appointment.startTime} is now marked as ${upperStatus}.`,
    });
  }

  return appointment;
}

export async function cancelAppointment(appointmentId, reason = '', cancelledBy = 'client') {
  const isCancelledByAdmin = cancelledBy === 'admin' || (reason && reason.toLowerCase().includes('admin'));
  return await updateAppointmentStatus(appointmentId, 'CANCELLED', isCancelledByAdmin ? 'admin' : 'client', reason);
}

export async function rescheduleAppointment(appointmentId, newDate, newStartTime, rescheduledBy = 'client') {
  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new Error('Appointment not found');

  const oldDate = appt.date;
  const oldTime = appt.startTime;

  const validation = await validateSlotAvailability(newDate, newStartTime, appt.duration, appointmentId);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  appt.date = newDate;
  appt.startTime = newStartTime;
  appt.endTime = validation.endTime;
  appt.status = 'CONFIRMED';
  await appt.save();

  // 1. Client notification
  await createNotification({
    userId: appt.userId,
    recipientRole: 'client',
    type: 'BOOKING_RESCHEDULED',
    message: `Your appointment for ${appt.serviceName} has been rescheduled to ${newDate} at ${newStartTime}.`,
  });

  // 2. Admin notification
  await createNotification({
    recipientRole: 'admin',
    type: 'BOOKING_RESCHEDULED',
    message: `Client ${appt.clientName} rescheduled their appointment for ${appt.serviceName} from ${oldDate} ${oldTime} to ${newDate} at ${newStartTime}.`,
  });

  return appt;
}
