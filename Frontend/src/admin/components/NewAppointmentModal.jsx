import React, { useState } from 'react';
import ModalShell from './ModalShell.jsx';

export default function NewAppointmentModal({ isOpen, onClose, services, teamMembers, onAddAppointment }) {
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', service: services[0]?.name || '', staff: teamMembers[0]?.name || '',
    date: new Date().toISOString().split('T')[0], time: '10:00',
  });

  const handleSubmit = () => {
    if (!form.clientName.trim() || !form.date || !form.time) return;
    const service = services.find((s) => s.name === form.service);
    onAddAppointment({
      id: `apt-${Date.now()}`,
      ...form,
      duration: service?.duration || 30,
      status: 'confirmed',
      source: 'manual',
    });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="New appointment">
      <div className="space-y-3">
        <input
          placeholder="Client name"
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
        />
        <input
          placeholder="Client email"
          value={form.clientEmail}
          onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
          className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
        />
        <select
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
        >
          {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select
          value={form.staff}
          onChange={(e) => setForm({ ...form, staff: e.target.value })}
          className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
        >
          {teamMembers.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
          />
        </div>
        <button onClick={handleSubmit} className="w-full bg-signal text-ink-900 font-semibold text-sm rounded-md py-2.5 hover:bg-signal-soft">
          Confirm booking
        </button>
      </div>
    </ModalShell>
  );
}
