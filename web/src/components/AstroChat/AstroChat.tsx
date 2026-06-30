'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AstroAvatar, type AstroMood } from '@/components/AstroAvatar/AstroAvatar';
import { MiniMarkdown } from './mini-markdown';
import styles from './AstroChat.module.css';

type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
};

const API_PATH = '/api/v1/astro/chat';

export function AstroChat() {
  const t = useTranslations('astro');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<AstroMood>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      // Greet on first open
      if (messages.length === 0) {
        const greeting = locale === 'ar'
          ? 'أهلاً! أنا أسترو، مساعدك الذكي في مدينتي. إزاي أقدر أساعدك النهاردة؟'
          : "Hi! I'm Astro, your Madinaty AI assistant. How can I help you today?";
        setMessages([{ role: 'ai', content: greeting }]);
        setMood('waving');
        setTimeout(() => setMood('idle'), 2000);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setMood('thinking');

    try {
      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'kanto' },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-7, -1).map((m) => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const serverMsg = errBody?.message ?? errBody?.data?.reply ?? '';
        if (serverMsg) {
          setMessages((prev) => [...prev, { role: 'ai', content: serverMsg }]);
          setMood('talking');
          setTimeout(() => setMood('idle'), 3000);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } else {
        const payload = await res.json();
        const reply = payload?.data?.reply ?? payload?.reply ?? '';

        if (reply) {
          setMessages((prev) => [...prev, { role: 'ai', content: reply }]);
          setMood('talking');
          setTimeout(() => setMood('idle'), 3000);
        } else {
          throw new Error('Empty reply');
        }
      }
    } catch {
      const errMsg = locale === 'ar'
        ? 'في مشكلة فنية دلوقتي. جرب تاني بعد شوية.'
        : 'Something went wrong. Please try again in a moment.';
      setMessages((prev) => [...prev, { role: 'ai', content: errMsg }]);
      setMood('error');
      setTimeout(() => setMood('idle'), 2000);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, locale]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        className={styles.launcher}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('open')}
        aria-expanded={open}
      >
        {open ? (
          <svg className={styles.launcherIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className={styles.launcherIcon} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.04 2 11c0 1.8.67 3.46 1.8 4.85L2 22l6.15-1.8A11.3 11.3 0 0012 20c5.52 0 10-4.04 10-9s-4.48-9-10-9zm0 16c-1.4 0-2.73-.25-3.93-.7l-.28-.11-3.67 1.08 1.08-3.67-.11-.28A7.2 7.2 0 014 11c0-3.86 3.59-7 8-7s8 3.14 8 7-3.59 7-8 7z" />
          </svg>
        )}
        {!open && messages.length <= 1 && <span className={styles.launcherBadge} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('title')}>
          <div className={styles.header}>
            <AstroAvatar mood={mood} size="sm" />
            <div className={styles.headerText}>
              <p className={styles.headerTitle}>{t('title')}</p>
              <p className={styles.headerSubtitle}>{t('subtitle')}</p>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label={t('close')}>
              ✕
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgAstro}`}
              >
                {msg.role === 'ai' ? <MiniMarkdown content={msg.content} /> : msg.content}
              </div>
            ))}
            {loading && (
              <div className={styles.msgAstro}>
                <div className={styles.typingDots}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputBar}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              disabled={loading}
              maxLength={2000}
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label={t('send')}
            >
              <svg className={styles.sendIcon} viewBox="0 0 24 24">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
