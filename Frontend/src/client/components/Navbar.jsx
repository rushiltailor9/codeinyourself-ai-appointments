import React, { useState } from 'react';
import { Terminal, Menu, X } from 'lucide-react';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Work' },
];

export function Navbar({ currentScreen, onNavigate, user, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ink-900/90 backdrop-blur border-b border-ink-700">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-signal/10 border border-signal/40 flex items-center justify-center">
            <Terminal size={15} className="text-signal" />
          </div>
          <span className="font-mono text-sm text-paper">codeinyourself<span className="text-signal">.</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${currentScreen === l.id ? 'text-signal' : 'text-muted hover:text-paper'}`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <button onClick={() => onNavigate('portal')} className="text-sm text-muted hover:text-paper">
                {user.name.split(' ')[0]}
              </button>
              <button onClick={onLogout} className="text-sm bg-ink-800 border border-ink-600 text-paper px-3 py-1.5 rounded-md hover:border-signal/50">
                Log out
              </button>
            </>
          ) : (
            <button onClick={() => onNavigate('login')} className="text-sm bg-signal text-ink-900 font-semibold px-3 py-1.5 rounded-md hover:bg-signal-soft">
              Login
            </button>
          )}
        </div>

        <button className="md:hidden text-paper" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink-700 px-5 py-3 space-y-1">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => { onNavigate(l.id); setOpen(false); }}
              className="block w-full text-left px-2 py-2 text-sm text-muted hover:text-paper"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => { onNavigate(user ? 'portal' : 'login'); setOpen(false); }}
            className="block w-full text-left px-2 py-2 text-sm text-signal"
          >
            {user ? 'My portal' : 'Client login'}
          </button>
        </div>
      )}
    </header>
  );
}
