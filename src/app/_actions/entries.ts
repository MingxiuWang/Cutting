'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ActionError, runAction } from '@/lib/errors';
import { createEntrySchema, updateEntrySchema } from '@/lib/validation/entries';
import { deriveMeasuredDay, isWithinEditWindow } from '@/lib/time';
import { getActiveCut } from '@/lib/queries/cuts';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
  return session.user.id;
}

function serializeEntry(e: {
  id: string;
  userId: string;
  cutId: string | null;
  measuredAt: Date;
  measuredDay: Date;
  period: 'AM' | 'PM';
  weightKg: unknown;
  bodyFatPct: unknown;
  musclePct: unknown;
  waterPct: unknown;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: e.id,
    userId: e.userId,
    cutId: e.cutId,
    measuredAt: e.measuredAt,
    measuredDay: e.measuredDay,
    period: e.period,
    weightKg: Number(e.weightKg),
    bodyFatPct: Number(e.bodyFatPct),
    musclePct: Number(e.musclePct),
    waterPct: Number(e.waterPct),
    note: e.note,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export async function createEntry(input: {
  measuredAt: Date;
  period: 'AM' | 'PM';
  weightKg: number;
  bodyFatPct: number;
  musclePct: number;
  waterPct: number;
  note?: string;
  tzOffsetMinutes: number;
}) {
  return runAction(async () => {
    const userId = await requireUser();
    const parsed = createEntrySchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid input',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { measuredAt, period, weightKg, bodyFatPct, musclePct, waterPct, note, tzOffsetMinutes } =
      parsed.data;
    const measuredDay = new Date(deriveMeasuredDay(measuredAt, tzOffsetMinutes));
    const activeCut = await getActiveCut(userId);

    const existing = await db.entry.findFirst({
      where: { userId, measuredDay, period },
      select: { id: true },
    });
    if (existing) throw new ActionError('DUPLICATE_PERIOD_TODAY');

    const entry = await db.entry.create({
      data: {
        userId,
        cutId: activeCut?.id ?? null,
        measuredAt,
        measuredDay,
        period,
        weightKg,
        bodyFatPct,
        musclePct,
        waterPct,
        note: note ?? null,
      },
    });
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return serializeEntry(entry);
  });
}

async function loadOwnedEntry(entryId: string, userId: string) {
  const entry = await db.entry.findUnique({ where: { id: entryId } });
  if (!entry) throw new ActionError('FORBIDDEN');
  if (entry.userId !== userId) throw new ActionError('FORBIDDEN');
  return entry;
}

export async function updateEntry(
  entryId: string,
  input: Partial<{
    measuredAt: Date;
    period: 'AM' | 'PM';
    weightKg: number;
    bodyFatPct: number;
    musclePct: number;
    waterPct: number;
    note?: string;
  }> & { tzOffsetMinutes: number },
) {
  return runAction(async () => {
    const userId = await requireUser();
    const existing = await loadOwnedEntry(entryId, userId);
    if (!isWithinEditWindow(existing.createdAt)) throw new ActionError('EDIT_WINDOW_CLOSED');

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
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return serializeEntry(updated);
  });
}

export async function deleteEntry(entryId: string) {
  return runAction(async () => {
    const userId = await requireUser();
    const existing = await loadOwnedEntry(entryId, userId);
    if (!isWithinEditWindow(existing.createdAt)) throw new ActionError('EDIT_WINDOW_CLOSED');
    await db.entry.delete({ where: { id: entryId } });
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return { id: entryId };
  });
}
