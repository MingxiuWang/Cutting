'use client';

import { useTransition } from 'react';
import { endCut, deleteCut } from '@/app/_actions/cuts';
import { useRouter } from 'next/navigation';

type CutRow = {
  id: string;
  name: string;
  startDate: Date;
  expectedEndDate: Date | null;
  endDate: Date | null;
  targetWeightKg: number;
};

export default function CutList({ cuts }: { cuts: CutRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleEnd = (cutId: string) =>
    startTransition(async () => {
      await endCut(cutId, { endDate: new Date() });
      router.refresh();
    });

  const handleDelete = (cutId: string) =>
    startTransition(async () => {
      if (!confirm('Delete this cut?')) return;
      const result = await deleteCut(cutId);
      if (!result.ok && result.error === 'CUT_HAS_ENTRIES') alert('This cut has entries. End it instead.');
      router.refresh();
    });

  return (
    <ul className="grid gap-3">
      {cuts.map((c) => {
        const active = !c.endDate;
        return (
          <li
            key={c.id}
            className="rounded-xl bg-white border border-neutral-200 p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-base text-neutral-900 truncate">{c.name}</span>
                {active ? (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-1.5 inline-block" />
                    Ended
                  </span>
                )}
              </div>
              <div className="text-sm text-neutral-500 mt-1">
                {c.startDate.toISOString().slice(0, 10)} → {c.endDate ? c.endDate.toISOString().slice(0, 10) : 'now'} · target {c.targetWeightKg.toFixed(1)} kg
              </div>
              {c.expectedEndDate && (
                <div className="text-xs text-neutral-500 mt-0.5">
                  Expected end: {c.expectedEndDate.toISOString().slice(0, 10)}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!c.endDate && (
                <button
                  onClick={() => handleEnd(c.id)}
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  End
                </button>
              )}
              <button
                onClick={() => handleDelete(c.id)}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
