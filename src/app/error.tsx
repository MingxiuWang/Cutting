'use client';

import { TriangleAlert } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <TriangleAlert className="w-6 h-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Something went wrong</h1>
        <p className="mt-2 text-neutral-600">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
