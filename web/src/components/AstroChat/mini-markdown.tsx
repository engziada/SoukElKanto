'use client';

import React from 'react';

/**
 * Lightweight inline markdown renderer for chat messages.
 * Supports: [text](url) links, **bold**, and plain text.
 * Lines starting with "- " are rendered as list items.
 */

/** Process **bold** within a text string, and strip orphaned ** markers */
function renderBold(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Remove orphaned ** (not part of a **text** pair) by replacing valid pairs first,
  // then stripping leftover **, then restoring valid pairs
  const pairs: string[] = [];
  const placeholder = text.replace(/\*\*([^*]+)\*\*/g, (m) => {
    pairs.push(m);
    return `\x00${pairs.length - 1}\x00`;
  });
  const stripped = placeholder.replace(/\*\*/g, '');
  const cleaned = stripped.replace(/\x00(\d+)\x00/g, (_, idx) => pairs[Number(idx)]);

  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<React.Fragment key={`${keyPrefix}-t-${i}`}>{cleaned.slice(lastIndex, match.index)}</React.Fragment>);
    }
    nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
    i++;
  }
  if (lastIndex < cleaned.length) {
    nodes.push(<React.Fragment key={`${keyPrefix}-end`}>{cleaned.slice(lastIndex)}</React.Fragment>);
  }
  return nodes;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Pass 1: extract [text](url) links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Push preceding text (with bold processing)
    if (match.index > lastIndex) {
      nodes.push(...renderBold(text.slice(lastIndex, match.index), `${keyPrefix}-pre-${i}`));
    }

    // Link — process bold inside link text too
    nodes.push(
      <a
        key={`${keyPrefix}-l-${i}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="astro-link"
      >
        {renderBold(match[1], `${keyPrefix}-lt-${i}`)}
      </a>,
    );

    lastIndex = linkRegex.lastIndex;
    i++;
  }

  // Push remaining text (with bold processing)
  if (lastIndex < text.length) {
    nodes.push(...renderBold(text.slice(lastIndex), `${keyPrefix}-rem`));
  }

  return nodes;
}

export function MiniMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key} className="astro-list">
        {listItems.map((item, idx) => (
          <li key={idx}>{renderInline(item, `${key}-${idx}`)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
    } else {
      flushList(`ul-${idx}`);
      if (line.trim() === '') {
        elements.push(<div key={`sp-${idx}`} className="astro-spacing" />);
      } else {
        elements.push(
          <p key={`p-${idx}`} className="astro-para">
            {renderInline(line, `p-${idx}`)}
          </p>,
        );
      }
    }
  });
  flushList('ul-end');

  return <>{elements}</>;
}
