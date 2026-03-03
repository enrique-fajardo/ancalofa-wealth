'use client';

import React from 'react';
import { XCircle, AlertTriangle, Clock, CheckCircle, Info, TrendingUp, TrendingDown, ShieldAlert, Target } from 'lucide-react';

/**
 * Lightweight markdown-to-JSX renderer.
 * Supports: **bold**, *italic*, `code`, ```code blocks```,
 * - unordered lists, 1. ordered lists, | tables |, ### headings, [links](url)
 * - Inline severity badges: [CRITICAL], [WARNING], [APPROACHING], [ON TRACK], [INFO], etc.
 * No external dependency.
 */

// ---------------------------------------------------------------------------
// Severity / status badge config — mirrors the app's Badge + Alert system
// ---------------------------------------------------------------------------
interface BadgeConfig {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bg: string;
  text: string;
  label: string;
}

const BADGE_MAP: Record<string, BadgeConfig> = {
  // English
  'CRITICAL':    { icon: XCircle,       bg: 'bg-error-light',   text: 'text-error',   label: 'CRITICAL' },
  'URGENT':      { icon: XCircle,       bg: 'bg-error-light',   text: 'text-error',   label: 'URGENT' },
  'WARNING':     { icon: AlertTriangle, bg: 'bg-warning-light', text: 'text-warning', label: 'WARNING' },
  'APPROACHING': { icon: Clock,         bg: 'bg-warning-light', text: 'text-warning', label: 'APPROACHING' },
  'ON TRACK':    { icon: CheckCircle,   bg: 'bg-success-light', text: 'text-success', label: 'ON TRACK' },
  'ON TARGET':   { icon: CheckCircle,   bg: 'bg-success-light', text: 'text-success', label: 'ON TARGET' },
  'INFO':        { icon: Info,          bg: 'bg-info-light',    text: 'text-info',    label: 'INFO' },
  'EXPIRED':     { icon: XCircle,       bg: 'bg-error-light',   text: 'text-error',   label: 'EXPIRED' },
  'POSITIVE':    { icon: TrendingUp,    bg: 'bg-success-light', text: 'text-success', label: 'POSITIVE' },
  'NEGATIVE':    { icon: TrendingDown,  bg: 'bg-error-light',   text: 'text-error',   label: 'NEGATIVE' },
  'RISK':        { icon: ShieldAlert,   bg: 'bg-warning-light', text: 'text-warning', label: 'RISK' },
  'OVER':        { icon: AlertTriangle, bg: 'bg-warning-light', text: 'text-warning', label: 'OVER' },
  'UNDER':       { icon: AlertTriangle, bg: 'bg-info-light',    text: 'text-info',    label: 'UNDER' },
  'NOTICE':      { icon: Info,          bg: 'bg-accent-50',     text: 'text-accent-800', label: 'NOTICE' },
  // Spanish
  'CRITICO':     { icon: XCircle,       bg: 'bg-error-light',   text: 'text-error',   label: 'CRITICO' },
  'URGENTE':     { icon: XCircle,       bg: 'bg-error-light',   text: 'text-error',   label: 'URGENTE' },
  'ADVERTENCIA': { icon: AlertTriangle, bg: 'bg-warning-light', text: 'text-warning', label: 'ADVERTENCIA' },
  'PROXIMO':     { icon: Clock,         bg: 'bg-warning-light', text: 'text-warning', label: 'PRÓXIMO' },
  'EN CURSO':    { icon: CheckCircle,   bg: 'bg-success-light', text: 'text-success', label: 'EN CURSO' },
  'EN META':     { icon: CheckCircle,   bg: 'bg-success-light', text: 'text-success', label: 'EN META' },
  'VENCIDO':     { icon: XCircle,       bg: 'bg-error-light',   text: 'text-error',   label: 'VENCIDO' },
  'RIESGO':      { icon: ShieldAlert,   bg: 'bg-warning-light', text: 'text-warning', label: 'RIESGO' },
  'SOBRE':       { icon: AlertTriangle, bg: 'bg-warning-light', text: 'text-warning', label: 'SOBRE' },
  'BAJO':        { icon: AlertTriangle, bg: 'bg-info-light',    text: 'text-info',    label: 'BAJO' },
  'AVISO':       { icon: Info,          bg: 'bg-accent-50',     text: 'text-accent-800', label: 'AVISO' },
  'OBJETIVO':    { icon: Target,        bg: 'bg-success-light', text: 'text-success', label: 'OBJETIVO' },
};

