'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ActionError, runAction } from '@/lib/errors';
import { requireAdmin } from '@/lib/admin';
import { updateCutSchema } from '@/lib/validation/cuts';
import { updateEntrySchema } from '@/lib/validation/entries';
import { adminResetPasswordSchema } from '@/lib/validation/auth';
import { deriveMeasuredDay } from '@/lib/time';

export async function adminResetPassword(userId: string, input: { newPassword: string }) {
  return runAction(async () => {
    await requireAdmin();
    const parsed = adminResetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid password',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.user.update({ where: { id: userId }, data: { passwordHash } });
    revalidatePath('/admin');
    return { id: userId };
  });
}

export async function adminDeleteUser(userId: string) {
  return runAction(async () => {
    const me = await requireAdmin();
    if (userId === me.id) {
      throw new ActionError('VALIDATION_FAILED', 'You cannot delete your own admin account from here.');
    }
    await db.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
    return { id: userId };
  });
}

export async function adminDeleteCut(cutId: string) {
  return runAction(async () => {
    await requireAdmin();
    await db.cut.delete({ where: { id: cutId } });
    revalidatePath('/admin');
    return { id: cutId };
  });
}

export async function adminUpdateCut(
  cutId: string,
  input: { name?: string; startDate?: Date; targetWeightKg?: number; expectedEndDate?: Date | null; endDate?: Date | null },
) {
  return runAction(async () => {
    await requireAdmin();
    const parsed = updateCutSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid input',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const data: { name?: string; startDate?: Date; targetWeightKg?: number; expectedEndDate?: Date | null; endDate?: Date | null } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate;
    if (parsed.data.targetWeightKg !== undefined) data.targetWeightKg = parsed.data.targetWeightKg;
    if (parsed.data.expectedEndDate !== undefined) data.expectedEndDate = parsed.data.expectedEndDate;
    if (input.endDate !== undefined) data.endDate = input.endDate;
    const cut = await db.cut.update({ where: { id: cutId }, data });
    revalidatePath('/admin');
    return { id: cut.id };
  });
}

export async function adminDeleteEntry(entryId: string) {
  return runAction(async () => {
    await requireAdmin();
    await db.entry.delete({ where: { id: entryId } });
    revalidatePath('/admin');
    return { id: entryId };
  });
}

export async function adminUpdateEntry(
  entryId: string,
  input: Partial<{
    measuredAt: Date;
    period: 'AM' | 'PM';
    weightKg: number;
    bodyFatPct: number | null;
    musclePct: number | null;
    waterPct: number | null;
    note?: string;
  }> & { tzOffsetMinutes: number },
) {
  return runAction(async () => {
    await requireAdmin();
    const parsed = updateEntrySchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid input',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const data: Record<string, unknown> = {};
    for (const k of ['period', 'weightKg', 'bodyFatPct', 'musclePct', 'waterPct', 'note'] as const) {
      const v = (parsed.data as Record<string, unknown>)[k];
      if (v !== undefined) data[k] = v;
    }
    if (parsed.data.measuredAt !== undefined) {
      data.measuredAt = parsed.data.measuredAt;
      data.measuredDay = new Date(deriveMeasuredDay(parsed.data.measuredAt, parsed.data.tzOffsetMinutes));
    }
    const updated = await db.entry.update({ where: { id: entryId }, data });
    revalidatePath('/admin');
    return { id: updated.id };
  });
}
