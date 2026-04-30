'use client';

import { useEffect, useState } from 'react';

type Mode = 'date' | 'datetime';

function isoFallback(d: Date, mode: Mode): string {
  // Server-side fallback: use UTC ISO. Client will replace once mounted.
  return mode === 'date'
    ? d.toISOString().slice(0, 10)
    : d.toISOString().slice(0, 16).replace('T', ' ');
}

function formatLocal(d: Date, mode: Mode): string {
  if (mode === 'date') {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function LocalDate({
  value,
  mode = 'date',
}: {
  value: Date | string;
  mode?: Mode;
}) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const [text, setText] = useState<string>(() => isoFallback(date, mode));

  useEffect(() => {
    setText(formatLocal(date, mode));
  }, [date, mode]);

  return <time dateTime={date.toISOString()}>{text}</time>;
}
