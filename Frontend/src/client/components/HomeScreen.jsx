import React from 'react';
import { CalendarCheck, Bot, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export function HomeScreen({
  onOpenPortal,
  onExploreServices,
  onExplorePortfolio,
  onOpenAiChat,
}) {
  return (
    <div>
      <section className="relative overflow-hidden bg-ink-900 bg-grid bg-grid border-b border-ink-700">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-xs text-signal mb-4">// nexora technologies</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-paper leading-tight mb-5">
              Book a slot with our team<br /> by just <span className="text-signal">describing it</span>.
            </h1>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-md">
              No forms, no back-and-forth email. Click ASK AI anywhere or tell our assistant what you need — it checks availability and locks in the time.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onOpenAiChat}
                className="bg-signal text-ink-900 font-bold px-5 py-3 rounded-md text-sm hover:bg-signal-soft transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-signal/20"
              >
                <Sparkles size={16} className="animate-pulse" /> ASK AI to Book <ArrowRight size={15} />
              </button>
              <button
                onClick={onExploreServices}
                className="border border-ink-600 text-paper px-5 py-3 rounded-md text-sm hover:border-signal/50 transition-colors cursor-pointer"
              >
                View services
              </button>
              <button
                onClick={onExplorePortfolio}
                className="border border-ink-600 text-paper px-5 py-3 rounded-md text-sm hover:border-signal/50 transition-colors cursor-pointer"
              >
                See our work
              </button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div
              onClick={onOpenAiChat}
              className="w-full max-w-md rounded-2xl border border-signal/30 bg-ink-950/80 p-8 text-left shadow-2xl shadow-black/50 backdrop-blur group hover:border-signal/70 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-signal/10 rounded-full blur-2xl group-hover:bg-signal/20 transition-colors pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-signal/10 border border-signal/40 flex items-center justify-center text-signal group-hover:scale-110 transition-transform">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <span className="font-mono text-xs text-signal block">// AI ASSISTANT ONLINE</span>
                  <h3 className="font-bold text-paper text-lg">Smart Booking Assistant</h3>
                </div>
              </div>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Schedule consultations, ask about available slots, or request IT support in plain language.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-ink-900 bg-signal px-4 py-2.5 rounded-lg group-hover:bg-signal-soft transition-colors">
                <Bot size={15} />
                <span>CLICK TO ASK AI</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
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
