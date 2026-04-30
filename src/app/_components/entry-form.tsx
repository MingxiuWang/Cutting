'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEntry } from '@/app/_actions/entries';
import { Save, LoaderCircle } from 'lucide-react';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'text-sm font-medium text-neutral-700';

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
    <form action={onSubmit} className="grid gap-4 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="measuredAt">Date &amp; time</label>
          <input
            id="measuredAt"
            name="measuredAt"
            type="datetime-local"
            required
            defaultValue={localISO}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="period">Period</label>
          <select id="period" name="period" defaultValue={defaultPeriod} className={inputClass}>
            <option value="AM">Morning</option>
            <option value="PM">Evening</option>
          </select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={labelClass} htmlFor="weightKg">Weight (kg)</label>
        <input
          id="weightKg"
          name="weightKg"
          type="number"
          step="0.1"
          min="20"
          max="400"
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="bodyFatPct">Body fat (%)</label>
          <input
            id="bodyFatPct"
            name="bodyFatPct"
            type="number"
            step="0.1"
            min="1"
            max="70"
            required
            className={inputClass}
          />
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="musclePct">Muscle (%)</label>
          <input
            id="musclePct"
            name="musclePct"
            type="number"
            step="0.1"
            min="10"
            max="80"
            required
            className={inputClass}
          />
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="waterPct">Water (%)</label>
          <input
            id="waterPct"
            name="waterPct"
            type="number"
            step="0.1"
            min="20"
            max="80"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={labelClass} htmlFor="note">Note</label>
        <textarea id="note" name="note" maxLength={500} rows={3} className={inputClass} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors"
      >
        {pending ? (
          <>
            <LoaderCircle className="w-4 h-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save entry
          </>
        )}
      </button>
    </form>
  );
}
