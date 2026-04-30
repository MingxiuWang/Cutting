# Admin / manager page — Design

**Date:** 2026-04-30
**Status:** Approved
**Scope:** Single feature. One implementation cycle.

## 1. Purpose

Give the project owner a private admin view of all users and their data, with the ability to edit/delete anything. Used for support, debugging, and cleanup of test/spam accounts.

## 2. Admin identity

- One hardcoded admin: email match `mingxiuwang0530@gmail.com`.
- Constant lives in `src/lib/admin.ts` along with an `isAdmin(session)` helper.
- Every admin route + server action calls `isAdmin` first; non-admins get redirected to `/dashboard` (pages) or `FORBIDDEN` error code (actions).
- No DB column. No role table. Identity is purely email-string equality.

## 3. Routes

### `/admin` — users list
- Table columns: **email**, **signed up**, **cuts**, **entries**, **last log time**.
- Default sort: most-recently active first (last log time DESC, NULLs last).
- Click a row → `/admin/users/[id]`.
- No search / filters / pagination beyond a hard cap (first 200 users).

### `/admin/users/[id]` — user detail
- Header: email, signup date, **Delete user** button (with confirm prompt).
- Section: cuts (use the same `CutList`-style component, but admin variant has edit + delete unconditional).
- Section: entries (same `EntryTable`, but admin variant has edit + delete with no 24h restriction).
- Inline editing reuses the existing forms but routed to admin actions.

## 4. Server actions

New file `src/app/_actions/admin.ts`. Each action: (1) `requireAdmin()` (throws `FORBIDDEN` if not admin), (2) Zod parse, (3) DB write, (4) `revalidatePath`.

- `adminDeleteUser(userId)` — `db.user.delete()` cascades to cuts (via `onDelete: Cascade`) and entries; the existing `onDelete: SetNull` on `Entry.cutId` is irrelevant here since the user's entries are deleted by the cascade from `User`.
- `adminDeleteCut(cutId)` — same as user-facing `deleteCut` but no ownership check beyond admin.
- `adminUpdateCut(cutId, input)` — same fields as `updateCut`.
- `adminDeleteEntry(entryId)` — bypasses the 24h edit window.
- `adminUpdateEntry(entryId, input)` — bypasses the 24h edit window.

`requireAdmin()` is in `src/lib/admin.ts`:
```ts
async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    throw new ActionError('FORBIDDEN');
  }
  return { id: session.user.id, email: session.user.email };
}
```

## 5. UI

- New `Admin` nav item in `src/app/_components/nav.tsx`, **rendered only if** the current pathname's session belongs to the admin.
  - Implementation: pass `isAdmin: boolean` from `(app)/layout.tsx` to `Nav` as a prop, computed via `auth()` + `ADMIN_EMAIL` check.
- Lucide icon: `ShieldUser` (or `Shield` if `ShieldUser` isn't in installed lucide version).
- Pages live under `src/app/(app)/admin/...`. They're inside the existing auth-required group, but additionally check admin status server-side and redirect non-admins to `/dashboard`.

## 6. Tests

Add two integration tests in `tests/integration/admin.test.ts`:

1. **Non-admin gets FORBIDDEN.** Mock session with a non-admin email; call any admin action; expect `{ ok: false, error: 'FORBIDDEN' }`.
2. **Admin can edit past the 24h window.** Mock session with `ADMIN_EMAIL`; create an entry with `createdAt` 25 hours ago; call `adminUpdateEntry`; expect success.

Existing 61 tests must still pass.

## 7. What this design does NOT include (YAGNI)

- Bulk operations
- CSV / JSON export
- Audit log of admin actions
- Search or filters beyond default sort
- Pagination beyond a 200-user hard cap
- Impersonation ("log in as user")
- Stats / charts about all users in aggregate
- Read-only "view-only" mode for admin

## 8. Privacy note

The README continues to describe the app as "anonymous" — accurate in the identity sense (no real-name requirement, fake email accepted). The admin sees logged data but cannot tie it to a real person. No copy change needed.

## 9. Open questions

None.
