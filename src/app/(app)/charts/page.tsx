import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import RangeSelector, { type Range } from '@/app/_components/range-selector';
import WeightChart from '@/app/_components/weight-chart';
import CompositionChart from '@/app/_components/composition-chart';

const RANGE_DAYS: Record<Range, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null };

function rangeFromQuery(value: string | undefined): Range {
  return (['7d', '30d', '90d', 'all'] as const).includes(value as Range) ? (value as Range) : '30d';
}

export default async function ChartsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth();
  const userId = session!.user.id;
  const params = await searchParams;
  const ranges = {
    weightAm: rangeFromQuery(params.weightAm),
    weightPm: rangeFromQuery(params.weightPm),
    compAm: rangeFromQuery(params.compAm),
    compPm: rangeFromQuery(params.compPm),
  };

  const sinceFor = (r: Range) => {
    const days = RANGE_DAYS[r];
    return days === null ? undefined : new Date(Date.now() - days * 86400000);
  };

  const fetch = async (period: 'AM' | 'PM', r: Range) => {
    const since = sinceFor(r);
    const where: { userId: string; period: 'AM' | 'PM'; measuredAt?: { gte: Date } } = { userId, period };
    if (since) where.measuredAt = { gte: since };
    return db.entry.findMany({ where, orderBy: { measuredAt: 'asc' } });
  };

  const [amW, pmW, amC, pmC] = await Promise.all([
    fetch('AM', ranges.weightAm),
    fetch('PM', ranges.weightPm),
    fetch('AM', ranges.compAm),
    fetch('PM', ranges.compPm),
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const weightData = (rows: typeof amW) => rows.map((e) => ({ date: fmt(e.measuredAt), weight: Number(e.weightKg) }));
  const compData = (rows: typeof amW) => rows.map((e) => ({
    date: fmt(e.measuredAt),
    fat: Number(e.bodyFatPct),
    muscle: Number(e.musclePct),
    water: Number(e.waterPct),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Charts</h1>
        <p className="text-neutral-500 text-sm mt-1">Filter each metric independently.</p>
      </header>
      <div className="grid md:grid-cols-2 gap-5">
        <WeightChart
          title="Weight — Morning (kg)"
          data={weightData(amW)}
          headerRight={<RangeSelector paramKey="weightAm" current={ranges.weightAm} />}
        />
        <WeightChart
          title="Weight — Evening (kg)"
          data={weightData(pmW)}
          headerRight={<RangeSelector paramKey="weightPm" current={ranges.weightPm} />}
        />
        <CompositionChart
          title="Composition — Morning (%)"
          data={compData(amC)}
          headerRight={<RangeSelector paramKey="compAm" current={ranges.compAm} />}
        />
        <CompositionChart
          title="Composition — Evening (%)"
          data={compData(pmC)}
          headerRight={<RangeSelector paramKey="compPm" current={ranges.compPm} />}
        />
      </div>
    </div>
  );
}
