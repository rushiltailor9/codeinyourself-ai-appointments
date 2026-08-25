import React from 'react';
import { ArrowRight } from 'lucide-react';

const PROJECTS = [
  { name: 'Northfield Logistics Platform', summary: 'Full-stack rebuild of a fleet-tracking dashboard, cutting load times by 60%.' },
  { name: 'Brightleaf Booking Engine', summary: 'A MERN appointment system with AI-assisted scheduling for a wellness chain.' },
  { name: 'Osei Ventures Portfolio Site', summary: 'A fast, content-driven marketing site with a headless CMS.' },
];

export function PortfolioScreen({ onDiscussProject, onSelectProjectForBooking }) {
  return (
    <div className="max-w-6xl mx-auto px-5 py-16">
      <p className="font-mono text-xs text-signal mb-3">// selected work</p>
      <h1 className="text-3xl font-bold text-paper mb-2">Things we've shipped</h1>
      <p className="text-muted mb-10 max-w-lg">A few recent builds. Like the shape of one? We can scope something similar for you.</p>

      <div className="space-y-4">
        {PROJECTS.map((p) => (
          <div key={p.name} className="bg-ink-800 border border-ink-700 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-paper font-medium mb-1">{p.name}</h3>
              <p className="text-sm text-muted max-w-lg">{p.summary}</p>
            </div>
            <button
              onClick={() => onSelectProjectForBooking(p.name)}
              className="shrink-0 flex items-center gap-1.5 text-sm text-signal hover:text-signal-soft"
            >
              Discuss something similar <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={onDiscussProject} className="mt-10 text-sm text-muted hover:text-paper">
        ← Back to booking
      </button>
    </div>
  );
}
