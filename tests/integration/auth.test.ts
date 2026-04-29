// @vitest-environment node
import { describe, it, expect } from 'vitest';
import './helpers';
import { db } from '@/lib/db';
import { signup } from '@/app/_actions/auth';
import bcrypt from 'bcryptjs';

describe('signup', () => {
  it('creates a user with hashed password and returns ok', async () => {
    const result = await signup({ email: 'new@example.com', password: 'abcd1234' });
    expect(result).toEqual({ ok: true, data: { userId: expect.any(String) } });
    const user = await db.user.findUnique({ where: { email: 'new@example.com' } });
    expect(user).not.toBeNull();
    expect(await bcrypt.compare('abcd1234', user!.passwordHash)).toBe(true);
  });

  it('rejects duplicate email case-insensitively', async () => {
    await signup({ email: 'dup@example.com', password: 'abcd1234' });
    const second = await signup({ email: 'DUP@example.com', password: 'abcd1234' });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('VALIDATION_FAILED');
  });

  it('returns VALIDATION_FAILED on weak password', async () => {
    const result = await signup({ email: 'weak@example.com', password: 'short' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('VALIDATION_FAILED');
  });
});
