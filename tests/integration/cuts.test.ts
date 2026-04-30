// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './helpers';
import { makeUser } from './helpers';
import { db } from '@/lib/db';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { createCut, updateCut, endCut, deleteCut } from '@/app/_actions/cuts';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, email: 'x@y.z' },
    expires: '2099-01-01',
  });
}

beforeEach(() => {
  mockAuth.mockReset();
});

describe('createCut', () => {
  it('returns UNAUTHORIZED with no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createCut({
      name: 'Spring',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('UNAUTHORIZED');
  });

  it('creates a cut for the current user', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const result = await createCut({
      name: 'Spring',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    expect(result.ok).toBe(true);
    const cuts = await db.cut.findMany({ where: { userId: user.id } });
    expect(cuts).toHaveLength(1);
    expect(cuts[0]!.name).toBe('Spring');
  });

  it('returns ACTIVE_CUT_EXISTS if user already has an active cut', async () => {
    const user = await makeUser();
    mockSession(user.id);
    await createCut({
      name: 'A',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    const result = await createCut({
      name: 'B',
      startDate: new Date('2026-02-01'),
      targetWeightKg: 65,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ACTIVE_CUT_EXISTS');
  });

  it('returns VALIDATION_FAILED with bad input', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const result = await createCut({
      name: '',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('VALIDATION_FAILED');
  });
});

describe('updateCut', () => {
  it('updates the cut for the owning user', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({
      name: 'Old',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    if (!created.ok) throw new Error('precondition');
    const result = await updateCut(created.data.id, { name: 'New' });
    expect(result.ok).toBe(true);
    const fresh = await db.cut.findUnique({ where: { id: created.data.id } });
    expect(fresh?.name).toBe('New');
  });

  it('returns FORBIDDEN when cut belongs to another user', async () => {
    const owner = await makeUser({ email: 'a@a.aa' });
    const intruder = await makeUser({ email: 'b@b.bb' });
    mockSession(owner.id);
    const created = await createCut({
      name: 'A',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    if (!created.ok) throw new Error('precondition');
    mockSession(intruder.id);
    const result = await updateCut(created.data.id, { name: 'Hacked' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });
});

describe('endCut', () => {
  it('sets endDate', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({
      name: 'A',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    if (!created.ok) throw new Error('precondition');
    const result = await endCut(created.data.id, { endDate: new Date('2026-04-01') });
    expect(result.ok).toBe(true);
    const fresh = await db.cut.findUnique({ where: { id: created.data.id } });
    expect(fresh?.endDate).not.toBeNull();
  });

  it('allows starting a new cut once the previous one is ended', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const a = await createCut({
      name: 'A',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    if (!a.ok) throw new Error('precondition');
    await endCut(a.data.id, { endDate: new Date('2026-02-01') });
    const b = await createCut({
      name: 'B',
      startDate: new Date('2026-03-01'),
      targetWeightKg: 65,
    });
    expect(b.ok).toBe(true);
  });
});

describe('deleteCut', () => {
  it('deletes a cut with no entries', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({
      name: 'A',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    if (!created.ok) throw new Error('precondition');
    const result = await deleteCut(created.data.id);
    expect(result.ok).toBe(true);
    expect(await db.cut.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it('deletes a cut with entries and detaches them (cutId set to null)', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({
      name: 'A',
      startDate: new Date('2026-01-01'),
      targetWeightKg: 70,
    });
    if (!created.ok) throw new Error('precondition');
    const entry = await db.entry.create({
      data: {
        userId: user.id,
        cutId: created.data.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
        bodyFatPct: 18,
        musclePct: 42,
        waterPct: 55,
      },
    });
    const result = await deleteCut(created.data.id);
    expect(result.ok).toBe(true);
    expect(await db.cut.findUnique({ where: { id: created.data.id } })).toBeNull();
    const orphan = await db.entry.findUnique({ where: { id: entry.id } });
    expect(orphan).not.toBeNull();
    expect(orphan!.cutId).toBeNull();
  });
});
