# Cutting Tracker — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a multi-user cutting tracker (auth, entry logging, cuts, dashboard, charts) deployed on Vercel + Neon Postgres.

**Architecture:** Single Next.js 15 App Router app. RSC reads + Server Actions for writes, NextAuth.js (Credentials) for auth, Prisma against Neon Postgres, Tailwind + shadcn/ui + Recharts on the frontend.

**Tech Stack:** Next.js 15, TypeScript (strict), Prisma, Postgres (Neon), NextAuth.js v5, Zod, bcrypt, Tailwind, shadcn/ui, Recharts, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-04-28-cutting-tracker-phase1-design.md`

---

## File Structure

This is what the repo looks like once Phase 1 is complete. Each task creates or modifies a focused subset.

```
Cutting/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── playwright.config.ts
├── vitest.config.ts
├── .env.example
├── .env.local                       # gitignored
├── .gitignore
├── prisma/
│   ├── schema.prisma                # User, Cut, Entry, NextAuth tables
│   └── migrations/                  # generated
├── src/
│   ├── app/
│   │   ├── layout.tsx               # root layout
│   │   ├── page.tsx                 # landing
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           # sidebar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── charts/page.tsx
│   │   │   ├── entries/page.tsx
│   │   │   ├── cuts/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── _actions/
│   │   │   ├── auth.ts              # signup, logout, change email/password, delete account
│   │   │   ├── cuts.ts              # createCut, updateCut, endCut, deleteCut
│   │   │   └── entries.ts           # createEntry, updateEntry, deleteEntry
│   │   ├── _components/
│   │   │   ├── nav.tsx              # sidebar + bottom nav
│   │   │   ├── entry-form.tsx
│   │   │   ├── entry-table.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── am-pm-card.tsx
│   │   │   ├── weight-chart.tsx
│   │   │   └── composition-chart.tsx
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── lib/
│   │   ├── auth.ts                  # NextAuth config + auth() helper
│   │   ├── db.ts                    # Prisma singleton
│   │   ├── errors.ts                # ErrorCode + runAction wrapper
│   │   ├── stats.ts                 # pure dashboard math
│   │   ├── time.ts                  # measuredDay derivation, edit-window check
│   │   ├── rate-limit.ts            # in-memory login limiter
│   │   ├── queries/
│   │   │   ├── cuts.ts              # getActiveCut, getCuts
│   │   │   ├── entries.ts           # getEntries
│   │   │   └── dashboard.ts         # getDashboardStats
│   │   └── validation/
│   │       ├── auth.ts              # signup, login, change-email, change-password schemas
│   │       ├── cuts.ts              # cut schemas
│   │       └── entries.ts           # entry schemas
│   └── components/ui/               # shadcn/ui generated components
├── tests/
│   ├── unit/
│   │   ├── stats.test.ts
│   │   ├── time.test.ts
│   │   └── validation.test.ts
│   ├── integration/
│   │   ├── helpers.ts               # test DB setup, user factories
│   │   ├── auth.test.ts
│   │   ├── cuts.test.ts
│   │   └── entries.test.ts
│   └── e2e/
│       ├── signup-and-log.spec.ts
│       ├── am-pm-duplicate.spec.ts
│       └── cut-and-dashboard.spec.ts
└── .github/workflows/ci.yml
```

---

## Task 1: Initialize Next.js project + base dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`
- Modify: existing `/Users/mingxiuwang/Cutting/` (currently empty apart from `docs/`)

- [ ] **Step 1: Bootstrap Next.js**

Run from `/Users/mingxiuwang/Cutting/`:
```bash
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack --use-pnpm
```

When prompted "would you like to customize the import alias?" accept default. Answer "no" to any optional prompts (Turbopack, etc.). The CLI may warn that the directory is non-empty (because of `docs/`); proceed.

- [ ] **Step 2: Verify it builds and runs**

```bash
pnpm dev
```

Expected: server starts on `http://localhost:3000` and shows the default Next.js page. Stop with Ctrl-C.

- [ ] **Step 3: Add base dependencies**

```bash
pnpm add @prisma/client @auth/prisma-adapter next-auth@beta bcrypt zod recharts
pnpm add -D prisma @types/bcrypt vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test tsx
```

- [ ] **Step 4: Update tsconfig.json for strict mode**

Open `tsconfig.json` and ensure these compiler options:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```
Keep other options the create-next-app defaults set up.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js app and install base deps"
```

---

## Task 2: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    poolOptions: { threads: { singleThread: true } },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 2: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json` `scripts`, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

```bash
pnpm test
```

Expected: "No test files found" — that is OK.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json
git commit -m "chore: configure vitest"
```

---

## Task 3: Configure Prisma + Neon connection

**Files:**
- Create: `prisma/schema.prisma`, `.env.example`, `.env.local`, `src/lib/db.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Initialise Prisma**

```bash
pnpm prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and `.env`.

- [ ] **Step 2: Provision a Neon project**

Manual step. In the Neon console, create a project named "cutting" with two branches: `main` and `dev`. Copy the connection string for `dev`.

- [ ] **Step 3: Set up env files**

Create `.env.example`:
```
DATABASE_URL="postgresql://user:pass@host/db"
AUTH_SECRET="generate-with-openssl-rand-hex-32"
AUTH_URL="http://localhost:3000"
```

Create `.env.local` (gitignored) with the actual Neon `dev` URL and a real `AUTH_SECRET`:
```bash
echo "AUTH_SECRET=\"$(openssl rand -hex 32)\"" >> .env.local
echo "AUTH_URL=\"http://localhost:3000\"" >> .env.local
echo "DATABASE_URL=\"<your-neon-dev-url>\"" >> .env.local
```

Confirm `.env.local` is in `.gitignore` (Next.js scaffold already adds it).

Delete the auto-created `.env` (it was Prisma's, replaced by `.env.local`).

- [ ] **Step 4: Create Prisma client singleton at `src/lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

- [ ] **Step 5: Verify Prisma can read env**

```bash
pnpm prisma validate
```

Expected: "The schema at prisma/schema.prisma is valid".

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma .env.example src/lib/db.ts .gitignore
git commit -m "chore: configure prisma + neon connection"
```

---

## Task 4: Define the Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma` contents**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [citext]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique @db.Citext
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  cuts     Cut[]
  entries  Entry[]
  accounts Account[]
  sessions Session[]
}

model Cut {
  id              String    @id @default(cuid())
  userId          String
  name            String
  startDate       DateTime  @db.Date
  targetWeightKg  Decimal   @db.Decimal(5, 1)
  endDate         DateTime? @db.Date
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries Entry[]

  @@index([userId, endDate])
}

enum Period {
  AM
  PM
}

model Entry {
  id           String   @id @default(cuid())
  userId       String
  cutId        String?
  measuredAt   DateTime
  measuredDay  DateTime @db.Date
  period       Period
  weightKg     Decimal  @db.Decimal(5, 1)
  bodyFatPct   Decimal  @db.Decimal(4, 1)
  musclePct    Decimal  @db.Decimal(4, 1)
  waterPct     Decimal  @db.Decimal(4, 1)
  note         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  cut  Cut? @relation(fields: [cutId], references: [id], onDelete: SetNull)

  @@unique([userId, measuredDay, period])
  @@index([userId, measuredAt(sort: Desc)])
  @@index([cutId])
}

// NextAuth tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **Step 2: Generate the initial migration**

```bash
pnpm prisma migrate dev --name init
```

Expected: creates `prisma/migrations/<timestamp>_init/migration.sql`, applies it to the Neon `dev` branch, and runs `prisma generate`.

- [ ] **Step 3: Add the partial unique index for active cut**

Prisma doesn't support partial indexes natively, so we add it as a raw migration:

```bash
pnpm prisma migrate dev --create-only --name active_cut_unique_index
```

This creates a new empty migration file. Open it (`prisma/migrations/<timestamp>_active_cut_unique_index/migration.sql`) and replace its contents with:

```sql
CREATE UNIQUE INDEX "Cut_active_unique"
  ON "Cut" ("userId")
  WHERE "endDate" IS NULL;
```

Apply it:
```bash
pnpm prisma migrate dev
```

Expected: "Applied migration `<timestamp>_active_cut_unique_index`".

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): initial schema for users, cuts, entries"
```

---

## Task 5: Error taxonomy and `runAction` wrapper

**Files:**
- Create: `src/lib/errors.ts`
- Test: `tests/unit/errors.test.ts`

- [ ] **Step 1: Write failing tests at `tests/unit/errors.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { runAction, ActionError, ErrorCode } from '@/lib/errors';

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
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/unit/errors.test.ts
```

Expected: FAIL — module `@/lib/errors` not found.

- [ ] **Step 3: Implement `src/lib/errors.ts`**

```ts
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
  constructor(public readonly code: ErrorCode, message?: string, public readonly fieldErrors?: Record<string, string[]>) {
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
      return { ok: false, error: err.code, message: err.message, fieldErrors: err.fieldErrors };
    }
    if (isPrismaError(err)) {
      const code = mapPrismaError(err);
      if (code) return { ok: false, error: code };
    }
    console.error(JSON.stringify({ level: 'error', errorCode: 'INTERNAL', message: (err as Error).message, stack: (err as Error).stack }));
    return { ok: false, error: 'INTERNAL' };
  }
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/unit/errors.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors.ts tests/unit/errors.test.ts
git commit -m "feat: error taxonomy and runAction wrapper"
```

---

## Task 6: Time helpers (`measuredDay` and edit-window)

**Files:**
- Create: `src/lib/time.ts`
- Test: `tests/unit/time.test.ts`

- [ ] **Step 1: Write failing tests at `tests/unit/time.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { deriveMeasuredDay, isWithinEditWindow } from '@/lib/time';

