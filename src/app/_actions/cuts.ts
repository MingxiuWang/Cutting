'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ActionError, runAction } from '@/lib/errors';
import { createCutSchema, updateCutSchema, endCutSchema } from '@/lib/validation/cuts';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
  return session.user.id;
}

export async function createCut(input: {
  name: string;
  startDate: Date;
  targetWeightKg: number;
}) {
  return runAction(async () => {
    const userId = await requireUser();
    const parsed = createCutSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid input',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const existingActive = await db.cut.findFirst({
      where: { userId, endDate: null },
      select: { id: true },
    });
    if (existingActive) throw new ActionError('ACTIVE_CUT_EXISTS');
    const cut = await db.cut.create({
      data: {
        userId,
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        targetWeightKg: parsed.data.targetWeightKg,
      },
    });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return cut;
  });
}

async function loadOwnedCut(cutId: string, userId: string) {
  const cut = await db.cut.findUnique({ where: { id: cutId } });
  if (!cut) throw new ActionError('FORBIDDEN');
  if (cut.userId !== userId) throw new ActionError('FORBIDDEN');
  return cut;
}

export async function updateCut(
  cutId: string,
  input: { name?: string; startDate?: Date; targetWeightKg?: number },
) {
  return runAction(async () => {
    const userId = await requireUser();
    await loadOwnedCut(cutId, userId);
    const parsed = updateCutSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid input',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const data: { name?: string; startDate?: Date; targetWeightKg?: number } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate;
    if (parsed.data.targetWeightKg !== undefined) data.targetWeightKg = parsed.data.targetWeightKg;
    const cut = await db.cut.update({
      where: { id: cutId },
      data,
    });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return cut;
  });
}

export async function endCut(cutId: string, input: { endDate: Date }) {
  return runAction(async () => {
    const userId = await requireUser();
    const existing = await loadOwnedCut(cutId, userId);
    const parsed = endCutSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid input');
    if (parsed.data.endDate < existing.startDate) {
      throw new ActionError('VALIDATION_FAILED', 'endDate must be on or after startDate');
    }
    const cut = await db.cut.update({
      where: { id: cutId },
      data: { endDate: parsed.data.endDate },
    });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return cut;
  });
}

export async function deleteCut(cutId: string) {
  return runAction(async () => {
    const userId = await requireUser();
    await loadOwnedCut(cutId, userId);
    const entryCount = await db.entry.count({ where: { cutId } });
    if (entryCount > 0) {
      throw new ActionError('CUT_HAS_ENTRIES', 'End the cut instead of deleting it.');
    }
    await db.cut.delete({ where: { id: cutId } });
    revalidatePath('/cuts');
    return { id: cutId };
  });
}
