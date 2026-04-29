import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/queries/dashboard';
import StatCard from '@/app/_components/stat-card';
import AmPmCard from '@/app/_components/am-pm-card';
import EntryForm from '@/app/_components/entry-form';
import EntryTable from '@/app/_components/entry-table';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { activeCut, stats, amPm7d, amPm30d, recentEntries } = await getDashboardStats(userId);

  if (!activeCut) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-neutral-600">No active cut yet.</p>
        <Link href="/cuts" className="inline-block bg-black text-white rounded px-4 py-2">Start a cut</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border rounded-xl p-4 bg-white">
        <div className="text-sm text-neutral-500">Active cut</div>
        <div className="text-xl font-semibold">{activeCut.name}</div>
        <div className="text-sm text-neutral-600">
          {activeCut.startDate.toISOString().slice(0, 10)} → target {Number(activeCut.targetWeightKg).toFixed(1)} kg
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Start (AM)" value={stats!.startWeightKg?.toFixed(1) ?? null} suffix="kg" />
        <StatCard label="Current (AM)" value={stats!.currentWeightKg?.toFixed(1) ?? null} suffix="kg" />
        <StatCard label="Total lost" value={stats!.totalLostKg?.toFixed(1) ?? null} suffix="kg" />
        <StatCard label="Avg weekly rate" value={stats!.weeklyRateKg?.toFixed(2) ?? null} suffix="kg/wk" />
        <StatCard label="Days in cut" value={stats!.daysInCut} />
        <StatCard label="Progress" value={stats!.progressPct?.toFixed(0) ?? null} suffix="%" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AmPmCard title="Avg AM vs PM (last 7 days)" am={amPm7d!.amAvgKg} pm={amPm7d!.pmAvgKg} />
        <AmPmCard title="Avg AM vs PM (last 30 days)" am={amPm30d!.amAvgKg} pm={amPm30d!.pmAvgKg} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Log an entry</h2>
        <EntryForm />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p className="text-neutral-600">No entries yet.</p>
        ) : (
          <EntryTable
            entries={recentEntries.map((e) => ({
              id: e.id,
              measuredAt: e.measuredAt,
              period: e.period,
              weightKg: Number(e.weightKg),
              bodyFatPct: Number(e.bodyFatPct),
              musclePct: Number(e.musclePct),
              waterPct: Number(e.waterPct),
              note: e.note,
              createdAt: e.createdAt,
            }))}
          />
        )}
      </section>
    </div>
  );
}