describe('deriveMeasuredDay', () => {
  it('returns same day for UTC noon, offset 0', () => {
    const date = new Date('2026-04-28T12:00:00Z');
    expect(deriveMeasuredDay(date, 0)).toBe('2026-04-28');
  });

  it('rolls back when local offset places it on the previous day', () => {
    // 02:00 UTC, local UTC-5 => 21:00 previous day
    const date = new Date('2026-04-28T02:00:00Z');
    expect(deriveMeasuredDay(date, -300)).toBe('2026-04-27');
  });

  it('rolls forward when local offset places it on the next day', () => {
    // 23:00 UTC, local UTC+8 => 07:00 next day
    const date = new Date('2026-04-28T23:00:00Z');
    expect(deriveMeasuredDay(date, 480)).toBe('2026-04-29');
  });

  it('handles month boundary', () => {
    const date = new Date('2026-05-01T03:00:00Z');
    expect(deriveMeasuredDay(date, -300)).toBe('2026-04-30');
  });
});

describe('isWithinEditWindow', () => {
  const now = new Date('2026-04-28T12:00:00Z');

  it('returns true at 0h', () => {
    expect(isWithinEditWindow(now, now)).toBe(true);
  });

  it('returns true at 23h59m', () => {
    const created = new Date(now.getTime() - (24 * 60 - 1) * 60 * 1000);
    expect(isWithinEditWindow(created, now)).toBe(true);
  });

  it('returns false at exactly 24h', () => {
    const created = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(isWithinEditWindow(created, now)).toBe(false);
  });

  it('returns false at 24h01m', () => {
    const created = new Date(now.getTime() - (24 * 60 + 1) * 60 * 1000);
    expect(isWithinEditWindow(created, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/unit/time.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/time.ts`**

```ts
export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function deriveMeasuredDay(measuredAt: Date, tzOffsetMinutes: number): string {
  const local = new Date(measuredAt.getTime() + tzOffsetMinutes * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWithinEditWindow(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < EDIT_WINDOW_MS;
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/unit/time.test.ts
```

Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/time.ts tests/unit/time.test.ts
git commit -m "feat: time helpers (measuredDay, edit window)"
```

---

## Task 7: Validation schemas

**Files:**
- Create: `src/lib/validation/auth.ts`, `src/lib/validation/cuts.ts`, `src/lib/validation/entries.ts`
- Test: `tests/unit/validation.test.ts`

- [ ] **Step 1: Write failing tests at `tests/unit/validation.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { signupSchema, changePasswordSchema } from '@/lib/validation/auth';
import { createCutSchema } from '@/lib/validation/cuts';
import { createEntrySchema } from '@/lib/validation/entries';

describe('signupSchema', () => {
  it('accepts a valid email + password', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'abcd1234' }).success).toBe(true);
  });

  it('rejects too-short password', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'abc1' }).success).toBe(false);
  });

  it('rejects password without a digit', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'abcdefgh' }).success).toBe(false);
  });

  it('rejects password without a letter', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: '12345678' }).success).toBe(false);
  });

  it('rejects malformed email', () => {
    expect(signupSchema.safeParse({ email: 'not-an-email', password: 'abcd1234' }).success).toBe(false);
  });

  it('rejects email > 254 chars', () => {
    const long = 'a'.repeat(250) + '@b.co';
    expect(signupSchema.safeParse({ email: long, password: 'abcd1234' }).success).toBe(false);
  });
});

describe('createCutSchema', () => {
  const baseDate = new Date('2026-01-01');
  it('accepts a valid cut', () => {
    expect(createCutSchema.safeParse({ name: 'Spring', startDate: baseDate, targetWeightKg: 70 }).success).toBe(true);
  });

  it('rejects future startDate', () => {
    const future = new Date(Date.now() + 86400000 * 2);
    expect(createCutSchema.safeParse({ name: 'Future', startDate: future, targetWeightKg: 70 }).success).toBe(false);
  });

  it('rejects target out of range', () => {
    expect(createCutSchema.safeParse({ name: 'X', startDate: baseDate, targetWeightKg: 10 }).success).toBe(false);
    expect(createCutSchema.safeParse({ name: 'X', startDate: baseDate, targetWeightKg: 500 }).success).toBe(false);
  });
});

describe('createEntrySchema', () => {
  const valid = {
    measuredAt: new Date(),
    period: 'AM' as const,
    weightKg: 75.4,
    bodyFatPct: 18.5,
    musclePct: 42.0,
    waterPct: 55.5,
    tzOffsetMinutes: 0,
  };

  it('accepts a valid entry', () => {
    expect(createEntrySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects weight out of range', () => {
    expect(createEntrySchema.safeParse({ ...valid, weightKg: 10 }).success).toBe(false);
    expect(createEntrySchema.safeParse({ ...valid, weightKg: 500 }).success).toBe(false);
  });

  it('rejects bodyFatPct out of range', () => {
    expect(createEntrySchema.safeParse({ ...valid, bodyFatPct: 0 }).success).toBe(false);
    expect(createEntrySchema.safeParse({ ...valid, bodyFatPct: 80 }).success).toBe(false);
  });

  it('rejects future measuredAt', () => {
    const future = new Date(Date.now() + 60_000);
    expect(createEntrySchema.safeParse({ ...valid, measuredAt: future }).success).toBe(false);
  });

  it('rejects measuredAt > 1 year ago', () => {
    const old = new Date(Date.now() - 400 * 86400000);
    expect(createEntrySchema.safeParse({ ...valid, measuredAt: old }).success).toBe(false);
  });

  it('rejects note > 500 chars', () => {
    expect(createEntrySchema.safeParse({ ...valid, note: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('requires current and new password and applies same complexity', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'abcd1234', newPassword: 'wxyz5678' }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: 'abcd1234', newPassword: 'short' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/unit/validation.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create `src/lib/validation/auth.ts`**

```ts
import { z } from 'zod';

const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'Max 72 characters')
  .refine((s) => /[A-Za-z]/.test(s), 'Must contain a letter')
  .refine((s) => /\d/.test(s), 'Must contain a digit');

const email = z.string().email('Invalid email').max(254, 'Email too long').transform((s) => s.toLowerCase());

export const signupSchema = z.object({ email, password });
export const loginSchema = z.object({ email, password: z.string().min(1) });
export const changeEmailSchema = z.object({ email });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
export const deleteAccountSchema = z.object({ password: z.string().min(1) });

export type SignupInput = z.infer<typeof signupSchema>;
```

- [ ] **Step 4: Create `src/lib/validation/cuts.ts`**

```ts
import { z } from 'zod';

const targetWeightKg = z.number().min(20, 'Min 20 kg').max(400, 'Max 400 kg');

export const createCutSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 86400000, 'startDate cannot be in the future'),
  targetWeightKg,
});

export const updateCutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  targetWeightKg: targetWeightKg.optional(),
});

export const endCutSchema = z.object({
  endDate: z.coerce.date(),
});
```

- [ ] **Step 5: Create `src/lib/validation/entries.ts`**

```ts
import { z } from 'zod';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const createEntrySchema = z.object({
  measuredAt: z.coerce.date()
    .refine((d) => d.getTime() <= Date.now(), 'measuredAt cannot be in the future')
    .refine((d) => d.getTime() >= Date.now() - ONE_YEAR_MS, 'measuredAt cannot be more than 1 year in the past'),
  period: z.enum(['AM', 'PM']),
  weightKg: z.number().min(20).max(400),
  bodyFatPct: z.number().min(1).max(70),
  musclePct: z.number().min(10).max(80),
  waterPct: z.number().min(20).max(80),
  note: z.string().max(500).optional(),
  tzOffsetMinutes: z.number().int().min(-720).max(840),
});

export const updateEntrySchema = createEntrySchema.partial({
  measuredAt: true,
  period: true,
  weightKg: true,
  bodyFatPct: true,
  musclePct: true,
  waterPct: true,
  note: true,
});
```

Note: `updateEntrySchema.partial(...)` keeps `tzOffsetMinutes` required (it's needed if `measuredAt` changes and we recompute `measuredDay`).

- [ ] **Step 6: Run tests, expect pass**

```bash
pnpm test tests/unit/validation.test.ts
```

Expected: PASS — 17 tests.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validation tests/unit/validation.test.ts
git commit -m "feat: zod schemas for auth, cuts, entries"
```

---

## Task 8: Pure dashboard math (`computeStats`, AM/PM averages)

**Files:**
- Create: `src/lib/stats.ts`
- Test: `tests/unit/stats.test.ts`

- [ ] **Step 1: Write failing tests at `tests/unit/stats.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeStats, computeAmPmAverages, type EntryRow } from '@/lib/stats';

const makeEntry = (daysAgo: number, weightKg: number, period: 'AM' | 'PM' = 'AM'): EntryRow => ({
  measuredAt: new Date(Date.now() - daysAgo * 86400000),
  period,
  weightKg,
});

describe('computeStats', () => {
  it('returns null fields when there are no AM entries', () => {
    expect(computeStats([], { startDate: new Date(), targetWeightKg: 70 })).toEqual({
      startWeightKg: null,
      currentWeightKg: null,
      totalLostKg: null,
      weeklyRateKg: null,
      daysInCut: 0,
      progressPct: null,
    });
  });

  it('uses earliest AM entry for startWeight, latest for currentWeight', () => {
    const entries = [makeEntry(0, 75), makeEntry(7, 78), makeEntry(14, 80)];
    const result = computeStats(entries, { startDate: new Date(Date.now() - 14 * 86400000), targetWeightKg: 70 });
    expect(result.startWeightKg).toBe(80);
    expect(result.currentWeightKg).toBe(75);
    expect(result.totalLostKg).toBe(5);
  });

  it('computes weekly rate as (start - current) / weeks elapsed', () => {
    const entries = [makeEntry(0, 75), makeEntry(14, 80)]; // 5 kg over 14 days = 2.5/wk
    const result = computeStats(entries, { startDate: new Date(Date.now() - 14 * 86400000), targetWeightKg: 70 });
    expect(result.weeklyRateKg).toBeCloseTo(2.5, 1);
  });

  it('ignores PM entries', () => {
    const entries = [makeEntry(0, 70), makeEntry(0, 73, 'PM'), makeEntry(7, 75)];
    const result = computeStats(entries, { startDate: new Date(Date.now() - 7 * 86400000), targetWeightKg: 65 });
    expect(result.startWeightKg).toBe(75);
    expect(result.currentWeightKg).toBe(70);
  });

  it('computes progressPct toward target', () => {
    const entries = [makeEntry(0, 75), makeEntry(7, 80)]; // start 80, current 75, target 70 -> 50%
    const result = computeStats(entries, { startDate: new Date(Date.now() - 7 * 86400000), targetWeightKg: 70 });
    expect(result.progressPct).toBe(50);
  });

  it('clamps progressPct to [0, 100]', () => {
    const overshoot = [makeEntry(0, 65), makeEntry(7, 80)]; // current below target
    const result = computeStats(overshoot, { startDate: new Date(Date.now() - 7 * 86400000), targetWeightKg: 70 });
    expect(result.progressPct).toBe(100);
  });
});

describe('computeAmPmAverages', () => {
  it('returns null when no entries in window', () => {
    expect(computeAmPmAverages([], 7)).toEqual({ amAvgKg: null, pmAvgKg: null });
  });

  it('averages AM and PM entries within the window', () => {
    const entries = [
      makeEntry(0, 70, 'AM'),
      makeEntry(0, 72, 'PM'),
      makeEntry(2, 71, 'AM'),
      makeEntry(2, 73, 'PM'),
      makeEntry(10, 80, 'AM'), // outside 7-day window
    ];
    expect(computeAmPmAverages(entries, 7)).toEqual({ amAvgKg: 70.5, pmAvgKg: 72.5 });
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/unit/stats.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/stats.ts`**

```ts
export type EntryRow = {
  measuredAt: Date;
  period: 'AM' | 'PM';
  weightKg: number;
};

export type CutRow = {
  startDate: Date;
  targetWeightKg: number;
};

export type Stats = {
  startWeightKg: number | null;
  currentWeightKg: number | null;
  totalLostKg: number | null;
  weeklyRateKg: number | null;
  daysInCut: number;
  progressPct: number | null;
};

export function computeStats(entries: EntryRow[], cut: CutRow): Stats {
  const am = entries.filter((e) => e.period === 'AM').sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
  const daysInCut = Math.max(0, Math.floor((Date.now() - cut.startDate.getTime()) / 86400000));

  if (am.length === 0) {
    return { startWeightKg: null, currentWeightKg: null, totalLostKg: null, weeklyRateKg: null, daysInCut, progressPct: null };
  }

  const startWeightKg = am[0]!.weightKg;
  const currentWeightKg = am[am.length - 1]!.weightKg;
  const totalLostKg = +(startWeightKg - currentWeightKg).toFixed(1);

  let weeklyRateKg: number | null = null;
  if (am.length >= 2) {
    const weeks = (am[am.length - 1]!.measuredAt.getTime() - am[0]!.measuredAt.getTime()) / (7 * 86400000);
    if (weeks > 0) weeklyRateKg = +((startWeightKg - currentWeightKg) / weeks).toFixed(2);
  }

  let progressPct: number | null = null;
  const totalGoal = startWeightKg - cut.targetWeightKg;
  if (totalGoal > 0) {
    const pct = ((startWeightKg - currentWeightKg) / totalGoal) * 100;
    progressPct = Math.max(0, Math.min(100, +pct.toFixed(1)));
  }

  return { startWeightKg, currentWeightKg, totalLostKg, weeklyRateKg, daysInCut, progressPct };
}

export function computeAmPmAverages(entries: EntryRow[], windowDays: number): { amAvgKg: number | null; pmAvgKg: number | null } {
  const cutoff = Date.now() - windowDays * 86400000;
  const inWindow = entries.filter((e) => e.measuredAt.getTime() >= cutoff);
  const am = inWindow.filter((e) => e.period === 'AM');
  const pm = inWindow.filter((e) => e.period === 'PM');
  const avg = (rows: EntryRow[]) => (rows.length === 0 ? null : +(rows.reduce((s, r) => s + r.weightKg, 0) / rows.length).toFixed(2));
  return { amAvgKg: avg(am), pmAvgKg: avg(pm) };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/unit/stats.test.ts
```

Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats.ts tests/unit/stats.test.ts
git commit -m "feat: pure dashboard math (computeStats, am/pm averages)"
```

---

## Task 9: NextAuth configuration

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `src/lib/db.ts` (no change), `next.config.ts` (no change)

- [ ] **Step 1: Create `src/lib/auth.ts`**

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validation/auth';
import { checkLoginRateLimit } from '@/lib/rate-limit';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (!checkLoginRateLimit(email)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.userId = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    user: { id: string; email?: string | null };
  }
}
```

- [ ] **Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**

```ts
export { GET, POST } from '@/lib/auth' assert { 'resolution-mode': 'import' };
```

If the assert syntax causes issues, simplify to:

```ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create stub `src/lib/rate-limit.ts`**

```ts
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(email);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_ATTEMPTS) return false;
  bucket.count += 1;
  return true;
}

export function resetLoginRateLimit(email: string): void {
  buckets.delete(email);
}
```

- [ ] **Step 4: Verify it builds**

```bash
pnpm build
```

Expected: build succeeds (may emit a deprecation note about NextAuth beta — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/rate-limit.ts src/app/api/auth
git commit -m "feat(auth): nextauth config with credentials provider"
```

---

## Task 10: Integration test harness

**Files:**
- Create: `tests/integration/helpers.ts`
- Modify: `vitest.config.ts` (add separate integration project), `package.json`

- [ ] **Step 1: Provide a separate test database**

In Neon, create a third branch named `test` derived from `main`. Add `TEST_DATABASE_URL` to `.env.local` with that branch's connection string.

- [ ] **Step 2: Update `vitest.config.ts` to load integration env**

Replace contents:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { config as dotenv } from 'dotenv';

dotenv({ path: '.env.local' });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    poolOptions: { threads: { singleThread: true } },
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'test-secret',
      AUTH_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Install dotenv:
```bash
pnpm add -D dotenv
```

- [ ] **Step 3: Create `tests/integration/helpers.ts`**

```ts
import { afterEach, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { execSync } from 'node:child_process';

beforeAll(() => {
  // Apply latest migrations to the test DB
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit' });
});

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
```

- [ ] **Step 4: Smoke-test the harness**

Add a tiny `tests/integration/smoke.test.ts`:
```ts
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
```

Run:
```bash
pnpm test tests/integration/smoke.test.ts
```

Expected: PASS. If it fails because the test DB isn't migrated, run `TEST_DATABASE_URL=... pnpm prisma migrate deploy` once manually.

- [ ] **Step 5: Commit**

```bash
git add tests/integration/helpers.ts tests/integration/smoke.test.ts vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore(test): integration test harness"
```

---

## Task 11: `signup` server action (with tests)

**Files:**
- Create: `src/app/_actions/auth.ts` (signup only for now)
- Test: `tests/integration/auth.test.ts`

- [ ] **Step 1: Write failing tests at `tests/integration/auth.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import './helpers';
import { db } from '@/lib/db';
import { signup } from '@/app/_actions/auth';
import bcrypt from 'bcrypt';

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
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/integration/auth.test.ts
```

Expected: FAIL — `signup` not exported from `@/app/_actions/auth`.

- [ ] **Step 3: Implement `src/app/_actions/auth.ts`**

```ts
'use server';

import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { runAction, ActionError } from '@/lib/errors';
import { signupSchema } from '@/lib/validation/auth';

export async function signup(input: { email: string; password: string }) {
  return runAction(async () => {
    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError('VALIDATION_FAILED', 'Invalid input', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }
    const { email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new ActionError('VALIDATION_FAILED', 'Email already registered', { email: ['Email already registered'] });
    }

    const user = await db.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 12) },
    });
    return { userId: user.id };
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/integration/auth.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/_actions/auth.ts tests/integration/auth.test.ts
git commit -m "feat(auth): signup server action"
```

---

## Task 12: Auth pages (signup + login forms)

**Files:**
- Create: `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/layout.tsx`
- Modify: `src/app/_actions/auth.ts` (add `loginAction` wrapper that calls NextAuth `signIn`)

- [ ] **Step 1: Add `loginAction` and `logout` to `src/app/_actions/auth.ts`**

Append to that file:
```ts
import { signIn, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  return runAction(async () => {
    try {
      await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirect: false,
      });
      return { ok: true };
    } catch {
      throw new ActionError('VALIDATION_FAILED', 'Invalid email or password');
    }
  });
}

export async function logout() {
  await signOut({ redirect: false });
  redirect('/');
}
```

- [ ] **Step 2: Create `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">{children}</div>
    </main>
  );
}
```

- [ ] **Step 3: Create `src/app/(auth)/signup/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup, loginAction } from '@/app/_actions/auth';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: FormData) => {
    setError(null);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const result = await signup({ email, password });
    if (!result.ok) {
      setError(result.message ?? 'Signup failed');
      return;
    }
    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', password);
    await loginAction(fd);
    router.push('/dashboard');
  };

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <input name="email" type="email" required placeholder="Email" className="border rounded p-2" />
      <input name="password" type="password" required placeholder="Password (8+ chars, letter+digit)" className="border rounded p-2" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="bg-black text-white rounded p-2">Create account</button>
      <a href="/login" className="text-sm text-neutral-600">Already have an account? Log in</a>
    </form>
  );
}
```

- [ ] **Step 4: Create `src/app/(auth)/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/_actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: FormData) => {
    setError(null);
    const result = await loginAction(formData);
    if (!result.ok) {
      setError('Invalid email or password');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <input name="email" type="email" required placeholder="Email" className="border rounded p-2" />
      <input name="password" type="password" required placeholder="Password" className="border rounded p-2" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="bg-black text-white rounded p-2">Log in</button>
      <a href="/signup" className="text-sm text-neutral-600">No account? Sign up</a>
    </form>
  );
}
```

- [ ] **Step 5: Replace `src/app/page.tsx` with a landing page**

```tsx
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold">Cutting</h1>
        <p className="text-neutral-600">Track weight, body fat, muscle, and water through your cut. Twice a day.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="bg-black text-white rounded px-4 py-2">Log in</Link>
          <Link href="/signup" className="border rounded px-4 py-2">Sign up</Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Manual smoke test**

```bash
pnpm dev
```

Open `http://localhost:3000`, click Sign up, create an account, get redirected to `/dashboard` (404 for now — fine). Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/app/_actions/auth.ts src/app/\(auth\) src/app/page.tsx
git commit -m "feat(auth): signup + login pages and actions"
```

---

## Task 13: Auth-required app layout + nav

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/_components/nav.tsx`

- [ ] **Step 1: Create `src/app/_components/nav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/_actions/auth';

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/charts', label: 'Charts' },
  { href: '/entries', label: 'Entries' },
  { href: '/cuts', label: 'Cuts' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      <nav className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:border-r bg-white p-4 gap-1">
        <div className="font-bold text-xl mb-4">Cutting</div>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded p-2 text-sm ${pathname.startsWith(it.href) ? 'bg-neutral-100 font-medium' : 'hover:bg-neutral-50'}`}
          >
            {it.label}
          </Link>
        ))}
        <form action={logout} className="mt-auto">
          <button type="submit" className="text-sm text-neutral-600 hover:text-black p-2">Sign out</button>
        </form>
      </nav>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex-1 text-center py-3 text-xs ${pathname.startsWith(it.href) ? 'text-black font-medium' : 'text-neutral-500'}`}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Create `src/app/(app)/layout.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Nav from '@/app/_components/nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen md:pl-56 pb-16 md:pb-0">
      <Nav />
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Add a stub dashboard page**

