'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEntry } from '@/app/_actions/entries';
import { isWithinEditWindow } from '@/lib/time';

type Row = {
  id: string;
  measuredAt: Date;
  period: 'AM' | 'PM';
  weightKg: number;
  bodyFatPct: number;
  musclePct: number;
  waterPct: number;
  note: string | null;
  createdAt: Date;
};

export default function EntryTable({ entries }: { entries: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = (id: string) =>
    startTransition(async () => {
      if (!confirm('Delete this entry?')) return;
      await deleteEntry(id);
      router.refresh();
    });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-neutral-500">
          <tr>
            <th className="p-2">When</th>
            <th className="p-2">Period</th>
            <th className="p-2">Weight</th>
            <th className="p-2">Fat %</th>
            <th className="p-2">Muscle %</th>
            <th className="p-2">Water %</th>
            <th className="p-2">Note</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const editable = isWithinEditWindow(e.createdAt);
            return (
              <tr key={e.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{e.measuredAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                <td className="p-2">{e.period}</td>
                <td className="p-2">{e.weightKg.toFixed(1)}</td>
                <td className="p-2">{e.bodyFatPct.toFixed(1)}</td>
                <td className="p-2">{e.musclePct.toFixed(1)}</td>
                <td className="p-2">{e.waterPct.toFixed(1)}</td>
                <td className="p-2 max-w-xs truncate">{e.note}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={pending || !editable}
                    title={editable ? 'Delete' : 'Past 24h — can no longer edit or delete'}
                    className="text-sm text-red-600 disabled:text-neutral-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
