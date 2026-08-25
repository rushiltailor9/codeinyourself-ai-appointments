import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, MessagesSquare, Wrench, Settings, Plus, Terminal, ArrowLeft, LogOut, X, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'chat-logs', label: 'AI Chat Logs', icon: MessagesSquare, badgeKey: true },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  unreadEscalationsCount,
  isMobileOpen,
  onCloseMobile,
  onOpenNewAppointment,
  currentUser,
  onLogout,
}) {
  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-ink-950 border-r border-ink-700 z-40 flex flex-col transition-transform duration-200
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-signal/10 border border-signal/40 flex items-center justify-center">
              <Terminal size={15} className="text-signal" />
            </div>
            <div className="leading-tight">
              <p className="font-mono text-[13px] text-paper">nexora</p>
              <p className="text-[10px] text-muted -mt-0.5">ops console</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="md:hidden text-muted hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={onOpenNewAppointment}
            className="w-full flex items-center justify-center gap-2 bg-signal text-ink-900 font-semibold text-sm rounded-md py-2.5 hover:bg-signal-soft transition-colors"
          >
            <Plus size={16} /> New appointment
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon, badgeKey }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); onCloseMobile(); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-sm transition-colors
                ${isActive ? 'bg-ink-700 text-signal border border-ink-600' : 'text-muted hover:text-paper hover:bg-ink-800 border border-transparent'}`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} />
                  {label}
                </span>
                {badgeKey && unreadEscalationsCount > 0 && (
                  <span className="text-[10px] font-mono bg-coral/20 text-coral border border-coral/40 rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadEscalationsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {currentUser && (
          <div className="px-4 py-2 border-t border-ink-800 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-signal/10 border border-signal/30 flex items-center justify-center text-signal">
              <Shield size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-paper font-medium truncate">{currentUser.name}</p>
              <p className="text-[10px] text-signal font-mono uppercase tracking-wider">{currentUser.role}</p>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-ink-700 space-y-1">
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted hover:text-paper hover:bg-ink-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to client site
          </Link>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-coral hover:bg-coral/10 transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}