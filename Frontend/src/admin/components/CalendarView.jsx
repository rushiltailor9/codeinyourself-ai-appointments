import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

function getWeekDates(anchor) {
  const start = new Date(anchor);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day; // start week on Monday
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const STATUS_STYLES = {
  confirmed: 'bg-signal/10 border-signal/40 text-signal',
  pending: 'bg-amber/10 border-amber/40 text-amber',
  cancelled: 'bg-ink-700 border-ink-600 text-muted line-through',
};

export default function CalendarView({ appointments, teamMembers, onOpenNewAppointment, onSelectAppointment }) {
  const [anchor, setAnchor] = useState(new Date());
  const [staffFilter, setStaffFilter] = useState('all');

  const weekDates = useMemo(() => getWeekDates(anchor), [anchor]);

  const filtered = appointments.filter((a) => staffFilter === 'all' || a.staff === staffFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-paper font-mono">// Team calendar</h2>
        <div className="flex items-center gap-2">
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-ink-800 border border-ink-600 text-sm text-paper rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="all">All team members</option>
            {teamMembers.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={onOpenNewAppointment}
            className="text-sm bg-signal text-ink-900 font-semibold px-3 py-2 rounded-md flex items-center gap-1 hover:bg-signal-soft"
          >
            <Plus size={14} /> New
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-ink-800 border border-ink-700 rounded-lg p-3">
        <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() - 7)))} className="text-muted hover:text-paper p-1">
          <ChevronLeft size={18} />
        </button>
        <p className="font-mono text-sm text-paper">
          {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {weekDates[4].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
        <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() + 7)))} className="text-muted hover:text-paper p-1">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {weekDates.map((d) => {
          const iso = d.toISOString().split('T')[0];
          const dayAppointments = filtered.filter((a) => a.date === iso).sort((a, b) => a.time.localeCompare(b.time));
          const isToday = iso === new Date().toISOString().split('T')[0];
          return (
            <div key={iso} className={`bg-ink-800 border rounded-lg p-3 min-h-[180px] ${isToday ? 'border-signal/50' : 'border-ink-700'}`}>
              <p className={`text-xs font-mono mb-2 ${isToday ? 'text-signal' : 'text-muted'}`}>
                {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </p>
              <div className="space-y-1.5">
                {dayAppointments.length === 0 && <p className="text-[11px] text-ink-500">—</p>}
                {dayAppointments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectAppointment(a)}
                    className={`w-full text-left text-[11px] border rounded px-2 py-1.5 ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}
                  >
                    <p className="font-mono">{a.time}</p>
                    <p className="truncate">{a.clientName}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
