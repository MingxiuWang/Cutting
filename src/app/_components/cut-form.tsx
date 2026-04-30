'use client';

import { useEffect, useState, useTransition } from 'react';
import { createCut } from '@/app/_actions/cuts';
import { useRouter } from 'next/navigation';
import { Plus, LoaderCircle } from 'lucide-react';

function localToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'text-sm font-medium text-neutral-700';

export default function CutForm({ mostRecentWeightKg }: { mostRecentWeightKg: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<number>(70);
  const [startDate, setStartDate] = useState<string>('');
  useEffect(() => {
    setStartDate(localToday());
  }, []);

  const showWarning = mostRecentWeightKg !== null && target >= mostRecentWeightKg;

  const onSubmit = (formData: FormData) => {
    if (showWarning && !confirm(`Your target ${target} kg is at or above your most recent weight ${mostRecentWeightKg} kg. This is a cutting tracker. Continue?`)) {
      return;
    }
    startTransition(async () => {
      setError(null);
      const expectedEndRaw = String(formData.get('expectedEndDate') ?? '').trim();
      const result = await createCut({
        name: String(formData.get('name') ?? ''),
        startDate: new Date(String(formData.get('startDate') ?? '')),
        targetWeightKg: Number(formData.get('targetWeightKg') ?? target),
        ...(expectedEndRaw ? { expectedEndDate: new Date(expectedEndRaw) } : {}),
      });
      if (!result.ok) {
        if (result.error === 'ACTIVE_CUT_EXISTS') setError('You already have an active cut. End it before starting a new one.');
        else if (result.error === 'VALIDATION_FAILED') {
          const fieldMsg = Object.values(result.fieldErrors ?? {}).flat().join('; ');
          setError(fieldMsg || result.message || 'Invalid input');
        } else setError(result.message ?? 'Could not create cut');
        return;
      }
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="grid gap-4 max-w-md">
      <div className="grid gap-1.5">
        <label className={labelClass} htmlFor="cut-name">Cut name</label>
        <input id="cut-name" name="name" required placeholder="e.g. Spring 2026" className={inputClass} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="cut-start">Start date</label>
          <input
            id="cut-start"
            name="startDate"
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="cut-target">Target weight (kg)</label>
          <input
            id="cut-target"
            name="targetWeightKg"
            required
            type="number"
            step="0.1"
            min="20"
            max="400"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <label className={labelClass} htmlFor="cut-expected-end">
          Expected end date <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <input
          id="cut-expected-end"
          name="expectedEndDate"
          type="date"
          className={inputClass}
        />
        <p className="text-xs text-neutral-500">When you plan to finish. Used to track pacing — you can change or skip this.</p>
      </div>

      {showWarning && (
        <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">
          Heads up: your target ({target} kg) is at or above your most recent weight ({mostRecentWeightKg} kg).
        </div>
      )}

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
            <Plus className="w-4 h-4" />
            Start cut
          </>
        )}
      </button>
    </form>
  );
}
