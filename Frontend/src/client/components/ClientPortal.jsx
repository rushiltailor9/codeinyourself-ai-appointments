import React from 'react';
import { CalendarPlus, LogOut } from 'lucide-react';

export function ClientPortal({ user, bookings, onBookNewConsultation, onLogout, onCancelAppointment }) {
  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <p className="font-mono text-xs text-signal mb-1">// client portal</p>
          <h1 className="text-2xl font-semibold text-paper">Welcome back, {user?.name?.split(' ')[0] || 'there'}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBookNewConsultation}
            className="flex items-center gap-1.5 bg-signal text-ink-900 font-semibold text-sm px-4 py-2 rounded-md hover:bg-signal-soft"
          >
            <CalendarPlus size={15} /> New appointment
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 border border-ink-600 text-paper text-sm px-4 py-2 rounded-md hover:border-signal/50"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </div>

      <div className="bg-ink-800 border border-ink-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-ink-700">
          <h2 className="font-mono text-sm text-paper">Your appointments</h2>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">No appointments yet — use the assistant on the home page to book one.</p>
        ) : (
          <div className="divide-y divide-ink-700">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-paper font-medium">{b.service}</p>
                  <p className="text-xs text-muted">{b.date} at {b.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-mono rounded-full px-2.5 py-1 ${
                      b.status === 'cancelled'
                        ? 'bg-ink-700 text-muted border border-ink-600'
                        : 'bg-signal/10 text-signal border border-signal/30'
                    }`}
                  >
                    {b.status}
                  </span>
                  {b.status !== 'cancelled' && onCancelAppointment && (
                    <button
                      onClick={() => {
                        if (window.confirm(`You Sure Cancel The Slot for ${b.service} on ${b.date} at ${b.time}?`)) {
                          onCancelAppointment(b.id);
                        }
                      }}
                      className="text-xs text-muted hover:text-coral transition-colors font-mono"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
