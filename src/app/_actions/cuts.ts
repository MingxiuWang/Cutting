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

function serializeCut(c: {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  expectedEndDate: Date | null;
  endDate: Date | null;
  targetWeightKg: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    startDate: c.startDate,
    expectedEndDate: c.expectedEndDate,
    endDate: c.endDate,
    targetWeightKg: Number(c.targetWeightKg),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export async function createCut(input: {
  name: string;
  startDate: Date;
  targetWeightKg: number;
  expectedEndDate?: Date;
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
        expectedEndDate: parsed.data.expectedEndDate ?? null,
      },
    });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return serializeCut(cut);
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
  input: { name?: string; startDate?: Date; targetWeightKg?: number; expectedEndDate?: Date | null },
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
    const data: { name?: string; startDate?: Date; targetWeightKg?: number; expectedEndDate?: Date | null } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate;
    if (parsed.data.targetWeightKg !== undefined) data.targetWeightKg = parsed.data.targetWeightKg;
    if (parsed.data.expectedEndDate !== undefined) data.expectedEndDate = parsed.data.expectedEndDate;
    const cut = await db.cut.update({
      where: { id: cutId },
      data,
    });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return serializeCut(cut);
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
    return serializeCut(cut);
  });
}

export async function deleteCut(cutId: string) {
  return runAction(async () => {
    const userId = await requireUser();
    await loadOwnedCut(cutId, userId);
    // Entries belonging to this cut have ON DELETE SET NULL — they stay in the
    // user's history with `cutId = null` so no logged data is lost.
    await db.cut.delete({ where: { id: cutId } });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return { id: cutId };
  });
}