Create `src/app/(app)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return <div>Dashboard placeholder</div>;
}
```

- [ ] **Step 4: Verify auth guard works**

```bash
pnpm dev
```

In a private browser window, open `http://localhost:3000/dashboard` — should redirect to `/login`. Log in — should land on the dashboard placeholder. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/app/_components/nav.tsx src/app/\(app\)
git commit -m "feat: auth-required app layout with sidebar/bottom nav"
```

---

## Task 14: `createCut` server action

**Files:**
- Create: `src/app/_actions/cuts.ts`
- Test: `tests/integration/cuts.test.ts`

- [ ] **Step 1: Write failing tests at `tests/integration/cuts.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import './helpers';
import { makeUser } from './helpers';
import { db } from '@/lib/db';
import { createCut } from '@/app/_actions/cuts';
import * as authMod from '@/lib/auth';

function mockSession(userId: string) {
  vi.spyOn(authMod, 'auth').mockResolvedValue({ user: { id: userId, email: 'x@y.z' }, expires: '2099-01-01' } as never);
}

describe('createCut', () => {
  it('returns UNAUTHORIZED with no session', async () => {
    vi.spyOn(authMod, 'auth').mockResolvedValue(null as never);
    const result = await createCut({ name: 'Spring', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('UNAUTHORIZED');
  });

  it('creates a cut for the current user', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const result = await createCut({ name: 'Spring', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    expect(result.ok).toBe(true);
    const cuts = await db.cut.findMany({ where: { userId: user.id } });
    expect(cuts).toHaveLength(1);
    expect(cuts[0]!.name).toBe('Spring');
  });

  it('returns ACTIVE_CUT_EXISTS if user already has an active cut', async () => {
    const user = await makeUser();
    mockSession(user.id);
    await createCut({ name: 'A', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    const result = await createCut({ name: 'B', startDate: new Date('2026-02-01'), targetWeightKg: 65 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ACTIVE_CUT_EXISTS');
  });

  it('returns VALIDATION_FAILED with bad input', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const result = await createCut({ name: '', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('VALIDATION_FAILED');
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/integration/cuts.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/app/_actions/cuts.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ActionError, runAction } from '@/lib/errors';
import { createCutSchema, updateCutSchema, endCutSchema } from '@/lib/validation/cuts';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
  return session.user.id;
}

export async function createCut(input: { name: string; startDate: Date; targetWeightKg: number }) {
  return runAction(async () => {
    const userId = await requireUser();
    const parsed = createCutSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid input', parsed.error.flatten().fieldErrors as Record<string, string[]>);

    const cut = await db.cut.create({
      data: { userId, name: parsed.data.name, startDate: parsed.data.startDate, targetWeightKg: parsed.data.targetWeightKg },
    });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return cut;
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/integration/cuts.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/_actions/cuts.ts tests/integration/cuts.test.ts
git commit -m "feat(cuts): createCut server action"
```

---

## Task 15: `updateCut`, `endCut`, `deleteCut`

**Files:**
- Modify: `src/app/_actions/cuts.ts`
- Modify: `tests/integration/cuts.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `tests/integration/cuts.test.ts`:
```ts
import { updateCut, endCut, deleteCut } from '@/app/_actions/cuts';

describe('updateCut', () => {
  it('updates the cut for the owning user', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({ name: 'Old', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!created.ok) throw new Error('precondition');
    const result = await updateCut(created.data.id, { name: 'New' });
    expect(result.ok).toBe(true);
    const fresh = await db.cut.findUnique({ where: { id: created.data.id } });
    expect(fresh?.name).toBe('New');
  });

  it('returns FORBIDDEN when cut belongs to another user', async () => {
    const owner = await makeUser({ email: 'a@a.a' });
    const intruder = await makeUser({ email: 'b@b.b' });
    mockSession(owner.id);
    const created = await createCut({ name: 'A', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!created.ok) throw new Error('precondition');
    mockSession(intruder.id);
    const result = await updateCut(created.data.id, { name: 'Hacked' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });
});

describe('endCut', () => {
  it('sets endDate', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({ name: 'A', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!created.ok) throw new Error('precondition');
    const result = await endCut(created.data.id, { endDate: new Date('2026-04-01') });
    expect(result.ok).toBe(true);
    const fresh = await db.cut.findUnique({ where: { id: created.data.id } });
    expect(fresh?.endDate).not.toBeNull();
  });

  it('allows starting a new cut once the previous one is ended', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const a = await createCut({ name: 'A', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!a.ok) throw new Error('precondition');
    await endCut(a.data.id, { endDate: new Date('2026-02-01') });
    const b = await createCut({ name: 'B', startDate: new Date('2026-03-01'), targetWeightKg: 65 });
    expect(b.ok).toBe(true);
  });
});

describe('deleteCut', () => {
  it('deletes a cut with no entries', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({ name: 'A', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!created.ok) throw new Error('precondition');
    const result = await deleteCut(created.data.id);
    expect(result.ok).toBe(true);
    expect(await db.cut.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it('returns CUT_HAS_ENTRIES when entries exist', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createCut({ name: 'A', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!created.ok) throw new Error('precondition');
    await db.entry.create({
      data: {
        userId: user.id,
        cutId: created.data.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
        bodyFatPct: 18,
        musclePct: 42,
        waterPct: 55,
      },
    });
    const result = await deleteCut(created.data.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CUT_HAS_ENTRIES');
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/integration/cuts.test.ts
```

Expected: FAIL — `updateCut`, `endCut`, `deleteCut` not exported.

- [ ] **Step 3: Append to `src/app/_actions/cuts.ts`**

```ts
async function loadOwnedCut(cutId: string, userId: string) {
  const cut = await db.cut.findUnique({ where: { id: cutId } });
  if (!cut) throw new ActionError('FORBIDDEN');
  if (cut.userId !== userId) throw new ActionError('FORBIDDEN');
  return cut;
}

export async function updateCut(cutId: string, input: { name?: string; startDate?: Date; targetWeightKg?: number }) {
  return runAction(async () => {
    const userId = await requireUser();
    await loadOwnedCut(cutId, userId);
    const parsed = updateCutSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid input', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    const cut = await db.cut.update({ where: { id: cutId }, data: parsed.data });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return cut;
  });
}

export async function endCut(cutId: string, input: { endDate: Date }) {
  return runAction(async () => {
    const userId = await requireUser();
    const existing = await loadOwnedCut(cutId, userId);
    const parsed = endCutSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid input');
    if (parsed.data.endDate < existing.startDate) throw new ActionError('VALIDATION_FAILED', 'endDate must be ≥ startDate');
    const cut = await db.cut.update({ where: { id: cutId }, data: { endDate: parsed.data.endDate } });
    revalidatePath('/cuts');
    revalidatePath('/dashboard');
    return cut;
  });
}

export async function deleteCut(cutId: string) {
  return runAction(async () => {
    const userId = await requireUser();
    await loadOwnedCut(cutId, userId);
    const entryCount = await db.entry.count({ where: { cutId } });
    if (entryCount > 0) throw new ActionError('CUT_HAS_ENTRIES', 'End the cut instead of deleting it.');
    await db.cut.delete({ where: { id: cutId } });
    revalidatePath('/cuts');
    return { id: cutId };
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/integration/cuts.test.ts
```

Expected: PASS — 9 tests total in this file now.

- [ ] **Step 5: Commit**

```bash
git add src/app/_actions/cuts.ts tests/integration/cuts.test.ts
git commit -m "feat(cuts): updateCut, endCut, deleteCut"
```

---

## Task 16: Cut queries

**Files:**
- Create: `src/lib/queries/cuts.ts`

- [ ] **Step 1: Implement `src/lib/queries/cuts.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/queries/cuts.ts
git commit -m "feat(cuts): query helpers"
```

---

## Task 17: Cuts page UI

**Files:**
- Create: `src/app/(app)/cuts/page.tsx`, `src/app/_components/cut-form.tsx`, `src/app/_components/cut-list.tsx`

- [ ] **Step 1: Create `src/app/_components/cut-form.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { createCut } from '@/app/_actions/cuts';
import { useRouter } from 'next/navigation';

export default function CutForm({ mostRecentWeightKg }: { mostRecentWeightKg: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<number>(70);

  const showWarning = mostRecentWeightKg !== null && target >= mostRecentWeightKg;

  const onSubmit = (formData: FormData) => {
    if (showWarning && !confirm(`Your target ${target} kg is at or above your most recent weight ${mostRecentWeightKg} kg. This is a cutting tracker. Continue?`)) {
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await createCut({
        name: String(formData.get('name') ?? ''),
        startDate: new Date(String(formData.get('startDate') ?? '')),
        targetWeightKg: Number(formData.get('targetWeightKg') ?? target),
      });
      if (!result.ok) {
        if (result.error === 'ACTIVE_CUT_EXISTS') setError('You already have an active cut. End it before starting a new one.');
        else setError(result.message ?? 'Could not create cut');
        return;
      }
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="grid gap-3 max-w-md">
      <input name="name" required placeholder="Cut name" className="border rounded p-2" />
      <input name="startDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="border rounded p-2" />
      <input
        name="targetWeightKg"
        required
        type="number"
        step="0.1"
        min="20"
        max="400"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        className="border rounded p-2"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">
        {pending ? 'Saving…' : 'Start cut'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `src/app/_components/cut-list.tsx`**

```tsx
'use client';

import { useTransition } from 'react';
import { endCut, deleteCut } from '@/app/_actions/cuts';
import { useRouter } from 'next/navigation';

type CutRow = { id: string; name: string; startDate: Date; endDate: Date | null; targetWeightKg: number };

export default function CutList({ cuts }: { cuts: CutRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleEnd = (cutId: string) => startTransition(async () => {
    await endCut(cutId, { endDate: new Date() });
    router.refresh();
  });

  const handleDelete = (cutId: string) => startTransition(async () => {
    if (!confirm('Delete this cut?')) return;
    const result = await deleteCut(cutId);
    if (!result.ok && result.error === 'CUT_HAS_ENTRIES') alert('This cut has entries. End it instead.');
    router.refresh();
  });

  return (
    <ul className="grid gap-3">
      {cuts.map((c) => (
        <li key={c.id} className="border rounded p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-neutral-600">
              {c.startDate.toISOString().slice(0, 10)} → {c.endDate ? c.endDate.toISOString().slice(0, 10) : 'active'} · target {String(c.targetWeightKg)} kg
            </div>
          </div>
          <div className="flex gap-2">
            {!c.endDate && <button onClick={() => handleEnd(c.id)} disabled={pending} className="border rounded px-3 py-1 text-sm">End</button>}
            <button onClick={() => handleDelete(c.id)} disabled={pending} className="border rounded px-3 py-1 text-sm">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/cuts/page.tsx`**

```tsx
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
          <CutList cuts={cuts.map((c) => ({ ...c, targetWeightKg: Number(c.targetWeightKg) }))} />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Manual smoke test**

`pnpm dev`, log in, go to `/cuts`, create a cut, end it, create another. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/cuts src/app/_components/cut-form.tsx src/app/_components/cut-list.tsx
git commit -m "feat(cuts): cuts page (list, create, end, delete)"
```

---

## Task 18: `createEntry` server action

**Files:**
- Create: `src/app/_actions/entries.ts`
- Test: `tests/integration/entries.test.ts`

- [ ] **Step 1: Write failing tests at `tests/integration/entries.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import './helpers';
import { makeUser } from './helpers';
import { db } from '@/lib/db';
import { createEntry } from '@/app/_actions/entries';
import { createCut } from '@/app/_actions/cuts';
import * as authMod from '@/lib/auth';

function mockSession(userId: string) {
  vi.spyOn(authMod, 'auth').mockResolvedValue({ user: { id: userId, email: 'x@y.z' }, expires: '2099-01-01' } as never);
}

const valid = () => ({
  measuredAt: new Date(),
  period: 'AM' as const,
  weightKg: 75.4,
  bodyFatPct: 18.5,
  musclePct: 42.0,
  waterPct: 55.5,
  tzOffsetMinutes: 0,
});

describe('createEntry', () => {
  it('returns UNAUTHORIZED with no session', async () => {
    vi.spyOn(authMod, 'auth').mockResolvedValue(null as never);
    const result = await createEntry(valid());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('UNAUTHORIZED');
  });

  it('creates entry and auto-attaches to active cut', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const cut = await createCut({ name: 'Spring', startDate: new Date('2026-01-01'), targetWeightKg: 70 });
    if (!cut.ok) throw new Error('precondition');
    const result = await createEntry(valid());
    expect(result.ok).toBe(true);
    const entries = await db.entry.findMany({ where: { userId: user.id } });
    expect(entries).toHaveLength(1);
    expect(entries[0]!.cutId).toBe(cut.data.id);
  });

  it('rejects duplicate AM same day with DUPLICATE_PERIOD_TODAY', async () => {
    const user = await makeUser();
    mockSession(user.id);
    await createEntry(valid());
    const second = await createEntry(valid());
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('DUPLICATE_PERIOD_TODAY');
  });

  it('allows AM and PM same day', async () => {
    const user = await makeUser();
    mockSession(user.id);
    await createEntry(valid());
    const pm = await createEntry({ ...valid(), period: 'PM' });
    expect(pm.ok).toBe(true);
  });

  it('returns VALIDATION_FAILED on out-of-range weight', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const result = await createEntry({ ...valid(), weightKg: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('VALIDATION_FAILED');
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/integration/entries.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/app/_actions/entries.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ActionError, runAction } from '@/lib/errors';
import { createEntrySchema, updateEntrySchema } from '@/lib/validation/entries';
import { deriveMeasuredDay, isWithinEditWindow } from '@/lib/time';
import { getActiveCut } from '@/lib/queries/cuts';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
  return session.user.id;
}

export async function createEntry(input: {
  measuredAt: Date;
  period: 'AM' | 'PM';
  weightKg: number;
  bodyFatPct: number;
  musclePct: number;
  waterPct: number;
  note?: string;
  tzOffsetMinutes: number;
}) {
  return runAction(async () => {
    const userId = await requireUser();
    const parsed = createEntrySchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid input', parsed.error.flatten().fieldErrors as Record<string, string[]>);

    const { measuredAt, period, weightKg, bodyFatPct, musclePct, waterPct, note, tzOffsetMinutes } = parsed.data;
    const measuredDay = new Date(deriveMeasuredDay(measuredAt, tzOffsetMinutes));
    const activeCut = await getActiveCut(userId);

    const entry = await db.entry.create({
      data: {
        userId,
        cutId: activeCut?.id ?? null,
        measuredAt,
        measuredDay,
        period,
        weightKg,
        bodyFatPct,
        musclePct,
        waterPct,
        note: note ?? null,
      },
    });
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return entry;
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/integration/entries.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/_actions/entries.ts tests/integration/entries.test.ts
git commit -m "feat(entries): createEntry with active-cut attach + duplicate guard"
```

---

## Task 19: `updateEntry` and `deleteEntry`

**Files:**
- Modify: `src/app/_actions/entries.ts`
- Modify: `tests/integration/entries.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `tests/integration/entries.test.ts`:
```ts
import { updateEntry, deleteEntry } from '@/app/_actions/entries';

describe('updateEntry', () => {
  it('updates an entry within the 24h window', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createEntry(valid());
    if (!created.ok) throw new Error('precondition');
    const result = await updateEntry(created.data.id, { weightKg: 76.0, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(true);
    const fresh = await db.entry.findUnique({ where: { id: created.data.id } });
    expect(Number(fresh!.weightKg)).toBe(76);
  });

  it('returns EDIT_WINDOW_CLOSED past 24h', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const old = await db.entry.create({
      data: {
        userId: user.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
        bodyFatPct: 18,
        musclePct: 42,
        waterPct: 55,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });
    const result = await updateEntry(old.id, { weightKg: 80, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EDIT_WINDOW_CLOSED');
  });

  it('returns FORBIDDEN for another user’s entry', async () => {
    const owner = await makeUser({ email: 'o@o.o' });
    const intruder = await makeUser({ email: 'i@i.i' });
    mockSession(owner.id);
    const created = await createEntry(valid());
    if (!created.ok) throw new Error('precondition');
    mockSession(intruder.id);
    const result = await updateEntry(created.data.id, { weightKg: 99, tzOffsetMinutes: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });
});

describe('deleteEntry', () => {
  it('deletes within window', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const created = await createEntry(valid());
    if (!created.ok) throw new Error('precondition');
    const result = await deleteEntry(created.data.id);
    expect(result.ok).toBe(true);
    expect(await db.entry.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it('returns EDIT_WINDOW_CLOSED past 24h', async () => {
    const user = await makeUser();
    mockSession(user.id);
    const old = await db.entry.create({
      data: {
        userId: user.id,
        measuredAt: new Date(),
        measuredDay: new Date(),
        period: 'AM',
        weightKg: 75,
        bodyFatPct: 18,
        musclePct: 42,
        waterPct: 55,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });
    const result = await deleteEntry(old.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EDIT_WINDOW_CLOSED');
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm test tests/integration/entries.test.ts
```

Expected: FAIL — `updateEntry`, `deleteEntry` not exported.

- [ ] **Step 3: Append to `src/app/_actions/entries.ts`**

```ts
async function loadOwnedEntry(entryId: string, userId: string) {
  const entry = await db.entry.findUnique({ where: { id: entryId } });
  if (!entry) throw new ActionError('FORBIDDEN');
  if (entry.userId !== userId) throw new ActionError('FORBIDDEN');
  return entry;
}

export async function updateEntry(
  entryId: string,
  input: Partial<{
    measuredAt: Date;
    period: 'AM' | 'PM';
    weightKg: number;
    bodyFatPct: number;
    musclePct: number;
    waterPct: number;
    note?: string;
  }> & { tzOffsetMinutes: number },
) {
  return runAction(async () => {
    const userId = await requireUser();
    const existing = await loadOwnedEntry(entryId, userId);
    if (!isWithinEditWindow(existing.createdAt)) throw new ActionError('EDIT_WINDOW_CLOSED');

    const parsed = updateEntrySchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid input', parsed.error.flatten().fieldErrors as Record<string, string[]>);

    const data: Record<string, unknown> = {};
    for (const k of ['period', 'weightKg', 'bodyFatPct', 'musclePct', 'waterPct', 'note'] as const) {
      if (parsed.data[k] !== undefined) data[k] = parsed.data[k];
    }
    if (parsed.data.measuredAt !== undefined) {
      data.measuredAt = parsed.data.measuredAt;
      data.measuredDay = new Date(deriveMeasuredDay(parsed.data.measuredAt, parsed.data.tzOffsetMinutes));
    }

    const updated = await db.entry.update({ where: { id: entryId }, data });
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return updated;
  });
}

export async function deleteEntry(entryId: string) {
  return runAction(async () => {
    const userId = await requireUser();
    const existing = await loadOwnedEntry(entryId, userId);
    if (!isWithinEditWindow(existing.createdAt)) throw new ActionError('EDIT_WINDOW_CLOSED');
    await db.entry.delete({ where: { id: entryId } });
    revalidatePath('/dashboard');
    revalidatePath('/entries');
    return { id: entryId };
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm test tests/integration/entries.test.ts
```

Expected: PASS — 10 tests in this file now.

- [ ] **Step 5: Commit**

```bash
git add src/app/_actions/entries.ts tests/integration/entries.test.ts
git commit -m "feat(entries): updateEntry and deleteEntry with edit window"
```

---

## Task 20: Entry queries + dashboard query

**Files:**
- Create: `src/lib/queries/entries.ts`, `src/lib/queries/dashboard.ts`

- [ ] **Step 1: Implement `src/lib/queries/entries.ts`**

```ts
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
  return db.entry.findMany({
    where: {
      userId,
      ...(filter.period && { period: filter.period }),
      ...(filter.cutId !== undefined && { cutId: filter.cutId }),
      ...(filter.from || filter.to
        ? { measuredAt: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
        : {}),
    },
    orderBy: { measuredAt: 'desc' },
    take: filter.take,
    skip: filter.skip,
  });
}
```

- [ ] **Step 2: Implement `src/lib/queries/dashboard.ts`**

```ts
import { db } from '@/lib/db';
import { computeStats, computeAmPmAverages, type EntryRow } from '@/lib/stats';
import { getActiveCut } from '@/lib/queries/cuts';

export async function getDashboardStats(userId: string) {
  const cut = await getActiveCut(userId);
  if (!cut) return { activeCut: null as null, stats: null, amPm7d: null, amPm30d: null, recentEntries: [] };

  const entries = await db.entry.findMany({
    where: { userId, cutId: cut.id },
    orderBy: { measuredAt: 'desc' },
    take: 365,
  });

  const rows: EntryRow[] = entries.map((e) => ({ measuredAt: e.measuredAt, period: e.period, weightKg: Number(e.weightKg) }));
  const stats = computeStats(rows, { startDate: cut.startDate, targetWeightKg: Number(cut.targetWeightKg) });
  const amPm7d = computeAmPmAverages(rows, 7);
  const amPm30d = computeAmPmAverages(rows, 30);

  const recentEntries = entries.slice(0, 10);

  return { activeCut: cut, stats, amPm7d, amPm30d, recentEntries };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/entries.ts src/lib/queries/dashboard.ts
git commit -m "feat: entry and dashboard query helpers"
```

---

## Task 21: Entry form component

**Files:**
- Create: `src/app/_components/entry-form.tsx`

- [ ] **Step 1: Implement `src/app/_components/entry-form.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEntry } from '@/app/_actions/entries';

export default function EntryForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const defaultPeriod: 'AM' | 'PM' = now.getHours() < 12 ? 'AM' : 'PM';
  const tzOffsetMinutes = -now.getTimezoneOffset();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const result = await createEntry({
        measuredAt: new Date(String(formData.get('measuredAt'))),
        period: String(formData.get('period')) as 'AM' | 'PM',
        weightKg: Number(formData.get('weightKg')),
        bodyFatPct: Number(formData.get('bodyFatPct')),
        musclePct: Number(formData.get('musclePct')),
        waterPct: Number(formData.get('waterPct')),
        note: String(formData.get('note') ?? '') || undefined,
        tzOffsetMinutes,
      });
      if (!result.ok) {
        if (result.error === 'DUPLICATE_PERIOD_TODAY') setError('You already logged this period today. Edit the existing entry instead.');
        else setError(result.message ?? 'Could not save');
        return;
      }
      router.refresh();
      onDone?.();
    });
  };

  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

  return (
    <form action={onSubmit} className="grid gap-3 max-w-md">
      <label className="grid gap-1 text-sm">
        Date & time
        <input name="measuredAt" type="datetime-local" required defaultValue={localISO} className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Period
        <select name="period" defaultValue={defaultPeriod} className="border rounded p-2">
          <option value="AM">Morning</option>
          <option value="PM">Evening</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Weight (kg)
        <input name="weightKg" type="number" step="0.1" min="20" max="400" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Body fat (%)
        <input name="bodyFatPct" type="number" step="0.1" min="1" max="70" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Muscle (%)
        <input name="musclePct" type="number" step="0.1" min="10" max="80" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Water (%)
        <input name="waterPct" type="number" step="0.1" min="20" max="80" required className="border rounded p-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Note
        <textarea name="note" maxLength={500} className="border rounded p-2" />
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">
        {pending ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_components/entry-form.tsx
git commit -m "feat: entry form component"
```

---

## Task 22: Recent entries table

**Files:**
- Create: `src/app/_components/entry-table.tsx`

- [ ] **Step 1: Implement `src/app/_components/entry-table.tsx`**

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEntry } from '@/app/_actions/entries';
import { isWithinEditWindow } from '@/lib/time';

type Row = {
  id: string;
  measuredAt: Date;
  period: 'AM' | 'PM';
  weightKg: number;
  bodyFatPct: number;
  musclePct: number;
  waterPct: number;
  note: string | null;
  createdAt: Date;
};

export default function EntryTable({ entries }: { entries: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = (id: string) =>
    startTransition(async () => {
      if (!confirm('Delete this entry?')) return;
      await deleteEntry(id);
      router.refresh();
    });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-neutral-500">
          <tr>
            <th className="p-2">When</th>
            <th className="p-2">Period</th>
            <th className="p-2">Weight</th>
            <th className="p-2">Fat %</th>
            <th className="p-2">Muscle %</th>
            <th className="p-2">Water %</th>
            <th className="p-2">Note</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const editable = isWithinEditWindow(e.createdAt);
            return (
              <tr key={e.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{e.measuredAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                <td className="p-2">{e.period}</td>
                <td className="p-2">{e.weightKg.toFixed(1)}</td>
                <td className="p-2">{e.bodyFatPct.toFixed(1)}</td>
                <td className="p-2">{e.musclePct.toFixed(1)}</td>
                <td className="p-2">{e.waterPct.toFixed(1)}</td>
                <td className="p-2 max-w-xs truncate">{e.note}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={pending || !editable}
                    title={editable ? 'Delete' : 'Past 24h — can no longer edit or delete'}
                    className="text-sm text-red-600 disabled:text-neutral-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_components/entry-table.tsx
git commit -m "feat: entry table with edit-window-aware delete"
```

---

## Task 23: Entries page

**Files:**
- Create: `src/app/(app)/entries/page.tsx`

- [ ] **Step 1: Implement the page**

```tsx
import { auth } from '@/lib/auth';
import { getEntries } from '@/lib/queries/entries';
import EntryForm from '@/app/_components/entry-form';
import EntryTable from '@/app/_components/entry-table';

export default async function EntriesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const raw = await getEntries(userId, { take: 50 });
  const entries = raw.map((e) => ({
    id: e.id,
    measuredAt: e.measuredAt,
    period: e.period,
    weightKg: Number(e.weightKg),
    bodyFatPct: Number(e.bodyFatPct),
    musclePct: Number(e.musclePct),
    waterPct: Number(e.waterPct),
    note: e.note,
    createdAt: e.createdAt,
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Log an entry</h1>
        <EntryForm />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent entries</h2>
        {entries.length === 0 ? <p className="text-neutral-600">No entries yet.</p> : <EntryTable entries={entries} />}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test**

`pnpm dev`, log an entry from `/entries`, see it appear in the table. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/entries
git commit -m "feat(entries): entries page (form + recent table)"
```

---

## Task 24: Dashboard page

**Files:**
- Create: `src/app/_components/stat-card.tsx`, `src/app/_components/am-pm-card.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create `src/app/_components/stat-card.tsx`**

```tsx
export default function StatCard({ label, value, suffix }: { label: string; value: string | number | null; suffix?: string }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value === null ? '—' : value}{suffix && value !== null ? <span className="text-base text-neutral-500"> {suffix}</span> : null}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/_components/am-pm-card.tsx`**

```tsx
export default function AmPmCard({ title, am, pm }: { title: string; am: number | null; pm: number | null }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{title}</div>
      <div className="flex gap-6 mt-2">
        <div>
          <div className="text-xs text-neutral-500">AM</div>
          <div className="text-xl font-semibold">{am === null ? '—' : am.toFixed(2)}<span className="text-base text-neutral-500"> kg</span></div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">PM</div>
          <div className="text-xl font-semibold">{pm === null ? '—' : pm.toFixed(2)}<span className="text-base text-neutral-500"> kg</span></div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/app/(app)/dashboard/page.tsx`**

```tsx
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/queries/dashboard';
import StatCard from '@/app/_components/stat-card';
import AmPmCard from '@/app/_components/am-pm-card';
import EntryForm from '@/app/_components/entry-form';
import EntryTable from '@/app/_components/entry-table';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { activeCut, stats, amPm7d, amPm30d, recentEntries } = await getDashboardStats(userId);

  if (!activeCut) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-neutral-600">No active cut yet.</p>
        <Link href="/cuts" className="inline-block bg-black text-white rounded px-4 py-2">Start a cut</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border rounded-xl p-4 bg-white">
        <div className="text-sm text-neutral-500">Active cut</div>
        <div className="text-xl font-semibold">{activeCut.name}</div>
        <div className="text-sm text-neutral-600">
          {activeCut.startDate.toISOString().slice(0, 10)} → target {String(activeCut.targetWeightKg)} kg
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Start (AM)" value={stats!.startWeightKg?.toFixed(1) ?? null} suffix="kg" />
        <StatCard label="Current (AM)" value={stats!.currentWeightKg?.toFixed(1) ?? null} suffix="kg" />
        <StatCard label="Total lost" value={stats!.totalLostKg?.toFixed(1) ?? null} suffix="kg" />
        <StatCard label="Avg weekly rate" value={stats!.weeklyRateKg?.toFixed(2) ?? null} suffix="kg/wk" />
        <StatCard label="Days in cut" value={stats!.daysInCut} />
        <StatCard label="Progress" value={stats!.progressPct?.toFixed(0) ?? null} suffix="%" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AmPmCard title="Avg AM vs PM (last 7 days)" am={amPm7d!.amAvgKg} pm={amPm7d!.pmAvgKg} />
        <AmPmCard title="Avg AM vs PM (last 30 days)" am={amPm30d!.amAvgKg} pm={amPm30d!.pmAvgKg} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Log an entry</h2>
        <EntryForm />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p className="text-neutral-600">No entries yet.</p>
        ) : (
          <EntryTable
            entries={recentEntries.map((e) => ({
              id: e.id,
              measuredAt: e.measuredAt,
              period: e.period,
              weightKg: Number(e.weightKg),
              bodyFatPct: Number(e.bodyFatPct),
              musclePct: Number(e.musclePct),
              waterPct: Number(e.waterPct),
              note: e.note,
              createdAt: e.createdAt,
            }))}
          />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Manual smoke test**

`pnpm dev`, log a few entries (different days if possible — temporarily backdate `measuredAt` if needed), confirm dashboard shows numbers. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/app/_components/stat-card.tsx src/app/_components/am-pm-card.tsx src/app/\(app\)/dashboard
git commit -m "feat(dashboard): stats, am-vs-pm cards, recent entries"
```

---

## Task 25: Charts page

**Files:**
- Create: `src/app/_components/range-selector.tsx`, `src/app/_components/weight-chart.tsx`, `src/app/_components/composition-chart.tsx`, `src/app/(app)/charts/page.tsx`

- [ ] **Step 1: Create `src/app/_components/range-selector.tsx`**

```tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const ranges = ['7d', '30d', '90d', 'all'] as const;
export type Range = typeof ranges[number];

export default function RangeSelector({ paramKey, current }: { paramKey: string; current: Range }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  return (
    <div className="flex gap-1 text-xs">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set(paramKey, r);
            router.push(`${pathname}?${next.toString()}`);
          }}
          className={`px-2 py-1 rounded ${current === r ? 'bg-black text-white' : 'border'}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/_components/weight-chart.tsx`**

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeightChart({ title, data }: { title: string; data: { date: string; weight: number }[] }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="weight" stroke="#000" dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/_components/composition-chart.tsx`**

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

type Point = { date: string; fat: number; muscle: number; water: number };

export default function CompositionChart({ title, data }: { title: string; data: Point[] }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="fat" stroke="#dc2626" dot={false} />
            <Line type="monotone" dataKey="muscle" stroke="#059669" dot={false} />
            <Line type="monotone" dataKey="water" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/(app)/charts/page.tsx`**

```tsx
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import RangeSelector, { type Range } from '@/app/_components/range-selector';
import WeightChart from '@/app/_components/weight-chart';
import CompositionChart from '@/app/_components/composition-chart';

const RANGE_DAYS: Record<Range, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null };

function rangeFromQuery(value: string | undefined): Range {
  return (['7d', '30d', '90d', 'all'] as const).includes(value as Range) ? (value as Range) : '30d';
}

export default async function ChartsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth();
  const userId = session!.user.id;
  const params = await searchParams;
  const ranges = {
    weightAm: rangeFromQuery(params.weightAm),
    weightPm: rangeFromQuery(params.weightPm),
    compAm: rangeFromQuery(params.compAm),
    compPm: rangeFromQuery(params.compPm),
  };

  const sinceFor = (r: Range) => {
    const days = RANGE_DAYS[r];
    return days === null ? undefined : new Date(Date.now() - days * 86400000);
  };

  const fetch = async (period: 'AM' | 'PM', r: Range) =>
    db.entry.findMany({
      where: { userId, period, ...(sinceFor(r) && { measuredAt: { gte: sinceFor(r) } }) },
      orderBy: { measuredAt: 'asc' },
    });

  const [amW, pmW, amC, pmC] = await Promise.all([
    fetch('AM', ranges.weightAm),
    fetch('PM', ranges.weightPm),
    fetch('AM', ranges.compAm),
    fetch('PM', ranges.compPm),
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const weightData = (rows: typeof amW) => rows.map((e) => ({ date: fmt(e.measuredAt), weight: Number(e.weightKg) }));
  const compData = (rows: typeof amW) => rows.map((e) => ({
    date: fmt(e.measuredAt),
    fat: Number(e.bodyFatPct),
    muscle: Number(e.musclePct),
    water: Number(e.waterPct),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Charts</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <RangeSelector paramKey="weightAm" current={ranges.weightAm} />
          <WeightChart title="Weight — Morning (kg)" data={weightData(amW)} />
        </div>
        <div className="space-y-2">
          <RangeSelector paramKey="weightPm" current={ranges.weightPm} />
          <WeightChart title="Weight — Evening (kg)" data={weightData(pmW)} />
        </div>
        <div className="space-y-2">
          <RangeSelector paramKey="compAm" current={ranges.compAm} />
          <CompositionChart title="Composition — Morning (%)" data={compData(amC)} />
        </div>
        <div className="space-y-2">
          <RangeSelector paramKey="compPm" current={ranges.compPm} />
          <CompositionChart title="Composition — Evening (%)" data={compData(pmC)} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Manual smoke test**

`pnpm dev`, visit `/charts`, click range buttons. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/range-selector.tsx src/app/_components/weight-chart.tsx src/app/_components/composition-chart.tsx src/app/\(app\)/charts
git commit -m "feat(charts): 4 charts (weight am/pm, composition am/pm) with range selector"
```

---

## Task 26: Settings page (change email, change password, delete account)

**Files:**
- Modify: `src/app/_actions/auth.ts`
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Append to `src/app/_actions/auth.ts`**

```ts
import { changeEmailSchema, changePasswordSchema, deleteAccountSchema } from '@/lib/validation/auth';

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new ActionError('UNAUTHORIZED');
  return session.user.id;
}

export async function changeEmail(input: { email: string }) {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = changeEmailSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid email');
    const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (exists && exists.id !== userId) throw new ActionError('VALIDATION_FAILED', 'Email already in use');
    await db.user.update({ where: { id: userId }, data: { email: parsed.data.email } });
    return { ok: true };
  });
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED', 'Invalid password');
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      throw new ActionError('VALIDATION_FAILED', 'Current password is wrong');
    }
    await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
    return { ok: true };
  });
}

export async function deleteAccount(input: { password: string }) {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = deleteAccountSchema.safeParse(input);
    if (!parsed.success) throw new ActionError('VALIDATION_FAILED');
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      throw new ActionError('VALIDATION_FAILED', 'Wrong password');
    }
    await db.user.delete({ where: { id: userId } });
    await signOut({ redirect: false });
    return { ok: true };
  });
}
```

You'll also need `bcrypt` imported at the top of the file (it should already be implicit in earlier tasks; if not, add `import bcrypt from 'bcrypt'`).

- [ ] **Step 2: Create `src/app/(app)/settings/page.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changeEmail, changePassword, deleteAccount, logout } from '@/app/_actions/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [delMsg, setDelMsg] = useState<string | null>(null);

  const onChangeEmail = (formData: FormData) =>
    startTransition(async () => {
      const result = await changeEmail({ email: String(formData.get('email')) });
      setEmailMsg(result.ok ? 'Email updated' : result.message ?? 'Failed');
    });

  const onChangePassword = (formData: FormData) =>
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: String(formData.get('currentPassword')),
        newPassword: String(formData.get('newPassword')),
      });
      setPwMsg(result.ok ? 'Password updated' : result.message ?? 'Failed');
    });

  const onDelete = (formData: FormData) =>
    startTransition(async () => {
      if (!confirm('Permanently delete your account and all data?')) return;
      const result = await deleteAccount({ password: String(formData.get('password')) });
      if (result.ok) router.push('/');
      else setDelMsg(result.message ?? 'Failed');
    });

  return (
    <div className="space-y-10 max-w-md">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section>
        <h2 className="text-lg font-medium mb-2">Change email</h2>
        <form action={onChangeEmail} className="grid gap-2">
          <input name="email" type="email" required className="border rounded p-2" />
          <button disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">Save</button>
          {emailMsg && <p className="text-sm">{emailMsg}</p>}
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Change password</h2>
        <form action={onChangePassword} className="grid gap-2">
          <input name="currentPassword" type="password" required placeholder="Current password" className="border rounded p-2" />
          <input name="newPassword" type="password" required placeholder="New password" className="border rounded p-2" />
          <button disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">Save</button>
          {pwMsg && <p className="text-sm">{pwMsg}</p>}
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Sign out</h2>
        <form action={logout}>
          <button className="border rounded p-2">Sign out</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium text-red-700 mb-2">Delete account</h2>
        <form action={onDelete} className="grid gap-2">
          <input name="password" type="password" required placeholder="Password" className="border rounded p-2" />
          <button disabled={pending} className="bg-red-600 text-white rounded p-2 disabled:opacity-50">Delete account</button>
          {delMsg && <p className="text-sm text-red-700">{delMsg}</p>}
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Manual smoke test**

`pnpm dev`, change email, change password, sign out, log back in, delete a fresh test account. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/_actions/auth.ts src/app/\(app\)/settings
git commit -m "feat(settings): change email/password and delete account"
```

---

## Task 27: Error and not-found boundaries

**Files:**
- Create: `src/app/error.tsx`, `src/app/not-found.tsx`

- [ ] **Step 1: Create `src/app/error.tsx`**

```tsx
'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-neutral-600">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="bg-black text-white rounded px-4 py-2">Try again</button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create `src/app/not-found.tsx`**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <Link href="/" className="text-blue-600 underline">Go home</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/error.tsx src/app/not-found.tsx
git commit -m "feat: error and not-found boundaries"
```

---

## Task 28: Playwright setup

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/helpers.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Create `tests/e2e/helpers.ts`**

```ts
import { Page } from '@playwright/test';

export async function signupAndLogin(page: Page, email: string, password = 'abcd1234') {
  await page.goto('/signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

export const uniqueEmail = (label: string) => `e2e-${label}-${Date.now()}@example.com`;
```

- [ ] **Step 4: Add a smoke spec**

Create `tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Cutting')).toBeVisible();
});
```

Run:
```bash
pnpm test:e2e
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "chore(test): playwright setup + smoke"
```

---

## Task 29: E2E — signup and log first entry

**Files:**
- Create: `tests/e2e/signup-and-log.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';
import { signupAndLogin, uniqueEmail } from './helpers';

test('signup → log first entry → see it on dashboard', async ({ page }) => {
  await signupAndLogin(page, uniqueEmail('first'));

  await page.goto('/dashboard');
  await page.fill('input[name="weightKg"]', '75.4');
  await page.fill('input[name="bodyFatPct"]', '18.5');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55.5');
  await page.click('button:has-text("Save entry")');

  await expect(page.getByText('75.4')).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/e2e/signup-and-log.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/signup-and-log.spec.ts
git commit -m "test(e2e): signup and log first entry"
```

---

## Task 30: E2E — AM/PM duplicate

**Files:**
- Create: `tests/e2e/am-pm-duplicate.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';
import { signupAndLogin, uniqueEmail } from './helpers';

test('logging two AMs same day shows duplicate error; AM+PM same day works', async ({ page }) => {
  await signupAndLogin(page, uniqueEmail('dup'));
  await page.goto('/entries');

  // First AM
  await page.selectOption('select[name="period"]', 'AM');
  await page.fill('input[name="weightKg"]', '75');
  await page.fill('input[name="bodyFatPct"]', '18');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(page.getByText('75.0')).toBeVisible();

  // Second AM same day
  await page.selectOption('select[name="period"]', 'AM');
  await page.fill('input[name="weightKg"]', '75.2');
  await page.fill('input[name="bodyFatPct"]', '18');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(page.getByText('already logged this period today')).toBeVisible();

  // PM same day succeeds
  await page.selectOption('select[name="period"]', 'PM');
  await page.fill('input[name="weightKg"]', '76.5');
  await page.fill('input[name="bodyFatPct"]', '18');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(page.getByText('76.5')).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/e2e/am-pm-duplicate.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/am-pm-duplicate.spec.ts
git commit -m "test(e2e): am/pm duplicate handling"
```

---

## Task 31: E2E — cut + dashboard

**Files:**
- Create: `tests/e2e/cut-and-dashboard.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';
import { signupAndLogin, uniqueEmail } from './helpers';

test('create cut, log entry, dashboard shows stats and progress bar', async ({ page }) => {
  await signupAndLogin(page, uniqueEmail('cut'));

  await page.goto('/cuts');
  await page.fill('input[name="name"]', 'E2E cut');
  await page.fill('input[name="targetWeightKg"]', '70');
  await page.click('button:has-text("Start cut")');
  await expect(page.getByText('E2E cut')).toBeVisible();

  await page.goto('/entries');
  await page.fill('input[name="weightKg"]', '78');
  await page.fill('input[name="bodyFatPct"]', '20');
  await page.fill('input[name="musclePct"]', '40');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');

  await page.goto('/dashboard');
  await expect(page.getByText('E2E cut')).toBeVisible();
  await expect(page.getByText('Start (AM)')).toBeVisible();
  await expect(page.getByText('Progress')).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/e2e/cut-and-dashboard.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/cut-and-dashboard.spec.ts
git commit -m "test(e2e): cut + dashboard flow"
```

---

## Task 32: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cutting_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cutting_test
      TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cutting_test
      AUTH_SECRET: ci-secret-not-real
      AUTH_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma migrate deploy
      - run: |
          psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS citext;'
      - run: pnpm test
      - if: github.event_name == 'pull_request'
        run: pnpm exec playwright install --with-deps chromium
      - if: github.event_name == 'pull_request'
        run: pnpm test:e2e
```

Note: the `citext` extension creation may need to run before `prisma migrate deploy` if the migration depends on it. If the first migration creates citext via Prisma `extensions = [citext]`, swap the order. Run locally to confirm.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: github actions for tests"
```

---

## Task 33: Vercel deployment + production migrations

**Files:**
- Modify: `package.json` (add `postinstall` for prisma generate, build script for migrate deploy)

- [ ] **Step 1: Update `package.json` scripts**

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma migrate deploy && next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "postinstall": "prisma generate"
}
```

- [ ] **Step 2: Create the Vercel project**

Manual step:
1. Push the repo to GitHub (`git remote add origin ...`, `git push`).
2. In Vercel, "Add new project" → import the GitHub repo.
3. Set env vars: `DATABASE_URL` (Neon `main` branch), `AUTH_SECRET` (new random hex), `AUTH_URL` (Vercel-assigned domain or custom).
4. Deploy.
5. After first deploy, hit `/signup`, create the first user, confirm dashboard loads.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: build runs prisma migrate deploy"
```

---

## Self-Review Checklist (Run Before Handing Off)

- [ ] Every spec section has at least one task implementing it.
- [ ] No `TBD`, `TODO`, or "implement later" anywhere in this plan.
- [ ] Function names are consistent across tasks (e.g. `createEntry` not `create_entry`).
- [ ] Schema field names match between Prisma, Zod, actions, and components (`musclePct` everywhere — never `muscleKg`).
- [ ] Each task lists exact file paths.
- [ ] Each step shows the actual code or command, not a description of it.
- [ ] All tests are runnable as written.
- [ ] Frequent commits — each task ends with one.
