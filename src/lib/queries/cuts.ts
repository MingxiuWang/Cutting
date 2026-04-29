import { db } from '@/lib/db';

export async function getActiveCut(userId: string) {
  return db.cut.findFirst({
    where: { userId, endDate: null },
    orderBy: { startDate: 'desc' },
  });
}

export async function getCuts(userId: string) {
  return db.cut.findMany({
    where: { userId },
    orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }],
  });
}
