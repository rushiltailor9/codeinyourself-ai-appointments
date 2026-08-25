import Appointment from '../models/Appointment.js';
import {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
} from '../services/appointmentService.js';

export async function create(req, res) {
  try {
    const { clientName, clientEmail, serviceId, serviceName, date, startTime, reason, source, staff } = req.body;
    const userId = req.user ? req.user._id : null;

    const appointment = await createAppointment({
      userId,
      clientName: clientName || req.user?.name,
      clientEmail: clientEmail || req.user?.email,
      serviceId,
      serviceName,
      date,
      startTime,
      reason,
      source: source || 'client-portal',
      staff,
    });

    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function getClientAppointments(req, res) {
  try {
    const userId = req.user ? req.user._id : null;
    const email = req.user?.email || req.query.email;
    const appointments = await getMyAppointments(userId, email);
    return res.json({ success: true, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAppointmentById(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    return res.json({ success: true, appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function reschedule(req, res) {
  try {
    const { date, startTime } = req.body;
    if (!date || !startTime) return res.status(400).json({ success: false, message: 'New date and startTime are required' });

    const updated = await rescheduleAppointment(req.params.id, date, startTime);
    return res.json({ success: true, appointment: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function cancel(req, res) {
  try {
    const cancelledBy = req.user?.role === 'admin' ? 'admin' : 'client';
    const cancelled = await cancelAppointment(req.params.id, req.body?.reason || '', cancelledBy);
    return res.json({ success: true, appointment: cancelled, message: 'Appointment cancelled successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function listAllAdmin(req, res) {
  try {
    const { status, date } = req.query;
    const appointments = await getAllAppointments({ status, date });
    return res.json({ success: true, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateStatusAdmin(req, res) {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const updated = await updateAppointmentStatus(req.params.id, status, 'admin', reason || '');
    return res.json({ success: true, appointment: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
