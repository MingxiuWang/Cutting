import { auth } from '@/lib/auth';
import { getEntries } from '@/lib/queries/entries';
import EntryForm from '@/app/_components/entry-form';
import EntryTable from '@/app/_components/entry-table';

export default async function EntriesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const raw = await getEntries(userId, { take: 50 });
  const entries = raw.map((e) => ({
    id: e.id,
    measuredAt: e.measuredAt,
    period: e.period,
    weightKg: Number(e.weightKg),
    bodyFatPct: Number(e.bodyFatPct),
    musclePct: Number(e.musclePct),
    waterPct: Number(e.waterPct),
    note: e.note,
    createdAt: e.createdAt,
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Log an entry</h1>
        <EntryForm />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent entries</h2>
        {entries.length === 0 ? <p className="text-neutral-600">No entries yet.</p> : <EntryTable entries={entries} />}
      </section>
    </div>
  );
}
