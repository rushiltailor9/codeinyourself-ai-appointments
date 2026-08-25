import React from 'react';
import ModalShell from './ModalShell.jsx';

export default function HelpModal({ isOpen, onClose }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Help & shortcuts">
      <ul className="text-sm text-muted space-y-2 list-disc pl-4">
        <li>Use the search bar to jump to a client's chat or appointment.</li>
        <li>Toggle "Take over chat" to pause the AI and reply manually.</li>
        <li>Turn AI off per-service if you want that service booked manually only.</li>
        <li>Click any calendar slot to view or cancel that appointment.</li>
      </ul>
    </ModalShell>
  );
}
