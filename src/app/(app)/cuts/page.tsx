import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCuts } from '@/lib/queries/cuts';
import CutForm from '@/app/_components/cut-form';
import CutList from '@/app/_components/cut-list';

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
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Start a cut</h1>
        <CutForm mostRecentWeightKg={recent} />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">All cuts</h2>
        {cuts.length === 0 ? (
          <p className="text-neutral-600">No cuts yet.</p>
        ) : (
          <CutList cuts={cuts.map((c) => ({
            id: c.id,
            name: c.name,
            startDate: c.startDate,
            endDate: c.endDate,
            targetWeightKg: Number(c.targetWeightKg),
          }))} />
        )}
      </section>
    </div>
  );
}
