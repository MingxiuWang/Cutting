'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminDeleteUser, adminDeleteCut, adminDeleteEntry, adminResetPassword } from '@/app/_actions/admin';
import { Trash2, KeyRound, X } from 'lucide-react';

export function ResetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => {
          setMsg(null);
          setSuccess(false);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <KeyRound className="w-4 h-4" />
        Reset password
      </button>
    );
  }

  const onSubmit = (formData: FormData) =>
    startTransition(async () => {
      setMsg(null);
      const newPassword = String(formData.get('newPassword') ?? '');
      const result = await adminResetPassword(userId, { newPassword });
      if (!result.ok) {
        const fieldMsg = Object.values(result.fieldErrors ?? {}).flat().join('; ');
        setMsg(fieldMsg || result.message || 'Reset failed');
        setSuccess(false);
        return;
      }
      setMsg(`Password updated for ${email}.`);
      setSuccess(true);
    });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-neutral-900">Reset password for {email}</h3>
        <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form action={onSubmit} className="grid gap-3">
        <input
          name="newPassword"
          type="password"
          placeholder="New password (8+ chars, letter + digit)"
          required
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {msg && (
          <div
            className={
              success
                ? 'rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-2'
                : 'rounded-md bg-red-50 border border-red-200 text-red-700 text-sm p-2'
            }
          >
            {msg}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          if (!confirm(`Delete ${email}? This cascades to all their cuts and entries. This cannot be undone.`)) return;
          const result = await adminDeleteUser(userId);
          if (!result.ok) {
            alert(result.message ?? 'Could not delete user');
            return;
          }
          router.push('/admin');
        })
      }
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      {pending ? 'Deleting…' : 'Delete user'}
    </button>
  );
}

export function DeleteCutButton({ cutId }: { cutId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          if (!confirm('Delete this cut? Entries are kept (cutId set to null).')) return;
          await adminDeleteCut(cutId);
          router.refresh();
        })
      }
      disabled={pending}
      className="inline-flex items-center justify-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="w-3 h-3" />
      Delete
    </button>
  );
}

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          if (!confirm('Delete this entry?')) return;
          await adminDeleteEntry(entryId);
          router.refresh();
        })
      }
      disabled={pending}
      title="Admin: delete (no 24h restriction)"
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
