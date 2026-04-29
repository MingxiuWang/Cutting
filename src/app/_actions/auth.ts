'use server';

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { runAction, ActionError } from '@/lib/errors';
import { signupSchema, changeEmailSchema, changePasswordSchema } from '@/lib/validation/auth';

async function requireUserIdInAuthFile(): Promise<string> {
  // Inlined to avoid importing from @/lib/auth (which would pull next-auth)
  // Lazy-load it so vitest test imports of this module don't trigger next-auth.
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
  return session.user.id;
}

export async function signup(input: { email: string; password: string }) {
  return runAction(async () => {
    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'Invalid input',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const { email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new ActionError('VALIDATION_FAILED', 'Email already registered', {
        email: ['Email already registered'],
      });
    }

    const user = await db.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 12) },
    });
    return { userId: user.id };
  });
}

export async function changeEmail(input: { email: string }) {
  return runAction(async () => {
    const userId = await requireUserIdInAuthFile();
    const parsed = changeEmailSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid email');
    const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (exists && exists.id !== userId) throw new ActionError('VALIDATION_FAILED', 'Email already in use');
    await db.user.update({ where: { id: userId }, data: { email: parsed.data.email } });
    return { ok: true as const };
  });
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  return runAction(async () => {
    const userId = await requireUserIdInAuthFile();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid password');
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      throw new ActionError('VALIDATION_FAILED', 'Current password is wrong');
    }
    await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
    return { ok: true as const };
  });
}
