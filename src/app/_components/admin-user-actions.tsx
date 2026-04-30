'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminDeleteUser, adminDeleteCut, adminDeleteEntry } from '@/app/_actions/admin';
import { Trash2 } from 'lucide-react';

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
