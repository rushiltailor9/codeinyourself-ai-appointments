import React from 'react';
import { AiBookingChat } from './AiBookingChat.jsx';
import { CalendarCheck, Bot, ShieldCheck, ArrowRight } from 'lucide-react';

export function HomeScreen({
  prefillService,
  onBookingConfirmed,
  onOpenPortal,
  onExploreServices,
  onExplorePortfolio,
  user,
  onRequireLogin,
}) {
  return (
    <div>
      <section className="relative overflow-hidden bg-ink-900 bg-grid bg-grid border-b border-ink-700">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-xs text-signal mb-4">// codeinyourself IT company</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-paper leading-tight mb-5">
              Book a slot with our team<br /> by just <span className="text-signal">describing it</span>.
            </h1>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-md">
              No forms, no back-and-forth email. Tell our AI assistant what you need and when — it checks the calendar and locks in the time.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onExploreServices}
                className="bg-signal text-ink-900 font-semibold px-5 py-3 rounded-md text-sm hover:bg-signal-soft transition-colors flex items-center gap-2"
              >
                View services <ArrowRight size={15} />
              </button>
              <button
                onClick={onExplorePortfolio}
                className="border border-ink-600 text-paper px-5 py-3 rounded-md text-sm hover:border-signal/50 transition-colors"
              >
                See our work
              </button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AiBookingChat
              prefillService={prefillService}
              onBookingConfirmed={onBookingConfirmed}
              user={user}
              onRequireLogin={onRequireLogin}
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16 grid sm:grid-cols-3 gap-6">
        {[
          { icon: Bot, title: 'AI-first booking', text: 'Describe your need in plain language; the assistant finds a real open slot.' },
          { icon: CalendarCheck, title: 'Instant confirmation', text: 'No waiting on a reply — your appointment is locked the moment it fits.' },
          { icon: ShieldCheck, title: 'Human backup', text: 'A team member can step in and take over any conversation, any time.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-ink-800 border border-ink-700 rounded-lg p-6">
            <Icon size={20} className="text-signal mb-3" />
            <h3 className="text-paper font-medium mb-1.5">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-ink-700 bg-ink-950">
        <div className="max-w-6xl mx-auto px-5 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-paper mb-1">Already booked with us?</h2>
            <p className="text-sm text-muted">Check your upcoming appointments and booking history.</p>
          </div>
          <button
            onClick={onOpenPortal}
            className="border border-ink-600 text-paper px-5 py-2.5 rounded-md text-sm hover:border-signal/50 shrink-0"
          >
            Open client portal
          </button>
        </div>
      </section>
    </div>
  );
}