// Build regex from all keys — sorted longest first to match "ON TRACK" before "ON"
const badgeKeys = Object.keys(BADGE_MAP).sort((a, b) => b.length - a.length);
const badgePattern = badgeKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const BADGE_REGEX = new RegExp(`\\[(${badgePattern})\\]`, 'g');

function renderBadge(key: string, reactKey: number | string): React.ReactNode {
  const config = BADGE_MAP[key];
  if (!config) return `[${key}]`;
  const Icon = config.icon;
  return (
    <span
      key={reactKey}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {config.label}
    </span>
  );
}

function parseLine(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Combined regex: badges, bold, italic, inline code, links
  const regex = new RegExp(
    `(\\[(${badgePattern})\\])` +    // Group 1-2: Badge [CRITICAL]
    `|(\\*\\*(.+?)\\*\\*)` +          // Group 3-4: Bold
    `|(\\*(.+?)\\*)` +                // Group 5-6: Italic
    '|(`(.+?)`)' +                    // Group 7-8: Inline code
    `|(\\[(.+?)\\]\\((.+?)\\))`,     // Group 9-10-11: Link
    'g'
  );
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Badge
      nodes.push(renderBadge(match[2], `badge-${match.index}`));
    } else if (match[3]) {
      // Bold
      nodes.push(<strong key={match.index} className="font-semibold">{match[4]}</strong>);
    } else if (match[5]) {
      // Italic
      nodes.push(<em key={match.index}>{match[6]}</em>);
    } else if (match[7]) {
      // Inline code
      nodes.push(
        <code key={match.index} className="bg-gray-100 text-primary-700 px-1 py-0.5 rounded text-sm font-mono">
          {match[8]}
        </code>
      );
    } else if (match[9]) {
      // Link
      nodes.push(
        <a key={match.index} href={match[11]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary-700">
          {match[10]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderTable(lines: string[]): React.ReactNode {
  // Parse table rows: | col1 | col2 | col3 |
  const rows = lines.map(line =>
    line.split('|').map(c => c.trim()).filter(Boolean)
  );

  if (rows.length < 2) return null;

  const headers = rows[0];
  // Skip separator row (index 1): | --- | --- |
  const dataRows = rows.slice(2);

  return (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-sm border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-1.5 text-left font-semibold text-gray-700 border-b">
                {parseLine(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50/50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1 border-b border-gray-100 text-gray-600">
                  {parseLine(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Table (detect | at start)
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = renderTable(tableLines);
      if (table) elements.push(<React.Fragment key={`table-${i}`}>{table}</React.Fragment>);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold text-gray-800 mt-3 mb-1">{parseLine(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-semibold text-gray-800 mt-3 mb-1">{parseLine(line.slice(3))}</h2>);
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1 text-gray-700">
          {items.map((item, j) => <li key={j}>{parseLine(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 my-1 text-gray-700">
          {items.map((item, j) => <li key={j}>{parseLine(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-3 border-primary-300 bg-primary-50 pl-3 pr-2 py-1.5 my-2 rounded-r-lg text-gray-700">
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="my-0.5 leading-relaxed">{parseLine(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="my-2 border-gray-200" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-gray-700 my-0.5 leading-relaxed">
        {parseLine(line)}
      </p>
    );
    i++;
  }

  return <div className="markdown-content">{elements}</div>;
}
