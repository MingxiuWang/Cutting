# Cutting

A personal body-composition tracker for cutting cycles. Log weight, body fat %, muscle %, and water % twice a day (morning + evening), watch the trend, and stay accountable to a target.

**Live:** https://cutting-beta.vercel.app

## Features

- Email + password auth, multi-user, **no email verification required** — sign up anonymously with any address (real or fake) and start logging in seconds
- Cuts as first-class objects: start date, target weight, optional expected end date
- Twice-daily entry logging (one AM + one PM per calendar day)
- Dashboard with progress bar, AM-vs-PM averages, weekly rate of change
- Charts: weight (AM / PM), composition (fat / muscle / water — AM / PM)
- 24-hour edit window on entries to keep the data honest
- Deleting a cut keeps its entries — they just lose the cut association
- Local-timezone date display
- Optional composition fields — log just weight if that's all you have

## Tech stack — and why

| Layer            | Choice                                                | Why                                                                                                                                  |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**    | Next.js 16 (App Router)                               | One repo for frontend + backend. Server Components for fast reads, Server Actions for writes — no separate API layer to maintain.    |
| **Language**     | TypeScript (strict, `exactOptionalPropertyTypes`)     | Catches a whole class of bugs at compile time. The strict flags pay off the moment a schema changes.                                 |
| **Styling**      | Tailwind v4 + lucide-react                            | Utility classes keep design decisions in the JSX where the markup lives. lucide gives a consistent open-source icon set.             |
| **Database**     | Postgres (Neon serverless)                            | Real SQL with relational integrity (cuts → entries via FKs). Neon's branching makes it easy to spin up a separate test DB.           |
| **ORM**          | Prisma 7 + `@prisma/adapter-pg`                       | Schema-first, type-safe queries, painless migrations. The `pg` adapter speaks standard Postgres — works on Neon and any vanilla DB.  |
| **Auth**         | NextAuth.js v5 (Credentials, JWT sessions)            | First-party Next.js integration. JWT strategy avoids a session DB lookup on every request.                                           |
| **Validation**   | Zod                                                   | One schema definition shared between client form errors and server-action enforcement. No drift.                                     |
| **Charts**       | Recharts                                              | React-native, declarative, good enough out-of-the-box for line charts with range selection.                                          |
| **Hosting**      | Vercel                                                | First-class Next.js host. Auto-deploys on push, free tier covers a personal app comfortably.                                         |
| **Testing**      | Vitest (unit + integration) + Playwright (E2E)        | Vitest for fast pure-function and Server Action tests. Playwright for the critical user flows (signup, log entry, AM/PM duplicate). |
| **CI**           | GitHub Actions                                        | Runs `tsc --noEmit`, vitest, and Playwright on every push to `main`. Free for public repos.                                          |
| **Package mgr**  | pnpm                                                  | Faster installs, strict by default, less disk usage than npm/yarn.                                                                   |

## Project structure

```
src/
├── app/
│   ├── (auth)/             # /login, /signup
│   ├── (app)/              # auth-required: dashboard, charts, entries, cuts, settings
│   ├── _actions/           # Server Actions: signup, cuts, entries, session
│   ├── _components/        # shared UI (cards, forms, charts, nav, LocalDate)
│   └── api/auth/           # NextAuth catch-all route
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client singleton
│   ├── errors.ts           # ErrorCode + runAction wrapper
│   ├── stats.ts            # pure dashboard math
│   ├── time.ts             # measuredDay + edit-window helpers
│   ├── validation/         # Zod schemas (auth, cuts, entries)
│   └── queries/            # read helpers (getActiveCut, getEntries, getDashboardStats)
prisma/
├── schema.prisma
└── migrations/
tests/
├── unit/                   # pure functions: stats, time, validation, errors
├── integration/            # server actions against a real Postgres branch
└── e2e/                    # Playwright specs
```

## Local development

```bash
# 1. Install
pnpm install

# 2. Set env vars (copy .env.example and fill in Neon connection strings)
cp .env.example .env.local
# DATABASE_URL=postgresql://...
# TEST_DATABASE_URL=postgresql://...
# AUTH_SECRET=...    # generate with `openssl rand -hex 32`
# AUTH_URL=http://localhost:3000

# 3. Apply migrations
pnpm prisma migrate deploy

# 4. Start the dev server
pnpm dev
```

Verification:

```bash
pnpm test               # vitest (unit + integration)
pnpm test:e2e           # Playwright
pnpm exec tsc --noEmit  # type check
pnpm build              # production build
```

## License

Personal project. All rights reserved.
