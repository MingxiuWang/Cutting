import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { isCurrentUserAdmin } from '@/lib/admin';
import LocalDate from '@/app/_components/local-date';
import { DeleteUserButton, DeleteCutButton, DeleteEntryButton } from '@/app/_components/admin-user-actions';
import { ArrowLeft } from 'lucide-react';

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurrentUserAdmin())) redirect('/dashboard');
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      cuts: { orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }] },
      entries: { orderBy: { measuredAt: 'desc' }, take: 200 },
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="w-4 h-4" />
        Back to admin
      </Link>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{user.email}</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Signed up <LocalDate value={user.createdAt} /> · {user.cuts.length} cuts · {user.entries.length} recent entries
          </p>
        </div>
        <DeleteUserButton userId={user.id} email={user.email} />
      </header>

      <section>
        <h2 className="text-lg font-medium text-neutral-900 mb-3">Cuts ({user.cuts.length})</h2>
        {user.cuts.length === 0 ? (
          <p className="text-sm text-neutral-500">No cuts.</p>
        ) : (
          <ul className="grid gap-2">
            {user.cuts.map((c) => (
              <li
                key={c.id}
                className="rounded-xl bg-white border border-neutral-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-base text-neutral-900 truncate">{c.name}</span>
                    {!c.endDate ? (
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
                    <LocalDate value={c.startDate} /> → {c.endDate ? <LocalDate value={c.endDate} /> : 'now'} · target{' '}
                    {Number(c.targetWeightKg).toFixed(1)} kg
                  </div>
                  {c.expectedEndDate && (
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Expected end: <LocalDate value={c.expectedEndDate} />
                    </div>
                  )}
                </div>
                <DeleteCutButton cutId={c.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-neutral-900 mb-3">Entries ({user.entries.length})</h2>
        {user.entries.length === 0 ? (
          <p className="text-sm text-neutral-500">No entries.</p>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-right">Weight</th>
                  <th className="px-4 py-3 text-right">Fat %</th>
                  <th className="px-4 py-3 text-right">Muscle %</th>
                  <th className="px-4 py-3 text-right">Water %</th>
                  <th className="px-4 py-3 text-left">Note</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {user.entries.map((e) => (
                  <tr key={e.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                      <LocalDate value={e.measuredAt} mode="datetime" />
                    </td>
                    <td className="px-4 py-3">{e.period}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(e.weightKg).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {e.bodyFatPct === null ? <span className="text-neutral-300">—</span> : Number(e.bodyFatPct).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {e.musclePct === null ? <span className="text-neutral-300">—</span> : Number(e.musclePct).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {e.waterPct === null ? <span className="text-neutral-300">—</span> : Number(e.waterPct).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">{e.note}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteEntryButton entryId={e.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
