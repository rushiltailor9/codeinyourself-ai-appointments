import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Send, Terminal, Sparkles, X, Calendar, RefreshCw, Trash2, ListFilter, Clock, Plus } from 'lucide-react';
import { sendChatMessage } from '../../api/aiApi.js';

const QUICK_ACTIONS = [
  { label: 'Suggest Slots', icon: Sparkles, prompt: 'Suggest available slots' },
  { label: 'Book Slot', icon: Calendar, prompt: 'I want to book an appointment tomorrow at 3pm' },
  { label: 'Reschedule', icon: RefreshCw, prompt: 'Reschedule my appointment' },
  { label: 'Cancel Slot', icon: Trash2, prompt: 'Cancel my appointment' },
  { label: 'My Bookings', icon: ListFilter, prompt: 'Show my upcoming appointments' },
];

const getInitialConversationId = () => {
  const savedId = localStorage.getItem('nexora_ai_conv_id');
  if (savedId) return savedId;
  const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  localStorage.setItem('nexora_ai_conv_id', newId);
  return newId;
};

const getInitialMessages = (user) => {
  const savedMsgs = localStorage.getItem('nexora_ai_messages');
  if (savedMsgs) {
    try {
      const parsed = JSON.parse(savedMsgs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Could not parse stored AI messages:', e);
    }
  }
  return [
    {
      id: 'greet',
      sender: 'ai',
      text: user
        ? `Hi ${user.name ? user.name.split(' ')[0] : 'there'}! I'm the Nexora AI Assistant. Tell me what service you need, or click an action below to book, reschedule, or cancel slots.`
        : "Welcome to Nexora! Please sign in or register to interact with our AI assistant and manage appointment slots.",
    },
  ];
};

export function AiBookingChat({ prefillService, onBookingConfirmed, user, onRequireLogin, onClose }) {
  const [conversationId, setConversationId] = useState(getInitialConversationId);
  const [messages, setMessages] = useState(() => getInitialMessages(user));
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  // Automatically save conversation ID and chat messages to localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('nexora_ai_conv_id', conversationId);
    }
    if (messages && messages.length > 0) {
      localStorage.setItem('nexora_ai_messages', JSON.stringify(messages));
    }
  }, [conversationId, messages]);

  // Handle New Chat Session
  const handleNewChat = () => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const initialMsg = [
      {
        id: 'greet',
        sender: 'ai',
        text: user
          ? `Hi ${user.name ? user.name.split(' ')[0] : 'there'}! I'm the Nexora AI Assistant. Tell me what service you need, or click an action below to book, reschedule, or cancel slots.`
          : "Welcome to Nexora! Please sign in or register to interact with our AI assistant and manage appointment slots.",
      },
    ];
    setConversationId(newId);
    setMessages(initialMsg);
    localStorage.setItem('nexora_ai_conv_id', newId);
    localStorage.setItem('nexora_ai_messages', JSON.stringify(initialMsg));
    toast.info('Started a new AI conversation.');
  };

  useEffect(() => {
    if (prefillService && user) {
      setMessages((prev) => [
        ...prev,
        { id: `pre-${Date.now()}`, sender: 'ai', text: `Selected service: ${prefillService}. What date and time works for you? (e.g. "Tomorrow at 2pm")` },
      ]);
      sendChatMessage({ message: `I would like to book ${prefillService}`, conversationId }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillService, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const pushMessage = (sender, text, extra = {}) => {
    setMessages((prev) => [...prev, { id: `${sender}-${Date.now()}-${Math.random()}`, sender, text, ...extra }]);
  };

  const handleSend = async (rawText) => {
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

      pushMessage('ai', result.message || 'I processed your request.', {
        done: result.done,
        booking: result.booking,
        awaitingConfirmation: result.awaitingConfirmation,
      });
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

  // Extract times if AI message lists available slots (e.g., "include: 09:00, 11:00, 14:00")
  const extractTimeOptions = (text) => {
    if (!text) return [];
    const match = text.match(/(?:slots|openings|include:)\s*([0-9]{2}:[0-9]{2}(?:,\s*[0-9]{2}:[0-9]{2})*)/i);
    if (match && match[1]) {
      return match[1].split(',').map((s) => s.trim());
    }
    return [];
  };

  // Extract service options if AI message lists offered services (e.g., "We offer: Web Dev, IT Support")
  const extractServiceOptions = (text) => {
    if (!text) return [];
    const match = text.match(/offer:\s*([^.\n]+)/i);
    if (match && match[1]) {
      return match[1]
        .split(',')
        .map((s) => s.trim().replace(/^and\s+/i, ''))
        .filter(Boolean);
    }
    return [];
  };

  return (
    <div className="w-full max-w-lg rounded-lg border border-ink-600 bg-ink-950 shadow-2xl shadow-black/40 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700 bg-ink-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-coral/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-signal/70" />
          <span className="ml-2 font-mono text-xs text-muted flex items-center gap-1.5">
            <Terminal size={12} /> booking-assistant — nexora
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 text-[11px] font-mono text-signal bg-signal/10 border border-signal/30 px-2 py-0.5 rounded hover:bg-signal hover:text-ink-900 transition-colors cursor-pointer"
            title="Start New Chat Session"
          >
            <Plus size={12} />
            <span>New Chat</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted hover:text-paper transition-colors cursor-pointer p-1 rounded hover:bg-ink-800"
              title="Close Assistant"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div ref={scrollRef} className="h-64 sm:h-72 max-h-[45vh] overflow-y-auto px-4 py-3 space-y-3 font-mono text-[13px]">
        {messages.map((m) => {
          const timeOptions = m.sender === 'ai' ? extractTimeOptions(m.text) : [];
          const serviceOptions = m.sender === 'ai' ? extractServiceOptions(m.text) : [];
          const isCancelPrompt = m.sender === 'ai' && m.text.includes('You Sure Cancel');

          return (
            <div key={m.id} className={`space-y-1.5 ${m.sender === 'client' ? 'text-right' : ''}`}>
              <div>
                <span className={m.sender === 'client' ? 'text-paper font-semibold' : 'text-signal font-semibold'}>
                  {m.sender === 'client' ? '$ ' : '> '}
                </span>
                <span className={m.sender === 'client' ? 'text-paper' : 'text-signal-soft whitespace-pre-line'}>{m.text}</span>
              </div>

              {/* Confirmation quick-reply buttons if cancelling */}
              {isCancelPrompt && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleSend('Yes')}
                    className="text-xs bg-coral/20 border border-coral/50 text-coral hover:bg-coral hover:text-white px-3 py-1 rounded-md transition-colors cursor-pointer font-sans font-semibold"
                  >
                    Yes, Cancel Slot
                  </button>
                  <button
                    onClick={() => handleSend('No')}
                    className="text-xs bg-ink-800 border border-ink-600 text-paper hover:bg-ink-700 px-3 py-1 rounded-md transition-colors cursor-pointer font-sans"
                  >
                    No, Keep Slot
                  </button>
                </div>
              )}

              {/* Clickable Service pills if AI listed offered services */}
              {serviceOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-muted self-center mr-1">Select service:</span>
                  {serviceOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(`I want to book ${s}`)}
                      className="text-xs bg-signal/15 border border-signal/50 text-signal hover:bg-signal hover:text-ink-900 px-2.5 py-1 rounded transition-colors font-mono cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Clickable Time slot pills if AI offered times */}
              {timeOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-muted self-center mr-1">Select time:</span>
                  {timeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSend(t)}
                      className="text-xs bg-signal/10 border border-signal/40 text-signal hover:bg-signal hover:text-ink-900 px-2.5 py-1 rounded transition-colors font-mono cursor-pointer"
                    >
                      <Clock size={11} className="inline mr-1" />
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {thinking && (
          <div className="flex items-center gap-1.5 text-muted">
            <Sparkles size={12} className="animate-pulse text-signal" />
            <span>AI analyzing request…</span>
          </div>
        )}
      </div>

      {/* Quick Action Pills */}
      <div className="px-3 py-2 bg-ink-950 border-t border-ink-800 flex gap-1.5 overflow-x-auto scrollbar-none">
        {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
          <button
            key={label}
            onClick={() => handleSend(prompt)}
            className="text-[11px] font-mono text-paper bg-ink-900 border border-ink-700 rounded-lg px-2.5 py-1.5 hover:border-signal hover:text-signal transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Icon size={12} className="text-signal" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {!user ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-ink-700 bg-ink-900/60 shrink-0">
          <span className="text-xs text-muted font-mono">Sign in required to book</span>
          <button
            onClick={onRequireLogin}
            className="bg-signal text-ink-900 font-semibold text-xs font-mono px-3 py-1.5 rounded hover:bg-signal-soft transition-colors cursor-pointer"
          >
            Sign In / Register →
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-3 border-t border-ink-700 shrink-0">
          <span className="font-mono text-signal text-sm">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your request (book, reschedule, cancel)..."
            className="flex-1 bg-transparent font-mono text-xs sm:text-sm text-paper placeholder:text-muted focus:outline-none"
          />
          <button onClick={() => handleSend()} className="text-signal hover:text-signal-soft shrink-0 cursor-pointer">
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
