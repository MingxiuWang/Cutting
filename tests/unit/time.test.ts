import { describe, it, expect } from 'vitest';
import { deriveMeasuredDay, isWithinEditWindow } from '@/lib/time';

describe('deriveMeasuredDay', () => {
  it('returns same day for UTC noon, offset 0', () => {
    const date = new Date('2026-04-28T12:00:00Z');
    expect(deriveMeasuredDay(date, 0)).toBe('2026-04-28');
  });

  it('rolls back when local offset places it on the previous day', () => {
    const date = new Date('2026-04-28T02:00:00Z');
    expect(deriveMeasuredDay(date, -300)).toBe('2026-04-27');
  });

  it('rolls forward when local offset places it on the next day', () => {
    const date = new Date('2026-04-28T23:00:00Z');
    expect(deriveMeasuredDay(date, 480)).toBe('2026-04-29');
  });

  it('handles month boundary', () => {
    const date = new Date('2026-05-01T03:00:00Z');
    expect(deriveMeasuredDay(date, -300)).toBe('2026-04-30');
  });
});

describe('isWithinEditWindow', () => {
  const now = new Date('2026-04-28T12:00:00Z');

  it('returns true at 0h', () => {
    expect(isWithinEditWindow(now, now)).toBe(true);
  });

  it('returns true at 23h59m', () => {
    const created = new Date(now.getTime() - (24 * 60 - 1) * 60 * 1000);
    expect(isWithinEditWindow(created, now)).toBe(true);
  });

  it('returns false at exactly 24h', () => {
    const created = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(isWithinEditWindow(created, now)).toBe(false);
  });

  it('returns false at 24h01m', () => {
    const created = new Date(now.getTime() - (24 * 60 + 1) * 60 * 1000);
    expect(isWithinEditWindow(created, now)).toBe(false);
  });
});
