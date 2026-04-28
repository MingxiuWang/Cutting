# Cutting Tracker — Phase 1 Design

**Date:** 2026-04-28
**Status:** Draft, awaiting user review
**Scope:** Phase 1 (core tracking + dashboard). Phases 2 (nutrition), 3 (goals + reminders), and 4 (weekly summaries) are out of scope and will be brainstormed separately.

## 1. Purpose

A multi-user web app for tracking body composition during a cutting cycle. Users log measurements twice a day (morning and evening) and see trends, current cut progress, and AM-vs-PM averages.

Each entry captures: weight (kg), body fat %, muscle %, water %, AM/PM tag, optional note, timestamp.

## 2. Architecture overview

A single Next.js 15 app (App Router) deployed to Vercel, talking to a Neon Postgres database via Prisma.

```
Browser ──▶ Next.js (Vercel)
              ├── App Router pages (RSC reads via Prisma)
              ├── Server Actions (writes, validated with Zod)
              └── NextAuth.js (sessions, email + password)
                          │
                          ▼
                 Neon Postgres (Prisma)
```

- **Frontend:** React Server Components for reads, Server Actions for writes, Tailwind + shadcn/ui, Recharts for charts.
- **Backend:** Server Actions only (no REST/tRPC layer in Phase 1).
- **Auth:** NextAuth.js v5 (Auth.js), Credentials provider, JWT sessions.
- **Database:** Neon Postgres, accessed via Prisma.
- **Background jobs:** none in Phase 1.

## 3. Data model

All weights stored as `Decimal(5,1)` kg; percentages as `Decimal(4,1)`. All timestamps in UTC.

### `User`
- `id` (cuid, pk)
- `email` (unique, citext, lowercased)
- `passwordHash` (string, bcrypt cost 12)
- `createdAt`, `updatedAt`

### `Cut` — a cutting cycle owned by one user
- `id` (cuid, pk)
- `userId` (fk → User, indexed)
- `name` (string)
- `startDate` (date)
- `targetWeightKg` (Decimal 5,1)
- `endDate` (date, nullable — null = active)
- `createdAt`, `updatedAt`
- Index: `(userId, endDate)`
- Partial unique index: `(userId) WHERE endDate IS NULL` — enforces one active cut per user

### `Entry` — one measurement
- `id` (cuid, pk)
- `userId` (fk → User, indexed)
- `cutId` (fk → Cut, nullable, indexed)
- `measuredAt` (timestamptz, user-editable)
- `measuredDay` (date, derived from `measuredAt` in user timezone — used for the daily-uniqueness constraint)
- `period` (enum: `AM` | `PM`)
- `weightKg` (Decimal 5,1)
- `bodyFatPct` (Decimal 4,1)
- `musclePct` (Decimal 4,1)
- `waterPct` (Decimal 4,1)
- `note` (text, nullable, max 500 chars)
- `createdAt`, `updatedAt`
- Index: `(userId, measuredAt DESC)` for trend queries
- Unique: `(userId, measuredDay, period)` — at most one AM and one PM per calendar day per user

### NextAuth tables
`Session`, `Account`, `VerificationToken` — auto-managed by NextAuth's Prisma adapter.

### Notes
- `cutId` lets dashboard math scope to the active cut. Entries logged before any cut still have a home (`cutId` nullable).
- `period` is stored explicitly rather than derived from hour; some users weigh in at unusual times.
- `measuredDay` is computed from `measuredAt` plus the timezone offset sent by the browser at write time, then stored on the row to keep the unique index correct without per-query timezone math.

## 4. Authentication & sessions

**Library:** NextAuth.js v5 (Auth.js), Credentials provider only.

**Signup:**
1. Submit `{ email, password }` to a `signup` server action.
2. Zod validates: email format; password 8–72 chars, ≥ 1 letter and ≥ 1 digit.
3. Email uniqueness checked case-insensitively.
4. `bcrypt.hash(password, 12)` → store `User`.
5. Auto-sign in (set NextAuth session cookie), redirect to `/dashboard`.

**Login:**
1. Submit credentials.
2. Credentials provider looks up user by email, `bcrypt.compare`s the password.
3. On success, NextAuth issues a JWT cookie (HttpOnly, Secure, SameSite=Lax, 30-day sliding expiry).
4. On failure, generic error "Invalid email or password" (no enumeration).

**Session:** JWT strategy. Token contains `userId` and `email`. Server Components and Server Actions read via `auth()` from `@/lib/auth`. Every action begins with an `auth()` check.

**Logout:** standard `signOut()` clears the cookie.

**Password reset:** out of scope for Phase 1.

**Rate limiting:** in-memory limiter on login — 5 failed attempts per email per 15 min.

## 5. Server Actions (write surface)

