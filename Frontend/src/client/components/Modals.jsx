import React from 'react';
import { X } from 'lucide-react';

const CONTENT = {
  privacy: {
    title: 'Privacy',
    body: 'We only use your booking details to schedule and confirm appointments with our team. We never sell client data.',
  },
  terms: {
    title: 'Terms',
    body: 'Appointments booked through the assistant can be rescheduled or cancelled by messaging the assistant again or contacting us directly.',
  },
};

export function Modals({ modalType, onClose }) {
  if (!modalType || !CONTENT[modalType]) return null;
  const { title, body } = CONTENT[modalType];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ink-800 border border-ink-600 rounded-lg w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-sm text-paper">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-paper"><X size={18} /></button>
        </div>
        <p className="text-sm text-muted">{body}</p>
      </div>
    </div>
  );
}
