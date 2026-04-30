import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isAdminEmail } from '@/lib/admin';
import { Scale, ChartLine, Target } from 'lucide-react';

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect(isAdminEmail(session.user.email) ? '/admin' : '/dashboard');
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-xl text-center">
        <div className="w-12 h-1 bg-emerald-600 rounded-full mx-auto mb-6" />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">Cutting</h1>
        <p className="mt-4 text-lg text-neutral-600">
          Track weight, body fat, muscle, and water through your cut. Twice a day.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            Sign up
          </Link>
        </div>
        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-neutral-600">
          <li className="flex items-center justify-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            Twice-daily weigh-ins
          </li>
          <li className="flex items-center justify-center gap-2">
            <ChartLine className="w-4 h-4 text-emerald-600" />
            Trends &amp; charts
          </li>
          <li className="flex items-center justify-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Progress to target
          </li>
        </ul>
      </div>
    </main>
  );
}
