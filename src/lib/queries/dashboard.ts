import { db } from '@/lib/db';
import { computeStats, computeAmPmAverages, type EntryRow } from '@/lib/stats';
import { getActiveCut } from '@/lib/queries/cuts';

export async function getDashboardStats(userId: string) {
  const cut = await getActiveCut(userId);
  if (!cut)
    return {
      activeCut: null as null,
      stats: null,
      amPm7d: null,
      amPm30d: null,
      recentEntries: [],
    };

  const entries = await db.entry.findMany({
    where: { userId, cutId: cut.id },
    orderBy: { measuredAt: 'desc' },
    take: 365,
  });

  const rows: EntryRow[] = entries.map((e) => ({
    measuredAt: e.measuredAt,
    period: e.period,
    weightKg: Number(e.weightKg),
  }));
  const stats = computeStats(rows, {
    startDate: cut.startDate,
    targetWeightKg: Number(cut.targetWeightKg),
  });
  const amPm7d = computeAmPmAverages(rows, 7);
  const amPm30d = computeAmPmAverages(rows, 30);

  const recentEntries = entries.slice(0, 10);

  return { activeCut: cut, stats, amPm7d, amPm30d, recentEntries };
}
