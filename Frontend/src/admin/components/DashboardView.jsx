import React from 'react';
import { CalendarDays, MessagesSquare, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted uppercase tracking-wide">{label}</span>
        <Icon size={16} className={accent} />
      </div>
      <p className="text-2xl font-semibold text-paper font-mono">{value}</p>
    </div>
  );
}

export default function DashboardView({ appointments, chats, onNavigateToTab, onSelectChatForClient, onOpenNewAppointment }) {
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter((a) => a.date === today && a.status !== 'cancelled');
  const aiBooked = appointments.filter((a) => a.source === 'ai-chat').length;
  const escalations = chats.filter((c) => c.actionRequired === 'Escalation Suggested');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-paper font-mono">// Today at a glance</h2>
          <p className="text-sm text-muted mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={onOpenNewAppointment}
          className="text-sm bg-ink-800 border border-ink-600 text-paper px-4 py-2 rounded-md hover:border-signal/50 hover:text-signal transition-colors"
        >
          + New appointment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's bookings" value={todaysAppointments.length} icon={CalendarDays} accent="text-signal" />
        <StatCard label="Booked by AI" value={aiBooked} icon={TrendingUp} accent="text-signal" />
        <StatCard label="Active chats" value={chats.length} icon={MessagesSquare} accent="text-amber" />
        <StatCard label="Needs attention" value={escalations.length} icon={AlertTriangle} accent="text-coral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-ink-800 border border-ink-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm text-paper">Today's schedule</h3>
            <button onClick={() => onNavigateToTab('calendar')} className="text-xs text-signal flex items-center gap-1 hover:underline">
              View calendar <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {todaysAppointments.length === 0 && (
              <p className="text-sm text-muted py-6 text-center">No appointments left today.</p>
            )}
            {todaysAppointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-ink-700 last:border-0">
                <div>
                  <p className="text-sm text-paper">{a.clientName}</p>
                  <p className="text-xs text-muted">{a.service} · {a.staff}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-signal">{a.time}</p>
                  <p className="text-[10px] uppercase text-muted">{a.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-ink-800 border border-ink-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm text-paper">Needs attention</h3>
            <button onClick={() => onNavigateToTab('chat-logs')} className="text-xs text-signal flex items-center gap-1 hover:underline">
              Open chat logs <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {escalations.length === 0 && (
              <p className="text-sm text-muted py-6 text-center">AI is handling everything smoothly.</p>
            )}
            {escalations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectChatForClient(c.id)}
                className="w-full text-left flex items-center justify-between py-2.5 border-b border-ink-700 last:border-0 hover:bg-ink-700/40 -mx-2 px-2 rounded"
              >
                <div>
                  <p className="text-sm text-paper">{c.clientName}</p>
                  <p className="text-xs text-muted truncate max-w-[220px]">{c.previewMessage}</p>
                </div>
                <span className="text-[10px] font-mono bg-coral/15 text-coral border border-coral/40 rounded-full px-2 py-1 shrink-0">
                  escalate
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
