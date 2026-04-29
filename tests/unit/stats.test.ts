import { describe, it, expect } from 'vitest';
import { computeStats, computeAmPmAverages, type EntryRow } from '@/lib/stats';

const makeEntry = (daysAgo: number, weightKg: number, period: 'AM' | 'PM' = 'AM'): EntryRow => ({
  measuredAt: new Date(Date.now() - daysAgo * 86400000),
  period,
  weightKg,
});

describe('computeStats', () => {
  it('returns null fields when there are no AM entries', () => {
    expect(computeStats([], { startDate: new Date(), targetWeightKg: 70 })).toEqual({
      startWeightKg: null,
      currentWeightKg: null,
      totalLostKg: null,
      weeklyRateKg: null,
      daysInCut: 0,
      progressPct: null,
    });
  });

  it('uses earliest AM entry for startWeight, latest for currentWeight', () => {
    const entries = [makeEntry(0, 75), makeEntry(7, 78), makeEntry(14, 80)];
    const result = computeStats(entries, { startDate: new Date(Date.now() - 14 * 86400000), targetWeightKg: 70 });
    expect(result.startWeightKg).toBe(80);
    expect(result.currentWeightKg).toBe(75);
    expect(result.totalLostKg).toBe(5);
  });

  it('computes weekly rate as (start - current) / weeks elapsed', () => {
    const entries = [makeEntry(0, 75), makeEntry(14, 80)];
    const result = computeStats(entries, { startDate: new Date(Date.now() - 14 * 86400000), targetWeightKg: 70 });
    expect(result.weeklyRateKg).toBeCloseTo(2.5, 1);
  });

  it('ignores PM entries', () => {
    const entries = [makeEntry(0, 70), makeEntry(0, 73, 'PM'), makeEntry(7, 75)];
    const result = computeStats(entries, { startDate: new Date(Date.now() - 7 * 86400000), targetWeightKg: 65 });
    expect(result.startWeightKg).toBe(75);
    expect(result.currentWeightKg).toBe(70);
  });

  it('computes progressPct toward target', () => {
    const entries = [makeEntry(0, 75), makeEntry(7, 80)];
    const result = computeStats(entries, { startDate: new Date(Date.now() - 7 * 86400000), targetWeightKg: 70 });
    expect(result.progressPct).toBe(50);
  });

  it('clamps progressPct to [0, 100]', () => {
    const overshoot = [makeEntry(0, 65), makeEntry(7, 80)];
    const result = computeStats(overshoot, { startDate: new Date(Date.now() - 7 * 86400000), targetWeightKg: 70 });
    expect(result.progressPct).toBe(100);
  });
});

describe('computeAmPmAverages', () => {
  it('returns null when no entries in window', () => {
    expect(computeAmPmAverages([], 7)).toEqual({ amAvgKg: null, pmAvgKg: null });
  });

  it('averages AM and PM entries within the window', () => {
    const entries = [
      makeEntry(0, 70, 'AM'),
      makeEntry(0, 72, 'PM'),
      makeEntry(2, 71, 'AM'),
      makeEntry(2, 73, 'PM'),
      makeEntry(10, 80, 'AM'),
    ];
    expect(computeAmPmAverages(entries, 7)).toEqual({ amAvgKg: 70.5, pmAvgKg: 72.5 });
  });
});
