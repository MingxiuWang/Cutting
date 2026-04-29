export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_PERIOD_TODAY'
  | 'EDIT_WINDOW_CLOSED'
  | 'ACTIVE_CUT_EXISTS'
  | 'CUT_HAS_ENTRIES'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class ActionError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message ?? code);
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; message?: string; fieldErrors?: Record<string, string[]> };

function isPrismaError(err: unknown): err is { code: string; meta?: { target?: string | string[] } } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function mapPrismaError(err: { code: string; meta?: { target?: string | string[] } }): ErrorCode | null {
  if (err.code !== 'P2002') return null;
  const target = err.meta?.target;
  if (Array.isArray(target) && target.includes('measuredDay')) return 'DUPLICATE_PERIOD_TODAY';
  if (target === 'Cut_active_unique') return 'ACTIVE_CUT_EXISTS';
  return null;
}

export async function runAction<T>(body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await body();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ActionError) {
      const result: ActionResult<T> = { ok: false, error: err.code, message: err.message };
      if (err.fieldErrors) result.fieldErrors = err.fieldErrors;
      return result;
    }
    if (isPrismaError(err)) {
      const code = mapPrismaError(err);
      if (code) return { ok: false, error: code };
    }
    console.error(
      JSON.stringify({
        level: 'error',
        errorCode: 'INTERNAL',
        message: (err as Error).message,
        stack: (err as Error).stack,
      }),
    );
    return { ok: false, error: 'INTERNAL' };
  }
}
