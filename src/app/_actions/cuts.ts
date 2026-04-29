'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ActionError, runAction } from '@/lib/errors';
import { createCutSchema } from '@/lib/validation/cuts';

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