Located in `src/app/_actions/`. Every action: (1) `auth()`, (2) Zod parse, (3) authorization (resource belongs to current user), (4) Prisma write, (5) `revalidatePath()`. Each returns `{ ok: true, data } | { ok: false, error: ErrorCode, message?: string }`. Never throws to the client.

**Auth:** `signup`, `logout`. `login` is invoked via NextAuth's `signIn('credentials', ...)`.

**Cuts:**
- `createCut({ name, startDate, targetWeightKg })` — fails with `ACTIVE_CUT_EXISTS` if the user already has an active cut.
- `updateCut(cutId, { name?, startDate?, targetWeightKg? })`.
- `endCut(cutId, endDate)` — sets `endDate`; future entries no longer auto-attach.
- `deleteCut(cutId)` — only if cut has zero entries; otherwise `CUT_HAS_ENTRIES`.

**Entries:**
- `createEntry({ measuredAt, period, weightKg, bodyFatPct, musclePct, waterPct, note?, tzOffsetMinutes })` — auto-attaches to active cut.
- `updateEntry(entryId, { ... })` — only if `now - createdAt < 24h`.
- `deleteEntry(entryId)` — same 24h rule.

**Reads** are not actions; Server Components fetch via Prisma in page files. Helpers in `src/lib/queries/`:
- `getActiveCut(userId)`
- `getEntries(userId, { period?, from?, to?, cutId? })`
- `getDashboardStats(userId)` — derives start/current/lost/weeklyRate/AM-vs-PM averages from AM entries of the active cut.

## 6. UI / pages

Routes (App Router):

- `/` — landing; "Log in" / "Sign up" CTAs. Redirects to `/dashboard` if signed in.
- `/signup`, `/login` — auth forms.
- `/dashboard` *(auth required)*:
  - **Header card:** active cut name + dates, or "Start a cut" button.
  - **Stat cards (AM-based, active cut):** Start weight · Current weight · Total lost · Avg weekly rate · Days in cut · Progress bar to target.
  - **AM-vs-PM card:** average AM vs average PM weight over last 7/30 days.
  - **Log entry button** opens a modal with the entry form.
  - **Recent entries:** last 10, edit/delete buttons greyed out past 24h.
- `/charts` *(auth required)*: 4 charts, each with a 7d / 30d / 90d / all range selector, scoped to active cut by default with an "all time" toggle:
  - Weight AM (kg)
  - Weight PM (kg)
  - Composition AM (3 lines: fat %, muscle %, water %)
  - Composition PM (3 lines: fat %, muscle %, water %)
- `/entries` *(auth required)*: full paginated list, filterable by date range / period / cut. Edit/delete (24h rule).
- `/cuts` *(auth required)*: list of cuts (active + past); create / edit / end / delete.
- `/settings` *(auth required)*: change email, change password, sign out, delete account.

**Layout:** persistent left sidebar on desktop; bottom nav on mobile. Mobile-first since entries are usually logged from a phone.

**Entry form fields:** date+time (default = now), AM/PM toggle (default based on current hour: <12 → AM), weight, fat %, muscle %, water %, note. All numeric inputs accept 1 decimal place.

## 7. Validation & business rules

Zod schemas live in `src/lib/validation/` and are shared by client (form errors) and server (action enforcement).

### Entry rules
- `weightKg`: 20.0 – 400.0
- `bodyFatPct`: 1.0 – 70.0
- `musclePct`: 10.0 – 80.0
- `waterPct`: 20.0 – 80.0
- `note`: ≤ 500 chars, optional
- `period`: `'AM' | 'PM'`
- `measuredAt`: not in the future, not more than 1 year in the past
- All numeric inputs rounded to 1 decimal before save
- **Daily uniqueness:** at most one AM and one PM per user per calendar day in the user's timezone. Calendar day is derived from `measuredAt + tzOffsetMinutes` and stored as `measuredDay`. Duplicate submissions return `DUPLICATE_PERIOD_TODAY`.

### Cut rules
- `startDate`: not in the future
- `targetWeightKg`: 20.0 – 400.0; warn (not block) if target ≥ start weight
- `endDate`: must be ≥ `startDate`
- At most one active cut per user (partial unique index)
- Deleting a cut requires zero entries; otherwise the user must end it
- Ending a cut does not detach existing entries; future entries simply won't auto-attach until a new cut starts

### Edit window
- Entries: `update` / `delete` allowed only if `now - createdAt < 24h`. Enforced server-side; UI also greys out the buttons.
- Cuts: editable any time.

### Auth rules
- Email: standard regex + max 254 chars; stored lowercased
- Password: 8–72 chars (bcrypt cap), ≥ 1 letter and ≥ 1 digit
- Login rate limit: 5 failed attempts per email per 15 min

## 8. Error handling

Server Actions never throw to the client. They return `{ ok: true, data } | { ok: false, error: ErrorCode, message?: string }`.

