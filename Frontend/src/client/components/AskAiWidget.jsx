import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, GripVertical, Move } from 'lucide-react';
import { AiBookingChat } from './AiBookingChat.jsx';

export function AskAiWidget({
  isOpen,
  onToggle,
  onClose,
  prefillService,
  onBookingConfirmed,
  user,
  onRequireLogin,
}) {
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const widgetRef = useRef(null);
  const hasMovedRef = useRef(false);

  // Keep widget completely inside viewport screen bounds on resize & open
  const clampPosition = (x, y) => {
    const rect = widgetRef.current ? widgetRef.current.getBoundingClientRect() : null;
    const widgetWidth = rect ? rect.width : (isOpen ? 420 : 150);
    const widgetHeight = rect ? rect.height : (isOpen ? 480 : 50);

    const maxX = Math.max(10, window.innerWidth - widgetWidth - 10);
    const maxY = Math.max(10, window.innerHeight - widgetHeight - 10);

    return {
      x: Math.min(Math.max(10, x), maxX),
      y: Math.min(Math.max(10, y), maxY),
    };
  };

  // Adjust position when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (position.x !== null && position.y !== null) {
        setPosition((prev) => clampPosition(prev.x, prev.y));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, isOpen]);

  // Adjust position when chat toggles open to prevent bottom/right overflow
  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      setTimeout(() => {
        setPosition((prev) => clampPosition(prev.x, prev.y));
      }, 50);
    }
  }, [isOpen]);

  const startDrag = (clientX, clientY) => {
    let currentX = position.x;
    let currentY = position.y;

    if (currentX === null || currentY === null) {
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
      } else {
        currentX = window.innerWidth - 180;
        currentY = window.innerHeight - 80;
      }
    }

    dragStartPos.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDragging) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartPos.current.startX;
      const deltaY = clientY - dragStartPos.current.startY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        hasMovedRef.current = true;
      }

      const rawX = dragStartPos.current.initialX + deltaX;
      const rawY = dragStartPos.current.initialY + deltaY;

      // Clamp to visible viewport so it never cuts off
      const clamped = clampPosition(rawX, rawY);
      setPosition(clamped);
    };

    const onPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [isDragging]);

  const handleButtonClick = (e) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onToggle();
  };

  const style = position.x !== null && position.y !== null
    ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <div
      ref={widgetRef}
      style={style}
      className={`fixed z-50 flex flex-col items-end max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] ${
        position.x === null ? 'bottom-6 right-6' : ''
      }`}
    >
      {/* AI Chatbot Popup Window */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[420px] max-w-lg max-h-[calc(100vh-6rem)] rounded-xl border border-signal/40 bg-ink-950/95 backdrop-blur-md shadow-2xl shadow-black/90 overflow-hidden flex flex-col animate-slideUp">
          {/* Moveable Drag Handle Bar above chatbot */}
          <div
            onMouseDown={onPointerDown}
            onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
            className="flex items-center justify-between px-3 py-1.5 bg-ink-900 border-b border-ink-700 cursor-move select-none shrink-0 group"
            title="Click and drag to move chatbot"
          >
            <div className="flex items-center gap-1.5 text-muted text-xs font-mono group-hover:text-signal transition-colors">
              <GripVertical size={14} className="text-signal/70" />
              <span>Drag to move AI box</span>
            </div>
            <span className="text-[10px] font-mono text-muted/60">✋ Hold & Drag</span>
          </div>

          <div className="overflow-y-auto flex-1">
            <AiBookingChat
              prefillService={prefillService}
              onBookingConfirmed={(booking) => {
                if (onBookingConfirmed) onBookingConfirmed(booking);
              }}
              user={user}
              onRequireLogin={onRequireLogin}
              onClose={onClose}
            />
          </div>
        </div>
      )}

      {/* Floating Action ASK AI Button (Draggable) */}
      <div
        onMouseDown={onPointerDown}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        className="cursor-move select-none shrink-0"
      >
        <button
          onClick={handleButtonClick}
          className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full font-mono text-xs font-bold transition-all transform active:scale-95 shadow-2xl cursor-pointer ${
            isOpen
              ? 'bg-ink-800 border border-signal/60 text-signal shadow-signal/10 hover:bg-ink-700'
              : 'bg-signal text-ink-900 border border-signal hover:bg-signal-soft hover:shadow-signal/30 hover:scale-105'
          }`}
          title={isOpen ? 'Close AI Assistant (Hold & Drag to move)' : 'Open AI Booking Assistant (Hold & Drag to move)'}
        >
          {/* Glow effect on button */}
          {!isOpen && (
            <span className="absolute -inset-0.5 rounded-full bg-signal opacity-30 blur-sm group-hover:opacity-75 transition duration-300"></span>
          )}

          <div className="relative flex items-center gap-2">
            <Move size={13} className="text-ink-900/60 opacity-60 group-hover:opacity-100" />
            {isOpen ? (
              <>
                <X size={16} className="text-signal" />
                <span>CLOSE AI</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Sparkles size={16} className="animate-pulse text-ink-900" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <span className="tracking-wider">ASK AI</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
