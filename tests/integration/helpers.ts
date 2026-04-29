import { afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

afterEach(async () => {
  await db.entry.deleteMany();
  await db.cut.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();
});

export async function makeUser(overrides: { email?: string; password?: string } = {}) {
  const email = overrides.email ?? `test-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = overrides.password ?? 'abcd1234';
  return db.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 4) },
  });
}

export function tomorrow(date = new Date()): Date {
  return new Date(date.getTime() + 86400000);
}
