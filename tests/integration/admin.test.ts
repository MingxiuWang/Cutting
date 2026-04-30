import { describe, it, expect, vi, beforeEach } from 'vitest';
import './helpers';
import { makeUser } from './helpers';
import { db } from '@/lib/db';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/lib/auth';
import {
  adminDeleteUser,
  adminDeleteEntry,
  adminUpdateEntry,
  adminResetPassword,
} from '@/app/_actions/admin';
import { ADMIN_EMAIL } from '@/lib/admin';
import bcrypt from 'bcryptjs';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

function mockSession(userId: string, email: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, email }, expires: '2099-01-01' });
}

beforeEach(() => {
  mockAuth.mockReset();
});

describe('admin actions — non-admin guard', () => {
  it('returns FORBIDDEN when caller is not the admin email', async () => {
    const intruder = await makeUser({ email: 'not-admin@example.com' });
    mockSession(intruder.id, intruder.email);
    const result = await adminDeleteUser('any-id');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });

  it('returns FORBIDDEN with no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await adminDeleteEntry('any-id');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });
});

describe('admin actions — happy path', () => {
  it('admin can update an entry past the 24h edit window', async () => {
    const admin = await makeUser({ email: ADMIN_EMAIL });
    const target = await makeUser({ email: 'target@example.com' });
    mockSession(admin.id, admin.email);

    const stale = await db.entry.create({
      data: {
        userId: target.id,
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

    const result = await adminUpdateEntry(stale.id, { weightKg: 80, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(true);
    const fresh = await db.entry.findUnique({ where: { id: stale.id } });
    expect(Number(fresh!.weightKg)).toBe(80);
  });

  it('adminResetPassword sets a new password without knowing the old one', async () => {
    const admin = await makeUser({ email: ADMIN_EMAIL });
    const target = await makeUser({ email: 'forgetful@example.com', password: 'oldpass1' });
    mockSession(admin.id, admin.email);

    const result = await adminResetPassword(target.id, { newPassword: 'newpass9' });
    expect(result.ok).toBe(true);

    const fresh = await db.user.findUnique({ where: { id: target.id } });
    expect(await bcrypt.compare('newpass9', fresh!.passwordHash)).toBe(true);
    expect(await bcrypt.compare('oldpass1', fresh!.passwordHash)).toBe(false);
  });

  it('adminResetPassword rejects weak passwords', async () => {
    const admin = await makeUser({ email: ADMIN_EMAIL });
    const target = await makeUser({ email: 'weak@example.com' });
    mockSession(admin.id, admin.email);

    const result = await adminResetPassword(target.id, { newPassword: 'short' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('VALIDATION_FAILED');
  });

  it('adminDeleteUser cascades to cuts and entries', async () => {
    const admin = await makeUser({ email: ADMIN_EMAIL });
    const target = await makeUser({ email: 'doomed@example.com' });
    mockSession(admin.id, admin.email);

    const cut = await db.cut.create({
      data: {
        userId: target.id,
        name: 'Doomed cut',
        startDate: new Date('2026-01-01'),
        targetWeightKg: 70,
      },
    });
    await db.entry.create({
      data: {
        userId: target.id,
        cutId: cut.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
      },
    });

    const result = await adminDeleteUser(target.id);
    expect(result.ok).toBe(true);
    expect(await db.user.findUnique({ where: { id: target.id } })).toBeNull();
    expect(await db.cut.findMany({ where: { userId: target.id } })).toHaveLength(0);
    expect(await db.entry.findMany({ where: { userId: target.id } })).toHaveLength(0);
  });
});
