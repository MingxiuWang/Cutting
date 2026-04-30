import { auth } from '@/lib/auth';
import { ActionError } from '@/lib/errors';

export const ADMIN_EMAIL = 'mingxiuwang0530@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    throw new ActionError('FORBIDDEN');
  }
  return { id: session.user.id, email: session.user.email! };
}
