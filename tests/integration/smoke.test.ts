// @vitest-environment node
import { describe, it, expect } from 'vitest';
import './helpers';
import { db } from '@/lib/db';
import { makeUser } from './helpers';

describe('smoke', () => {
  it('connects to the test database and round-trips a user', async () => {
    const u = await makeUser();
    const found = await db.user.findUnique({ where: { id: u.id } });
    expect(found?.email).toBe(u.email);
  });
});
