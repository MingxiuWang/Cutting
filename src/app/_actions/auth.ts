'use server';

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { runAction, ActionError } from '@/lib/errors';
import { signupSchema } from '@/lib/validation/auth';

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
