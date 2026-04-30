import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCuts } from '@/lib/queries/cuts';
import CutForm from '@/app/_components/cut-form';
import CutList from '@/app/_components/cut-list';
import { Target } from 'lucide-react';

export default async function CutsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const cuts = await getCuts(userId);
  const latestEntry = await db.entry.findFirst({
    where: { userId },
    orderBy: { measuredAt: 'desc' },
    select: { weightKg: true },
  });
  const recent = latestEntry ? Number(latestEntry.weightKg) : null;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Cuts</h1>
        <p className="text-neutral-500 text-sm mt-1">A cut tracks your progress from start weight to target.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Start a new cut</h2>
        <CutForm mostRecentWeightKg={recent} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">All cuts</h2>
        {cuts.length === 0 ? (
          <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <p className="mt-4 text-base font-medium text-neutral-900">No cuts yet</p>
            <p className="mt-1 text-sm text-neutral-500">Create your first cut above to start tracking progress.</p>
          </div>
        ) : (
          <CutList
            cuts={cuts.map((c) => ({
              id: c.id,
              name: c.name,
              startDate: c.startDate,
              expectedEndDate: c.expectedEndDate,
              endDate: c.endDate,
              targetWeightKg: Number(c.targetWeightKg),
            }))}
          />
        )}
      </section>
    </div>
  );
}
