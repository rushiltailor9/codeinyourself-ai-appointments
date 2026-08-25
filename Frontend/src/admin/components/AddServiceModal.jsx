import React, { useState } from 'react';
import ModalShell from './ModalShell.jsx';

export default function AddServiceModal({ isOpen, onClose, onAddService }) {
  const [form, setForm] = useState({ name: '', description: '', duration: 30, price: 0 });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onAddService({
      id: `svc-${Date.now()}`,
      ...form,
      duration: Number(form.duration),
      price: Number(form.price),
      aiActive: true,
      bookedThisMonth: 0,
    });
    setForm({ name: '', description: '', duration: 30, price: 0 });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Add service">
      <div className="space-y-3">
        <input
          placeholder="Service name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Duration (min)"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
          />
        </div>
        <button onClick={handleSubmit} className="w-full bg-signal text-ink-900 font-semibold text-sm rounded-md py-2.5 hover:bg-signal-soft">
          Add service
        </button>
      </div>
    </ModalShell>
  );
}
