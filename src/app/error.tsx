'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-neutral-600">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="bg-black text-white rounded px-4 py-2">Try again</button>
      </div>
    </main>
  );
}
