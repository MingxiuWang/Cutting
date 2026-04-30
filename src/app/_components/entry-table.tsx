'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEntry } from '@/app/_actions/entries';
import { isWithinEditWindow } from '@/lib/time';
import { Sun, Moon, Trash2 } from 'lucide-react';
import LocalDate from '@/app/_components/local-date';

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
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">When</th>
              <th className="px-4 py-3 text-left font-medium">Period</th>
              <th className="px-4 py-3 text-left font-medium">Weight</th>
              <th className="px-4 py-3 text-left font-medium">Fat %</th>
              <th className="px-4 py-3 text-left font-medium">Muscle %</th>
              <th className="px-4 py-3 text-left font-medium">Water %</th>
              <th className="px-4 py-3 text-left font-medium">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const editable = isWithinEditWindow(e.createdAt);
              const isAm = e.period === 'AM';
              return (
                <tr key={e.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-sm whitespace-nowrap text-neutral-700">
                    <LocalDate value={e.measuredAt} mode="datetime" />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        isAm
                          ? 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700'
                          : 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700'
                      }
                    >
                      {isAm ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      {e.period}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900">{e.weightKg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{e.bodyFatPct.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{e.musclePct.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{e.waterPct.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate text-neutral-500">{e.note}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={pending || !editable}
                      title={editable ? 'Delete' : 'Past 24h — can no longer edit or delete'}
                      aria-label="Delete"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
