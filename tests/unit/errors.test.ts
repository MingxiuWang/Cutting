import { describe, it, expect } from 'vitest';
import { runAction, ActionError } from '@/lib/errors';

describe('runAction', () => {
  it('returns ok=true with data when the body resolves', async () => {
    const result = await runAction(async () => 42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it('maps ActionError to ok=false with code and message', async () => {
    const result = await runAction(async () => {
      throw new ActionError('UNAUTHORIZED', 'no session');
    });
    expect(result).toEqual({ ok: false, error: 'UNAUTHORIZED', message: 'no session' });
  });

  it('maps Prisma P2002 with target containing measuredDay to DUPLICATE_PERIOD_TODAY', async () => {
    const err = Object.assign(new Error('Unique constraint'), {
      code: 'P2002',
      meta: { target: ['userId', 'measuredDay', 'period'] },
    });
    const result = await runAction(async () => { throw err; });
    expect(result).toEqual({ ok: false, error: 'DUPLICATE_PERIOD_TODAY' });
  });

  it('maps Prisma P2002 with active-cut index to ACTIVE_CUT_EXISTS', async () => {
    const err = Object.assign(new Error('Unique constraint'), {
      code: 'P2002',
      meta: { target: 'Cut_active_unique' },
    });
    const result = await runAction(async () => { throw err; });
    expect(result).toEqual({ ok: false, error: 'ACTIVE_CUT_EXISTS' });
  });

  it('maps unknown errors to INTERNAL', async () => {
    const result = await runAction(async () => { throw new Error('boom'); });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INTERNAL');
  });
});
