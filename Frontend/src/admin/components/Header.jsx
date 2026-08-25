import React, { useMemo, useState } from 'react';
import { Search, HelpCircle, Menu } from 'lucide-react';

export default function Header({ searchTerm, setSearchTerm, activeTabTitle, onOpenHelp, onSelectSearchResult, onToggleMobile, chats, appointments }) {
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const chatResults = (chats || [])
      .filter((c) => c.clientName.toLowerCase().includes(term))
      .map((c) => ({ id: c.id, label: c.clientName, sub: 'AI chat log', tab: 'chat-logs' }));
    const aptResults = (appointments || [])
      .filter((a) => a.clientName.toLowerCase().includes(term) || a.service.toLowerCase().includes(term))
      .map((a) => ({ id: a.id, label: `${a.clientName} — ${a.service}`, sub: `${a.date} ${a.time}`, tab: 'calendar' }));
    return [...chatResults, ...aptResults].slice(0, 6);
  }, [searchTerm, chats, appointments]);

  return (
    <header className="fixed top-0 left-0 right-0 md:left-[260px] h-16 bg-ink-900/95 backdrop-blur border-b border-ink-700 z-20 flex items-center px-4 sm:px-6 gap-4">
      <button onClick={onToggleMobile} className="md:hidden text-muted hover:text-paper">
        <Menu size={20} />
      </button>

      <h1 className="font-mono text-sm sm:text-base text-paper truncate hidden sm:block">
        <span className="text-signal">// </span>{activeTabTitle}
      </h1>

      <div className="flex-1 flex justify-end sm:justify-center max-w-md ml-auto relative">
        <div className="w-full relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search clients, appointments..."
            className="w-full bg-ink-800 border border-ink-600 rounded-md pl-9 pr-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
          />
          {focused && results.length > 0 && (
            <div className="absolute mt-1 w-full bg-ink-800 border border-ink-600 rounded-md shadow-xl overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id + r.label}
                  onClick={() => { onSelectSearchResult(r.id, r.tab); setSearchTerm(''); }}
                  className="w-full text-left px-3 py-2 text-sm text-paper hover:bg-ink-700 flex flex-col"
                >
                  <span>{r.label}</span>
                  <span className="text-xs text-muted">{r.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={onOpenHelp} className="text-muted hover:text-paper shrink-0">
        <HelpCircle size={20} />
      </button>
    </header>
  );
}
