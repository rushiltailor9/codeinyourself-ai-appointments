import React from 'react';
import { Plus, Bot, BotOff, Clock, IndianRupee } from 'lucide-react';

export default function ServicesView({ services, onUpdateService, onToggleAiActive, onOpenAddServiceModal }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-paper font-mono">// Services</h2>
        <button
          onClick={onOpenAddServiceModal}
          className="text-sm bg-signal text-ink-900 font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 hover:bg-signal-soft"
        >
          <Plus size={14} /> Add service
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div key={s.id} className="bg-ink-800 border border-ink-700 rounded-lg p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-paper font-medium">{s.name}</h3>
              <button
                onClick={() => onToggleAiActive(s.id)}
                className={`shrink-0 flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border
                ${s.aiActive ? 'bg-signal/10 text-signal border-signal/40' : 'bg-ink-700 text-muted border-ink-600'}`}
              >
                {s.aiActive ? <Bot size={12} /> : <BotOff size={12} />}
                {s.aiActive ? 'AI enabled' : 'AI off'}
              </button>
            </div>
            <p className="text-sm text-muted mb-4">{s.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted font-mono mb-4">
              <span className="flex items-center gap-1"><Clock size={12} /> {s.duration} min</span>
              <span className="flex items-center gap-1"><IndianRupee size={12} /> {s.price > 0 ? s.price : 'Free'}</span>
              <span>{s.bookedThisMonth} booked this month</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={s.duration}
                onChange={(e) => onUpdateService(s.id, { duration: Number(e.target.value) })}
                className="w-20 bg-ink-900 border border-ink-600 rounded px-2 py-1.5 text-sm text-paper focus:outline-none focus:border-signal/60"
              />
              <span className="text-xs text-muted">minute duration</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
