import { auth } from '@/lib/auth';
import { getEntries } from '@/lib/queries/entries';
import EntryForm from '@/app/_components/entry-form';
import EntryTable from '@/app/_components/entry-table';
import { ClipboardList } from 'lucide-react';

export default async function EntriesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const raw = await getEntries(userId, { take: 50 });
  const entries = raw.map((e) => ({
    id: e.id,
    measuredAt: e.measuredAt,
    period: e.period,
    weightKg: Number(e.weightKg),
    bodyFatPct: e.bodyFatPct === null ? null : Number(e.bodyFatPct),
    musclePct: e.musclePct === null ? null : Number(e.musclePct),
    waterPct: e.waterPct === null ? null : Number(e.waterPct),
    note: e.note,
    createdAt: e.createdAt,
  }));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Entries</h1>
        <p className="text-neutral-500 text-sm mt-1">Log measurements twice a day. AM and PM only once each per day.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">New entry</h2>
        <EntryForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Recent (last 50)</h2>
        {entries.length === 0 ? (
          <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ClipboardList className="w-6 h-6" />
            </div>
            <p className="mt-4 text-base font-medium text-neutral-900">No entries yet</p>
            <p className="mt-1 text-sm text-neutral-500">Add your first measurement above.</p>
          </div>
        ) : (
          <EntryTable entries={entries} />
        )}
      </section>
    </div>
  );
}
