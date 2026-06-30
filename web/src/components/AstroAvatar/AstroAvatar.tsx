'use client';

import { type ReactNode } from 'react';
import './AstroAvatar.css';

export type AstroMood =
  | 'idle'
  | 'talking'
  | 'listening'
  | 'celebrating'
  | 'thinking'
  | 'error'
  | 'waving';

export interface AstroAvatarProps {
  mood?: AstroMood;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'huge';
  className?: string;
  style?: React.CSSProperties;
}

export function AstroAvatar({
  mood = 'idle',
  size = 'md',
  className = '',
  style,
}: AstroAvatarProps) {
  const sizeClass = `astro-avatar--${size}`;
  const moodClass = `astro-mood--${mood}`;

  return (
    <div
      className={`astro-avatar ${sizeClass} ${moodClass} ${className}`}
      role="img"
      aria-label="Astro, the AI robot dog mascot"
      style={style}
    >
      <div className="astro-glow" aria-hidden="true" />
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="astro-svg">
        <ellipse cx="100" cy="130" rx="52" ry="42" className="astro-body" />
        <circle cx="100" cy="78" r="40" className="astro-head" />
        <rect x="68" y="62" width="64" height="30" rx="15" className="astro-visor" />
        <g className="astro-eyes">
          <circle cx="85" cy="77" r="6" className="astro-eye astro-eye--left" />
          <circle cx="115" cy="77" r="6" className="astro-eye astro-eye--right" />
          <circle cx="86" cy="76" r="2.5" className="astro-pupil" />
          <circle cx="116" cy="76" r="2.5" className="astro-pupil" />
          <circle cx="88" cy="74" r="1.2" className="astro-eye-shine" />
          <circle cx="118" cy="74" r="1.2" className="astro-eye-shine" />
        </g>
        <path d="M90 90 Q100 97 110 90" strokeWidth="2.5" strokeLinecap="round" fill="none" className="astro-mouth" />
        <g className="astro-ear astro-ear--left">
          <line x1="72" y1="52" x2="58" y2="28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="58" cy="26" r="5" className="astro-ear-tip" />
        </g>
        <g className="astro-ear astro-ear--right">
          <line x1="128" y1="52" x2="142" y2="28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="142" cy="26" r="5" className="astro-ear-tip" />
        </g>
        <path d="M148 140 Q168 125 160 105" strokeWidth="4" strokeLinecap="round" fill="none" className="astro-tail" />
        <ellipse cx="72" cy="168" rx="14" ry="8" className="astro-paw astro-paw--left" />
        <ellipse cx="128" cy="168" rx="14" ry="8" className="astro-paw astro-paw--right" />
        <circle cx="100" cy="122" r="8" className="astro-badge" />
        <text x="100" y="126" textAnchor="middle" className="astro-badge-text" fontSize="8" fontWeight="700">AI</text>
      </svg>
      {mood === 'celebrating' && (
        <div className="astro-confetti" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="astro-confetti-piece"
              style={{ '--i': i, '--hue': `${i * 30}` } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}
