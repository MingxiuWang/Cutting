'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEntry } from '@/app/_actions/entries';

export default function EntryForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const defaultPeriod: 'AM' | 'PM' = now.getHours() < 12 ? 'AM' : 'PM';
  const tzOffsetMinutes = -now.getTimezoneOffset();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const note = String(formData.get('note') ?? '').trim();
      const result = await createEntry({
        measuredAt: new Date(String(formData.get('measuredAt'))),
        period: String(formData.get('period')) as 'AM' | 'PM',
        weightKg: Number(formData.get('weightKg')),
        bodyFatPct: Number(formData.get('bodyFatPct')),
        musclePct: Number(formData.get('musclePct')),
        waterPct: Number(formData.get('waterPct')),
        ...(note ? { note } : {}),
        tzOffsetMinutes,
      });
      if (!result.ok) {
        if (result.error === 'DUPLICATE_PERIOD_TODAY') setError('You already logged this period today. Edit the existing entry instead.');
        else setError(result.message ?? 'Could not save');
        return;
      }
      router.refresh();
      onDone?.();
    });
  };

  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

  return (
    <form action={onSubmit} className="grid gap-3 max-w-md">
      <label className="grid gap-1 text-sm">
        Date & time
        <input name="measuredAt" type="datetime-local" required defaultValue={localISO} className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Period
        <select name="period" defaultValue={defaultPeriod} className="border rounded p-2">
          <option value="AM">Morning</option>
          <option value="PM">Evening</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Weight (kg)
        <input name="weightKg" type="number" step="0.1" min="20" max="400" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Body fat (%)
        <input name="bodyFatPct" type="number" step="0.1" min="1" max="70" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Muscle (%)
        <input name="musclePct" type="number" step="0.1" min="10" max="80" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Water (%)
        <input name="waterPct" type="number" step="0.1" min="20" max="80" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Note
        <textarea name="note" maxLength={500} className="border rounded p-2" />
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">
        {pending ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  );
}
