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
    return entry;
  });
}
