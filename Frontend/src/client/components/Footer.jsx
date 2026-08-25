import React from 'react';
import { Terminal } from 'lucide-react';

export function Footer({ onOpenModal, dark }) {
  return (
    <footer className={`border-t border-ink-700 ${dark ? 'bg-ink-950' : 'bg-ink-900'}`}>
      <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-signal" />
          <span className="font-mono text-xs text-muted">© {new Date().getFullYear()} Codeinyourself IT Company</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted">
          <button onClick={() => onOpenModal('privacy')} className="hover:text-paper">Privacy</button>
          <button onClick={() => onOpenModal('terms')} className="hover:text-paper">Terms</button>
        </div>
      </div>
    </footer>
  );
}
