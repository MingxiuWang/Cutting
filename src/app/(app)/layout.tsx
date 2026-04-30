import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Nav from '@/app/_components/nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen bg-neutral-50 md:pl-56 pb-20 md:pb-0">
      <Nav />
      <main className="p-6 sm:p-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
