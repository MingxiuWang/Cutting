import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold">Cutting</h1>
        <p className="text-neutral-600">Track weight, body fat, muscle, and water through your cut. Twice a day.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="bg-black text-white rounded px-4 py-2">Log in</Link>
          <Link href="/signup" className="border rounded px-4 py-2">Sign up</Link>
        </div>
      </div>
    </main>
  );
}
