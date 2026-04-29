import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <Link href="/" className="text-blue-600 underline">Go home</Link>
      </div>
    </main>
  );
}
