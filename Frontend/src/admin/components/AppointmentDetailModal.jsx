import React from 'react';
import ModalShell from './ModalShell.jsx';

export default function AppointmentDetailModal({ isOpen, onClose, appointment, onCancelAppointment }) {
  if (!appointment) return null;
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Appointment details">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-muted">Client</span><span className="text-paper">{appointment.clientName}</span></div>
        <div className="flex justify-between"><span className="text-muted">Service</span><span className="text-paper">{appointment.service}</span></div>
        <div className="flex justify-between"><span className="text-muted">Staff</span><span className="text-paper">{appointment.staff}</span></div>
        <div className="flex justify-between"><span className="text-muted">Date</span><span className="text-paper font-mono">{appointment.date} {appointment.time}</span></div>
        <div className="flex justify-between"><span className="text-muted">Status</span><span className="text-paper capitalize">{appointment.status}</span></div>
        <div className="flex justify-between"><span className="text-muted">Source</span><span className="text-paper">{appointment.source === 'ai-chat' ? 'Booked by AI' : 'Manual'}</span></div>
        {appointment.status !== 'cancelled' && (
          <button
            onClick={() => { onCancelAppointment(appointment.id); onClose(); }}
            className="w-full mt-2 bg-coral/10 border border-coral/40 text-coral text-sm rounded-md py-2.5 hover:bg-coral/20"
          >
            Cancel appointment
          </button>
        )}
      </div>
    </ModalShell>
  );
}
