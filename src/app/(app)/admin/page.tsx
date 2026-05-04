import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { isCurrentUserAdmin } from '@/lib/admin';
import LocalDate from '@/app/_components/local-date';

export default async function AdminPage() {
  if (!(await isCurrentUserAdmin())) redirect('/dashboard');

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      email: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { cuts: true, entries: true } },
      entries: {
        orderBy: { measuredAt: 'desc' },
        take: 1,
        select: { measuredAt: true },
      },
    },
  });

  const rows = users
    .map((u) => {
      const lastLog = u.entries[0]?.measuredAt ?? null;
      const lastSeen = Math.max(
        u.createdAt.getTime(),
        u.lastLoginAt?.getTime() ?? 0,
        lastLog?.getTime() ?? 0,
      );
      return {
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        cutCount: u._count.cuts,
        entryCount: u._count.entries,
        lastLog,
        lastSeen,
      };
    })
    .sort((a, b) => b.lastSeen - a.lastSeen);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Admin</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {rows.length} user{rows.length === 1 ? '' : 's'} — sorted by most recent of signup, login, or log entry.
        </p>
      </header>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Signed up</th>
              <th className="px-4 py-3 text-left">Last login</th>
              <th className="px-4 py-3 text-right">Cuts</th>
              <th className="px-4 py-3 text-right">Entries</th>
              <th className="px-4 py-3 text-left">Last log</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{u.email}</td>
                <td className="px-4 py-3 text-neutral-700">
                  <LocalDate value={u.createdAt} />
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {u.lastLoginAt ? <LocalDate value={u.lastLoginAt} mode="datetime" /> : <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{u.cutCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.entryCount}</td>
                <td className="px-4 py-3 text-neutral-700">
                  {u.lastLog ? <LocalDate value={u.lastLog} mode="datetime" /> : <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-emerald-700 hover:text-emerald-900 text-sm font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
