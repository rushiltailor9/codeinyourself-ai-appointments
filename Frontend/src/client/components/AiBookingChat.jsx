import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Send, Terminal, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../api/aiApi.js';

const SUGGESTIONS = [
  'Web consultation tomorrow at 3pm',
  'IT support, our server is down',
  'Product strategy session Thursday 11am',
];

export function AiBookingChat({ prefillService, onBookingConfirmed, user, onRequireLogin }) {
  const [messages, setMessages] = useState([
    {
      id: 'greet',
      sender: 'ai',
      text: user
        ? `Hi ${user.name ? user.name.split(' ')[0] : 'there'}, I'm the Nexora booking assistant. Tell me what you need and when — e.g. "IT support call tomorrow at 2pm."`
        : "Welcome to Nexora! Please sign in or register to interact with our AI assistant and book appointments.",
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(() => `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (user) {
      setMessages([
        {
          id: 'greet',
          sender: 'ai',
          text: `Hi ${user.name ? user.name.split(' ')[0] : 'there'}, I'm the Nexora booking assistant. Tell me what you need and when — e.g. "IT support call tomorrow at 2pm."`,
        },
      ]);
    } else {
      setMessages([
        {
          id: 'greet',
          sender: 'ai',
          text: "Welcome to Nexora! Please sign in or register to interact with our AI assistant and book appointments.",
        },
      ]);
    }
  }, [user]);

  useEffect(() => {
    if (prefillService && user) {
      setMessages((prev) => [
        ...prev,
        { id: `pre-${Date.now()}`, sender: 'ai', text: `Set to book: ${prefillService}. What date and time works for you?` },
      ]);
      // Send intent to backend to set draft service
      sendChatMessage({ message: `I would like to book ${prefillService}`, conversationId }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillService, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const pushMessage = (sender, text) => {
    setMessages((prev) => [...prev, { id: `${sender}-${Date.now()}-${Math.random()}`, sender, text }]);
  };

  const handleSend = async (rawText) => {
    if (!user) {
      pushMessage('client', rawText || input || 'Book appointment');
      pushMessage('ai', 'Authentication required: Please sign in or create an account to chat with the AI assistant and schedule an appointment.');
      if (onRequireLogin) {
        setTimeout(onRequireLogin, 1200);
      }
      return;
    }

    const text = (rawText ?? input).trim();
    if (!text) return;
    pushMessage('client', text);
    setInput('');
    setThinking(true);

    try {
      const result = await sendChatMessage({ message: text, conversationId });
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }
      pushMessage('ai', result.message || 'I processed your request.');
      setThinking(false);

      if (result.message && result.message.includes('successfully cancelled')) {
        toast.warning('Appointment slot has been cancelled.');
      } else if (result.message && result.message.includes('successfully updated to')) {
        toast.success('Appointment updated to new date/time.');
      }

      if (result.done && result.booking) {
        onBookingConfirmed({
          id: result.booking.id,
          clientName: result.booking.clientName,
          clientEmail: result.booking.clientEmail,
          service: result.booking.service,
          date: result.booking.date,
          time: result.booking.time,
          status: result.booking.status || 'confirmed',
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (err.message && err.message.includes('sign in')) {
        pushMessage('ai', 'Please sign in or register to interact with the booking assistant.');
        if (onRequireLogin) setTimeout(onRequireLogin, 1000);
      } else {
        pushMessage('ai', "I'm having a little trouble connecting with the booking system. Please try again in a moment.");
      }
      setThinking(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-lg border border-ink-600 bg-ink-950 shadow-2xl shadow-black/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-ink-700 bg-ink-900">
        <span className="w-2.5 h-2.5 rounded-full bg-coral/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-signal/70" />
        <span className="ml-2 font-mono text-xs text-muted flex items-center gap-1.5">
          <Terminal size={12} /> booking-assistant — nexora
        </span>
      </div>

      <div ref={scrollRef} className="h-72 overflow-y-auto px-4 py-3 space-y-3 font-mono text-[13px]">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === 'client' ? 'text-right' : ''}>
            <span className={m.sender === 'client' ? 'text-paper' : 'text-signal'}>
              {m.sender === 'client' ? '$ ' : '> '}
            </span>
            <span className={m.sender === 'client' ? 'text-paper' : 'text-signal-soft'}>{m.text}</span>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-1.5 text-muted">
            <Sparkles size={12} className="animate-pulse" />
            <span>thinking…</span>
          </div>
        )}
      </div>

      <div className="px-3 pt-2 pb-1 flex gap-1.5 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            className="text-[11px] font-mono text-muted border border-ink-600 rounded-full px-2.5 py-1 hover:border-signal/50 hover:text-signal transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {!user ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-ink-700 bg-ink-900/60">
          <span className="text-xs text-muted font-mono">Sign in required to book</span>
          <button
            onClick={onRequireLogin}
            className="bg-signal text-ink-900 font-semibold text-xs font-mono px-3 py-1.5 rounded hover:bg-signal-soft transition-colors"
          >
            Sign In / Register →
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-3 border-t border-ink-700">
          <span className="font-mono text-signal text-sm">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your request..."
            className="flex-1 bg-transparent font-mono text-sm text-paper placeholder:text-muted focus:outline-none"
          />
          <button onClick={() => handleSend()} className="text-signal hover:text-signal-soft shrink-0">
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
