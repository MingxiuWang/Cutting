import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/queries/dashboard';
import StatCard from '@/app/_components/stat-card';
import AmPmCard from '@/app/_components/am-pm-card';
import EntryForm from '@/app/_components/entry-form';
import EntryTable from '@/app/_components/entry-table';
import LocalDate from '@/app/_components/local-date';
import { Scale, TrendingDown, Activity, Calendar, Target } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { activeCut, stats, amPm7d, amPm30d, recentEntries } = await getDashboardStats(userId);

  if (!activeCut) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Dashboard</h1>
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Target className="w-12 h-12 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-neutral-900">Start your first cut</h2>
          <p className="mt-2 text-sm text-neutral-500 max-w-sm mx-auto">
            Create a cut to set a target weight and start tracking your daily progress.
          </p>
          <Link
            href="/cuts"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            Start a cut
          </Link>
        </div>
      </div>
    );
  }

  const progressPctRaw = stats!.progressPct ?? 0;
  const progressPct = Math.max(0, Math.min(100, progressPctRaw));

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              Active cut
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">{activeCut.name}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              <LocalDate value={activeCut.startDate} /> → target {Number(activeCut.targetWeightKg).toFixed(1)} kg
            </p>
            {activeCut.expectedEndDate && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Expected end: <LocalDate value={activeCut.expectedEndDate} />
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-neutral-500">Progress</div>
            <div className="text-3xl font-semibold text-emerald-600">{progressPctRaw.toFixed(0)}%</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-neutral-700">Progress to target</span>
            <span className="text-neutral-500">{progressPctRaw.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2">
            <div
              className="h-2 bg-emerald-600 rounded-full transition-all"
              style={{ width: progressPct + '%' }}
            />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Start (AM)" value={stats!.startWeightKg?.toFixed(1) ?? null} suffix="kg" icon={Scale} />
        <StatCard label="Current (AM)" value={stats!.currentWeightKg?.toFixed(1) ?? null} suffix="kg" icon={Scale} />
        <StatCard label="Total lost" value={stats!.totalLostKg?.toFixed(1) ?? null} suffix="kg" icon={TrendingDown} />
        <StatCard label="Avg weekly rate" value={stats!.weeklyRateKg?.toFixed(2) ?? null} suffix="kg/wk" icon={Activity} />
        <StatCard label="Days in cut" value={stats!.daysInCut} icon={Calendar} />
        <StatCard label="Progress" value={stats!.progressPct?.toFixed(0) ?? null} suffix="%" icon={Target} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AmPmCard title="Avg AM vs PM (last 7 days)" am={amPm7d!.amAvgKg} pm={amPm7d!.pmAvgKg} />
        <AmPmCard title="Avg AM vs PM (last 30 days)" am={amPm30d!.amAvgKg} pm={amPm30d!.pmAvgKg} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Log an entry</h2>
        <EntryForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p className="text-neutral-500 text-sm">No entries yet.</p>
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
