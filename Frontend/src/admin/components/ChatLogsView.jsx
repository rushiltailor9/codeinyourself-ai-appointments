import React, { useState } from 'react';
import { Send, UserCog, ShieldAlert, Bot, User } from 'lucide-react';

export default function ChatLogsView({ chats, activeChatId, onSelectChat, onOpenClientProfile, onSendMessage, onToggleTakeover }) {
  const [draft, setDraft] = useState('');
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const handleSend = () => {
    if (!draft.trim() || !activeChat) return;
    onSendMessage(activeChat.id, draft.trim());
    setDraft('');
  };

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-160px)] min-h-[500px]">
      <div className="bg-ink-800 border border-ink-700 rounded-lg overflow-y-auto">
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectChat(c.id)}
            className={`w-full text-left p-3.5 border-b border-ink-700 last:border-0 hover:bg-ink-700/50 transition-colors
            ${activeChat?.id === c.id ? 'bg-ink-700/60' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-paper font-medium truncate">{c.clientName}</p>
              {c.actionRequired === 'Escalation Suggested' && <ShieldAlert size={13} className="text-coral shrink-0" />}
            </div>
            <p className="text-xs text-muted truncate">{c.previewMessage}</p>
            {c.takenOver && (
              <span className="inline-block mt-1.5 text-[10px] font-mono bg-signal/10 text-signal border border-signal/30 rounded px-1.5 py-0.5">
                admin active
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-ink-800 border border-ink-700 rounded-lg flex flex-col overflow-hidden">
        {activeChat ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700">
              <button
                onClick={() => onOpenClientProfile({ email: activeChat.clientEmail }, activeChat.clientName)}
                className="text-sm text-paper font-medium hover:text-signal"
              >
                {activeChat.clientName}
              </button>
              <button
                onClick={() => onToggleTakeover(activeChat.id)}
                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors
                ${activeChat.takenOver ? 'bg-signal/10 border-signal/40 text-signal' : 'bg-ink-700 border-ink-600 text-muted hover:text-paper'}`}
              >
                <UserCog size={13} /> {activeChat.takenOver ? 'Hand back to AI' : 'Take over chat'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeChat.messages.map((m) => (
                <div key={m.id} className={`flex items-end gap-2 ${m.sender === 'client' ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
                    ${m.sender === 'client' ? 'bg-ink-700 text-muted' : m.sender === 'ai' ? 'bg-signal/15 text-signal' : 'bg-amber/15 text-amber'}`}>
                    {m.sender === 'client' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm
                    ${m.sender === 'client' ? 'bg-ink-700 text-paper' : m.sender === 'ai' ? 'bg-signal/10 text-paper border border-signal/20' : 'bg-amber/10 text-paper border border-amber/20'}`}>
                    <p>{m.text}</p>
                    <p className="text-[10px] text-muted mt-1 font-mono">{m.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-ink-700 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={activeChat.takenOver ? 'Reply as admin...' : 'Take over chat to reply manually...'}
                disabled={!activeChat.takenOver}
                className="flex-1 bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 disabled:opacity-40"
              />
              <button
                onClick={handleSend}
                disabled={!activeChat.takenOver}
                className="bg-signal text-ink-900 rounded-md p-2.5 disabled:opacity-30"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <p className="m-auto text-muted text-sm">Select a conversation</p>
        )}
      </div>
    </div>
  );
}
