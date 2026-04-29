'use server';

import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/lib/auth';
import { runAction, ActionError } from '@/lib/errors';

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
