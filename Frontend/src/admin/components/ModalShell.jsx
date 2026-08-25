import React from 'react';
import { X } from 'lucide-react';

export default function ModalShell({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-ink-800 border border-ink-600 rounded-lg w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
          <h3 className="font-mono text-sm text-paper">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-paper">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
