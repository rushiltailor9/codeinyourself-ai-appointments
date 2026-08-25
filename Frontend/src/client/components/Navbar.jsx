import React, { useState } from 'react';
import { Terminal, Menu, X, CalendarCheck } from 'lucide-react';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Work' },
  { id: 'portal', label: 'Client Portal' },
];

export function Navbar({ currentScreen, onNavigate, user, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ink-900/90 backdrop-blur border-b border-ink-700">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded bg-signal/10 border border-signal/40 flex items-center justify-center">
            <Terminal size={15} className="text-signal" />
          </div>
          <span className="font-mono text-sm text-paper">codeinyourself<span className="text-signal">.</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const isActive = currentScreen === l.id;
            return (
              <button
                key={l.id}
                onClick={() => onNavigate(l.id)}
                className={`px-3 py-2 text-sm rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'text-signal font-semibold bg-signal/10 border border-signal/20' : 'text-muted hover:text-paper hover:bg-ink-800'
                }`}
              >
                {l.id === 'portal' && <CalendarCheck size={14} className={isActive ? 'text-signal' : 'text-muted'} />}
                <span>{l.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('portal')}
                className="text-xs font-mono text-paper bg-ink-800 border border-ink-600 px-3 py-1.5 rounded-md hover:border-signal/50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-signal inline-block"></span>
                <span>{user.name}</span>
              </button>
              <button
                onClick={onLogout}
                className="text-xs text-muted hover:text-coral transition-colors px-2 py-1.5 cursor-pointer font-mono"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="text-sm bg-signal text-ink-900 font-semibold px-3.5 py-1.5 rounded-md hover:bg-signal-soft transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        <button className="md:hidden text-paper cursor-pointer" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink-700 px-5 py-3 space-y-1 bg-ink-900">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => { onNavigate(l.id); setOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                currentScreen === l.id ? 'text-signal font-semibold bg-signal/10' : 'text-muted hover:text-paper'
              }`}
            >
              {l.label}
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-ink-800">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-paper font-mono">{user.name}</span>
                <button
                  onClick={() => { onLogout(); setOpen(false); }}
                  className="text-xs text-coral font-mono"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onNavigate('login'); setOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-signal font-semibold"
              >
                Client Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
