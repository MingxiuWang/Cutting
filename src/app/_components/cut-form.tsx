'use client';

import { useState, useTransition } from 'react';
import { createCut } from '@/app/_actions/cuts';
import { useRouter } from 'next/navigation';

export default function CutForm({ mostRecentWeightKg }: { mostRecentWeightKg: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<number>(70);

  const showWarning = mostRecentWeightKg !== null && target >= mostRecentWeightKg;

  const onSubmit = (formData: FormData) => {
    if (showWarning && !confirm(`Your target ${target} kg is at or above your most recent weight ${mostRecentWeightKg} kg. This is a cutting tracker. Continue?`)) {
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await createCut({
        name: String(formData.get('name') ?? ''),
        startDate: new Date(String(formData.get('startDate') ?? '')),
        targetWeightKg: Number(formData.get('targetWeightKg') ?? target),
      });
      if (!result.ok) {
        if (result.error === 'ACTIVE_CUT_EXISTS') setError('You already have an active cut. End it before starting a new one.');
        else setError(result.message ?? 'Could not create cut');
        return;
      }
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="grid gap-3 max-w-md">
      <input name="name" required placeholder="Cut name" className="border rounded p-2" />
      <input name="startDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="border rounded p-2" />
      <input
        name="targetWeightKg"
        required
        type="number"
        step="0.1"
        min="20"
        max="400"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        className="border rounded p-2"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">
        {pending ? 'Saving…' : 'Start cut'}
      </button>
    </form>
  );
}
