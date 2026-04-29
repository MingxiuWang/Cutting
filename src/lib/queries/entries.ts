import { db } from '@/lib/db';

export type EntryFilter = {
  period?: 'AM' | 'PM';
  from?: Date;
  to?: Date;
  cutId?: string | null;
  take?: number;
  skip?: number;
};

export async function getEntries(userId: string, filter: EntryFilter = {}) {
  const where: Record<string, unknown> = { userId };
  if (filter.period) where.period = filter.period;
  if (filter.cutId !== undefined) where.cutId = filter.cutId;
  if (filter.from || filter.to) {
    const measuredAt: Record<string, Date> = {};
    if (filter.from) measuredAt.gte = filter.from;
    if (filter.to) measuredAt.lte = filter.to;
    where.measuredAt = measuredAt;
  }
  return db.entry.findMany({
    where,
    orderBy: { measuredAt: 'desc' },
    ...(filter.take !== undefined ? { take: filter.take } : {}),
    ...(filter.skip !== undefined ? { skip: filter.skip } : {}),
  });
}
