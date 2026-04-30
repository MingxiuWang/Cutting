import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MapPin className="w-6 h-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Not found</h1>
        <p className="mt-2 text-neutral-600">The page you’re looking for doesn’t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
