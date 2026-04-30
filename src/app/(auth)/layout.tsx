export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center text-xl font-semibold mb-6 text-neutral-900">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-2 align-middle" />
          Cutting
        </div>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
