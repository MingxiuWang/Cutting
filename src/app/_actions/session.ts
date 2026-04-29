'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { signIn, signOut, auth } from '@/lib/auth';
import { runAction, ActionError } from '@/lib/errors';
import { db } from '@/lib/db';
import { deleteAccountSchema } from '@/lib/validation/auth';

export async function loginAction(formData: FormData) {
  return runAction(async () => {
    try {
      await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirect: false,
      });
      return { ok: true as const };
    } catch {
      throw new ActionError('VALIDATION_FAILED', 'Invalid email or password');
    }
  });
}

export async function logout() {
  await signOut({ redirect: false });
  redirect('/');
}

export async function deleteAccount(input: { password: string }) {
  return runAction(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
    const userId = session.user.id;
    const parsed = deleteAccountSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED');
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      throw new ActionError('VALIDATION_FAILED', 'Wrong password');
    }
    await db.user.delete({ where: { id: userId } });
    await signOut({ redirect: false });
    return { ok: true as const };
  });
}
