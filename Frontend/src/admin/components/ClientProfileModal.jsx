import React from 'react';
import ModalShell from './ModalShell.jsx';

export default function ClientProfileModal({ isOpen, onClose, clientName, clientDetails }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Client profile">
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs text-muted">Name</p>
          <p className="text-paper">{clientName || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Email</p>
          <p className="text-paper">{clientDetails?.email || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Notes</p>
          <p className="text-paper">{clientDetails?.notes || 'No notes yet.'}</p>
        </div>
      </div>
    </ModalShell>
  );
}
