export type EntryRow = {
  measuredAt: Date;
  period: 'AM' | 'PM';
  weightKg: number;
};

export type CutRow = {
  startDate: Date;
  targetWeightKg: number;
};

export type Stats = {
  startWeightKg: number | null;
  currentWeightKg: number | null;
  totalLostKg: number | null;
  weeklyRateKg: number | null;
  daysInCut: number;
  progressPct: number | null;
};

export function computeStats(entries: EntryRow[], cut: CutRow): Stats {
  const am = entries
    .filter((e) => e.period === 'AM')
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
  const daysInCut = Math.max(0, Math.floor((Date.now() - cut.startDate.getTime()) / 86400000));

  if (am.length === 0) {
    return {
      startWeightKg: null,
      currentWeightKg: null,
      totalLostKg: null,
      weeklyRateKg: null,
      daysInCut,
      progressPct: null,
    };
  }

  const startWeightKg = am[0]!.weightKg;
  const currentWeightKg = am[am.length - 1]!.weightKg;
  const totalLostKg = +(startWeightKg - currentWeightKg).toFixed(1);

  let weeklyRateKg: number | null = null;
  if (am.length >= 2) {
    const weeks =
      (am[am.length - 1]!.measuredAt.getTime() - am[0]!.measuredAt.getTime()) / (7 * 86400000);
    if (weeks > 0) weeklyRateKg = +((startWeightKg - currentWeightKg) / weeks).toFixed(2);
  }

  let progressPct: number | null = null;
  const totalGoal = startWeightKg - cut.targetWeightKg;
  if (totalGoal > 0) {
    const pct = ((startWeightKg - currentWeightKg) / totalGoal) * 100;
    progressPct = Math.max(0, Math.min(100, +pct.toFixed(1)));
  }

  return { startWeightKg, currentWeightKg, totalLostKg, weeklyRateKg, daysInCut, progressPct };
}

export function computeAmPmAverages(
  entries: EntryRow[],
  windowDays: number,
): { amAvgKg: number | null; pmAvgKg: number | null } {
  const cutoff = Date.now() - windowDays * 86400000;
  const inWindow = entries.filter((e) => e.measuredAt.getTime() >= cutoff);
  const am = inWindow.filter((e) => e.period === 'AM');
  const pm = inWindow.filter((e) => e.period === 'PM');
  const avg = (rows: EntryRow[]) =>
    rows.length === 0 ? null : +(rows.reduce((s, r) => s + r.weightKg, 0) / rows.length).toFixed(2);
  return { amAvgKg: avg(am), pmAvgKg: avg(pm) };
}
