'use client';

import { useTransition } from 'react';
import { endCut, deleteCut } from '@/app/_actions/cuts';
import { useRouter } from 'next/navigation';

type CutRow = { id: string; name: string; startDate: Date; endDate: Date | null; targetWeightKg: number };

export default function CutList({ cuts }: { cuts: CutRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleEnd = (cutId: string) => startTransition(async () => {
    await endCut(cutId, { endDate: new Date() });
    router.refresh();
  });

  const handleDelete = (cutId: string) => startTransition(async () => {
    if (!confirm('Delete this cut?')) return;
    const result = await deleteCut(cutId);
    if (!result.ok && result.error === 'CUT_HAS_ENTRIES') alert('This cut has entries. End it instead.');
    router.refresh();
  });

  return (
    <ul className="grid gap-3">
      {cuts.map((c) => (
        <li key={c.id} className="border rounded p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-neutral-600">
              {c.startDate.toISOString().slice(0, 10)} → {c.endDate ? c.endDate.toISOString().slice(0, 10) : 'active'} · target {c.targetWeightKg.toFixed(1)} kg
            </div>
          </div>
          <div className="flex gap-2">
            {!c.endDate && <button onClick={() => handleEnd(c.id)} disabled={pending} className="border rounded px-3 py-1 text-sm">End</button>}
            <button onClick={() => handleDelete(c.id)} disabled={pending} className="border rounded px-3 py-1 text-sm">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