### Error codes
- `UNAUTHORIZED` — no session. UI redirects to `/login`.
- `FORBIDDEN` — session exists but resource belongs to another user. UI shows "Not found".
- `VALIDATION_FAILED` — Zod parse failed. Field-level errors returned; form highlights them inline.
- `DUPLICATE_PERIOD_TODAY` — entry conflict. UI offers an "Edit existing entry" link.
- `EDIT_WINDOW_CLOSED` — past 24h. UI shows tooltip on disabled buttons.
- `ACTIVE_CUT_EXISTS` — tried to create a second active cut. UI prompts to end the current one first.
- `CUT_HAS_ENTRIES` — tried to delete a cut with entries. UI offers "End cut" instead.
- `RATE_LIMITED` — too many login attempts. UI shows "Try again in N minutes".
- `INTERNAL` — anything unexpected. UI shows generic error; server logs the real cause.

**Logging:** `console.error` with stable JSON shape (`{ level, action, userId, errorCode, stack }`). Vercel captures these. No external error service in Phase 1.

**Boundaries:** top-level `error.tsx` catches RSC render errors → generic error page. `not-found.tsx` for 404s. Form-level errors via shadcn/ui `<FormMessage>`; non-field errors shown in a top-of-form banner.

**Database errors:** caught in a `runAction` wrapper that maps known Prisma codes (`P2002` unique violation → `DUPLICATE_PERIOD_TODAY` or `ACTIVE_CUT_EXISTS` based on context); everything else becomes `INTERNAL`.

## 9. Testing strategy

### Unit tests (Vitest)
Pure functions only:
- `computeStats` (start/current/lost/weeklyRate from AM entries)
- AM-vs-PM averages
- Edit-window check (boundaries at 0h, 23h59m, 24h, 24h01m)
- Zod schemas (valid + invalid + boundary inputs per field)
- `measuredDay` derivation (timezone offset + DST edge cases)

### Integration tests (Vitest + Prisma against a test database)
Server Actions called directly, run against a separate Postgres database (Neon branch or local Docker). Tests truncate or roll back between cases. One test per action covering: happy path, unauthorized, forbidden (other user's resource), validation failure, business-rule failure (duplicate period, edit window, active-cut conflict). `signup` and `login` exercised at the action layer.

### End-to-end tests (Playwright)
Three flows, run against `next dev` + test DB:
1. Signup → log first entry → see it on dashboard.
2. Log AM, then PM same day, see both in entries; second AM the same day shows the duplicate error.
3. Create a cut, log entries across several days, dashboard shows correct stats and progress bar.

### CI
GitHub Actions: unit + integration on every push; Playwright on PRs to `main`. Test DB is a Postgres service container in CI.

### Coverage
No hard percentage. Every Server Action and every business rule above must have at least one test.

### Out of scope for Phase 1
Visual regression, load testing, accessibility audits beyond shadcn/ui defaults.

## 10. Project structure

Repo root: `/Users/mingxiuwang/Cutting/`.

```
Cutting/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── .env.example          # DATABASE_URL, AUTH_SECRET, AUTH_URL
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/                    # auth-required group
│   │   │   ├── layout.tsx            # sidebar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── charts/page.tsx
│   │   │   ├── entries/page.tsx
│   │   │   ├── cuts/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── _actions/                 # Server Actions
│   │   │   ├── auth.ts
│   │   │   ├── cuts.ts
│   │   │   └── entries.ts
│   │   ├── _components/              # shared UI
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth setup
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── queries/                  # read helpers
│   │   ├── validation/               # Zod schemas
│   │   ├── stats.ts                  # pure dashboard math
│   │   └── errors.ts                 # ErrorCode + runAction wrapper
│   └── components/ui/                # shadcn/ui generated components
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── .github/workflows/ci.yml
```

## 11. Deployment

- **Database:** Neon Postgres, two branches — `main` (prod) and `dev` (preview deploys + local).
- **Hosting:** Vercel, connected to GitHub. Pushes to `main` deploy prod; PRs get preview deploys against the `dev` DB branch.
- **Migrations:** `prisma migrate deploy` runs as a Vercel build step before the Next.js build.
- **Env vars:** `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`. Set in Vercel; mirrored to `.env.local` for development.
- **Local dev:** `pnpm dev` against the Neon `dev` branch.

## 12. Tooling

TypeScript strict, ESLint (Next.js defaults), Prettier. `pnpm` as package manager.

## 13. Out of scope (deferred to later phases)

- Calorie / macro logging (Phase 2)
- Goals + twice-daily reminders (Phase 3, requires scheduler + email/push)
- Weekly auto-generated summary reports (Phase 4)
- Password reset flow
- OAuth / magic-link auth
- Imperial units
- Multi-region / global rate limiting
- Mobile native apps

## 14. Open questions

None at time of writing.
