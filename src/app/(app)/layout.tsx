import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AppShell from '@/app/_components/app-shell';
import { isAdminEmail } from '@/lib/admin';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const admin = isAdminEmail(session.user.email);
  return <AppShell isAdmin={admin}>{children}</AppShell>;
}
