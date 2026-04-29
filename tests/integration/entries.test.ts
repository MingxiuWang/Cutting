// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './helpers';
import { makeUser } from './helpers';
import { db } from '@/lib/db';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/lib/auth';
import { createEntry, updateEntry, deleteEntry } from '@/app/_actions/entries';
import { createCut } from '@/app/_actions/cuts';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, email: 'x@y.z' }, expires: '2099-01-01' });
}

beforeEach(() => {
  mockAuth.mockReset();
});

const valid = () => ({
  measuredAt: new Date(),
  period: 'AM' as const,
  weightKg: 75.4,
  bodyFatPct: 18.5,
  musclePct: 42.0,
  waterPct: 55.5,
  tzOffsetMinutes: 0,
});

describe('createEntry', () => {
  it('returns UNAUTHORIZED with no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createEntry(valid());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('UNAUTHORIZED');
  });

  it('creates entry and auto-attaches to active cut', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const cut = await createCut({ name: 'Spring', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!cut.ok) throw new Error('precondition');
    const result = await createEntry(valid());
    expect(result.ok).toBe(true);
    const entries = await db.entry.findMany({ where: { userId: user.id } });
    expect(entries).toHaveLength(1);
    expect(entries[0]!.cutId).toBe(cut.data.id);
  });

  it('rejects duplicate AM same day with DUPLICATE_PERIOD_TODAY', async () => {
    const user = await makeUser();
    mockSession(user.id);
    await createEntry(valid());
    const second = await createEntry(valid());
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('DUPLICATE_PERIOD_TODAY');
  });

  it('allows AM and PM same day', async () => {
    const user = await makeUser();
    mockSession(user.id);
    await createEntry(valid());
    const pm = await createEntry({ ...valid(), period: 'PM' });
    expect(pm.ok).toBe(true);
  });

  it('returns VALIDATION_FAILED on out-of-range weight', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const result = await createEntry({ ...valid(), weightKg: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('VALIDATION_FAILED');
  });
});

describe('updateEntry', () => {
  it('updates an entry within the 24h window', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createEntry(valid());
    if (!created.ok) throw new Error('precondition');
    const result = await updateEntry(created.data.id, { weightKg: 76.0, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(true);
    const fresh = await db.entry.findUnique({ where: { id: created.data.id } });
    expect(Number(fresh!.weightKg)).toBe(76);
  });

  it('returns EDIT_WINDOW_CLOSED past 24h', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const old = await db.entry.create({
      data: {
        userId: user.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
        bodyFatPct: 18,
        musclePct: 42,
        waterPct: 55,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });
    const result = await updateEntry(old.id, { weightKg: 80, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EDIT_WINDOW_CLOSED');
  });

  it('returns FORBIDDEN for another user’s entry', async () => {
    const owner = await makeUser({ email: 'o@o.oo' });
    const intruder = await makeUser({ email: 'i@i.ii' });
    mockSession(owner.id);
    const created = await createEntry(valid());
    if (!created.ok) throw new Error('precondition');
    mockSession(intruder.id);
    const result = await updateEntry(created.data.id, { weightKg: 99, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });
});

describe('deleteEntry', () => {
  it('deletes within window', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createEntry(valid());
    if (!created.ok) throw new Error('precondition');
    const result = await deleteEntry(created.data.id);
    expect(result.ok).toBe(true);
    expect(await db.entry.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it('returns EDIT_WINDOW_CLOSED past 24h', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const old = await db.entry.create({
      data: {
        userId: user.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
        bodyFatPct: 18,
        musclePct: 42,
        waterPct: 55,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });
    const result = await deleteEntry(old.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EDIT_WINDOW_CLOSED');
  });
});
